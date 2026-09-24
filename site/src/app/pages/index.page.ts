import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { meta } from '../spec/spec';

/* ------------------------------------------------------------------------
 * A ILUSTRAÇÃO DA HOME é geometria isométrica CALCULADA, não desenhada à mão.
 *
 * Projeção isométrica clássica (30°): um ponto do mundo (x, y, z) vira
 * (sx, sy) = ((x − y)·cos30, (x + y)·sin30 − z). Cada sólido é uma caixa com
 * três faces visíveis — o topo e as duas faces da frente — e as peças
 * assentam num chão que também é uma caixa. Assim todo objeto tem volume de
 * verdade, as arestas batem umas nas outras e nenhum "rx" precisa fingir
 * perspectiva. A ordem de pintura vai do fundo para a frente.
 *
 * Pedido de 23/09/2026, quarta versão: "algo mais isométrico e menos
 * gratuito". As peças são o que o sistema entrega — a tela (laje com coluna
 * de navegação, indicadores e tabela), o gráfico de barras extrudadas, o
 * indicador, o formulário com interruptor, o cartão de escolha, o selo — e as
 * pessoas para quem tudo isso existe, como esferas. Uma tinta de traço, duas
 * tintas de face, bordô só em três acentos.
 * --------------------------------------------------------------------- */
const COS = 0.8660254;
const SEN = 0.5;
const OX = 452;
const OY = 36;

type Face = { d: string; classe: string };

function ponto(x: number, y: number, z: number): [number, number] {
  return [(x - y) * COS + OX, (x + y) * SEN - z + OY];
}
function poligono(pontos: [number, number, number][]): string {
  return pontos.map(([x, y, z], i) => (i ? 'L' : 'M') + ponto(x, y, z).map((n) => n.toFixed(1)).join(' ')).join(' ') + ' Z';
}
/** Uma caixa: face esquerda (frente, y + d), face direita (frente, x + w) e topo. */
function caixa(x: number, y: number, z: number, w: number, d: number, h: number, classe = ''): Face[] {
  const t = z + h;
  return [
    { d: poligono([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]]), classe: `face-esq ${classe}` },
    { d: poligono([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]]), classe: `face-dir ${classe}` },
    { d: poligono([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]]), classe: `topo ${classe}` },
  ];
}
/** Um retângulo deitado no plano do topo, para o conteúdo das lajes. */
function plano(x: number, y: number, z: number, w: number, d: number, classe: string): Face {
  return { d: poligono([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]), classe };
}
/** Uma esfera assentada em z, com a sombra em crescente das referências. */
function esfera(x: number, y: number, z: number, r: number): Face[] {
  const [cx, cy] = ponto(x, y, z + r);
  const disco = `M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  // O crescente: a metade direita do disco menos um arco de raio maior, que
  // bojeia menos — o que sobra entre os dois é a sombra das referências.
  const R = r * 1.7;
  const crescente = `M ${cx.toFixed(1)} ${(cy - r).toFixed(1)} A ${r} ${r} 0 0 1 ${cx.toFixed(1)} ${(cy + r).toFixed(1)} A ${R} ${R} 0 0 0 ${cx.toFixed(1)} ${(cy - r).toFixed(1)} Z`;
  return [{ d: disco, classe: 'esfera' }, { d: crescente, classe: 'crescente' }];
}

function montarCena(): Face[] {
  const cena: Face[] = [];
  const Z = 14; // altura do chão

  // A ordem de pintura é do fundo para a frente: quem tem x + y maior está
  // mais perto de quem olha e entra por último. Em 24/09/2026 o gráfico
  // entrava ANTES da tela e ficava com a base coberta por ela, e as três
  // esferas caíam em cima do cartão e do canto da tela. As posições abaixo
  // foram conferidas por um verificador de silhuetas (casco convexo de cada
  // peça em espaço de tela, separação por eixos): nenhuma peça toca outra.

  // O CHÃO: a placa das fundações, onde tudo assenta.
  cena.push(...caixa(0, 0, 0, 500, 380, Z, 'chao'));

  // O INDICADOR: bloco atrás à esquerda, com a variação em bordô.
  const [ix, iy] = [12, 108];
  cena.push(...caixa(ix, iy, Z, 92, 64, 26, 'bloco'));
  const I = Z + 26.5;
  cena.push(plano(ix + 10, iy + 8, I, 36, 5, 'traco'));
  cena.push(plano(ix + 10, iy + 22, I, 52, 12, 'traco-forte'));
  cena.push(plano(ix + 10, iy + 44, I, 60, 5, 'traco'));
  cena.push(plano(ix + 68, iy + 22, I, 16, 12, 'acento-plano'));

  // A TELA: a laje central com coluna de navegação, indicadores e tabela.
  // O conteúdo é relativo à laje: coluna de 76, margem de 16, três ladrilhos
  // com vão 8 e quantas linhas de tabela couberem.
  const [tx, ty, tw, td] = [130, 56, 260, 204];
  cena.push(...caixa(tx, ty, Z, tw, td, 10, 'tela'));
  const T = Z + 10.5;
  cena.push(plano(tx, ty, T, tw, 24, 'faixa'));
  cena.push(plano(tx + 10, ty + 6, T, 6, 6, 'ponto'), plano(tx + 20, ty + 6, T, 6, 6, 'ponto'), plano(tx + 30, ty + 6, T, 6, 6, 'ponto'));
  cena.push(plano(tx, ty + 24, T, 76, td - 24, 'coluna'));
  cena.push(plano(tx + 10, ty + 36, T, 56, 14, 'realce'));
  cena.push(plano(tx + 14, ty + 40, T, 30, 5, 'traco-forte'));
  [62, 82, 102, 122].forEach((y, i) => cena.push(plano(tx + 14, ty + y, T, [28, 40, 22, 34][i], 5, 'traco')));
  const cx0 = tx + 88;
  const cw = tw - 88 - 16;
  const lad = (cw - 2 * 8) / 3;
  [0, 1, 2].forEach((i) => {
    const x = cx0 + i * (lad + 8);
    cena.push(plano(x, ty + 34, T, lad, 38, 'ladrilho'));
    cena.push(plano(x + 8, ty + 42, T, 24, 4, 'traco'));
    cena.push(plano(x + 8, ty + 54, T, Math.min(36, lad - 16), 8, 'traco-forte'));
  });
  cena.push(plano(cx0, ty + 84, T, cw, 14, 'cabecalho'));
  const linhas = Math.floor((td - 84 - 14 - 8) / 26);
  for (let k = 0; k < linhas; k++) {
    const y = ty + 106 + k * 26;
    cena.push(plano(cx0 + 8, y + 4, T, 10, 10, 'avatar-mini'));
    cena.push(plano(cx0 + 24, y + 3, T, 52, 5, 'traco-forte'));
    cena.push(plano(cx0 + 24, y + 11, T, 78, 4, 'traco'));
    cena.push(plano(cx0 + cw - 52, y + 3, T, 44, 11, 'selo'));
    cena.push(plano(cx0, y + 22, T, cw, 1, 'fio'));
  }

  // O GRÁFICO: cinco barras extrudadas à direita da tela, e à frente dela na
  // projeção — por isso entra depois. A quarta é o acento.
  const [gx, gy] = [452, 90];
  cena.push(plano(gx, gy, Z + 0.5, 38, 156, 'plinto'));
  [26, 46, 34, 62, 50].forEach((h, i) => cena.push(...caixa(gx + 8, gy + 6 + i * 30, Z, 22, 22, h, i === 3 ? 'acento' : '')));

  // O FORMULÁRIO: rótulo, campo e interruptor ligado.
  const [fx, fy] = [10, 220];
  cena.push(...caixa(fx, fy, Z, 100, 74, 8, 'bloco'));
  const F = Z + 8.5;
  cena.push(plano(fx + 10, fy + 8, F, 30, 5, 'traco-forte'));
  cena.push(plano(fx + 10, fy + 20, F, 80, 18, 'campo'));
  cena.push(plano(fx + 16, fy + 26, F, 40, 5, 'traco'));
  cena.push(plano(fx + 10, fy + 50, F, 26, 12, 'acento-plano'));
  cena.push(plano(fx + 26, fy + 52, F, 8, 8, 'knob'));
  cena.push(plano(fx + 44, fy + 54, F, 40, 5, 'traco'));

  // O SELO, deitado no chão: ponto e palavra.
  const [sx, sy] = [176, 330];
  cena.push(...caixa(sx, sy, Z, 88, 22, 5, 'bloco'));
  cena.push(plano(sx + 8, sy + 6, Z + 5.5, 8, 8, 'acento-plano'));
  cena.push(plano(sx + 22, sy + 7, Z + 5.5, 50, 6, 'traco'));

  // O CARTÃO DE ESCOLHA, marcado: figura, título, apoio e o check em bordô.
  const [kx, ky] = [296, 296];
  cena.push(...caixa(kx, ky, Z, 110, 62, 8, 'bloco escolhido'));
  const C = Z + 8.5;
  cena.push(plano(kx + 10, ky + 10, C, 20, 20, 'ladrilho'));
  cena.push(plano(kx + 38, ky + 12, C, 44, 5, 'traco-forte'));
  cena.push(plano(kx + 38, ky + 22, C, 60, 4, 'traco'));
  cena.push(plano(kx + 10, ky + 42, C, 80, 4, 'traco'));
  cena.push(plano(kx + 94, ky + 8, C, 8, 8, 'acento-plano'));

  // AS PESSOAS: três esferas no canto da frente, à direita do cartão e à
  // frente do gráfico, para quem tudo isso existe.
  cena.push(...esfera(474, 290, Z, 17));
  cena.push(...esfera(492, 334, Z, 12));
  cena.push(...esfera(460, 346, Z, 10));

  return cena;
}

@Component({
  selector: 'ucam-inicio',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A CAPA EM DUAS COLUNAS (23/09/2026). Era uma pilha: título, faixa
         de números, callout, ilustração, cartões — e a ilustração, o único
         desenho da página, só aparecia depois de uma rolagem. Agora o texto e
         as duas portas ficam à esquerda e a ilustração à direita, na mesma
         dobra; a faixa de números fecha o bloco por baixo, atravessando as
         duas colunas. Abaixo de 64rem volta a empilhar.

         Duas portas, um primário: "Começar" leva à instalação, que é onde a
         pergunta do trilho é respondida (ADR-045); "Ver o catálogo" é a
         segunda entrada mais pedida e vai contornada. São os botões do
         próprio sistema — a capa do design system usa o botão que documenta. -->
    <header class="masthead">
      <div class="masthead-texto">
        <p class="eyebrow eyebrow-marca">Universidade Candido Mendes</p>
        <h1 class="display">Design System UCAM</h1>
        <p class="lede">
          Fundamentos, componentes e padrões para as interfaces da UCAM. Cada componente traz
          API, comportamento, requisitos de acessibilidade e limites de uso.
        </p>
        <p class="masthead-acoes">
          <a class="ucam-btn ucam-btn--primary ucam-btn--lg" routerLink="/comecar/instalacao">Começar</a>
          <a class="ucam-btn ucam-btn--secondary ucam-btn--lg" routerLink="/catalogo">Ver o catálogo</a>
        </p>
      </div>

      <!-- A geometria da ilustração está no topo deste arquivo; as cores vêm
           dos tokens, então ela vira sozinha no tema escuro. Decorativa por
           papel: role=img com um nome que diz o que há nela. -->
      <figure class="ilustracao">
        <svg
          viewBox="0 0 900 500"
          role="img"
          aria-label="Ilustração isométrica do design system: sobre uma placa, a tela com coluna de navegação, indicadores e tabela; ao lado, um gráfico de barras, um indicador, um formulário com interruptor, um cartão de escolha marcado, um selo e três pessoas."
        >
          <!-- A MALHA isométrica de fundo (pedido de 23/09): losangos na mesma
               projeção da cena, em filete, esmaecendo para as bordas por uma
               máscara radial — o chão continua sendo a placa; a malha é o papel
               quadriculado em que ela foi desenhada. O tile do padrão é UM
               losango de 24 de altura: 2·cos30·24 por 24. -->
          <defs>
            <pattern id="malha-iso" patternUnits="userSpaceOnUse" width="41.57" height="24">
              <path d="M 0 12 L 20.78 0 L 41.57 12 L 20.78 24 Z" class="malha" />
            </pattern>
            <radialGradient id="malha-fade" cx="50%" cy="52%" r="58%">
              <stop offset="0" stop-color="#fff" stop-opacity="1" />
              <stop offset="0.7" stop-color="#fff" stop-opacity="0.55" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
            <mask id="malha-mascara">
              <rect x="0" y="0" width="900" height="500" fill="url(#malha-fade)" />
            </mask>
          </defs>
          <rect x="0" y="0" width="900" height="500" fill="url(#malha-iso)" mask="url(#malha-mascara)" class="malha-fundo" />
          @for (f of cena; track $index) {
            <path [attr.d]="f.d" [attr.class]="f.classe" />
          }
        </svg>
      </figure>

      <!-- Os sete números viraram uma GRADE de células, e não mais uma linha
           corrida de texto. Eram o fato mais forte da home — sete medidas do
           que já existe — e saíam a 13px, em cinza, todos com o mesmo peso do
           que os separava. Em célula, o número lê primeiro e o rótulo depois,
           que é a ordem em que a informação importa. -->
      <ul class="numeros">
        @for (n of numeros; track n.rotulo) {
          <li>
            <strong class="num">{{ n.valor }}</strong>
            <span>{{ n.rotulo }}</span>
          </li>
        }
      </ul>
    </header>

    <!-- A SEÇÃO DOS TRILHOS SAIU DA HOME (23/09/2026, ADR-046). A pergunta que
         decide o trilho e os dois cartões continuam existindo num lugar só —
         migracao.escolhaDoTrilho, impresso na instalação, no guia de migração
         e no kit de agentes (ADR-045). A home deixa de ser a página em que se
         escolhe: é a capa, e a capa mostra o que o sistema É. -->

    <section class="prose">
      <h2>Por onde começar</h2>
    </section>

    <!-- As seis portas levam um LADRILHO DE ÍCONE do próprio sistema, como os
         blocos de pontos das outras páginas: seis caixas de título e texto
         eram indistinguíveis entre si e do resto do site. O ladrilho é a
         .ucam-icon-tile de @ucam/css, não um quadrado desenhado aqui. -->
    <div class="grade-cartoes">
      @for (p of portas; track p.link) {
        <a class="card porta" [routerLink]="p.link">
          <span class="ucam-icon-tile" aria-hidden="true">
            <svg class="ic"><use [attr.href]="'#i-' + p.icone" /></svg>
          </span>
          <h3>{{ p.titulo }}</h3>
          <p class="small muted">{{ p.texto }}</p>
        </a>
      }
    </div>

    <!-- A nota de leitura DESCEU para depois das portas (23/09/2026). Ficava
         entre a faixa de números e a ilustração, e um bloco tingido no meio da
         capa lia como aviso e a partia em duas. Ela explica como ler o que vem
         a seguir, e o lugar disso é depois de a capa ter mostrado o que há. -->
    <div class="callout nota-leitura">
      <p class="eyebrow">Como ler esta documentação</p>
      <p>
        Cada componente tem um contrato: API, estados, tokens, requisitos de acessibilidade e
        limites de uso. O contrato é normativo — o que não está nele não é garantido. O que já é
        instalável está em <a routerLink="/comecar/skills">Skills e pacotes</a>; a versão e o
        estado de cada contrato, em <a routerLink="/releases">Releases</a>.
      </p>
    </div>
  `,
  styles: `
    /* O filete de 2px na tinta do texto SAIU. Um traço preto de ponta a ponta
       abaixo do título é o gesto de capa de relatório: separa por peso bruto,
       e ainda por cima competia com o próprio h1 pela atenção. Quem separa
       agora é o vão — e o degrau de superfície da grade de números, que
       fecha o bloco por baixo sem precisar de régua nenhuma. */
    .masthead {
      display: grid;
      gap: 2rem;
      align-items: center;
      margin-block-end: var(--ritmo-secao);
    }
    /* Duas colunas a partir de 64rem: 6/7, porque a ilustração é mais larga
       do que alta e perde detalhe se ficar com menos da metade. A faixa de
       números atravessa as duas colunas. */
    @media (min-width: 64rem) {
      .masthead {
        grid-template-columns: minmax(0, 6fr) minmax(0, 7fr);
        column-gap: 2.5rem;
      }
      .masthead > .numeros {
        grid-column: 1 / -1;
      }
    }
    .masthead h1 {
      font-size: clamp(2.125rem, 5vw, 3rem);
      margin: 0.6rem 0 1.1rem;
    }
    .masthead-texto .lede {
      margin: 0;
    }
    .masthead-acoes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin: 1.5rem 0 0;
    }
    /* Grade de células com filete de 1px.
       A divisória NÃO é gap sobre fundo tingido: são sete números e o auto-fit
       quase nunca fecha a linha (a 420px dá 2 colunas, então a última linha
       tem uma célula vazia). Com o truque do gap, essa célula vazia mostra o
       fundo do contêiner — e o que aparecia era um bloco cinza-azulado do
       tamanho de uma célula, medido por CDP a 420px.

       Cada célula desenha o próprio filete à direita e embaixo por box-shadow;
       os que sobram na borda externa são comidos pelo overflow:hidden do
       contêiner arredondado. Célula que não existe não desenha nada, que é
       exatamente o comportamento que faltava. */
    .numeros {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
      margin: 0.5rem 0 0;
      padding: 0;
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      overflow: hidden;
    }
    .numeros li {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      padding: 0.8rem 0.95rem;
      box-shadow:
        1px 0 0 0 var(--ucam-color-border-subtle),
        0 1px 0 0 var(--ucam-color-border-subtle);
    }
    .numeros strong {
      font-size: 1.375rem;
      font-weight: 620;
      letter-spacing: -0.02em;
      line-height: 1.2;
      color: var(--ucam-color-text-primary);
    }
    .numeros span {
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--ucam-color-text-secondary);
    }

    /* A ILUSTRAÇÃO ocupa a coluna e mede pela largura; o viewBox fixa a
       proporção e o teto de 32rem segura a 1440px. Sem fundo e sem moldura:
       ela é o desenho (ADR-040: nenhum fundo cinza no claro). */
    .ilustracao {
      margin: 0;
      padding: 0;
      min-inline-size: 0;
    }
    .ilustracao svg {
      display: block;
      inline-size: 100%;
      block-size: auto;
      max-block-size: 32rem;
      margin-inline: auto;
      overflow: visible;
    }
    /* UMA tinta de traço (border.strong), DUAS tintas de face: o topo é
       branco, a face esquerda é o rebaixo, a direita o degrau sutil — é o que
       dá volume sem sombra. Bordô só nos acentos. Tudo por token: vira sozinho
       no tema escuro. */
    .ilustracao path {
      stroke: var(--ucam-color-border-strong);
      stroke-width: 1;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    /* A malha: filete de border.subtle, sem preenchimento; o rect que a
       carrega não tem traço próprio. */
    .ilustracao .malha { fill: none; stroke: var(--ucam-color-border-subtle); stroke-width: 1; }
    .ilustracao .malha-fundo { stroke: none; }
    .ilustracao .topo { fill: var(--ucam-color-surface-default); }
    .ilustracao .face-esq { fill: var(--ucam-color-surface-sunken); }
    .ilustracao .face-dir { fill: var(--ucam-color-surface-subtle); }
    .ilustracao .acento.topo { fill: var(--ucam-color-action-primary-subtle); }
    .ilustracao .acento.face-esq,
    .ilustracao .acento.face-dir { fill: var(--ucam-color-action-primary-default); stroke: var(--ucam-color-action-primary-default); }
    .ilustracao .escolhido { stroke: var(--ucam-color-action-primary-default); }
    /* Conteúdo deitado nas lajes: sem traço, só tinta. */
    .ilustracao .plinto,
    .ilustracao .faixa,
    .ilustracao .coluna,
    .ilustracao .realce,
    .ilustracao .traco,
    .ilustracao .traco-forte,
    .ilustracao .ladrilho,
    .ilustracao .cabecalho,
    .ilustracao .avatar-mini,
    .ilustracao .selo,
    .ilustracao .fio,
    .ilustracao .knob,
    .ilustracao .ponto,
    .ilustracao .acento-plano,
    .ilustracao .crescente { stroke: none; }
    .ilustracao .plinto { fill: var(--ucam-color-surface-sunken); }
    .ilustracao .faixa { fill: var(--ucam-color-surface-subtle); }
    .ilustracao .coluna { fill: var(--ucam-color-surface-subtle); }
    .ilustracao .realce { fill: var(--ucam-color-action-primary-subtle); }
    .ilustracao .traco { fill: var(--ucam-color-border-subtle); }
    .ilustracao .traco-forte { fill: var(--ucam-color-border-default); }
    .ilustracao .ladrilho { fill: var(--ucam-color-surface-sunken); }
    .ilustracao .cabecalho { fill: var(--ucam-color-surface-sunken); }
    .ilustracao .avatar-mini { fill: var(--ucam-color-border-default); }
    .ilustracao .selo { fill: var(--ucam-color-surface-sunken); }
    .ilustracao .fio { fill: var(--ucam-color-border-subtle); }
    .ilustracao .campo { fill: var(--ucam-color-surface-default); stroke: var(--ucam-color-border-default); }
    .ilustracao .knob { fill: var(--ucam-color-surface-default); }
    .ilustracao .ponto { fill: var(--ucam-color-border-default); }
    .ilustracao .acento-plano { fill: var(--ucam-color-action-primary-default); }
    .ilustracao .esfera { fill: var(--ucam-color-surface-default); }
    .ilustracao .crescente { fill: var(--ucam-color-surface-sunken); }

    /* A home lê na mesma coluna das páginas internas. Ela herdava os 80rem
       inteiros do container, então a faixa de números e as grades de cartão
       iam a 1232px enquanto o texto parava em 509 — um salto de 2,4×, e a
       borda direita dos blocos nada tinha a ver com a do texto. */
    /* 64rem. Tentei 50rem para aproximar a coluna da medida do texto, e a
       faixa de números quebrou em duas linhas com três células vazias — pior
       que o vazio que eu queria resolver. A largura dos BLOCOS aqui é ditada
       pela peça mais larga que a home tem, que são os sete indicadores. */
    :host {
      display: block;
      max-inline-size: 64rem;
    }
    .porta > .ucam-icon-tile {
      margin-block-end: 0.85rem;
    }
    .card h3 {
      margin: 0 0 0.4rem;
      font-size: 1rem;
    }
    .nota-leitura {
      margin-block: var(--ritmo-sub) 0;
    }
    .card p {
      margin: 0 0 0.5rem;
    }
    .card > :last-child {
      margin-bottom: 0;
    }
  `,
})
export default class IndexPage {
  protected readonly m = meta;

  /** A cena isométrica, calculada uma vez. Ver o cabeçalho do arquivo. */
  protected readonly cena = montarCena();

  /** As seis portas da capa: destino, ícone do sprite, nome e uma linha. */
  protected readonly portas = [
    { link: '/comecar/instalacao', icone: 'download', titulo: 'Instalação', texto: 'Como consumir o design system hoje, em cada trilho.' },
    { link: '/fundamentos/cor', icone: 'bookOpen', titulo: 'Fundamentos', texto: 'Cor, tipografia e espaçamento, com contraste calculado no build.' },
    { link: '/catalogo', icone: 'layoutGrid', titulo: 'Catálogo', texto: `${meta.componentes} contratos de componente.` },
    { link: '/decisoes', icone: 'scrollText', titulo: 'Decisões', texto: 'O porquê de cada regra, registrado em ADR.' },
    { link: '/comecar/mcp', icone: 'monitor', titulo: 'Servidor MCP', texto: 'Os contratos servidos a agentes de IA, com a API exata.' },
    { link: '/padroes', icone: 'listChecks', titulo: 'Padrões', texto: 'Composições que resolvem uma tarefa inteira.' },
  ];

  /** Os sete números da grade, na ordem em que respondem "o que já existe?". */
  protected readonly numeros = [
    { valor: meta.componentes, rotulo: 'componentes' },
    { valor: meta.padroes, rotulo: 'padrões' },
    { valor: meta.adrs, rotulo: 'decisões' },
    { valor: meta.evidencias, rotulo: 'problemas catalogados' },
    { valor: meta.requisitosA11y, rotulo: 'requisitos de a11y' },
    { valor: meta.criteriosWcag, rotulo: 'critérios WCAG' },
    { valor: meta.conversoesMigracao, rotulo: 'conversões de migração' },
  ];
}
