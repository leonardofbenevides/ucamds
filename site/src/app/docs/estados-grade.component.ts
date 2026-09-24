import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/** Um estado que esta grade sabe desenhar, com o rótulo que a matriz mostra. */
interface Palco {
  chave: string;
  rotulo: string;
  nota: string;
}

/**
 * A matriz de estados: o componente REAL em cada estado, lado a lado.
 *
 * Carbon publica a matriz variante × estado porque é a pergunta que todo
 * implementador faz — "como fica o hover do ghost em tom danger?". Aqui a
 * resposta era uma fileira de chips com os NOMES dos estados, que é a
 * pergunta repetida em vez de respondida.
 *
 * O truque está em tools/build-estados.mjs: o CSS dos componentes expressa
 * estado por pseudo-classe (`:hover`), e pseudo-classe só existe onde o
 * ponteiro está. O gerador espelha aquelas regras em seletores por atributo,
 * numa folha à parte, e o palco liga o estado pelo atributo. Nada do CSS dos
 * componentes muda, e o espelho é refeito a cada build — componente que mude
 * de hover muda aqui junto.
 *
 * DEGRADA: só entram os estados que o contrato declara E que o espelho cobre.
 * `loading` fica de fora porque não é aparência: é `aria-busy` mais troca de
 * ícone no markup, e um palco que só pintasse CSS mentiria sobre ele. Sem
 * preview do Trilho A, a grade inteira não aparece.
 */
@Component({
  selector: 'ucam-estados-grade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (palcos().length) {
      <ul class="estados-grade">
        @for (p of palcos(); track p.chave) {
          <li>
            <div class="estados-palco ucam-estado" [attr.data-ucam-estado]="p.chave" #palco>
              <div class="ucam" [innerHTML]="html()" inert></div>
            </div>
            <p class="estados-rotulo">
              <code>{{ p.rotulo }}</code>
              <span class="small muted">{{ p.nota }}</span>
            </p>
          </li>
        }
      </ul>
    }

    @if (foraDaGrade().length) {
      <p class="small muted estados-fora">
        Declarados no contrato e fora da grade:
        @for (e of foraDaGrade(); track e) {
          <code>{{ e }}</code>
        }
        — não são aparência que CSS sozinho produza.
      </p>
    }
  `,
  styles: `
    .estados-grade {
      display: grid;
      /* 8,5rem para os CINCO palcos caberem numa linha só na coluna de 752px:
         em 11rem cabiam quatro e o disabled descia sozinho, e uma matriz que
         quebra deixa de ser matriz — o que se compara aqui é a fileira. */
      grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
      gap: 0.75rem;
      margin: 0 0 1rem;
      padding: 0;
      list-style: none;
    }
    .estados-grade li {
      display: grid;
      gap: 0.4rem;
    }
    /* Mesmo chão dos outros palcos da página. A altura é igual entre células
       porque o que muda de um estado para o outro é cor e filete, nunca
       tamanho — se um dia mudar, a grade denuncia. */
    .estados-palco {
      display: grid;
      place-items: center;
      min-block-size: 4.5rem;
      padding: 1rem 0.75rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
      overflow: hidden;
    }
    .estados-rotulo {
      display: grid;
      gap: 0.1rem;
      margin: 0;
    }
    .estados-rotulo code {
      justify-self: start;
    }
    .estados-fora {
      margin: 0 0 1rem;
    }
  `,
})
export class EstadosGradeComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** Os estados que o contrato declara. */
  readonly estados = input<string[]>([]);
  /** O preview do Trilho A — o mesmo HTML que o catálogo desenha. */
  readonly preview = input<string>('');

  /**
   * Os estados que o espelho cobre.
   *
   * `default` entra sem espelho nenhum: é o componente como ele nasce, e serve
   * de referência para os outros — uma matriz sem o ponto de partida obriga a
   * rolar para cima para comparar.
   */
  private readonly COBERTOS: Palco[] = [
    { chave: 'default', rotulo: 'default', nota: 'Como o componente nasce.' },
    { chave: 'hover', rotulo: 'hover', nota: 'Ponteiro em cima.' },
    { chave: 'active', rotulo: 'active', nota: 'Durante o clique.' },
    { chave: 'focus', rotulo: 'focus-visible', nota: 'Foco por teclado.' },
    { chave: 'disabled', rotulo: 'disabled', nota: 'Indisponível.' },
  ];

  private readonly hospedeiro: ElementRef<HTMLElement> = inject(ElementRef);

  protected readonly html = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.preview()),
  );

  constructor() {
    afterNextRender(() => this.marcaFocavel());
  }

  /**
   * Marca o primeiro focável do palco de FOCO com `.ucam-estado-alvo`.
   *
   * O anel de foco do @ucam/css é escrito como `.ucam :focus-visible` — a
   * pseudo-classe é o seletor inteiro, sem dizer a QUE elemento ela se aplica.
   * Apagá-la no espelho deixaria `.ucam`, e o anel apareceria em volta do
   * palco inteiro em vez do controle. O gerador troca esse caso por
   * `.ucam-estado-alvo`, e quem sabe qual é o alvo é só o DOM: o primeiro
   * elemento que receberia foco de teclado.
   *
   * No cliente e não no prerender porque depende do HTML já montado. Como só
   * acrescenta uma classe a um elemento que já está lá, não há salto de
   * layout — o anel aparece onde o controle já estava.
   */
  private marcaFocavel(): void {
    // forEach e não for-of: NodeList só é iterável com downlevelIteration,
    // que este tsconfig não liga.
    this.hospedeiro.nativeElement
      .querySelectorAll<HTMLElement>('.estados-palco[data-ucam-estado="focus"]')
      .forEach((palco) => {
        const alvo = palco.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        alvo?.classList.add('ucam-estado-alvo');
      });
  }

  protected readonly palcos = computed(() => {
    if (!this.preview()) return [];
    const declarados = new Set(this.estados());
    // O contrato escreve `focus-visible`; o espelho chama a pasta de `focus`.
    // O de-para mora aqui e em lugar nenhum mais.
    const nome = (p: Palco) => (p.chave === 'focus' ? 'focus-visible' : p.chave);
    return this.COBERTOS.filter((p) => declarados.has(nome(p)));
  });

  /** O que o contrato declara e a grade não desenha — dito, não escondido. */
  protected readonly foraDaGrade = computed(() => {
    const cobertos = new Set(
      this.COBERTOS.map((p) => (p.chave === 'focus' ? 'focus-visible' : p.chave)),
    );
    return this.estados().filter((e) => !cobertos.has(e));
  });
}
