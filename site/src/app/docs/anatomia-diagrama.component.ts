import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterNextRender,
  computed,
  input,
  signal,
  viewChild,
  inject,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import type { Anatomia } from '../spec/spec.types';

/** Uma parte que foi ACHADA no preview, com a caixa que ela ocupa. */
interface Marca {
  n: number;
  parte: string;
  classe: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Canto da pastilha, já afastado de quem chegou antes. */
  nx: number;
  ny: number;
}

/**
 * O diagrama de anatomia: o componente REAL com as partes numeradas em cima.
 *
 * Spectrum, Carbon, Material e o zeroheight documentam anatomia como desenho
 * com chamadas numeradas, e o motivo é prático — o rótulo responde "qual parte
 * deste componente o token pinta?", que é a pergunta que uma tabela de três
 * colunas nunca responde. Aqui a anatomia era essa tabela.
 *
 * As posições são MEDIDAS do DOM depois de o preview renderizar, nunca escritas
 * à mão: o contrato já diz, em `anatomia[].classe`, qual classe do Trilho A é
 * cada parte — 193 das 313 partes têm o campo —, então o diagrama pergunta ao
 * navegador onde aquela classe caiu e põe o número ali. Componente que mude de
 * desenho continua com o diagrama certo, e nenhum pixel é hard-coded.
 *
 * DEGRADA: parte sem `classe`, ou com classe que não aparece no preview, não
 * ganha número — continua na legenda, sem chamada. Se NENHUMA for achada, o
 * palco some e sobra a legenda, que é a tabela de antes.
 *
 * Fica tudo no cliente de propósito. No prerender não há layout para medir, e
 * as marcas são absolutas sobre o palco: elas aparecem por cima, sem empurrar
 * nada, então não há salto de layout quando chegam.
 */
@Component({
  selector: 'ucam-anatomia-diagrama',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (preview()) {
      <figure class="anatomia-figura">
        <div class="anatomia-palco" #palco>
          <div class="ucam anatomia-peca" #peca [innerHTML]="html()" inert></div>
          @for (m of marcas(); track m.n) {
            <span
              class="anatomia-caixa"
              aria-hidden="true"
              [class.realce]="emFoco() === m.parte"
              [class.apagada]="emFoco() !== null && emFoco() !== m.parte"
              [style.left.px]="m.x"
              [style.top.px]="m.y"
              [style.width.px]="m.w"
              [style.height.px]="m.h"
            ></span>
            <span
              class="anatomia-numero"
              aria-hidden="true"
              [class.realce]="emFoco() === m.parte"
              [class.apagada]="emFoco() !== null && emFoco() !== m.parte"
              [style.left.px]="m.nx"
              [style.top.px]="m.ny"
              >{{ m.n }}</span
            >
          }
        </div>
        @if (marcas().length) {
          <figcaption class="small muted">
            {{ marcas().length }} de {{ partes().length }} partes localizadas no desenho.
            As demais não declaram classe do Trilho A no contrato.
          </figcaption>
        }
      </figure>
    }

    <!-- A legenda GOVERNA o desenho.
         Em componente denso — o Anexo tem sete partes numa área de 250×60px —
         as pastilhas se encostam por mais que se tentem os quatro cantos, e
         nenhum arranjo de chamadas resolve isso: é espaço que não existe.
         Apontar ou tabular um item apaga as outras e deixa uma parte só em
         cena, que é como o zeroheight e o Nord resolvem diagramas apertados.
         Sem ponteiro nenhum, tudo continua visível — a leitura de relance não
         depende de interação. -->
    <ol class="anatomia-legenda">
      @for (p of partes(); track p.parte) {
        <li
          [class.ativa]="emFoco() === p.parte"
          (mouseenter)="emFoco.set(p.parte)"
          (mouseleave)="emFoco.set(null)"
          (focusin)="emFoco.set(p.parte)"
          (focusout)="emFoco.set(null)"
          [tabindex]="numeroDe(p.parte) ? 0 : null"
        >
          <span class="anatomia-chamada" [class.sem-numero]="!numeroDe(p.parte)">
            {{ numeroDe(p.parte) ?? '—' }}
          </span>
          <span class="anatomia-corpo">
            <span class="anatomia-parte">
              <code>{{ p.parte }}</code>
              @if (!p.obrigatorio) {
                <span class="anatomia-opcional">opcional</span>
              }
            </span>
            <span class="anatomia-descricao">{{ p.descricao }}</span>
          </span>
        </li>
      }
    </ol>
  `,
  styles: `
    .anatomia-figura {
      margin: 0 0 1.25rem;
    }
    /* O palco tem o mesmo chão dos outros previews da página: o desenho é o
       componente de verdade, e ele precisa da superfície em que vive. */
    .anatomia-palco {
      position: relative;
      padding: 2.25rem 2rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
      overflow: hidden;
    }
    .anatomia-peca {
      position: relative;
    }
    /* Tracejado, não sólido: o contorno é ANOTAÇÃO sobre o componente, e um
       filete sólido na cor de marca seria lido como estado dele — o mesmo
       engano que a ADR-022 evita no resto do site. */
    .anatomia-caixa {
      position: absolute;
      pointer-events: none;
      border: 1px dashed color-mix(in oklab, var(--ucam-color-action-primary-default) 55%, transparent);
      border-radius: var(--ucam-radius-sm);
      transition: opacity 120ms ease;
    }
    /* Quem não está em foco some quase por inteiro em vez de sumir de vez: a
       caixa continua dizendo que há outras partes ali. */
    .anatomia-caixa.apagada,
    .anatomia-numero.apagada {
      opacity: 0.15;
    }
    .anatomia-caixa.realce {
      border-style: solid;
      border-color: var(--ucam-color-action-primary-default);
    }
    .anatomia-numero.realce {
      z-index: 1;
    }
    /* A pastilha sai da caixa e vira irmã dela, posicionada pelo script.
       Filha, ela herdava o canto da caixa e duas partes vizinhas — a barra e
       a dica do Compositor, que se encostam — empilhavam os números um sobre
       o outro. Ver resolveColisao(). */
    .anatomia-numero {
      position: absolute;
      transition: opacity 120ms ease;
      display: grid;
      place-items: center;
      inline-size: 1.3rem;
      block-size: 1.3rem;
      border-radius: 999px;
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-action-primary-on);
      font-family: var(--f-mono);
      /* 11px, não 10: o piso de texto do site. O círculo cresceu junto,
         para o numeral não encostar na borda. */
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 1;
    }
    .anatomia-legenda {
      display: grid;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .anatomia-legenda li {
      display: flex;
      align-items: start;
      gap: 0.6rem;
      padding: 0.25rem 0.4rem;
      margin-inline: -0.4rem;
      border-radius: var(--ucam-radius-sm);
      transition: background var(--transicao, 120ms ease);
    }
    /* O realce da linha é o filete de acento, não fundo cinza — ADR-040. */
    .anatomia-legenda li.ativa {
      box-shadow: inset 2px 0 0 var(--ucam-color-action-primary-default);
    }
    .anatomia-legenda li:focus-visible {
      outline: var(--ucam-focus-ring-width, 2px) solid var(--ucam-color-border-focus);
      outline-offset: 1px;
    }
    .anatomia-chamada {
      flex: none;
      display: grid;
      place-items: center;
      inline-size: 1.3rem;
      block-size: 1.3rem;
      margin-block-start: 0.1rem;
      border-radius: 999px;
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-action-primary-on);
      font-family: var(--f-mono);
      /* 11px, não 10: o piso de texto do site. O círculo cresceu junto,
         para o numeral não encostar na borda. */
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 1;
    }
    /* Parte que o desenho não achou não ganha pastilha cheia: o número seria
       uma promessa de que existe uma chamada lá em cima. */
    .anatomia-chamada.sem-numero {
      background: none;
      border: 1px dashed var(--ucam-color-border-default);
      color: var(--ucam-color-text-secondary);
    }
    .anatomia-corpo {
      display: grid;
      gap: 0.1rem;
      min-inline-size: 0;
    }
    .anatomia-parte {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .anatomia-opcional {
      font-size: 0.6875rem;
      color: var(--ucam-color-text-secondary);
    }
    .anatomia-descricao {
      font-size: 0.875rem;
      color: var(--ucam-color-text-secondary);
      max-inline-size: var(--measure);
    }
  `,
})
export class AnatomiaDiagramaComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly partes = input<Anatomia[]>([]);
  /** O HTML do preview do Trilho A — o mesmo que o catálogo desenha. */
  readonly preview = input<string>('');

  private readonly palco = viewChild<ElementRef<HTMLElement>>('palco');
  private readonly peca = viewChild<ElementRef<HTMLElement>>('peca');

  protected readonly marcas = signal<Marca[]>([]);

  /** A parte que a legenda está apontando, ou null quando ninguém aponta. */
  protected readonly emFoco = signal<string | null>(null);

  protected readonly html = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.preview()),
  );

  private readonly porParte = computed(() => {
    const m = new Map<string, number>();
    for (const x of this.marcas()) m.set(x.parte, x.n);
    return m;
  });

  protected numeroDe(parte: string): number | null {
    return this.porParte().get(parte) ?? null;
  }

  constructor() {
    afterNextRender(() => {
      this.medir();
      // O desenho reflui com a página: a caixa medida em 1440px está errada em
      // 900px, e as marcas são absolutas — ficariam apontando para o vazio.
      if (typeof ResizeObserver !== 'undefined') {
        const alvo = this.palco()?.nativeElement;
        if (alvo) new ResizeObserver(() => this.medir()).observe(alvo);
      }
    });
  }

  /**
   * Afasta pastilhas que cairiam uma sobre a outra.
   *
   * O canto natural é o topo-esquerdo da caixa, deslocado para fora. Partes
   * aninhadas ou encostadas compartilham esse canto: no Compositor, "barra" e
   * "dica" ficavam com os números 3 e 4 sobrepostos, e o 5 caía em cima do
   * botão Anexar.
   *
   * A saída é descer em degraus até achar lugar livre, e não empurrar para o
   * lado: para baixo a pastilha corre pela BORDA da caixa, que é onde ela
   * ainda descreve a parte; para o lado ela entraria no meio do desenho.
   */
  private resolveColisao(marcas: Marca[]): Marca[] {
    const LADO = 18;
    const META = LADO / 2;
    const postas: { x: number; y: number }[] = [];
    const livre = (x: number, y: number) =>
      !postas.some((p) => Math.abs(p.x - x) < LADO && Math.abs(p.y - y) < LADO);

    for (const m of marcas) {
      // Os QUATRO cantos da caixa, em ordem de preferência. Partes aninhadas
      // compartilham um canto, raramente os quatro: o topo-esquerdo do tile do
      // Anexo é o mesmo da figura e do corpo, mas o topo-direito do corpo está
      // livre. Tentar os cantos antes de empilhar foi o que tirou três
      // pastilhas de cima do nome do arquivo.
      const cantos = [
        [m.x - META, m.y - META],
        [m.x + m.w - META, m.y - META],
        [m.x - META, m.y + m.h - META],
        [m.x + m.w - META, m.y + m.h - META],
      ];

      let posto = cantos.find(([x, y]) => livre(x, y));

      // Nenhum canto livre: desce pela borda esquerda, que ainda é a caixa.
      if (!posto) {
        let y = m.y - META;
        for (let i = 0; i < 8 && !livre(m.x - META, y); i++) y += LADO + 3;
        posto = [m.x - META, y];
      }

      const nx = Math.max(2, posto[0]);
      const ny = Math.max(2, posto[1]);
      postas.push({ x: nx, y: ny });
      m.nx = nx;
      m.ny = ny;
    }
    return marcas;
  }

  private medir(): void {
    const palco = this.palco()?.nativeElement;
    const peca = this.peca()?.nativeElement;
    if (!palco || !peca) return;
    // A pré-renderização do Analog executa o afterNextRender sobre um DOM de
    // servidor sem geometria: o nó existe, getBoundingClientRect não. Medir
    // ali lançava 46 erros no build (24/09/2026); a medida certa é a do
    // navegador, que repete a passada na hidratação.
    if (typeof palco.getBoundingClientRect !== 'function') return;

    const base = palco.getBoundingClientRect();
    const achadas: Marca[] = [];
    let n = 0;

    for (const p of this.partes()) {
      const classe = (p as Anatomia & { classe?: string }).classe;
      if (!classe) continue;
      // A raiz pode ser o próprio nó de topo do preview, que não é descendente.
      const alvo =
        peca.querySelector<HTMLElement>('.' + CSS.escape(classe)) ??
        (peca.firstElementChild?.classList.contains(classe)
          ? (peca.firstElementChild as HTMLElement)
          : null);
      if (!alvo) continue;

      const r = alvo.getBoundingClientRect();
      // Caixa de área zero é elemento escondido: numerá-la poria a pastilha
      // num canto sem nada por baixo.
      if (r.width < 2 || r.height < 2) continue;

      achadas.push({
        n: ++n,
        parte: p.parte,
        classe,
        x: r.left - base.left,
        y: r.top - base.top,
        w: r.width,
        h: r.height,
        nx: 0,
        ny: 0,
      });
    }

    this.marcas.set(this.resolveColisao(achadas));
  }
}
