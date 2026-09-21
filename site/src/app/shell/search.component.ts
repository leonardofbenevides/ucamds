import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  viewChild,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { busca } from '../spec/spec';
import type { ItemBusca } from '../spec/spec.types';

/**
 * Paleta de busca (⌘K / Ctrl+K).
 *
 * O índice vem de tools/build-index.mjs e tem poucas dezenas de itens — não
 * justifica serviço externo nem biblioteca. A busca é por substring sem
 * acento, que é o que resolve "botao" achar "Botão".
 */
const semAcento = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const INDICE = busca.map((i) => ({ item: i, chave: semAcento(`${i.titulo} ${i.subtitulo} ${i.texto}`) }));

@Component({
  selector: 'ucam-search',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A lupa é o que sobra em tela estreita, e por isso ela existe: sem
         ícone, o gatilho encolhido viraria um retângulo vazio. O nome
         acessível vive no aria-label e não depende do rótulo visível. -->
    <button type="button" class="trigger" (click)="abrir()" aria-label="Buscar na documentação">
      <svg class="lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <span class="rotulo">Buscar</span>
      <kbd>⌘K</kbd>
    </button>

    @if (aberto()) {
      <div class="backdrop" (click)="fechar()"></div>
      <div class="palette" role="dialog" aria-modal="true" aria-label="Buscar na documentação">
        <input
          #campo
          type="search"
          class="campo"
          placeholder="Componente, token, decisão…"
          autocomplete="off"
          [value]="termo()"
          (input)="aoDigitar($event)"
          (keydown)="aoTeclar($event)"
          aria-controls="resultados-busca"
          role="combobox"
          aria-expanded="true"
        />

        <ul id="resultados-busca" class="resultados" role="listbox">
          @for (r of resultados(); track r.url + r.titulo; let i = $index) {
            <li role="option" [attr.aria-selected]="i === indice()">
              <a
                [routerLink]="r.url"
                (click)="fechar()"
                [class.ativo]="i === indice()"
                (mouseenter)="indice.set(i)"
              >
                <span class="tipo">{{ r.tipo }}</span>
                <span class="titulo">{{ r.titulo }}</span>
                <span class="sub">{{ r.subtitulo }}</span>
              </a>
            </li>
          } @empty {
            <li class="vazio">
              @if (termo()) {
                Nada encontrado para <strong>{{ termo() }}</strong>.
              } @else {
                {{ total }} itens indexados. Comece a digitar.
              }
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.35rem 0.45rem 0.35rem 0.7rem;
      border-radius: var(--r-controle);
      border: 1px solid var(--ucam-color-border-subtle);
      background: var(--ucam-color-surface-subtle);
      color: var(--ucam-color-text-placeholder);
      font: inherit;
      font-size: 0.8125rem;
      cursor: pointer;
      min-inline-size: 11rem;
      justify-content: space-between;
      transition:
        border-color var(--transicao),
        color var(--transicao),
        background var(--transicao);
    }
    .lupa {
      inline-size: 0.875rem;
      block-size: 0.875rem;
      flex: none;
      display: none;
    }
    .rotulo {
      margin-inline-end: auto;
    }

    /* Abaixo de 48rem o gatilho vira só a lupa.
       O header tem largura fixa e cinco papéis: menu, marca, abas, busca e
       tema. A 390px o gatilho de 11rem não cabia e o resultado não era
       quebra de linha — era SOBREPOSIÇÃO: a logo da universidade passava por
       baixo da palavra "Buscar". Aqui o rótulo e a tecla saem, a lupa entra,
       e o mínimo cai para a caixa de um botão de ícone. */
    @media (max-width: 47.999rem) {
      .trigger {
        min-inline-size: 0;
        inline-size: 2rem;
        block-size: 2rem;
        padding: 0;
        justify-content: center;
      }
      .lupa {
        display: block;
      }
      .rotulo,
      .trigger kbd {
        display: none;
      }
    }
    .trigger:hover {
      border-color: var(--ucam-color-border-default);
      color: var(--ucam-color-text-secondary);
      background: var(--ucam-color-surface-default);
    }
    kbd {
      font-size: 0.65rem;
      padding: 0.1rem 0.3rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-subtle);
    }
    /* O véu escurece E desfoca o que está atrás. Sem o desfoque, uma página
       cheia de tabelas continua legível por baixo da paleta e o olho não sabe
       onde pousar. */
    .backdrop {
      position: fixed;
      inset: 0;
      background: color-mix(in oklab, var(--ucam-color-surface-inverse) 45%, transparent);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      z-index: 90;
    }
    .palette {
      position: fixed;
      z-index: 91;
      inset-block-start: 12vh;
      inset-inline: 50%;
      translate: -50% 0;
      inline-size: min(38rem, calc(100vw - 2rem));
      background: var(--ucam-color-surface-raised);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--r-moldura);
      box-shadow: var(--ucam-elevation-overlay);
      overflow: hidden;
    }
    .campo {
      inline-size: 100%;
      padding: 0.9rem 1rem;
      border: 0;
      border-bottom: 1px solid var(--ucam-color-border-subtle);
      background: transparent;
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-size: 0.95rem;
    }
    .campo::placeholder {
      color: var(--ucam-color-text-placeholder);
    }
    .campo:focus {
      outline: none;
    }
    .resultados {
      list-style: none;
      margin: 0;
      padding: 0.35rem;
      max-block-size: 50vh;
      overflow-y: auto;
    }
    .resultados a {
      display: grid;
      grid-template-columns: 5.5rem 1fr;
      gap: 0.15rem 0.75rem;
      padding: 0.45rem 0.6rem;
      border-radius: var(--ucam-radius-md);
      text-decoration: none;
      color: var(--ucam-color-text-primary);
    }
    .resultados a.ativo {
      background: var(--realce-marca);
    }
    .tipo {
      grid-row: span 2;
      font-family: var(--f-mono);
      font-size: 0.65rem;
      color: var(--ucam-color-text-secondary);
      padding-top: 0.15rem;
    }
    .titulo {
      font-weight: 600;
      font-size: 0.875rem;
    }
    .sub {
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vazio {
      padding: 1.25rem 0.85rem;
      color: var(--ucam-color-text-secondary);
      font-size: 0.8125rem;
    }
  `,
})
export class SearchComponent {
  protected readonly aberto = signal(false);
  protected readonly termo = signal('');
  protected readonly indice = signal(0);
  protected readonly total = INDICE.length;

  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');
  private readonly router = inject(Router);

  protected readonly resultados = computed<ItemBusca[]>(() => {
    const t = semAcento(this.termo().trim());
    if (!t) return [];
    const termos = t.split(/\s+/);
    return INDICE.filter((e) => termos.every((p) => e.chave.includes(p)))
      .slice(0, 12)
      .map((e) => e.item);
  });

  @HostListener('document:keydown', ['$event'])
  protected atalho(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.aberto() ? this.fechar() : this.abrir();
    } else if (e.key === 'Escape' && this.aberto()) {
      this.fechar();
    }
  }

  protected abrir(): void {
    this.aberto.set(true);
    this.indice.set(0);
    // O foco precisa esperar o @if renderizar o campo. Em modo zoneless a
    // detecção de mudanças roda depois da fila de microtarefas, então
    // queueMicrotask focaria um campo que ainda não existe.
    setTimeout(() => this.campo()?.nativeElement.focus());
  }

  protected fechar(): void {
    this.aberto.set(false);
    this.termo.set('');
  }

  protected aoDigitar(e: Event): void {
    this.termo.set((e.target as HTMLInputElement).value);
    this.indice.set(0);
  }

  protected aoTeclar(e: KeyboardEvent): void {
    const rs = this.resultados();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.indice.set((this.indice() + 1) % Math.max(rs.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.indice.set((this.indice() - 1 + rs.length) % Math.max(rs.length, 1));
    } else if (e.key === 'Enter') {
      const alvo = rs[this.indice()];
      if (alvo) {
        e.preventDefault();
        this.router.navigateByUrl(alvo.url);
        this.fechar();
      }
    }
  }
}
