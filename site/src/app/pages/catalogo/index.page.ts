import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { componentesPorCategoria, meta } from '../../spec/spec';
import type { Componente } from '../../spec/spec.types';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { noNavegador } from '../../docs/no-navegador';

/**
 * Catálogo em grade visual, agrupado por categoria.
 *
 * O card mostra o COMPONENTE, não metadado sobre ele: o preview é o HTML de
 * spec/demos.json renderizado por @ucam/css — o mesmo arquivo que os apps
 * legados carregam. Não é captura de tela nem maquete; mudou o token na spec,
 * muda o que se vê aqui.
 *
 * O palco é `inert`: o card inteiro é um link, e controle focável dentro de
 * âncora é armadilha de teclado além de HTML inválido.
 */
@Component({
  selector: 'ucam-catalogo',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Catálogo"
      [titulo]="'Componentes'"
      [lede]="
        total +
        ' contratos de componente. Um componente só passa de draft para stable quando tem dois consumidores reais em produção.'
      "
    />

    @for (g of grupos; track g.chave) {
      <section class="grupo">
        <div class="grupo-cabeca">
          <h2>{{ g.rotulo }} <span class="num">{{ g.itens.length }}</span></h2>
          @if (g.nota) {
            <p class="small muted">{{ g.nota }}</p>
          }
        </div>

        <div class="grade">
          @for (c of g.itens; track c.id) {
            <a class="card" [routerLink]="'/catalogo/' + c.id">
              <div class="palco" inert>
                @if (preview(c); as html) {
                  <div class="ucam palco-conteudo" [innerHTML]="html"></div>
                } @else {
                  <p class="sem-preview">
                    <span class="sem-preview__marca">sem desenho</span>
                    <code>&#64;ucam/css</code> não desenha este componente
                  </p>
                }
              </div>

              <div class="corpo">
                <h3>
                  {{ c.name }}
                  @if (c.status !== 'stable') {
                    <span class="pill" [class]="'pill-' + c.status">{{ c.status }}</span>
                  }
                </h3>
                <p class="small muted">{{ c.description }}</p>
              </div>
            </a>
          }
        </div>
      </section>
    }
  `,
  styles: `
    .grupo {
      margin-block-end: 4rem;
    }
    .grupo-cabeca {
      margin-block-end: 1.25rem;
      max-inline-size: var(--measure);
    }
    /* A categoria pesa mais que o nome do componente: quem varre a página
       procura primeiro o grupo, depois a peça dentro dele. */
    .grupo-cabeca h2 {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin: 0 0 0.3rem;
      font-size: 1.375rem;
      font-weight: 560;
      letter-spacing: -0.02em;
    }
    .grupo-cabeca .num {
      font-family: var(--f-mono);
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--ucam-color-text-secondary);
    }
    .grupo-cabeca p {
      margin: 0;
    }

    .grade {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
    }

    /* Sombra dura de 2px, sem desfoque: o cartão assenta sobre a página em vez
       de flutuar. É o que dá peso à grade sem recorrer a borda mais escura. */
    /* Mesma linguagem de card do resto do site: raio de SUPERFÍCIE, sombra
       curta em repouso e a borda na tinta da marca no hover.
       O que havia aqui era "box-shadow: 0 2px 0 0 <borda>" — um filete duplo
       embaixo, não uma sombra: a caixa parecia ter uma segunda borda solta em
       vez de estar acima do papel. E o fundo era surface-subtle enquanto o
       palco por dentro pintava branco, o que dava dois cinzas dentro da mesma
       moldura. */
    .card {
      display: flex;
      flex-direction: column;
      /* O padding de 1,05rem/1,15rem vem do .card GLOBAL de styles.css e aqui
         é herança indesejada: o palco é sangria, e quem o clipa é o
         overflow:hidden com o raio deste card. Com o padding herdado a
         miniatura virava um retângulo cinza flutuando dentro de uma moldura
         branca, o filete do .palco parava a 19px de cada borda e o esmaecido
         do data-encaixe="corta", que é inset-inline: 0, não chegava às
         bordas. A regra global "a.card:has(.palco)::after { display:none }"
         já parte do princípio de que o canto do card É a miniatura. */
      padding: 0;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      overflow: hidden;
      background: var(--ucam-color-surface-default);
      color: inherit;
      text-decoration: none;
    }
    .card:hover {
      border-color: var(--borda-marca);
      box-shadow: var(--sombra-hover);
    }
    .card:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }

    /* Palco sobre cinza. O tom diz "isto é uma amostra, não uma tela" — sem
       ele o preview se confunde com conteúdo da página. É o passo mais fraco
       da escala (surface-subtle), o suficiente para separar do papel sem
       roubar atenção do componente em cima. */
    .palco {
      position: relative;
      /* Altura de TETO, não altura fixa. Quem escolhe a de cada palco é
         encaixar(), a partir do que o preview desenha; --alt só existe depois
         da medida. O teto é o que vale antes dela e para os cards sem
         miniatura. */
      block-size: var(--alt, 10.5rem);
      display: flex;
      align-items: center;
      /* safe é a rede: se um preview ainda assim não couber, o alinhamento
         cede para o início em vez de centrar. Conteúdo cortado à direita lê
         como amostra que continua; cortado à esquerda lê como defeito. */
      justify-content: safe center;
      overflow: hidden;
      padding: 0.5rem;
      /* BRANCO desde 20/09/2026 (ADR-040). O filete de baixo já separava a
         miniatura do texto do card; o cinza era o segundo sinal. */
      background-color: var(--ucam-color-surface-canvas);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    /* ESTADO ANTES DA MEDIDA. O conteúdo é montado na largura de uma tela real
       e reduzido por escala; a margem negativa devolve ao flex a diferença
       entre a caixa de layout (que o transform não muda) e o desenho, para
       centrar o que se VÊ.

       Uma escala fixa para os 46 previews erra nos dois extremos, e isso foi
       medido por CDP em 09/09/2026, não deduzido: Menu passava 59px da
       LARGURA do palco — cortando "Rio de Janeiro" no meio da palavra —,
       Drawer 46px, Dialog 36px, DataTable 30px, ListItem 21px e Alert 14px da
       ALTURA; e 25 previews desenhavam menos de 45% do palco, com Icon em 7%,
       Chip, Link, Prazo e Kbd em 9%. Nesses o texto saía com ~7px efetivos.

       Não há folha que resolva isso: a escala que serve depende de quanto o
       preview desenha, e só o layout sabe. Quem decide é encaixar(), que mede
       a caixa da TINTA e escreve --escala/--x/--y. O que está aqui é o que
       vale antes da hidratação e sem JavaScript — imperfeito, mas nunca
       ausente. */
    .palco-conteudo {
      --largura: 30rem;
      --escala: 0.62;
      inline-size: var(--largura);
      max-inline-size: none;
      flex: none;
      transform: scale(var(--escala));
      margin-inline: calc((var(--largura) * var(--escala) - var(--largura)) / 2);
    }

    /* Depois da medida o palco deixa de ser flex. Centrar vira conta, não
       alinhamento: o flex alinha a CAIXA de 30rem, e o que precisa ficar no
       meio é a tinta dentro dela. */
    .palco[data-encaixe] {
      display: block;
    }
    .palco[data-encaixe] .palco-conteudo {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      margin: 0;
      transform-origin: 0 0;
      transform: translate(var(--x), var(--y)) scale(var(--escala));
    }
    /* Preview que nem no piso de escala cabe na altura fica ANCORADO NO TOPO e
       esmaece no pé. Cortar seco lê como defeito; esmaecido lê como amostra
       que continua — a mesma regra que já valia para o corte à direita. */
    .palco[data-encaixe='corta']::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      block-size: 2.75rem;
      background: linear-gradient(to top, var(--ucam-color-surface-canvas), transparent);
      pointer-events: none;
    }
    /* Card sem miniatura é buraco na grade, e o que estava aqui piorava: uma
       frase de prosa técnica ocupando o lugar do desenho, em cinco cards
       espalhados pelo catálogo, cada um parecendo defeito de renderização.

       Vira MOLDURA VAZIA declarada — a mesma linguagem de um espaço reservado
       de imagem. O tracejado diz "não há desenho", a etiqueta diz por quê, e a
       moldura ocupa a mesma área do palco dos outros, então a grade continua
       tendo um ritmo só.

       O texto encolheu para o que é verificável em qualquer um dos cinco
       casos. "Precisa de JavaScript" valia para chart, command e combobox e
       era falso para file-field e input-group, que não desenham por outro
       motivo: o contrato declara a raiz do Trilho A e o gerador nunca a
       emitiu. O porquê de cada um está no contrato, que é o destino do card. */
    .sem-preview {
      position: absolute;
      inset: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0;
      padding: 0.75rem;
      border: 1px dashed var(--ucam-color-border-default);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
      text-align: center;
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
    }
    /* 11px e SEM opacidade. Estava em 10px com opacity 0,75 — duas formas de
       enfraquecer o mesmo texto ao mesmo tempo, e a segunda é a que o contrato
       do Kbd já proíbe: "a opacidade apaga texto e borda na mesma medida, e
       derruba o contraste do texto abaixo do piso". Quem diz que este rótulo é
       secundário é a cor; o tamanho e a opacidade não precisam repetir. */
    .sem-preview__marca {
      font-family: var(--f-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }

    /* Sem fundo próprio. O surface-subtle que estava aqui existia quando o
       CARD inteiro era subtle — as duas superfícies eram a mesma, e o que
       destacava era o palco branco por cima. Com o card em surface-default a
       relação inverteu: o corpo virou uma faixa cinza no pé de um card branco,
       lendo como rodapé de tabela. Quem separa palco de descrição continua
       sendo o filete do .palco mais a trama de pontos — que é o mesmo par que
       separa os dois na página de telas. */
    .corpo {
      padding: 0.9rem 1.1rem 1.1rem;
      flex: 1;
    }
    /* Monoespaçada no nome: é o identificador do componente, a mesma coisa que
       aparece como <ucam-button> no código. Tipografia diferente da prosa
       porque a natureza do texto é diferente. */
    .corpo h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.35rem;
      font-family: var(--f-mono);
      font-size: 0.9375rem;
      font-weight: 650;
      letter-spacing: -0.01em;
    }
    .corpo p {
      margin: 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      overflow: hidden;
    }

    @media (prefers-reduced-motion: no-preference) {
      .card {
        transition:
          border-color var(--transicao),
          box-shadow var(--transicao),
          transform var(--transicao);
      }
      .card:hover {
        transform: translateY(-2px);
      }
      .card:active {
        transform: translateY(0);
        box-shadow: none;
      }
    }
  `,
})
export default class CatalogoPage {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly total = meta.componentes;
  protected readonly grupos = componentesPorCategoria();

  constructor() {
    // O encaixe roda depois da primeira renderização e de novo a cada mudança
    // de LARGURA do palco — a grade é auto-fill, então o card muda de tamanho
    // com a janela e a escala que cabia deixa de caber. O observador é de
    // TAMANHO e não de janela porque o zoom do navegador e a coluna lateral
    // mexem no card sem mexer no window.
    //
    // Observar o palco não realimenta: encaixar() só escreve transform, e
    // transform não muda caixa de layout.
    noNavegador(() => {
      this.encaixar();

      const primeiro = document.querySelector('.palco');
      if (!primeiro) return;
      /* Só a LARGURA reencaixa. A altura do palco passou a ser escrita por
         encaixar(), então observar a caixa inteira é realimentação: escrever
         --alt dispararia o observador, que reencaixaria, que escreveria
         --alt… O comentário acima dizia "encaixar() só escreve transform, e
         transform não muda caixa de layout" — deixou de ser verdade no
         momento em que o palco passou a caber no desenho. */
      let largura = primeiro.getBoundingClientRect().width;
      new ResizeObserver(() => {
        const agora = primeiro.getBoundingClientRect().width;
        if (Math.abs(agora - largura) < 0.5) return;
        largura = agora;
        this.encaixar();
      }).observe(primeiro);
    });
  }

  /**
   * `bypassSecurityTrustHtml` é deliberado e seguro, pelo mesmo motivo do
   * DemoPainel: a origem é a spec deste repositório, resolvida em build.
   * Sanitizar apagaria os atributos `style` dos previews e todo layout de
   * demo cairia em coluna.
   */
  private readonly cache = new Map<string, SafeHtml | null>();

  protected preview(c: Componente): SafeHtml | null {
    if (!this.cache.has(c.id)) {
      // O preview é o componente de verdade. A miniatura é o retrato de quem
      // não tem preview — chart, combobox, command —, e o validador garante
      // que nenhum contrato tem os dois.
      const html = (c.demo?.principal?.preview ?? c.demo?.miniatura)?.trim();
      this.cache.set(c.id, html ? this.sanitizer.bypassSecurityTrustHtml(html) : null);
    }
    return this.cache.get(c.id)!;
  }

  /**
   * Ajusta cada preview ao seu palco, a partir da MEDIDA do que ele desenha.
   *
   * A conta é uma só: escala = min(1, cabe na largura, cabe na altura), com
   * piso. O teto de 1 é decisão de contrato — ampliar um Button para encher o
   * palco mostraria um botão que não existe em tamanho nenhum do sistema; um
   * componente atômico aparece em tamanho real, com ar em volta, e isso é o
   * retrato honesto dele. O piso existe porque abaixo de ~0,5 a legenda vira
   * borrão, e amostra ilegível não é amostra: quem não couber nem no piso é
   * ancorado no topo e esmaece no pé.
   *
   * A largura NUNCA é sacrificada. Corte lateral parte palavra ao meio e lê
   * como bug; corte no pé lê como continuação.
   *
   * Lê e escreve em blocos separados de propósito. Intercalado, cada card
   * forçaria um refluxo — 46 deles numa página só.
   */
  private encaixar(): void {
    /* 8px era a folga de quando o .card ainda tinha o padding do styles.css em
       volta do palco: o olho lia 8 + 18 = 26. Com o padding removido — ele
       cortava a sangria da miniatura — sobravam 8px, e 10 dos 43 previews
       (PageHeader, SectionBar, InputGroup, Textarea, DescriptionList, Tab,
       Badge, Menu…) passaram a encostar na borda do palco. A folga agora está
       aqui, que é o único lugar onde ela é medida junto com o desenho. */
    const MARGEM = 20;
    /* 0,8, e não mais 0,5. O piso é o menor tamanho em que a amostra ainda se
       lê: a 0,5 o texto de 13px vira 6,5px, e as CENAS — AppShell, DataTable,
       Dialog, Drawer, Menu — saíam todas assim, um retângulo ilegível no meio
       do palco (a queixa de 23/09/2026: "a thumbnail do AppShell tá ruim").
       Abaixo de 0,8 a amostra não encolhe mais: fica ancorada no topo e
       esmaece no pé, que é o que uma miniatura de tela faz. A largura
       continua nunca sendo sacrificada — a cena que precisa caber é
       desenhada mais larga e mais baixa na própria demo. */
    const PISO = 0.8;
    /* O palco era 10,5rem para tudo, de um Chip de 22px a uma DataTable de
       306px. Medido em 10/09/2026: 19 dos 43 previews ocupavam menos de 40%
       da ALTURA, e nove menos de 20% — Stepper 12%, Chip, Prazo e Kbd 13%,
       Link 15%, Pagination 17%, Button, IconButton e Segmented 19%. Não é ar
       em volta do componente, é um vazio cinza com o componente no meio.

       A saída não é ampliar: o teto de escala 1 continua de pé, pelo motivo
       escrito abaixo. É o PALCO que passa a caber no desenho, entre um piso e
       o teto de antes. Átomo ganha uma faixa curta, molécula continua com a
       faixa inteira, e em nenhum dos dois o componente aparece num tamanho
       que o sistema não tem. */
    /* O teto subiu de 168 para 200 em 11/09/2026. A 168 as moléculas que são
       CENA — AppShell, DataTable, Dialog, Drawer — não cabiam nem no piso de
       escala e saíam cortadas e esmaecidas no pé: a moldura da aplicação,
       justo o componente que mais precisa ser reconhecido de relance, virava
       uma faixa de 128px de conteúdo útil a meia escala. Com 200 ela cabe
       inteira perto de 0,6. Átomo não muda: a altura é da LINHA, e linha só
       de átomos continua pedindo o piso. */
    const ALT_MIN = 72;
    /* 224 desde 23/09/2026 (era 200). Com o piso de escala em 0,8 o palco
       precisa de mais 24px para as cenas caberem inteiras sem corte — Alert
       com dois avisos, Stat com dois ladrilhos, ChoiceCard com quatro
       cartões. Linha só de átomos continua no piso de 72. */
    const ALT_MAX = 224;

    // Array.from e não spread: a lib do site é ['ES2022','dom'], sem
    // dom.iterable — NodeList não tem Symbol.iterator aqui.
    const alvos = Array.from(document.querySelectorAll<HTMLElement>('.palco')).map((palco) => ({
      palco,
      conteudo: palco.querySelector<HTMLElement>('.palco-conteudo'),
    }));

    // 1. escreve — mede em tamanho real, com a escala anterior fora do caminho
    for (const { conteudo } of alvos) conteudo?.style.setProperty('--escala', '1');

    // 2. lê
    const medidas = alvos.map(({ palco, conteudo }) => {
      const caixa = palco.getBoundingClientRect();
      const tinta = conteudo ? caixaDaTinta(conteudo) : null;
      return {
        palco,
        conteudo,
        caixa,
        tinta,
        // A altura que ESTE palco pediria sozinho. Card sem miniatura pede o
        // teto: o que ocupa o lugar do desenho ali é uma moldura vazia
        // declarada, e moldura encolhida lê como componente encolhido.
        pedida: tinta ? Math.min(ALT_MAX, Math.max(ALT_MIN, tinta.altura + 2 * MARGEM)) : ALT_MAX,
        // A LINHA da grade a que o card pertence. O topo do palco é o topo do
        // card, e não muda quando a altura do palco muda — dá para agrupar
        // antes de aplicar qualquer altura.
        linha: Math.round(caixa.top + window.scrollY),
      };
    });

    /* A altura é da LINHA, não do card. Por card ela resolvia o vazio cinza e
       criava outro: a grade iguala a altura dos cards de uma linha, então um
       palco curto ao lado de um alto não encurta o card — empurra a sobra para
       DEBAIXO do texto, e o vazio cinza vira vazio branco, que é pior porque
       não se lê como palco. Medido na linha Command+Link, Alert+Badge e
       EmptyState+Prazo, todas em 10/09/2026.

       Igualando por linha, linha só de átomos encolhe inteira (Button e
       IconButton passam de 168 para 72) e linha mista mantém o teto. É o
       máximo de ar que dá para tirar sem desalinhar a grade. */
    const alturaDaLinha = new Map<number, number>();
    for (const m of medidas) {
      alturaDaLinha.set(m.linha, Math.max(alturaDaLinha.get(m.linha) ?? 0, m.pedida));
    }

    // 3. escreve
    for (const { palco, conteudo, caixa, tinta, linha } of medidas) {
      const alt = alturaDaLinha.get(linha) ?? ALT_MAX;
      palco.style.setProperty('--alt', `${Math.round(alt)}px`);
      if (!conteudo || !tinta) continue;

      const dispL = caixa.width - 2 * MARGEM;
      const dispA = alt - 2 * MARGEM;
      if (dispL <= 0 || dispA <= 0 || tinta.largura <= 0 || tinta.altura <= 0) continue;

      const escala = Math.min(1, dispL / tinta.largura, Math.max(PISO, dispA / tinta.altura));
      const pintadaA = tinta.altura * escala;
      const sobra = pintadaA > dispA + 0.5;

      const x = MARGEM + (dispL - tinta.largura * escala) / 2 - tinta.x * escala;
      const y = sobra ? MARGEM - tinta.y * escala : MARGEM + (dispA - pintadaA) / 2 - tinta.y * escala;

      conteudo.style.setProperty('--escala', String(Math.round(escala * 1000) / 1000));
      conteudo.style.setProperty('--x', `${Math.round(x)}px`);
      conteudo.style.setProperty('--y', `${Math.round(y)}px`);
      palco.dataset['encaixe'] = sobra ? 'corta' : 'cabe';
    }
  }
}

/**
 * A caixa da TINTA de um preview — onde o desenho começa e termina —, em
 * coordenadas relativas à própria raiz e sem escala aplicada.
 *
 * Não é o mesmo que a caixa da raiz. O preview é montado em 30rem para que o
 * layout interno seja o de uma tela real, mas o que ele PINTA pode ocupar bem
 * menos (a fila de ícones desenha ~110px dentro de 480) ou bem mais (a tabela
 * estica além da largura de montagem). Medir a raiz é medir o papel, não o
 * desenho — foi o que fez a fila de ícones aparecer minúscula e encostada no
 * meio de um palco vazio.
 *
 * Recipiente que só empilha filhos fica de fora: quem pinta são eles. Mas
 * recipiente que TEM borda, fundo ou sombra entra — a moldura de um Card é
 * tinta, e sem ela o encaixe apertaria a borda para fora do palco.
 */
/**
 * Se a tinta de fundo é NENHUMA.
 *
 * Era uma expressão regular e estava errada em silêncio: dava "tem fundo" para
 * `rgba(0, 0, 0, 0)`, e com isso todo recipiente de arranjo passava a contar
 * como desenho. O efeito foi medido — a fila de seis ícones do card de Icon
 * media 480px de tinta em vez de 110, e o encaixe reduzia a 0,898 uma amostra
 * que cabia inteira em tamanho real.
 *
 * Comparar texto resolve e não tem como sair errado: o navegador devolve a cor
 * já normalizada, e alfa zero termina sempre em ", 0)".
 */
function semFundo(cor: string): boolean {
  return cor === 'transparent' || cor === 'rgba(0, 0, 0, 0)' || cor.endsWith(', 0)');
}

function caixaDaTinta(raiz: HTMLElement): { x: number; y: number; largura: number; altura: number } {
  const base = raiz.getBoundingClientRect();
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  const soma = (r: DOMRect): void => {
    if (r.width === 0 && r.height === 0) return;
    x0 = Math.min(x0, r.left);
    y0 = Math.min(y0, r.top);
    x1 = Math.max(x1, r.right);
    y1 = Math.max(y1, r.bottom);
  };

  const anda = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let no = anda.nextNode(); no; no = anda.nextNode()) {
    if (no.nodeType === Node.TEXT_NODE) {
      if (!no.nodeValue?.trim()) continue;
      const faixa = document.createRange();
      faixa.selectNodeContents(no);
      const rects = faixa.getClientRects();
      for (let i = 0; i < rects.length; i++) soma(rects[i] as DOMRect);
      continue;
    }

    const el = no as HTMLElement;
    // Texto só para leitor de tela é posicionado fora da vista: entra na conta
    // e o desenho encolhe para caber num retângulo que ninguém vê.
    if (el.classList.contains('ucam-sr-only')) continue;

    const estilo = getComputedStyle(el);
    if (estilo.visibility === 'hidden' || estilo.display === 'none') continue;

    const pinta =
      estilo.borderTopWidth !== '0px' ||
      estilo.borderRightWidth !== '0px' ||
      estilo.borderBottomWidth !== '0px' ||
      estilo.borderLeftWidth !== '0px' ||
      estilo.backgroundImage !== 'none' ||
      estilo.boxShadow !== 'none' ||
      !semFundo(estilo.backgroundColor);

    if (el.firstElementChild && !pinta) continue;
    soma(el.getBoundingClientRect());
  }

  if (x0 === Infinity) return { x: 0, y: 0, largura: base.width, altura: base.height };
  return { x: x0 - base.left, y: y0 - base.top, largura: x1 - x0, altura: y1 - y0 };
}
