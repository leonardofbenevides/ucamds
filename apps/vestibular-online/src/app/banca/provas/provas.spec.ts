import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CadernoCadastro, ProvasApi } from './provas.api';
import { ProvasPage } from './provas';
import { ProvasStore } from './provas.store';
import { QuestaoFormPage, lerOrdem } from './questao-form';

@Component({ template: '' })
class Vazia {}

describe('Cadastro de provas', () => {
  let cadernos: CadernoCadastro[];
  const api = {
    processos: vi.fn(),
    formas: vi.fn(),
    captacoes: vi.fn(),
    vigencia: vi.fn(),
    cadernos: vi.fn(),
    criarCaderno: vi.fn(),
    excluirCaderno: vi.fn(),
    criarQuestao: vi.fn(),
    salvarQuestao: vi.fn(),
    excluirQuestao: vi.fn(),
  };

  async function preparar() {
    TestBed.resetTestingModule();
    api.processos.mockReset().mockReturnValue(of([{ oid: 'pps-1', rotulo: '2026/2' }, { oid: 'pps-2', rotulo: '2027/1' }]));
    api.formas.mockReset().mockReturnValue(of([{ oid: 'fi-1', rotulo: 'Vestibular online' }]));
    api.captacoes.mockReset().mockReturnValue(of([{ oid: 'cap-1', rotulo: 'Geral' }]));
    api.vigencia.mockReset().mockReturnValue(of('fiv-1'));
    api.cadernos.mockReset().mockImplementation(() => of(cadernos));
    api.criarCaderno.mockReset().mockImplementation((_v: string, tipoprova: string) => {
      cadernos = [{ oid: 'cad-novo', tipoprova, questoes: [] }];
      return of({});
    });
    api.excluirCaderno.mockReset().mockImplementation((oid: string) => {
      cadernos = cadernos.filter((c) => c.oid !== oid);
      return of({});
    });
    api.criarQuestao.mockReset().mockReturnValue(of({}));
    api.salvarQuestao.mockReset().mockReturnValue(of({}));
    api.excluirQuestao.mockReset().mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'banca/provas', component: Vazia },
          { path: 'banca/provas/:caderno/questao/nova', component: QuestaoFormPage },
          { path: 'banca/provas/:caderno/questao/:questao', component: QuestaoFormPage },
        ], withComponentInputBinding()),
        { provide: ProvasApi, useValue: api },
      ],
    }).compileComponents();
  }

  /** A tela se monta em voltas (opções, cadernos, campos): espera todas. */
  async function assentar(estavel: () => Promise<unknown>) {
    for (let volta = 0; volta < 4; volta++) {
      await new Promise((r) => setTimeout(r));
      await estavel();
    }
  }

  beforeEach(() => {
    cadernos = [
      {
        oid: 'cad-rd',
        tipoprova: 'REDACAO',
        questoes: [{ oid: 'rd1', descricao: '<p>Escreva sobre <strong>a leitura</strong>.</p>', textoreferencia: '<p>Texto I</p><p>Texto II</p>', pontuacao: 10, ordem: 1 }],
      },
    ];
  });

  describe('ProvasPage', () => {
    async function montar() {
      await preparar();
      const f = TestBed.createComponent(ProvasPage);
      f.detectChanges();
      await assentar(() => f.whenStable());
      return { f, el: f.nativeElement as HTMLElement, estavel: () => assentar(() => f.whenStable()) };
    }
    const clicar = (el: HTMLElement, rotulo: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(rotulo) && !b.closest('dialog:not([open])'))!.click();

    it('lista os cadernos do processo seletivo com as questões, e diz de que escopo são', async () => {
      const { el } = await montar();
      expect(el.querySelector('ucam-card')?.textContent).toContain('Redação');
      expect(el.querySelector('ucam-card')?.textContent).toContain('1 questão');
      expect(el.querySelector('ucam-list-item')?.textContent).toContain('Escreva sobre a leitura.');
      expect(el.querySelector('ucam-list-item')?.textContent).toContain('Vale 10 · com texto de apoio');
      expect(el.querySelector('a[href="/banca/provas/cad-rd/questao/rd1"]')).not.toBeNull();
      expect(el.textContent).toContain('2026/2');
      expect(api.cadernos).toHaveBeenCalledWith({ processo: 'pps-1', forma: 'fi-1', captacao: 'cap-1' });
    });

    it('sem caderno, o vazio oferece criar o de redação — e cria na vigência do escopo', async () => {
      cadernos = [];
      const { el, estavel } = await montar();
      expect(el.textContent).toContain('Nenhum caderno neste processo seletivo');
      clicar(el, 'Adicionar caderno de redação');
      await estavel();
      expect(api.criarCaderno).toHaveBeenCalledWith('fiv-1', 'REDACAO');
      expect(el.querySelector('ucam-card')?.textContent).toContain('Redação');
      expect(el.textContent).toContain('ainda não tem questão');
    });

    it('excluir caderno pede confirmação, diz o que vai junto e só então exclui', async () => {
      const { el, estavel } = await montar();
      clicar(el, 'Excluir caderno');
      await estavel();
      expect(api.excluirCaderno).not.toHaveBeenCalled();
      const dialogo = el.querySelector('ucam-dialog')!;
      expect(dialogo.textContent).toContain('A questão dele é excluída junto');
      expect(dialogo.textContent).toContain('não pode ser desfeita');
      [...dialogo.querySelectorAll('button')].find((b) => b.textContent?.includes('Excluir caderno'))!.click();
      await estavel();
      expect(api.excluirCaderno).toHaveBeenCalledWith('cad-rd');
      expect(el.querySelector('ucam-card')).toBeNull();
    });

    it('trocar o processo seletivo busca os cadernos dele', async () => {
      const { f, estavel } = await montar();
      f.componentInstance.mudar({ processo: 'pps-2' });
      await estavel();
      expect(api.cadernos).toHaveBeenLastCalledWith({ processo: 'pps-2', forma: 'fi-1', captacao: 'cap-1' });
    });
  });

  describe('QuestaoFormPage', () => {
    async function abrir(url: string) {
      await preparar();
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      const estavel = () => assentar(() => harness.fixture.whenStable());
      await estavel();
      const el = harness.routeNativeElement as HTMLElement;
      const navegar = vi.spyOn(TestBed.inject(Router), 'navigate');
      const escrever = async (seletor: string, texto: string) => {
        const campo = el.querySelectorAll(seletor);
        return (i: number) => {
          const c = campo[i] as HTMLInputElement | HTMLTextAreaElement;
          c.value = texto;
          c.dispatchEvent(new Event('input', { bubbles: true }));
        };
      };
      const enviar = async () => {
        (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
        await estavel();
      };
      return { el, estavel, escrever, enviar, navegar };
    }

    it('lerOrdem aceita inteiro e recusa o resto', () => {
      expect(lerOrdem(' 3 ')).toBe(3);
      expect(lerOrdem('0')).toBe(0);
      for (const t of ['', '1,5', '-1', 'um']) expect(lerOrdem(t)).toBeNull();
    });

    it('na edição, os campos nascem da questão, em texto simples', async () => {
      const { el } = await abrir('/banca/provas/cad-rd/questao/rd1');
      const areas = el.querySelectorAll('textarea');
      expect(areas[0].value).toBe('Texto I\n\nTexto II');
      expect(areas[1].value).toBe('Escreva sobre a leitura.');
      expect((el.querySelectorAll('input')[0] as HTMLInputElement).value).toBe('10');
      expect(el.textContent).toContain('Salvar questão');
      expect(el.textContent).toContain('Excluir questão');
    });

    it('salvar grava a questão com os textos em parágrafos e volta para as provas', async () => {
      const { escrever, enviar, navegar, estavel } = await abrir('/banca/provas/cad-rd/questao/rd1');
      (await escrever('textarea', 'Nova proposta.\n\nSegundo parágrafo.'))(1);
      (await escrever('input', '8,5'))(0);
      await estavel();
      await enviar();
      expect(api.salvarQuestao).toHaveBeenCalledWith('cad-rd', 'rd1', {
        textoreferencia: '<p>Texto I</p><p>Texto II</p>',
        descricao: '<p>Nova proposta.</p><p>Segundo parágrafo.</p>',
        pontuacao: 8.5,
        ordem: 1,
      });
      expect(navegar).toHaveBeenCalledWith(['/banca/provas']);
    });

    it('questão nova entra na posição seguinte do caderno e é criada nele', async () => {
      const { el, escrever, enviar, estavel } = await abrir('/banca/provas/cad-rd/questao/nova');
      expect((el.querySelectorAll('input')[1] as HTMLInputElement).value).toBe('2');
      expect(el.textContent).toContain('Criar questão');
      expect(el.textContent).not.toContain('Excluir questão');
      (await escrever('textarea', 'Outra proposta.'))(1);
      await estavel();
      await enviar();
      expect(api.criarQuestao).toHaveBeenCalledWith('cad-rd', { textoreferencia: '', descricao: '<p>Outra proposta.</p>', pontuacao: 10, ordem: 2 });
    });

    it('sem enunciado ou com pontuação fora da escala, o erro fica no campo e nada é gravado', async () => {
      const { el, escrever, enviar, estavel } = await abrir('/banca/provas/cad-rd/questao/nova');
      (await escrever('input', '12'))(0);
      await estavel();
      await enviar();
      const erros = [...el.querySelectorAll('[role="alert"]')].map((e) => e.textContent);
      expect(erros.join(' | ')).toContain('Falta o enunciado');
      expect(erros.join(' | ')).toContain('de 0 a 10');
      expect(api.criarQuestao).not.toHaveBeenCalled();
    });

    it('excluir questão pede confirmação antes', async () => {
      const { el, estavel, navegar } = await abrir('/banca/provas/cad-rd/questao/rd1');
      [...el.querySelectorAll('form button')].find((b) => b.textContent?.includes('Excluir questão'))!.dispatchEvent(new Event('click', { bubbles: true }));
      await estavel();
      expect(api.excluirQuestao).not.toHaveBeenCalled();
      [...el.querySelectorAll('ucam-dialog button')].find((b) => b.textContent?.includes('Excluir questão'))!.dispatchEvent(new Event('click', { bubbles: true }));
      await estavel();
      expect(api.excluirQuestao).toHaveBeenCalledWith('rd1');
      expect(navegar).toHaveBeenCalledWith(['/banca/provas']);
    });

    it('questão que não está no cadastro diz isso e oferece a volta', async () => {
      const { el } = await abrir('/banca/provas/cad-rd/questao/nao-existe');
      expect(el.textContent).toContain('não está no cadastro');
      expect(el.querySelector('form')).toBeNull();
    });

    it('a listagem já carregada serve ao formulário: não busca de novo', async () => {
      await preparar();
      await TestBed.inject(ProvasStore).iniciar();
      const chamadas = api.cadernos.mock.calls.length;
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/banca/provas/cad-rd/questao/rd1');
      await assentar(() => harness.fixture.whenStable());
      expect(api.cadernos.mock.calls.length).toBe(chamadas);
    });
  });
});
