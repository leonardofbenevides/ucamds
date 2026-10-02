import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  UcamAlert,
  UcamButton,
  UcamCard,
  UcamChip,
  UcamDialog,
  UcamDrawer,
  UcamEmptyState,
  UcamListItem,
  UcamOption,
  UcamPageHeader,
  UcamSelect,
  UcamSkeleton,
} from '@ucam/ui';
import { firstValueFrom } from 'rxjs';
import { ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { htmlParaTexto } from '../../core/store/prova.store';
import { MolduraBanca } from '../moldura-banca';
import { escreverNota } from '../nota';
import { CadernoCadastro, EscopoProvas, Opcao, ProvasApi, QuestaoCadastro } from './provas.api';
import { ProvasStore } from './provas.store';

const opcoes = (lista: Opcao[]): UcamOption[] => lista.map((o) => ({ value: o.oid, label: o.rotulo }));

/**
 * O cadastro de provas: os cadernos de um processo seletivo, forma de
 * ingresso e captação, e as questões de cada um (padrão listagem-crud).
 *
 * O que vem do legado (`admin/cadastro`): o escopo de três escolhas, o caderno
 * de redação como o único que se cria por aqui, e ele só quando o escopo ainda
 * não tem caderno nenhum.
 */
@Component({
  selector: 'app-provas',
  imports: [
    MolduraBanca,
    UcamAlert,
    UcamButton,
    UcamCard,
    UcamChip,
    UcamDialog,
    UcamDrawer,
    UcamEmptyState,
    UcamListItem,
    UcamPageHeader,
    UcamSelect,
    UcamSkeleton,
  ],
  templateUrl: './provas.html',
})
export class ProvasPage {
  readonly store = inject(ProvasStore);
  private readonly api = inject(ProvasApi);
  private readonly router = inject(Router);

  readonly trilha = [{ label: 'Cadastro' }, { label: 'Provas' }];
  readonly filtrosAbertos = signal(false);
  readonly opcoesProcesso = computed(() => opcoes(this.store.processos()));
  readonly opcoesForma = computed(() => opcoes(this.store.formas()));
  readonly opcoesCaptacao = computed(() => opcoes(this.store.captacoes()));

  readonly criando = signal(false);
  readonly erroAoCriar = signal(false);
  /** O caderno cuja exclusão está sendo confirmada. */
  readonly excluindo = signal<CadernoCadastro | null>(null);
  readonly excluindoEmCurso = signal(false);
  readonly erroAoExcluir = signal(false);
  readonly anuncio = signal('');

  /** O legado só deixa criar o caderno de redação, e só no escopo que ainda não tem caderno. */
  readonly podeCriarRedacao = computed(() => !!this.store.vigencia() && this.store.cadernos().length === 0);

  constructor() {
    void this.store.iniciar();
  }

  mudar(parte: Partial<EscopoProvas>): void {
    void this.store.mudarEscopo(parte);
  }

  rotulo(c: CadernoCadastro): string {
    return rotuloTipoProva(c.tipoprova);
  }
  icone(c: CadernoCadastro): 'pencil' | 'fileText' {
    return ehRedacao(c.tipoprova) ? 'pencil' : 'fileText';
  }
  contagem(c: CadernoCadastro): string {
    const n = c.questoes.length;
    return n === 1 ? '1 questão' : `${n} questões`;
  }
  /** O começo do enunciado, em texto: é o que identifica a questão na lista. */
  trecho(q: QuestaoCadastro): string {
    return htmlParaTexto(q.descricao).replace(/\s+/g, ' ').trim() || 'Questão sem enunciado';
  }
  apoio(q: QuestaoCadastro): string {
    const partes = [`Vale ${escreverNota(q.pontuacao ?? 0)}`];
    if (htmlParaTexto(q.textoreferencia ?? '').trim()) partes.push('com texto de apoio');
    return partes.join(' · ');
  }
  linkQuestao(c: CadernoCadastro, q: QuestaoCadastro): string {
    return `/banca/provas/${c.oid}/questao/${q.oid}`;
  }

  abrirQuestao(evento: Event, c: CadernoCadastro, q: QuestaoCadastro): void {
    evento.preventDefault();
    void this.router.navigate(['/banca/provas', c.oid, 'questao', q.oid]);
  }

  novaQuestao(c: CadernoCadastro): void {
    void this.router.navigate(['/banca/provas', c.oid, 'questao', 'nova']);
  }

  async criarRedacao(): Promise<void> {
    const vigencia = this.store.vigencia();
    if (!vigencia || this.criando()) return;
    this.criando.set(true);
    this.erroAoCriar.set(false);
    try {
      await firstValueFrom(this.api.criarCaderno(vigencia, 'REDACAO'));
      await this.store.recarregar();
      this.anuncio.set('Caderno de redação criado. Falta a questão com a proposta.');
    } catch {
      this.erroAoCriar.set(true);
    } finally {
      this.criando.set(false);
    }
  }

  pedirExclusao(c: CadernoCadastro): void {
    this.erroAoExcluir.set(false);
    this.excluindo.set(c);
  }

  /** O diálogo fechou (Esc, ×, fundo ou Cancelar): nada é excluído. */
  dialogoMudou(aberto: boolean): void {
    if (!aberto && !this.excluindoEmCurso()) this.excluindo.set(null);
  }

  async excluirCaderno(): Promise<void> {
    const c = this.excluindo();
    if (!c || this.excluindoEmCurso()) return;
    this.excluindoEmCurso.set(true);
    this.erroAoExcluir.set(false);
    try {
      await firstValueFrom(this.api.excluirCaderno(c.oid));
      this.excluindo.set(null);
      await this.store.recarregar();
      this.anuncio.set(`Caderno de ${this.rotulo(c)} excluído.`);
    } catch {
      this.erroAoExcluir.set(true);
    } finally {
      this.excluindoEmCurso.set(false);
    }
  }
}
