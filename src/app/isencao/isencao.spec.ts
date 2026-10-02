import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AcompanhamentoIsencaoPage } from './acompanhamento';
import { IsencaoApi } from './isencao.api';
import { DisciplinaIsencao, IsencaoCandidato, decisaoDe, disciplinasEmOrdem, nomeProprio, situacaoDaDisciplina, situacaoDe } from './isencao.model';

const disc = (nome: string, aceita: DisciplinaIsencao['aceita'], motivo: string | null = null): DisciplinaIsencao => ({ nome, aceita, motivo });

describe('modelo da isenção', () => {
  it('a situação tem o mesmo nome dos dois lados, e sem documento é "aguardando envio"', () => {
    expect(situacaoDe('PENDENTE_ANALISE', 0)).toBe('envio');
    expect(situacaoDe('PENDENTE_ANALISE', 2)).toBe('analise');
    expect(situacaoDe('ANALISADO_COM_PENDENCIA', 1)).toBe('candidato');
    expect(situacaoDe('CONCLUIDO', 0)).toBe('concluida');
  });

  it('PENDENTE sem motivo é disciplina ainda não avaliada; com motivo, é pedido de documento', () => {
    expect(decisaoDe(disc('A', 'PENDENTE'))).toBe('');
    expect(decisaoDe(disc('A', null))).toBe('');
    expect(decisaoDe(disc('A', 'PENDENTE', ''))).toBe('documento');
    expect(decisaoDe(disc('A', 'ACEITO'))).toBe('isentar');
    expect(decisaoDe(disc('A', 'RECUSADO'))).toBe('nao');
    expect(situacaoDaDisciplina(disc('A', 'PENDENTE')).label).toBe('Em análise');
    expect(situacaoDaDisciplina(disc('A', 'PENDENTE', 'Falta a ementa')).label).toBe('Aguardando documento');
  });

  it('põe os períodos em ordem numérica e o nome em caixa natural', () => {
    expect(disciplinasEmOrdem({ '10': [disc('Z', null)], '2': [disc('B', null)], '1': [disc('A', null)] }).map((d) => d.periodo)).toEqual(['1', '2', '10']);
    expect(nomeProprio('MARCOS VINÍCIUS DE SOUZA')).toBe('Marcos Vinícius de Souza');
  });
});

describe('AcompanhamentoIsencaoPage', () => {
  const api = { doCandidato: vi.fn(), enviarDocumento: vi.fn(), enderecoDoDocumento: vi.fn((fip: string, d: string) => `http://back/isencao/${fip}/download/${d}`) };
  const base: IsencaoCandidato = {
    status: 'ANALISADO_COM_PENDENCIA',
    curso: 'DIREITO',
    observacao: 'Falta a ementa de Direito Civil I.',
    semestres: {
      '1': [{ nome: 'Introdução ao Estudo do Direito', aceita: 'ACEITO', motivo: null }, { nome: 'Teoria Geral do Estado', aceita: 'PENDENTE', motivo: null }],
      '2': [{ nome: 'Direito Civil I', aceita: 'PENDENTE', motivo: 'Envie a ementa de Direito Civil I.' }],
    },
    documentos: [{ oid: 'd1', descricao: 'Histórico escolar', datacriacao: '2026-09-10T12:00:00Z', filename: 'historico.pdf' }],
  };

  async function abrir(isencao: IsencaoCandidato) {
    TestBed.resetTestingModule();
    api.doCandidato.mockReset().mockReturnValue(of(isencao));
    api.enviarDocumento.mockReset();
    await TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'isencao/:oid', component: AcompanhamentoIsencaoPage }], withComponentInputBinding()), { provide: IsencaoApi, useValue: api }],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/isencao/joao', AcompanhamentoIsencaoPage);
    const estavel = async () => {
      for (let volta = 0; volta < 3; volta++) {
        await new Promise((r) => setTimeout(r));
        await harness.fixture.whenStable();
      }
    };
    await estavel();
    return { el: harness.routeNativeElement as HTMLElement, pagina, estavel };
  }

  it('com documento pedido, diz que espera o candidato, mostra o pedido e a ação de enviar', async () => {
    const { el } = await abrir(base);
    expect(api.doCandidato).toHaveBeenCalledWith('joao');
    expect(el.querySelector('ucam-page-header')?.textContent).toContain('Aguardando você');
    expect(el.textContent).toContain('A coordenação pediu um documento');
    expect(el.textContent).toContain('Falta a ementa de Direito Civil I.');
    expect(el.textContent).toContain('Envie a ementa de Direito Civil I.');
    expect(el.textContent).toContain('3 disciplinas · 1 isenta · 1 aguardando documento · 1 em análise');
    expect(el.querySelector('a[href="http://back/isencao/joao/download/d1"]')).not.toBeNull();
  });

  it('concluída, mostra o resultado e não oferece mais envio', async () => {
    const { el } = await abrir({ ...base, status: 'CONCLUIDO', semestres: { '1': [disc('A', 'ACEITO'), disc('B', 'RECUSADO')] } });
    expect(el.querySelector('ucam-page-header')?.textContent).toContain('Concluída');
    expect(el.textContent).toContain('1 de 2 disciplinas isentas.');
    expect([...el.querySelectorAll('button')].some((b) => b.textContent?.includes('Enviar documento') && !b.closest('ucam-dialog'))).toBe(false);
  });

  it('sem documento nenhum, pede o histórico e as ementas', async () => {
    const { el } = await abrir({ status: 'PENDENTE_ANALISE', curso: 'DIREITO', semestres: {}, documentos: [] });
    expect(el.textContent).toContain('Falta enviar os documentos');
    expect(el.textContent).toContain('A lista de disciplinas aparece aqui quando a coordenação começar a análise.');
  });

  it('enviar exige descrição e arquivo, manda os dois e passa a mostrar a resposta do servidor', async () => {
    const { el, pagina, estavel } = await abrir(base);
    pagina.abrirEnvio();
    await estavel();
    await pagina.enviar();
    await estavel();
    expect([...el.querySelectorAll('[role="alert"]')].map((e) => e.textContent).join(' | ')).toContain('Falta a descrição');
    expect(api.enviarDocumento).not.toHaveBeenCalled();

    const arquivo = new File(['x'], 'ementa-civil.pdf', { type: 'application/pdf' });
    pagina.descricao.set('Ementa de Direito Civil I');
    pagina.arquivos.set([{ id: 'a1', nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type, estado: 'pendente' }]);
    pagina.guardar([arquivo]);
    api.enviarDocumento.mockReturnValue(
      of({ ...base, status: 'PENDENTE_ANALISE', documentos: [...base.documentos!, { oid: 'd2', descricao: 'Ementa de Direito Civil I', datacriacao: '2026-10-01T12:00:00Z', filename: 'ementa-civil.pdf' }] }),
    );
    await pagina.enviar();
    await estavel();
    expect(api.enviarDocumento).toHaveBeenCalledWith('joao', arquivo, 'Ementa de Direito Civil I');
    expect(el.querySelector('ucam-page-header')?.textContent).toContain('Em análise');
    expect(el.querySelectorAll('[aria-label="Documentos enviados"] ucam-anexo').length).toBe(2);
    expect(el.querySelector('[data-anuncio]')?.textContent).toContain('enviado');
  });
});
