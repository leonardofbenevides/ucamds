import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  PLATFORM_ID,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { ZardCommandComponent } from '@/shared/components/command/command.component';
import { ZardCommandImports } from '@/shared/components/command/command.imports';
import type { ZardCommandOption } from '@/shared/components/command/command.component';
import { UcamIcon } from '../icon/ucam-icon';
import type { UcamIconName } from '../icon/ucam-icons.generated';

/**
 * Contrato: spec/components/command.json
 *
 * Envelope sobre o z-command. A base entrega o filtro, a lista, o percurso por
 * setas e a região aria-live. O que ela NÃO tem, e este wrapper acrescenta:
 *
 *  - a SOBREPOSIÇÃO. O z-command é um painel em fluxo, não um diálogo: sem
 *    isto ele seria um bloco no meio da página;
 *  - o OUVINTE DO ATALHO. É a razão de o componente existir — o shell já
 *    mostrava o selo "Ctrl K" e declarava aria-keyshortcuts="Control+K" sem
 *    nada por trás, ou seja, anunciava uma tecla morta inclusive para quem usa
 *    leitor de tela e não tem como conferir na tela;
 *  - a DEVOLUÇÃO DO FOCO ao elemento que abriu, inclusive ao fechar por Esc;
 *  - o ESTADO VAZIO com o termo procurado, que a base deixa para quem usa.
 */
export interface UcamCommandItem {
  id: string;
  label: string;
  icone?: UcamIconName;
  atalho?: string;
  descricao?: string;
}

export interface UcamCommandGroup {
  titulo: string;
  itens: UcamCommandItem[];
}

@Component({
  selector: 'ucam-command',
  exportAs: 'ucamCommand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardCommandImports, A11yModule, UcamIcon],
  host: {
    // O ouvinte vive no documento porque o atalho tem de funcionar com o foco
    // em qualquer lugar da tela — é o que "atalho global" significa.
    '(document:keydown)': 'aoTeclar($event)',
  },
  template: `
    @if (open()) {
      <!-- A cortina é aria-hidden e não focável: quem lê por voz recebe o
           diálogo, que é modal, e não uma div vazia entre ele e a página. -->
      <div
        class="ucam-command__cortina fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ucam-color-surface-inverse)_45%,transparent)]"
        aria-hidden="true"
        (click)="fechar()"
      ></div>

      <!-- Ancorada no ALTO, não centrada na vertical: a lista cresce para
           baixo conforme se digita, e centrada a caixa saltaria a cada tecla. -->
      <div
        class="ucam-command fixed inset-inline-0 z-50 mx-auto w-[min(36rem,calc(100vw-2rem))]"
        style="inset-block-start: 12vh"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        (keydown.escape)="fechar()"
      >
        <z-command
          class="block rounded-[var(--ucam-radius-lg)] border border-[var(--ucam-color-border-default)] bg-[var(--ucam-color-surface-raised)] shadow-lg overflow-hidden"
          (zCommandSelected)="aoEscolher($event)"
        >
          <z-command-input [placeholder]="placeholder()" />
          <z-command-list [attr.aria-busy]="loading() ? 'true' : null">
            @for (g of groups(); track g.titulo) {
              <z-command-option-group [zLabel]="g.titulo">
                @for (i of g.itens; track i.id) {
                  <z-command-option [zValue]="i.id" [zLabel]="i.label" [zShortcut]="i.atalho ?? ''">
                    <!-- O ícone entra pelo SLOT da base, com o sprite do DS.
                         O zIcon dela espera nome do ng-icons, e usá-lo poria
                         dois sistemas de ícone na mesma lista. -->
                    @if (i.icone) {
                      <ucam-icon data-slot="command-option-leading" [name]="i.icone" size="sm" />
                    }
                  </z-command-option>
                }
              </z-command-option-group>
            }
          </z-command-list>

          <!-- O termo procurado ENTRA no texto: sem ele não dá para saber se
               foi erro de digitação ou destino inexistente. -->
          <!-- Buscando antes de vazio: sem isso a paleta afirma que não existe o
               que só ainda não chegou da busca remota. -->
          @if (loading()) {
            <p class="ucam-command__buscando m-0 px-4 py-6 text-sm text-[var(--ucam-color-text-secondary)]" role="status">Buscando…</p>
          } @else if (vazio()) {
            <p class="ucam-command__vazio m-0 px-4 py-6 text-sm text-[var(--ucam-color-text-secondary)]">
              {{ emptyText() }} para “{{ termo() }}”.
            </p>
          }
        </z-command>
      </div>
    }
  `,
})
export class UcamCommand {
  readonly open = model(false);
  readonly groups = input.required<readonly UcamCommandGroup[]>();
  /** Passar null quando a aplicação já tiver gerenciador de atalhos próprio. */
  readonly shortcut = input<string | null>('Control+K');
  readonly placeholder = input('Ir para uma tela ou executar uma ação');
  readonly emptyText = input('Nada encontrado');
  /** Itens de busca remota em curso: "Buscando…" no lugar do vazio. Ver command.json. */
  readonly loading = input(false);
  readonly label = input('Paleta de comando');

  /*
   * `selecao`, e não `select`: `select` é evento do DOM (o navegador o dispara
   * quando se seleciona texto num campo), e a paleta TEM um campo de busca
   * dentro. Arrastar o cursor sobre o termo digitado faria o (select) do
   * consumidor disparar com um Event nativo no lugar do item escolhido.
   * O portão de tools/sync-ui.mjs recusa output com nome de evento nativo.
   */
  readonly escolher = output<UcamCommandItem>();

  private readonly document = inject(DOCUMENT);
  private readonly ehNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Quem tinha o foco quando a paleta abriu. Para onde ele volta ao fechar. */
  private gatilho: HTMLElement | null = null;

  private readonly porId = computed(() => {
    const m = new Map<string, UcamCommandItem>();
    for (const g of this.groups()) for (const i of g.itens) m.set(i.id, i);
    return m;
  });

  constructor() {
    effect(() => {
      const aberta = this.open();
      if (!this.ehNavegador) return;
      if (aberta) {
        this.gatilho = this.document.activeElement as HTMLElement | null;
      } else if (this.gatilho) {
        // Devolver o foco é o que impede a pessoa de ser cuspida no começo da
        // página toda vez que fecha — inclusive quando fecha por Esc.
        this.gatilho.focus?.();
        this.gatilho = null;
      }
    });
  }

  /**
   * O atalho NÃO sequestra a tecla de dentro de um campo de texto de terceiro:
   * se o foco está num editor, Ctrl+K pode ser dele. A exceção é a própria
   * busca do shell, que é justamente quem anuncia este atalho — mas essa
   * decisão é da aplicação, que pode chamar `abrir()` de onde quiser.
   */
  protected aoTeclar(evento: KeyboardEvent) {
    const combinacao = this.shortcut();
    if (!combinacao || this.open()) return;

    const partes = combinacao.toLowerCase().split('+');
    const tecla = partes[partes.length - 1];
    if (evento.key.toLowerCase() !== tecla) return;
    // Cmd no macOS e Ctrl no resto: a mesma declaração serve aos dois.
    if (partes.includes('control') && !(evento.ctrlKey || evento.metaKey)) return;
    if (partes.includes('shift') && !evento.shiftKey) return;
    if (partes.includes('alt') && !evento.altKey) return;

    const alvo = evento.target as HTMLElement | null;
    if (alvo?.isContentEditable) return;
    const nome = alvo?.tagName;
    if (nome === 'TEXTAREA' || (nome === 'INPUT' && alvo?.getAttribute('type') !== 'search')) return;

    evento.preventDefault();
    this.open.set(true);
  }

  protected fechar() {
    this.open.set(false);
  }

  /* O MÉTODO que trata o evento da base; o output homônimo é a saída pública. */
  protected aoEscolher(opcao: ZardCommandOption) {
    const item = this.porId().get(String(opcao.value));
    this.open.set(false);
    if (item) this.escolher.emit(item);
  }

  /* O estado vazio vem da BASE, não de um filtro recontado aqui: ela já expõe
   * isEmpty() e searchTerm(), e manter uma segunda contagem daria duas
   * verdades sobre a mesma lista — a hora em que elas divergem é a hora em que
   * o painel diz "nada encontrado" com itens na tela. */
  private readonly base = viewChild(ZardCommandComponent);
  protected readonly vazio = computed(() => this.base()?.isEmpty() ?? false);
  protected readonly termo = computed(() => this.base()?.searchTerm().trim() ?? '');
}
