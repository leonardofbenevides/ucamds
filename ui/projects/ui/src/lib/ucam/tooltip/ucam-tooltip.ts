import { isPlatformBrowser } from '@angular/common';
import { Overlay, OverlayPositionBuilder, type ConnectedPosition, type OverlayRef } from '@angular/cdk/overlay';
import { DomPortal } from '@angular/cdk/portal';
import {
  booleanAttribute,
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  numberAttribute,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';

/**
 * Contrato: spec/components/tooltip.json
 *
 * Diretiva, não elemento — mudança de esquema feita de propósito em
 * 06/09/2026. Dica não é caixa no arranjo: é comportamento colado a um
 * controle que já existe. Como elemento, todo botão com dica ganharia um
 * invólucro que muda o fluxo do pai.
 *
 * NÃO ENVOLVE MAIS O zTooltip DA BASE, e a razão é de fronteira, não de gosto.
 * O envelope anterior entrava por `hostDirectives`, e diretiva de host é
 * visível ao consumidor: o compilador exige que ela seja exportada da API
 * pública (NG3001). Exportá-la é exatamente o que a ADR-006 proíbe — e o
 * `sync-ui.mjs` falha o build se algum símbolo Zard* aparecer no public-api.
 * As duas regras não podiam valer ao mesmo tempo com aquele desenho.
 *
 * O build chegou a passar uma vez com o envelope: o cache do ng-packagr
 * compilou por incremento e não recompilou o arquivo novo. Só a compilação
 * limpa mostrou o conflito — não confiar em build verde vindo de cache.
 *
 * O que se ganhou ao descer para o CDK direto, além de resolver a fronteira:
 * as três metades da WCAG 1.4.13 passam a existir de verdade. A base entrega a
 * dispensa por tempo; o contrato pede PERSISTENTE (não some sozinha),
 * APONTÁVEL (fica aberta enquanto o ponteiro estiver sobre o balão, para poder
 * ser lida) e DISPENSÁVEL por Esc. A apontável, em particular, não existia.
 */
export type UcamTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Posição preferida primeiro, e depois as saídas. É preferência, não ordem:
 * perto da borda da janela o balão vira para o lado que couber — senão a dica
 * sai da tela, que é o defeito que a dica nativa tem.
 */
const LADOS: Record<UcamTooltipPosition, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -6 },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 6 },
};

/** O oposto de cada lado — a primeira saída a tentar quando o preferido não cabe. */
const OPOSTO: Record<UcamTooltipPosition, UcamTooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

let seq = 0;

@Directive({
  selector: '[ucamTooltip]',
  exportAs: 'ucamTooltip',
  host: {
    class: 'ucam-tooltip-gatilho',
    '(mouseenter)': 'aoApontar()',
    '(mouseleave)': 'aoSair()',
    '(focus)': 'aoFocar()',
    '(blur)': 'fechar()',
    '(keydown.escape)': 'aoEscapar($event)',
  },
})
export class UcamTooltip {
  private readonly overlay = inject(Overlay);
  private readonly posicoes = inject(OverlayPositionBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly plataforma = inject(PLATFORM_ID);

  readonly ucamTooltip = input.required<string>();
  readonly tooltipPosition = input<UcamTooltipPosition>('top');
  /**
   * Espera antes de abrir no ponteiro. Existe para atravessar uma fileira de
   * botões sem acender todos. NÃO se aplica ao foco de teclado: quem chegou
   * ali por Tab já escolheu o controle, e fazê-lo esperar 400ms é punir o
   * teclado por um problema que só o mouse tem.
   */
  readonly tooltipDelay = input(400, { transform: numberAttribute });
  /** Desliga sem tirar a diretiva — o caso do texto que só corta em tela estreita. */
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });

  private readonly id = `ucam-tt-${++seq}`;
  private ref?: OverlayRef;
  private balao?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  /** O ponteiro está sobre o BALÃO — o que segura a dica aberta (1.4.13, apontável). */
  private sobreBalao = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destruir());

    // Texto novo com a dica aberta tem de chegar ao balão que já está na tela;
    // sem isto a dica mostraria a frase anterior até fechar e reabrir.
    effect(() => {
      const texto = this.ucamTooltip();
      if (this.balao) this.balao.textContent = texto;
      if (this.tooltipDisabled()) this.fechar();
    });
  }

  protected aoApontar(): void {
    this.agendar(this.tooltipDelay());
  }

  protected aoFocar(): void {
    this.agendar(0);
  }

  protected aoSair(): void {
    // Sai pelo ponteiro: dá uma janela curta para o ponteiro ALCANÇAR o balão.
    // Sem ela, o balão fecha no vão de 6px entre o gatilho e a caixa, e a dica
    // vira inalcançável — que é o defeito que a 1.4.13 chama de não apontável.
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.sobreBalao) this.fechar();
    }, 120);
  }

  /**
   * Esc fecha SEM tirar o foco do gatilho (WCAG 1.4.13). O stopPropagation é
   * necessário: sem ele o mesmo Esc que dispensa a dica fecharia também o
   * diálogo ou a gaveta em que o controle vive — uma tecla, dois efeitos, e a
   * pessoa perde o formulário para ver um balão sumir.
   */
  protected aoEscapar(evento: Event): void {
    if (!this.ref?.hasAttached()) return;
    evento.stopPropagation();
    evento.preventDefault();
    this.fechar();
  }

  private agendar(espera: number): void {
    if (this.tooltipDisabled() || !this.ucamTooltip()?.trim()) return;
    if (!isPlatformBrowser(this.plataforma)) return;
    clearTimeout(this.timer);
    if (espera === 0) {
      this.abrir();
      return;
    }
    this.timer = setTimeout(() => this.abrir(), espera);
  }

  private abrir(): void {
    if (this.ref?.hasAttached()) return;
    const ref = (this.ref ??= this.criarOverlay());
    ref.attach(new DomPortal(this.criarBalao()));
    // aria-describedby DESCREVE, não nomeia. Quem nomeia é o rótulo visível ou
    // o aria-label — uma dica como nome acessível some para quem usa toque.
    this.host.nativeElement.setAttribute('aria-describedby', this.id);
  }

  /** protected, não private: o `(blur)` do host é template e não enxerga private. */
  protected fechar(): void {
    clearTimeout(this.timer);
    this.sobreBalao = false;
    if (!this.ref?.hasAttached()) return;
    this.ref.detach();
    this.host.nativeElement.removeAttribute('aria-describedby');
  }

  private criarOverlay(): OverlayRef {
    const preferida = this.tooltipPosition();
    const ordem: UcamTooltipPosition[] = [
      preferida,
      OPOSTO[preferida],
      ...(['top', 'bottom', 'right', 'left'] as UcamTooltipPosition[]).filter(
        (l) => l !== preferida && l !== OPOSTO[preferida],
      ),
    ];
    return this.overlay.create({
      positionStrategy: this.posicoes
        .flexibleConnectedTo(this.host)
        .withPositions(ordem.map((l) => LADOS[l])),
      // A dica ACOMPANHA a rolagem em vez de sumir: ela está presa a um
      // controle que continua na tela.
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      disposeOnNavigation: true,
    });
  }

  /**
   * O balão é DOM cru, não componente. Um componente aqui entraria no grafo de
   * tipos da diretiva e traria de volta a discussão de fronteira que motivou
   * esta reescrita — por três elementos de marcação sem estado.
   *
   * As classes são as do Trilho A (`.ucam-tooltip`), não utilitárias do
   * Tailwind: é o mesmo balão nos dois trilhos, e o dia em que o desenho mudar
   * ele muda uma vez só.
   */
  private criarBalao(): HTMLElement {
    if (this.balao) return this.balao;
    const el: HTMLElement = this.renderer.createElement('div');
    el.id = this.id;
    el.setAttribute('role', 'tooltip');
    el.className = 'ucam ucam-tooltip';
    el.textContent = this.ucamTooltip();
    // Apontável: enquanto o ponteiro estiver sobre o balão, ele fica. É o que
    // permite ler uma dica longa e selecionar o texto dela.
    el.addEventListener('mouseenter', () => {
      this.sobreBalao = true;
      clearTimeout(this.timer);
    });
    el.addEventListener('mouseleave', () => {
      this.sobreBalao = false;
      this.fechar();
    });
    this.balao = el;
    return el;
  }

  private destruir(): void {
    clearTimeout(this.timer);
    this.ref?.dispose();
    this.ref = undefined;
    this.balao?.remove();
    this.balao = undefined;
  }
}
