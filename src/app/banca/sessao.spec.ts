import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Navegador } from '../core/navegador';
import { environment } from '../../environments/environment';
import { bancaGuard } from './banca.guard';
import { EntrarBancaPage } from './entrar';
import { GerencialApi, Sessao, SessaoBanca } from './sessao';

const MARTA: Sessao = {
  token: 't',
  usuario: { oid: 'marta', nome: 'Marta Reis' },
  oidPessoa: 'pessoa-marta',
  unidades: [{ oidUnidade: 'unid01', sigla: 'Campos' }],
  unidade: { oidUnidade: 'unid01', sigla: 'Campos' },
};

describe('SessaoBanca', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('nasce sem sessão; abrir guarda no navegador e encerrar apaga', () => {
    const s = TestBed.inject(SessaoBanca);
    expect(s.autenticada()).toBe(false);
    expect(s.usuario()).toBeNull();

    s.abrir(MARTA);
    expect(s.autenticada()).toBe(true);
    expect(s.usuario()?.nome).toBe('Marta Reis');
    expect(s.oidPessoa()).toBe('pessoa-marta');
    expect(s.nomeUnidade()).toBe('Campos');
    expect(JSON.parse(localStorage.getItem('sessao-banca')!).usuario.oid).toBe('marta');

    s.encerrar();
    expect(s.autenticada()).toBe(false);
    expect(localStorage.getItem('sessao-banca')).toBeNull();
  });

  it('recupera a sessão guardada ao recarregar, e ignora o que não é sessão', () => {
    localStorage.setItem('sessao-banca', JSON.stringify(MARTA));
    expect(TestBed.inject(SessaoBanca).usuario()?.oid).toBe('marta');

    TestBed.resetTestingModule();
    localStorage.setItem('sessao-banca', '{"token":""}');
    expect(TestBed.inject(SessaoBanca).autenticada()).toBe(false);

    TestBed.resetTestingModule();
    localStorage.setItem('sessao-banca', 'lixo');
    expect(TestBed.inject(SessaoBanca).autenticada()).toBe(false);
  });

  it('sem nome de unidade conhecido não mostra o oid', () => {
    const s = TestBed.inject(SessaoBanca);
    s.abrir({ ...MARTA, unidade: { oidUnidade: 'unid01' } });
    expect(s.nomeUnidade()).toBeNull();
  });
});

describe('GerencialApi', () => {
  it('monta a sessão com as três consultas do legado', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const pedido = firstValueFrom(TestBed.inject(GerencialApi).sessao('tok', 'marta'));

    const base = environment.apiGerencial;
    const conta = http.expectOne(`${base}/usuario/marta`);
    expect(conta.request.headers.get('Unidade-Ref')).toBe(environment.unidRef);
    conta.flush({ oidPessoa: 'pessoa-marta', senha: 'x' });
    http
      .expectOne((r) => r.url === `${base}/unidadeUsuario/search/usuario` && r.params.get('oidusuario') === 'marta')
      .flush({ _embedded: { unidadesUsuarios: [{ oidUnidade: 'unid01', sigla: 'Campos' }, { oidUnidade: 'unid19', sigla: 'Rio' }] } });
    http.expectOne(`${base}/usuario/marta/pessoa`).flush({ nome: 'Marta Reis', email: 'm@x' });

    const s = await pedido;
    expect(s).toEqual({
      token: 'tok',
      usuario: { oid: 'marta', nome: 'Marta Reis' },
      oidPessoa: 'pessoa-marta',
      unidades: [{ oidUnidade: 'unid01', sigla: 'Campos' }, { oidUnidade: 'unid19', sigla: 'Rio' }],
      unidade: { oidUnidade: 'unid01', sigla: 'Campos' },
    });
    http.verify();
  });
});

describe('bancaGuard', () => {
  const navegador = { irParaExterno: vi.fn() };
  const loginUrl = environment.loginUrl;

  beforeEach(() => {
    localStorage.clear();
    navegador.irParaExterno.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: Navegador, useValue: navegador }] });
  });
  afterEach(() => (environment.loginUrl = loginUrl));

  const run = () =>
    TestBed.runInInjectionContext(() => bancaGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as boolean | UrlTree;

  it('com sessão, libera', () => {
    TestBed.inject(SessaoBanca).abrir(MARTA);
    expect(run()).toBe(true);
  });

  it('sem sessão e com login único, manda para o login', () => {
    environment.loginUrl = 'https://login.example/entrar';
    expect(run()).toBe(false);
    expect(navegador.irParaExterno).toHaveBeenCalledWith('https://login.example/entrar');
  });

  it('sem sessão no protótipo (sem login único), volta para a porta de entrada', () => {
    environment.loginUrl = null;
    const destino = run();
    expect(destino).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(destino as UrlTree)).toBe('/');
    expect(navegador.irParaExterno).not.toHaveBeenCalled();
  });
});

describe('EntrarBancaPage', () => {
  @Component({ template: '' })
  class Vazia {}

  const api = { sessao: vi.fn() };

  async function montar() {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntrarBancaPage],
      providers: [provideRouter([{ path: 'banca', component: Vazia }]), { provide: GerencialApi, useValue: api }],
    }).compileComponents();
    const f = TestBed.createComponent(EntrarBancaPage);
    f.componentRef.setInput('token', 'tok');
    f.componentRef.setInput('usuario', 'marta');
    return f;
  }

  it('abre a sessão com o token e o usuário da rota e segue para a área interna sem deixar o token no histórico', async () => {
    api.sessao.mockReset().mockReturnValue(of(MARTA));
    const f = await montar();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await f.whenStable();
    expect(api.sessao).toHaveBeenCalledWith('tok', 'marta');
    expect(TestBed.inject(SessaoBanca).usuario()?.nome).toBe('Marta Reis');
    expect(nav).toHaveBeenCalledWith(['/banca'], { replaceUrl: true });
  });

  it('se o gerencial não responde, diz o que houve e oferece tentar de novo, sem abrir sessão', async () => {
    api.sessao.mockReset().mockReturnValue(throwError(() => new Error('rede')));
    const f = await montar();
    await f.whenStable();
    expect(TestBed.inject(SessaoBanca).autenticada()).toBe(false);
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Não foi possível abrir sua sessão');
    expect(el.textContent).toContain('Tentar de novo');

    api.sessao.mockReturnValue(of(MARTA));
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await f.componentInstance.entrar();
    expect(TestBed.inject(SessaoBanca).autenticada()).toBe(true);
    expect(nav).toHaveBeenCalled();
  });
});
