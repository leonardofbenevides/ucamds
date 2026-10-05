import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BancaApi, RedacaoNaFila } from '../banca.api';
import { candidatoFake } from '../../core/store/candidato.fake';
import { escreverNota, lerNota } from '../nota';
import { CorrecaoPage, quandoFoi } from './correcao';

function redacao(oid: string, nome: string, nota: number | null = null): RedacaoNaFila {
  const c = candidatoFake({ oid, situacao: nota === null ? 'PROVA_FINALIZADA' : 'PROVA_CORRIGIDA' });
  return {
    ...c,
    dataprova: '2026-09-28T14:20:00Z',
    formaingressopessoa: { ...c.formaingressopessoa, notaredacao: nota, pessoa: { ...c.formaingressopessoa.pessoa, nome } },
  };
}

describe('lerNota', () => {
  it('aceita de 0 a 10, de meio em meio ponto, com vírgula ou ponto', () => {
    expect(lerNota('7')).toBe(7);
    expect(lerNota(' 7,5 ')).toBe(7.5);
    expect(lerNota('8.5')).toBe(8.5);
    expect(lerNota('10')).toBe(10);
    expect(lerNota('0')).toBe(0);
  });

  it('recusa o que está fora da escala', () => {
    for (const t of ['', '11', '7,3', '-1', 'sete', '7,55', '10,5']) expect(lerNota(t)).toBeNull();
  });

  it('escreve a nota como se lê em português', () => {
    expect(escreverNota(7.5)).toBe('7,5');
    expect(escreverNota(8)).toBe('8');
  });
});

describe('quandoFoi', () => {
  const agora = new Date(2026, 9, 1, 10, 0);
  it('diz o prazo em palavra', () => {
    expect(quandoFoi(new Date(2026, 9, 1, 8, 0).toISOString(), agora)).toBe('hoje');
    expect(quandoFoi(new Date(2026, 8, 30, 23, 0).toISOString(), agora)).toBe('ontem');
    expect(quandoFoi(new Date(2026, 8, 26, 9, 0).toISOString(), agora)).toBe('há 5 dias');
  });
});

describe('CorrecaoPage', () => {
  const periodo = { oid: 'pi-1', rotulo: '2026-2', inicio: '2026-07-01', fim: '2026-12-20' };
  const forma = { oid: 'fi-1', descricao: 'Vestibular online' };
  let espera: RedacaoNaFila[];
  let corrigidas: RedacaoNaFila[];
  const api = {
    periodos: vi.fn(),
    formas: vi.fn(),
    emEspera: vi.fn(),
    corrigidas: vi.fn(),
    texto: vi.fn(),
    darNota: vi.fn(),
  };

  async function montar(url = '/banca/redacoes') {
    TestBed.resetTestingModule();
    api.periodos.mockReset().mockReturnValue(of([periodo]));
    api.formas.mockReset().mockReturnValue(of([forma]));
    api.emEspera.mockReset().mockImplementation(() => of({ content: espera, totalElements: espera.length, number: 0, size: 20 }));
    api.corrigidas.mockReset().mockImplementation(() => of({ content: corrigidas, totalElements: corrigidas.length, number: 0, size: 20 }));
    api.texto.mockReset().mockReturnValue(of({ respostaTextual: '<p>Ler forma o cidadão.</p>', textoReferencia: '<p>Apoio</p>', descricaoQuestao: '<p>Tema</p>' }));
    api.darNota.mockReset().mockImplementation((oid: string, nota: number) => {
      const r = espera.find((x) => x.oid === oid);
      espera = espera.filter((x) => x.oid !== oid);
      if (r) corrigidas = [redacao(r.oid, r.formaingressopessoa.pessoa.nome, nota), ...corrigidas];
      return of({});
    });
    await TestBed.configureTestingModule({
      imports: [CorrecaoPage],
      providers: [provideRouter([{ path: 'banca/redacoes', component: CorrecaoPage }]), { provide: BancaApi, useValue: api }],
    }).compileComponents();
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    const f = TestBed.createComponent(CorrecaoPage);
    // As abas do DS leem o próprio valor num microtask do construtor: a
    // primeira detecção tem de rodar antes dele, como roda no navegador.
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    // A tela se monta em voltas — escopo, filas, texto da redação aberta —, e
    // cada volta só começa depois de a anterior pintar.
    const estavel = async () => {
      for (let volta = 0; volta < 4; volta++) {
        await new Promise((r) => setTimeout(r));
        await f.whenStable();
      }
    };
    await estavel();
    const darNota = async (texto: string) => {
      const input = el.querySelector('.ucam-inbox__detalhe input') as HTMLInputElement;
      input.value = texto;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await estavel();
      (el.querySelector('.ucam-inbox__detalhe form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await estavel();
    };
    return { el, f, router, darNota, estavel };
  }

  beforeEach(() => {
    espera = [redacao('cp-1', 'Carla Menezes'), redacao('cp-2', 'Diego Farias')];
    corrigidas = [redacao('cp-9', 'Hugo Barreto', 8.5)];
  });

  it('abre a fila em espera com a primeira redação ao lado, pronta para ler', async () => {
    const { el } = await montar();
    expect(el.querySelectorAll('ucam-list-item').length).toBe(2);
    expect(el.querySelector('#t-redacao')?.textContent).toContain('Carla Menezes');
    expect(el.querySelector('[data-texto-candidato]')?.textContent).toContain('Ler forma o cidadão.');
    expect(el.querySelector('[data-proposta]')?.textContent).toContain('Tema');
    expect(el.querySelector('ucam-list-item[aria-current="true"]')?.textContent).toContain('Carla Menezes');
    expect(api.emEspera).toHaveBeenCalledWith(expect.objectContaining({ periodo, forma, pesquisa: '', pagina: 0 }));
  });

  it('gravar a nota tira a redação da espera e abre a seguinte no mesmo painel', async () => {
    const { el, darNota } = await montar();
    await darNota('7,5');
    expect(api.darNota).toHaveBeenCalledWith('cp-1', 7.5);
    expect(el.querySelectorAll('ucam-list-item').length).toBe(1);
    expect(el.querySelector('#t-redacao')?.textContent).toContain('Diego Farias');
    expect(el.querySelector('[data-anuncio]')?.textContent).toContain('Nota 7,5 gravada para Carla Menezes');
  });

  it('nota fora da escala fica no campo, com o que fazer, e nada é gravado', async () => {
    const { el, darNota } = await montar();
    await darNota('11');
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('de 0 a 10');
    expect(api.darNota).not.toHaveBeenCalled();
  });

  it('se a gravação falha, a redação continua aberta e a tela diz o que houve', async () => {
    const { el, darNota } = await montar();
    api.darNota.mockReturnValue(throwError(() => new Error('rede')));
    await darNota('6');
    expect(el.textContent).toContain('A nota não foi gravada');
    expect(el.querySelector('#t-redacao')?.textContent).toContain('Carla Menezes');
    expect(el.querySelectorAll('ucam-list-item').length).toBe(2);
  });

  it('em Corrigidas, a redação abre com a nota já dada e pode ser regravada', async () => {
    const { el, f, estavel } = await montar();
    f.componentInstance.trocarRecorte('corrigidas');
    await estavel();
    expect(el.querySelector('#t-redacao')?.textContent).toContain('Hugo Barreto');
    expect((el.querySelector('.ucam-inbox__detalhe input') as HTMLInputElement).value).toBe('8,5');
    expect(el.querySelector('.ucam-inbox__detalhe form')?.textContent).toContain('Gravar nova nota');
    expect(el.querySelector('ucam-list-item')?.textContent).toContain('Nota 8,5');
  });

  it('redação em branco é dita em palavra, e ainda recebe nota', async () => {
    const { el, f, estavel } = await montar();
    api.texto.mockReturnValue(of({ respostaTextual: '', textoReferencia: null, descricaoQuestao: '<p>Tema</p>' }));
    f.componentInstance.abrir(espera[1]);
    await estavel();
    expect(el.textContent).toContain('sem escrever a redação');
    expect(el.querySelector('.ucam-inbox__detalhe form')).not.toBeNull();
  });

  it('fila vazia explica a causa e oferece a saída', async () => {
    espera = [];
    const { el } = await montar();
    expect(el.textContent).toContain('Nenhuma redação em espera');
    expect(el.textContent).toContain('Ver as corrigidas');
  });

  it('o endereço abre direto uma redação', async () => {
    const { el } = await montar('/banca/redacoes?redacao=cp-2');
    expect(el.querySelector('#t-redacao')?.textContent).toContain('Diego Farias');
    expect(el.querySelector('.ucam-inbox')?.getAttribute('data-painel')).toBe('detalhe');
  });
});
