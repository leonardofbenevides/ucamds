import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { IsencaoApi } from '../../isencao/isencao.api';
import { CursoFila, IsencaoAnalise } from '../../isencao/isencao.model';
import { AnaliseIsencaoPage } from './analise';
import { FilaIsencaoPage } from './fila';

describe('Isenção — secretaria', () => {
  const api = {
    emAnalise: vi.fn(),
    concluidas: vi.fn(),
    matrizes: vi.fn(),
    analise: vi.fn(),
    avaliar: vi.fn(),
    enderecoDoDocumento: vi.fn(() => 'http://back/doc'),
  };
  const linha = (nome: string, fip: string, situacao: string, documentos: number, extra = {}) => ({
    nome,
    situacao,
    status: situacao,
    documentos,
    telefone: '(22) 99999-0000',
    email: `${fip}@exemplo.com`,
    periodoLetivo: '2026.2',
    datasolicitacao: '2026-09-12T12:00:00Z',
    dataalteracao: '2026-09-14T12:00:00Z',
    formaIngressoPessoa: fip,
    ...extra,
  });
  let emAnalise: CursoFila[];
  let concluidas: CursoFila[];
  let analise: IsencaoAnalise;

  function novaAnalise(): IsencaoAnalise {
    return {
      curso: 'DIREITO',
      nome: 'JOÃO CUTRIM',
      cpf: '11122233344',
      telefone: ['(22) 99911-2233'],
      email: 'joao@exemplo.com',
      status: 'PENDENTE_ANALISE',
      observacao: null,
      semestres: {
        '1': [
          { oid: 'd1', nome: 'Introdução ao Estudo do Direito', aceita: 'PENDENTE', motivo: null },
          { oid: 'd2', nome: 'Teoria Geral do Estado', aceita: 'PENDENTE', motivo: null },
        ],
        '2': [{ oid: 'd3', nome: 'Direito Civil I', aceita: 'PENDENTE', motivo: null }],
      },
      documentos: [{ oid: 'doc1', descricao: 'Histórico escolar', datacriacao: '2026-09-12T12:00:00Z', filename: 'historico.pdf' }],
    };
  }

  async function preparar() {
    TestBed.resetTestingModule();
    api.emAnalise.mockReset().mockImplementation(() => of(emAnalise));
    api.concluidas.mockReset().mockImplementation(() => of(concluidas));
    api.matrizes.mockReset().mockReturnValue(of([{ oidmatriz: 'mat-1', matriz: 'DIR20222' }, { oidmatriz: 'mat-2', matriz: 'DIR20201' }]));
    api.analise.mockReset().mockImplementation(() => of(structuredClone(analise)));
    api.avaliar.mockReset().mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'banca/isencao', component: FilaIsencaoPage },
            { path: 'banca/isencao/:oid', component: AnaliseIsencaoPage },
          ],
          withComponentInputBinding(),
        ),
        { provide: IsencaoApi, useValue: api },
      ],
    }).compileComponents();
  }

  async function abrir<T>(url: string, tipo: new (...a: never[]) => T) {
    await preparar();
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl(url, tipo as never) as T;
    const estavel = async () => {
      for (let volta = 0; volta < 4; volta++) {
        await new Promise((r) => setTimeout(r));
        await harness.fixture.whenStable();
      }
    };
    await estavel();
    return { el: harness.routeNativeElement as HTMLElement, pagina, estavel };
  }

  beforeEach(() => {
    emAnalise = [
      {
        nome: 'DIREITO',
        unidade: 'Campos',
        candidates: [
          linha('JOÃO CUTRIM', 'joao', 'PENDENTE_ANALISE', 2, { codigomatriz: 'mat-1' }),
          linha('ANA PAULA ROCHA', 'anapaula', 'PENDENTE_ANALISE', 0),
          linha('MARCOS TEIXEIRA', 'marcos', 'ANALISADO_COM_PENDENCIA', 1),
        ],
      },
      { nome: 'ADMINISTRAÇÃO', unidade: 'Campos', candidates: [linha('BEATRIZ LIMA', 'beatriz', 'PENDENTE_ANALISE', 1)] },
    ];
    concluidas = [{ nome: 'DIREITO', unidade: 'Campos', candidates: [linha('PEDRO ALVES', 'pedro', 'CONCLUIDO', 2, { codigomatriz: 'mat-1' })] }];
    analise = novaAnalise();
  });

  describe('FilaIsencaoPage', () => {
    const nomes = (el: HTMLElement) => [...el.querySelectorAll('tbody tr')].map((tr) => tr.textContent?.replace(/\s+/g, ' ').trim() ?? '');

    // Sem o roteador: as abas do DS leem o próprio valor num microtask do
    // construtor, e a primeira detecção tem de rodar antes dele.
    async function montar() {
      await preparar();
      const f = TestBed.createComponent(FilaIsencaoPage);
      f.detectChanges();
      const estavel = async () => {
        for (let volta = 0; volta < 4; volta++) {
          await new Promise((r) => setTimeout(r));
          await f.whenStable();
        }
      };
      await estavel();
      return { el: f.nativeElement as HTMLElement, pagina: f.componentInstance, estavel };
    }

    it('lista quem pediu, de que curso e em que pé está, com o nome em caixa natural e o link da análise', async () => {
      const { el } = await montar();
      const linhas = nomes(el);
      expect(linhas.length).toBe(4);
      expect(linhas.join(' | ')).toContain('João Cutrim');
      expect(linhas.find((l) => l.includes('Ana Paula Rocha'))).toContain('Aguardando envio');
      expect(linhas.find((l) => l.includes('Marcos Teixeira'))).toContain('Aguardando candidato');
      expect(linhas.find((l) => l.includes('Beatriz Lima'))).toContain('Administração');
      expect(el.querySelector('a[href="/banca/isencao/joao"]')).not.toBeNull();
    });

    it('a situação existe em dois controles com o mesmo valor: segmentado em tela larga, seleção em tela estreita', async () => {
      // Quatro rótulos longos não cabem em 390px: o segmentado rolava de lado
      // e escondia opções. Abaixo de 48rem quem aparece é a seleção.
      const { el } = await montar();
      const larga = el.querySelector('[data-situacao="larga"]');
      const estreita = el.querySelector('[data-situacao="estreita"]');
      expect(larga?.querySelector('ucam-segmented')).toBeTruthy();
      expect(estreita?.querySelector('ucam-select')).toBeTruthy();
      expect(larga?.className).toContain('md:block');
      expect(estreita?.className).toContain('md:hidden');
    });

    it('a situação, o curso e a busca recortam a fila; sem resultado, o vazio oferece limpar', async () => {
      const { el, pagina, estavel } = await montar();
      pagina.situacao.set('envio');
      await estavel();
      expect(nomes(el).length).toBe(1);
      pagina.curso.set('Administração');
      await estavel();
      expect(el.querySelectorAll('tbody tr a').length).toBe(0);
      expect(el.textContent).toContain('Limpar filtros');
      pagina.limparFiltros();
      await estavel();
      expect(nomes(el).length).toBe(4);
    });

    it('Concluídas é outro recorte da mesma tela', async () => {
      const { el, pagina, estavel } = await montar();
      pagina.trocarRecorte('concluidas');
      await estavel();
      expect(nomes(el).length).toBe(1);
      expect(nomes(el)[0]).toContain('Pedro Alves');
      expect(nomes(el)[0]).toContain('Concluída');
    });
  });

  describe('AnaliseIsencaoPage', () => {
    const botao = (el: HTMLElement, rotulo: string) => [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === rotulo);

    it('abre com a matriz já gravada na solicitação e as disciplinas dela, todas sem decisão', async () => {
      const { el, pagina } = await abrir('/banca/isencao/joao', AnaliseIsencaoPage);
      expect(api.matrizes).toHaveBeenCalledWith('joao');
      expect(api.analise).toHaveBeenCalledWith('joao', 'mat-1');
      expect(el.querySelector('ucam-page-header')?.textContent).toContain('João Cutrim');
      expect(el.querySelector('ucam-page-header')?.textContent).toContain('Aguardando análise');
      expect(el.textContent).toContain('Disciplinas da matriz DIR20222');
      expect(el.querySelectorAll('[data-disciplina]').length).toBe(3);
      expect(pagina.totais()).toBe('3 disciplinas · 3 sem decisão');
      expect(botao(el, 'Finalizar análise')).toBeTruthy();
    });

    it('disciplina sem decisão barra o fechamento, e o aviso diz quais são', async () => {
      const { el, pagina, estavel } = await abrir('/banca/isencao/joao', AnaliseIsencaoPage);
      pagina.decidir(pagina.disciplinas()[0], 'nao');
      pagina.pedirFechamento();
      await estavel();
      expect(pagina.dialogo()?.titulo).toBe('Faltam 2 decisões');
      expect(el.querySelector('ucam-dialog')?.textContent).toContain('Teoria Geral do Estado, Direito Civil I');
      expect(api.avaliar).not.toHaveBeenCalled();
    });

    it('isentar pede a origem; pedir documento pede o que falta — o erro fica em cada campo', async () => {
      const { el, pagina, estavel } = await abrir('/banca/isencao/joao', AnaliseIsencaoPage);
      const [a, b, c] = pagina.disciplinas();
      pagina.decidir(a, 'isentar');
      pagina.decidir(b, 'nao');
      pagina.decidir(c, 'documento');
      await estavel();
      expect(botao(el, 'Enviar pedido ao candidato')).toBeTruthy();
      pagina.pedirFechamento();
      await estavel();
      expect(pagina.dialogo()).toBeNull();
      const erros = [...el.querySelectorAll('[role="alert"]')].map((e) => e.textContent).join(' | ');
      expect(erros).toContain('Falta a disciplina de origem');
      expect(erros).toContain('Falta dizer o que o candidato deve enviar');
      expect(api.avaliar).not.toHaveBeenCalled();
    });

    it('com tudo decidido e preenchido, confirma com os números e grava a isenção inteira', async () => {
      const { el, pagina, estavel } = await abrir('/banca/isencao/joao', AnaliseIsencaoPage);
      const [a, b, c] = pagina.disciplinas();
      pagina.decidir(a, 'isentar');
      pagina.escrever(a, 'descricao', 'Introdução ao Direito');
      pagina.escrever(a, 'ies', 'UFF');
      pagina.escrever(a, 'cargaHoraria', '60');
      pagina.decidir(b, 'nao');
      pagina.decidir(c, 'nao');
      pagina.observacao.set('Parecer concluído.');
      pagina.pedirFechamento();
      await estavel();
      expect(el.querySelector('ucam-dialog')?.textContent).toContain('1 de 3 disciplinas isentas e 2 não isentas');
      analise = { ...novaAnalise(), status: 'CONCLUIDO' };
      await pagina.confirmar();
      await estavel();
      const [oid, corpo, matriz, parcial] = api.avaliar.mock.calls[0];
      expect([oid, matriz, parcial]).toEqual(['joao', 'mat-1', false]);
      expect(corpo.observacao).toBe('Parecer concluído.');
      expect(corpo.nome).toBe('JOÃO CUTRIM');
      expect(corpo.semestres['1'][0]).toMatchObject({ oid: 'd1', aceita: 'ACEITO', descricao: 'Introdução ao Direito', ies: 'UFF', cargaHoraria: '60' });
      expect(corpo.semestres['2'][0]).toMatchObject({ oid: 'd3', aceita: 'RECUSADO' });
      expect(el.querySelector('ucam-page-header')?.textContent).toContain('Concluída');
      expect(botao(el, 'Finalizar análise')).toBeUndefined();
    });

    it('salvar rascunho grava parcial, sem fechar, e diz a hora', async () => {
      const { el, pagina, estavel } = await abrir('/banca/isencao/joao', AnaliseIsencaoPage);
      pagina.decidir(pagina.disciplinas()[0], 'nao');
      await pagina.salvarRascunho();
      await estavel();
      expect(api.avaliar.mock.calls[0][3]).toBe(true);
      expect(el.textContent).toContain('Rascunho salvo às');
    });

    it('sem matriz gravada e com mais de uma disponível, pede a escolha antes de mostrar disciplinas', async () => {
      const { el, pagina, estavel } = await abrir('/banca/isencao/beatriz', AnaliseIsencaoPage);
      expect(api.analise).not.toHaveBeenCalled();
      expect(el.textContent).toContain('Escolha a matriz curricular');
      await pagina.trocarMatriz('mat-2');
      await estavel();
      expect(api.analise).toHaveBeenCalledWith('beatriz', 'mat-2');
      expect(el.querySelectorAll('[data-disciplina]').length).toBe(3);
    });

    it('quem não enviou documento abre com o contato, sem disciplinas e sem ações', async () => {
      const { el } = await abrir('/banca/isencao/anapaula', AnaliseIsencaoPage);
      expect(api.matrizes).not.toHaveBeenCalled();
      expect(el.textContent).toContain('Nenhum documento enviado');
      expect(el.textContent).toContain('anapaula@exemplo.com');
      expect(botao(el, 'Finalizar análise')).toBeUndefined();
      expect(botao(el, 'Salvar rascunho')).toBeUndefined();
    });

    it('concluída é só leitura: as decisões viram selo', async () => {
      analise = {
        ...novaAnalise(),
        status: 'CONCLUIDO',
        semestres: { '1': [{ oid: 'd1', nome: 'Introdução ao Estudo do Direito', aceita: 'ACEITO', motivo: null, descricao: 'Introdução ao Direito', ies: 'UFF', cargaHoraria: '60' }] },
      };
      const { el } = await abrir('/banca/isencao/pedro', AnaliseIsencaoPage);
      expect(el.querySelector('[data-disciplina]')?.textContent).toContain('Isenta');
      expect(el.querySelector('[data-disciplina]')?.textContent).toContain('Introdução ao Direito · UFF · 60 h');
      expect(el.querySelector('ucam-segmented')).toBeNull();
      expect(botao(el, 'Salvar rascunho')).toBeUndefined();
    });
  });
});
