import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UcamBadge, UcamButton, UcamCitacao, UcamIconTile, UcamSectionBar, UcamTooltip } from '@ucam/ui';
import { ProvaProtegida } from '../../../core/directives/prova-protegida';
import { iconeTipoProva, rotuloTipoProva } from '../../../core/model/prova';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { ProvaStore } from '../../../core/store/prova.store';
import { ProvaPage } from '../prova';

const LETRAS = 'ABCDEFG';

@Component({
  selector: 'app-questao',
  imports: [UcamBadge, UcamButton, UcamCitacao, UcamIconTile, UcamSectionBar, UcamTooltip, ProvaProtegida],
  templateUrl: './questao.html',
  styles: `
    /* O cartão do DS alinha pelo topo porque prevê título + linha de apoio;
       a alternativa é uma linha só, e o texto precisa ficar no eixo da letra. */
    :host .ucam-choice-card {
      align-items: center;
      /* Sem a marca no canto, o recuo que a reservava volta ao do cartão. */
      padding-inline-end: var(--ucam-space-inset-sm);
    }
    /* A ESCOLHIDA NÃO LEVA CHECK. Numa prova, check ao lado da alternativa lê
       como "certa", e a tela não sabe se está certa — só que foi a escolhida.
       O contrato do cartão pede um segundo sinal além da borda (WCAG 1.4.1),
       e aqui ele é o do cartão-resposta: a letra preenchida. É desvio
       declarado da ADR-046, que deixa o chip neutro — lá o chip é enfeite,
       aqui a letra é o nome da alternativa. */
    :host .ucam-choice-card:has(input:checked) .ucam-choice-card__figura {
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-action);
      /* A letra "assenta" ao ser marcada: um pulso curto de escala, só em
         propriedade que não recalcula layout, na duração de superfície que
         aparece. prefers-reduced-motion é respeitado pela regra global do DS. */
      animation: app-marcar var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-standard);
    }
    @keyframes app-marcar {
      50% { scale: 1.1; }
    }
    /* O título recebe foco por programa, não por Tab: sem anel quando o foco
       veio do ponteiro, com o anel do DS quando veio do teclado. */
    :host h2:focus:not(:focus-visible) {
      outline: none;
    }
    /* O botão de alternância pressionado fala a língua do "escolhido" do DS
       (ADR-046): um sinal de superfície e um de tipografia, mais o ponto de
       atenção que o mapa usa para a mesma marca. */
    :host .ucam-btn[aria-pressed='true'] {
      background: var(--ucam-color-action-primary-subtle);
      color: var(--ucam-color-text-primary);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    :host .ucam-btn[aria-pressed]::before {
      content: '';
      inline-size: 0.625rem;
      block-size: 0.625rem;
      border-radius: var(--ucam-radius-pill);
      border: 1px solid var(--ucam-color-border-strong);
      transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
                  border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
    }
    :host .ucam-btn[aria-pressed='true']::before {
      background: var(--ucam-color-feedback-warning-graphic);
      border-color: var(--ucam-color-feedback-warning-graphic);
    }
  `,
})
export class QuestaoPage {
  readonly caderno = input.required<string>();
  readonly n = input.required<number, string | number>({ transform: numberAttribute });

  readonly store = inject(ProvaStore);
  private readonly candidato = inject(CandidatoStore);
  private readonly router = inject(Router);
  private readonly pagina = inject(ProvaPage);
  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  readonly rotuloCaderno = computed(() => rotuloTipoProva(this.store.cadernoAtual()?.tipoprova ?? ''));
  /** O desenho da matéria: diz de que caderno é a questão antes de se ler o título. */
  readonly iconeCaderno = computed(() => iconeTipoProva(this.store.cadernoAtual()?.tipoprova ?? ''));
  readonly totalNoCaderno = computed(() => this.store.cadernoAtual()?.questoes.length ?? 0);
  readonly questao = this.store.questaoAtual;
  readonly escolhida = computed(() => this.store.respostas()[this.questao()?.oid ?? ''] ?? null);
  readonly marcada = computed(() => !!this.store.revisar()[this.questao()?.oid ?? '']);
  readonly alternativas = computed(() => (this.questao()?.alternativas ?? []).map((a, i) => ({ ...a, letra: LETRAS[i] })));
  readonly ehPrimeira = computed(() => this.store.anterior() === null);
  readonly proximaEhFim = computed(() => this.store.proxima() === 'fim');
  readonly proximaEhRedacao = computed(() => this.store.proxima() === 'redacao');
  readonly rotuloProxima = computed(() =>
    this.proximaEhFim() ? 'Entregar prova' : this.proximaEhRedacao() ? 'Ir para a redação' : 'Próxima',
  );
  /** Muda a cada questão: é o que recria o artigo e dispara a entrada dele. */
  readonly chave = computed(() => `${this.caderno()}/${this.n()}`);
  /** De onde a questão nova entra: avançando vem da direita, voltando vem da esquerda. */
  readonly direcao = signal<'frente' | 'tras'>('frente');
  /** O que o leitor de tela ouve ao marcar; limpa ao trocar de questão para não repetir. */
  readonly anuncio = signal('');
  private ultimoIndice = -1;

  constructor() {
    effect(() => {
      this.store.definirPosicao(this.caderno(), this.n());
      const i = untracked(() => this.store.indiceAtual());
      this.direcao.set(i < this.ultimoIndice ? 'tras' : 'frente');
      this.ultimoIndice = i;
      this.anuncio.set('');
    });
    // Cada questão nova leva o foco ao título dela: quem navega por teclado
    // ou leitor de tela começa a ler de onde a questão começa, em vez de ficar
    // parado no botão "Próxima" (WCAG 2.4.3). O artigo é recriado a cada
    // troca, então o viewChild muda e o efeito roda depois da pintura.
    afterRenderEffect(() => {
      this.titulo()?.nativeElement.focus();
    });
  }

  escolher(oidAlternativa: string): void {
    const q = this.questao();
    if (!q) return;
    this.store.responder(q.oid, oidAlternativa);
    const letra = this.alternativas().find((a) => a.oid === oidAlternativa)?.letra ?? '';
    this.anuncio.set(`Alternativa ${letra} marcada.`);
  }

  alternarRevisar(): void {
    const q = this.questao();
    if (!q) return;
    this.store.alternarRevisar(q.oid);
    this.anuncio.set(this.marcada() ? 'Questão marcada para revisar.' : 'Marca de revisão retirada.');
  }

  private base(): unknown[] {
    return ['/candidato', this.candidato.oidFip(), 'prova'];
  }

  anterior(): void {
    const p = this.store.anterior();
    if (p) this.router.navigate([...this.base(), p.slug, p.n]);
  }

  proxima(): void {
    const p = this.store.proxima();
    if (p === 'fim') {
      this.pagina.pedirEntrega.set('manual');
      return;
    }
    if (p === 'redacao') {
      this.router.navigate([...this.base(), 'redacao']);
      return;
    }
    this.router.navigate([...this.base(), p.slug, p.n]);
  }
}
