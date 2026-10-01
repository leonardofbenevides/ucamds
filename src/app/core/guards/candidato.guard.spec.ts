import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { candidatoGuard } from './candidato.guard';
import { CandidatoApi } from '../api/candidato.api';
import { CandidatoStore } from '../store/candidato.store';
import { Navegador } from '../navegador';
import { candidatoFake } from '../store/candidato.fake';

function rota(tela: string, tentativa?: string): ActivatedRouteSnapshot {
  return {
    paramMap: convertToParamMap({ oid: 'fip-1' }),
    queryParamMap: convertToParamMap(tentativa ? { tentativa } : {}),
    data: { tela },
  } as unknown as ActivatedRouteSnapshot;
}

describe('candidatoGuard', () => {
  const api = { buscar: vi.fn(), criar: vi.fn(), tentativas: vi.fn() };
  const navegador = { irParaExterno: vi.fn() };

  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    navegador.irParaExterno.mockReset();
    api.tentativas.mockReturnValue(of({ tentativaAtual: 1, totalTentativasPossiveis: 3 }));
    TestBed.configureTestingModule({
      providers: [
        { provide: CandidatoApi, useValue: api },
        { provide: Navegador, useValue: navegador },
      ],
    });
  });

  const run = (tela: string, tentativa?: string) =>
    TestBed.runInInjectionContext(() => candidatoGuard(rota(tela, tentativa), {} as RouterStateSnapshot)) as Promise<
      boolean | UrlTree
    >;

  it('tenta criar com a tentativa, cai na busca e libera a tela permitida', async () => {
    api.criar.mockReturnValue(throwError(() => new Error('já existe')));
    api.buscar.mockReturnValue(of(candidatoFake({ situacao: 'CADASTRADO' })));
    expect(await run('entrada')).toBe(true);
    expect(api.criar).toHaveBeenCalledWith('fip-1', '1');
    expect(TestBed.inject(CandidatoStore).oidCandidatoProva()).toBe('cp-1');
  });

  it('cria o candidato quando a busca não encontra', async () => {
    api.criar.mockReturnValueOnce(throwError(() => new Error('x'))).mockReturnValueOnce(of(candidatoFake()));
    api.buscar.mockReturnValue(of(null));
    expect(await run('entrada')).toBe(true);
    expect(api.criar).toHaveBeenLastCalledWith('fip-1');
  });

  it('redireciona para a prova quando ela já começou', async () => {
    api.criar.mockReturnValue(throwError(() => new Error('x')));
    api.buscar.mockReturnValue(of(candidatoFake({ situacao: 'PROVA_INICIADA' })));
    const r = await run('entrada');
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/candidato/fip-1/prova');
  });

  it('manda o aprovado para a área do inscrito', async () => {
    const c = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    c.formaingressopessoa.situacao = 'APROVADO';
    api.criar.mockReturnValue(throwError(() => new Error('x')));
    api.buscar.mockReturnValue(of(c));
    expect(await run('entrada')).toBe(false);
    expect(navegador.irParaExterno).toHaveBeenCalledWith(expect.stringContaining('12345678901'));
  });

  it('vai para a tela de erro quando o backend falha', async () => {
    api.criar.mockReturnValue(throwError(() => new Error('x')));
    api.buscar.mockReturnValue(throwError(() => new Error('rede')));
    const r = await run('entrada');
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/candidato/fip-1/erro');
    expect(TestBed.inject(CandidatoStore).erro()).toBeTruthy();
  });
});
