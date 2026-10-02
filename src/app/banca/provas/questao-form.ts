import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { UcamAlert, UcamButton, UcamDialog, UcamEmptyState, UcamPageHeader, UcamSkeleton, UcamTextField, UcamTextarea } from '@ucam/ui';
import { firstValueFrom } from 'rxjs';
import { rotuloTipoProva } from '../../core/model/prova';
import { htmlParaTexto, textoParaHtml } from '../../core/store/prova.store';
import { MolduraBanca } from '../moldura-banca';
import { escreverNota, lerNota } from '../nota';
import { ProvasApi } from './provas.api';
import { ProvasStore } from './provas.store';

/** '3' → 3; null se não for posição válida (inteiro de 0 a 999). */
export function lerOrdem(texto: string): number | null {
  const t = texto.trim();
  return /^\d{1,3}$/.test(t) ? Number(t) : null;
}

/**
 * Criar ou editar uma questão de um caderno, em página própria: os dois
 * campos são texto longo, e texto longo não cabe em diálogo (padrão
 * formulario-entidade). O mesmo formulário serve à criação e à edição.
 *
 * TEXTO SIMPLES, e isso é limite conhecido: o legado edita com editor rico
 * (Quill) e guarda HTML. Aqui o HTML vira texto para editar e volta a
 * parágrafos ao gravar — negrito, lista e imagem de uma questão antiga se
 * perdem se ela for regravada por esta tela.
 */
@Component({
  selector: 'app-questao-form',
  imports: [MolduraBanca, UcamAlert, UcamButton, UcamDialog, UcamEmptyState, UcamPageHeader, UcamSkeleton, UcamTextField, UcamTextarea],
  templateUrl: './questao-form.html',
})
export class QuestaoFormPage {
  /** Parâmetros da rota: o caderno e, na edição, a questão. */
  readonly caderno = input.required<string>();
  readonly questao = input<string>();

  readonly store = inject(ProvasStore);
  private readonly api = inject(ProvasApi);
  private readonly router = inject(Router);

  readonly nova = computed(() => !this.questao());
  readonly cadernoAtual = computed(() => this.store.caderno(this.caderno()));
  readonly questaoAtual = computed(() => this.cadernoAtual()?.questoes.find((q) => q.oid === this.questao()) ?? null);
  /** Edição de uma questão que o escopo carregado não tem, ou caderno que não existe. */
  readonly naoEncontrada = computed(
    () => this.store.estado() === 'pronto' && (!this.cadernoAtual() || (!this.nova() && !this.questaoAtual())),
  );
  readonly nomeCaderno = computed(() => {
    const c = this.cadernoAtual();
    return c ? rotuloTipoProva(c.tipoprova) : 'Caderno';
  });
  readonly titulo = computed(() => (this.nova() ? 'Nova questão' : 'Editar questão'));
  readonly trilha = computed(() => [{ label: 'Provas', link: '/banca/provas' }, { label: this.nomeCaderno() }, { label: this.titulo() }]);

  readonly apoio = signal('');
  readonly enunciado = signal('');
  readonly pontuacao = signal('10');
  readonly ordem = signal('1');
  readonly erroEnunciado = signal<string | null>(null);
  readonly erroPontuacao = signal<string | null>(null);
  readonly erroOrdem = signal<string | null>(null);
  readonly salvando = signal(false);
  readonly erroAoSalvar = signal(false);
  readonly confirmandoExclusao = signal(false);
  readonly excluindo = signal(false);
  readonly erroAoExcluir = signal(false);

  constructor() {
    // Chegar direto pelo endereço: o cadastro ainda não foi carregado.
    if (!this.store.cadernos().length) void this.store.iniciar();

    // Os campos nascem da questão (edição) ou da próxima posição do caderno (criação).
    effect(() => {
      const c = this.cadernoAtual();
      const q = this.questaoAtual();
      const nova = this.nova();
      untracked(() => {
        if (q) {
          this.apoio.set(htmlParaTexto(q.textoreferencia ?? ''));
          this.enunciado.set(htmlParaTexto(q.descricao));
          this.pontuacao.set(escreverNota(q.pontuacao ?? 0));
          this.ordem.set(String(q.ordem ?? 0));
        } else if (c && nova) {
          this.ordem.set(String(Math.max(0, ...c.questoes.map((x) => x.ordem ?? 0)) + 1));
        }
      });
    });
  }

  async salvar(evento?: Event): Promise<void> {
    evento?.preventDefault();
    const c = this.cadernoAtual();
    if (!c || this.salvando()) return;

    const pontuacao = lerNota(this.pontuacao());
    const ordem = lerOrdem(this.ordem());
    this.erroEnunciado.set(this.enunciado().trim() ? null : 'Falta o enunciado. Escreva o que o candidato deve fazer.');
    this.erroPontuacao.set(pontuacao === null ? 'Pontuação fora da escala. Use um valor de 0 a 10, de meio em meio ponto.' : null);
    this.erroOrdem.set(ordem === null ? 'Ordem inválida. Use um número inteiro: 1 para a primeira questão do caderno.' : null);
    if (this.erroEnunciado() || pontuacao === null || ordem === null) return;

    const campos = {
      textoreferencia: textoParaHtml(this.apoio()),
      descricao: textoParaHtml(this.enunciado()),
      pontuacao,
      ordem,
    };
    this.salvando.set(true);
    this.erroAoSalvar.set(false);
    try {
      const q = this.questaoAtual();
      await firstValueFrom(q ? this.api.salvarQuestao(c.oid, q.oid, campos) : this.api.criarQuestao(c.oid, campos));
      await this.store.recarregar();
      await this.voltar();
    } catch {
      this.erroAoSalvar.set(true);
    } finally {
      this.salvando.set(false);
    }
  }

  cancelar(): void {
    void this.voltar();
  }

  /** O diálogo fechou sem confirmar: nada é excluído. */
  dialogoMudou(aberto: boolean): void {
    if (!this.excluindo()) this.confirmandoExclusao.set(aberto);
  }

  async excluir(): Promise<void> {
    const q = this.questaoAtual();
    if (!q || this.excluindo()) return;
    this.excluindo.set(true);
    this.erroAoExcluir.set(false);
    try {
      await firstValueFrom(this.api.excluirQuestao(q.oid));
      this.confirmandoExclusao.set(false);
      await this.store.recarregar();
      await this.voltar();
    } catch {
      this.erroAoExcluir.set(true);
    } finally {
      this.excluindo.set(false);
    }
  }

  private voltar(): Promise<boolean> {
    return this.router.navigate(['/banca/provas']);
  }
}
