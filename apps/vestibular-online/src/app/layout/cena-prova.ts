import { ChangeDetectionStrategy, Component } from '@angular/core';

/* ------------------------------------------------------------------------
 * A CENA DA ENTRADA: a mesma ilustração isométrica CALCULADA da tela de
 * autenticação do DS (ucamds/site/src/app/pages/index.page.ts), com as peças
 * do vestibular no lugar das do Portal — o e-mail com o código, a prova com a
 * questão marcada e o mapa, o relógio, os cadernos, a redação com o lápis, o
 * selo de salvo e a pessoa que faz a prova.
 *
 * Só a geometria é daqui. Projeção, nomes de classe e pintura são do DS
 * (.ucam-login__cena em @ucam/css): traço e faces saem do texto sobre a
 * superfície de marca, então a cena acompanha a subpaleta e o tema escuro.
 * --------------------------------------------------------------------- */
const COS = 0.8660254;
const SEN = 0.5;
const OX = 452;
const OY = 36;

type Face = { d: string; classe: string };
type P3 = [number, number, number];

function ponto(x: number, y: number, z: number): [number, number] {
  return [(x - y) * COS + OX, (x + y) * SEN - z + OY];
}
function tracado(pontos: P3[]): string {
  return pontos.map(([x, y, z], i) => (i ? 'L' : 'M') + ponto(x, y, z).map((n) => n.toFixed(1)).join(' ')).join(' ');
}
function poligono(pontos: P3[]): string {
  return tracado(pontos) + ' Z';
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
/** Uma esfera assentada em z, com a sombra em crescente. */
function esfera(x: number, y: number, z: number, r: number): Face[] {
  const [cx, cy] = ponto(x, y, z + r);
  const disco = `M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const R = r * 1.7;
  const crescente = `M ${cx.toFixed(1)} ${(cy - r).toFixed(1)} A ${r} ${r} 0 0 1 ${cx.toFixed(1)} ${(cy + r).toFixed(1)} A ${R} ${R} 0 0 0 ${cx.toFixed(1)} ${(cy - r).toFixed(1)} Z`;
  return [{ d: disco, classe: 'esfera' }, { d: crescente, classe: 'crescente' }];
}
/**
 * Um disco em pé sobre o chão: o círculo deitado vira elipse na projeção —
 * (r·cos θ, r·sen θ) cai em ((cos θ − sen θ)·cos30·r, (cos θ + sen θ)·sen30·r),
 * ou seja, semieixos r·√2·cos30 e r·√2·sen30, já alinhados à tela.
 */
function cilindro(x: number, y: number, z: number, r: number, h: number, classe = ''): Face[] {
  const rx = +(r * Math.SQRT2 * COS).toFixed(1);
  const ry = +(r * Math.SQRT2 * SEN).toFixed(1);
  const [bx, by] = ponto(x, y, z);
  const [tx, ty] = ponto(x, y, z + h);
  const f = (n: number) => n.toFixed(1);
  const lado = `M ${f(tx - rx)} ${f(ty)} L ${f(bx - rx)} ${f(by)} A ${rx} ${ry} 0 0 0 ${f(bx + rx)} ${f(by)} L ${f(tx + rx)} ${f(ty)} A ${rx} ${ry} 0 0 1 ${f(tx - rx)} ${f(ty)} Z`;
  const tampa = `M ${f(tx - rx)} ${f(ty)} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
  return [{ d: lado, classe: `face-esq ${classe}` }, { d: tampa, classe: `topo ${classe}` }];
}

function montarCena(): Face[] {
  const cena: Face[] = [];
  const Z = 14; // altura do chão

  // Ordem de pintura do fundo para a frente (x + y crescente), nas mesmas
  // vagas da cena do DS, que já foram conferidas contra sobreposição.

  // O CHÃO.
  cena.push(...caixa(0, 0, 0, 500, 380, Z, 'chao'));

  // O E-MAIL com o código: envelope atrás, à esquerda — é por onde se chega.
  const [ex, ey, ew, ed] = [12, 104, 92, 62];
  cena.push(...caixa(ex, ey, Z, ew, ed, 8, 'bloco'));
  const E = Z + 8.5;
  cena.push({ d: tracado([[ex, ey, E], [ex + ew / 2, ey + ed * 0.56, E], [ex + ew, ey, E]]), classe: 'aba' });
  cena.push(plano(ex + 12, ey + ed - 16, E, 40, 5, 'traco'));

  // A PROVA: a laje central. À esquerda a questão com cinco alternativas, a
  // terceira marcada; à direita o mapa de questões.
  const [tx, ty, tw, td] = [130, 56, 260, 204];
  cena.push(...caixa(tx, ty, Z, tw, td, 10, 'tela'));
  const T = Z + 10.5;
  cena.push(plano(tx, ty, T, tw, 24, 'faixa'));
  cena.push(plano(tx + 10, ty + 9, T, 44, 6, 'traco-forte'));
  cena.push(plano(tx + tw - 58, ty + 6, T, 48, 12, 'selo')); // o relógio na faixa
  cena.push(plano(tx + 14, ty + 38, T, 120, 6, 'traco-forte'));
  cena.push(plano(tx + 14, ty + 50, T, 150, 4, 'traco'));
  cena.push(plano(tx + 14, ty + 59, T, 96, 4, 'traco'));
  [92, 124, 70, 108, 84].forEach((largura, k) => {
    const y = ty + 78 + k * 24;
    const marcada = k === 2;
    if (marcada) cena.push(plano(tx + 8, y - 5, T, 164, 20, 'realce'));
    cena.push(plano(tx + 14, y, T, 10, 10, marcada ? 'acento-plano' : 'campo'));
    cena.push(plano(tx + 32, y + 3, T, largura, 5, marcada ? 'traco-forte' : 'traco'));
  });
  const mx = tx + 180;
  cena.push(plano(mx, ty + 24, T, tw - 180, td - 24, 'coluna'));
  for (let n = 0; n < 15; n++) {
    const x = mx + 8 + (n % 3) * 24;
    const y = ty + 38 + Math.floor(n / 3) * 24;
    // Sete respondidas, a oitava é a atual, o resto ainda em branco.
    cena.push(plano(x, y, T, 16, 16, n < 7 ? 'traco' : n === 7 ? 'traco-forte' : 'ladrilho'));
  }
  cena.push(plano(mx + 8, ty + td - 30, T, 64, 14, 'cabecalho')); // entregar

  // O RELÓGIO: um disco à direita da prova, com os ponteiros em acento.
  const [rx, ry, rr, rh] = [458, 152, 30, 16];
  cena.push(plano(rx - 38, ry - 38, Z + 0.5, 76, 76, 'plinto'));
  cena.push(...cilindro(rx, ry, Z, rr, rh));
  const R = Z + rh + 0.5;
  cena.push(plano(rx - 1.5, ry - 21, R, 3, 21, 'acento-plano'));
  cena.push(plano(rx - 1.5, ry - 1.5, R, 15, 3, 'acento-plano'));

  // OS CADERNOS: três empilhados, o de cima com o título e as linhas.
  const [kx, ky] = [10, 222];
  [0, 1, 2].forEach((i) => cena.push(...caixa(kx, ky, Z + i * 6, 100, 72, 6, 'bloco')));
  const K = Z + 18.5;
  cena.push(plano(kx + 10, ky + 10, K, 46, 6, 'traco-forte'));
  [26, 38, 50].forEach((y, i) => cena.push(plano(kx + 10, ky + y, K, [80, 64, 72][i], 4, 'traco')));

  // O SELO de salvo, deitado no chão: ponto e palavra.
  const [sx, sy] = [176, 330];
  cena.push(...caixa(sx, sy, Z, 88, 22, 5, 'bloco'));
  cena.push(plano(sx + 8, sy + 6, Z + 5.5, 8, 8, 'acento-plano'));
  cena.push(plano(sx + 22, sy + 7, Z + 5.5, 50, 6, 'traco'));

  // A REDAÇÃO: a folha escrita, e o lápis ao lado.
  const [fx, fy] = [292, 296];
  cena.push(...caixa(fx, fy, Z, 104, 64, 6, 'bloco escolhido'));
  const F = Z + 6.5;
  cena.push(plano(fx + 10, fy + 9, F, 40, 5, 'traco-forte'));
  [22, 31, 40, 49].forEach((y, i) => cena.push(plano(fx + 10, fy + y, F, i === 3 ? 48 : 84, 4, 'traco')));
  cena.push(...caixa(fx + 114, fy + 4, Z, 7, 56, 7, 'acento'));

  // A PESSOA: uma só, na frente — a prova é dela.
  cena.push(...esfera(470, 322, Z, 18));

  return cena;
}

/**
 * A ilustração da coluna institucional da entrada. Decorativa: o argumento
 * está na frase e na lista ao lado; o host já é o .ucam-login__cena do DS.
 */
@Component({
  selector: 'app-cena-prova',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ucam-login__cena', 'aria-hidden': 'true' },
  template: `
    <svg class="ucam-login__cena-svg" viewBox="0 0 900 500" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="cena-malha" patternUnits="userSpaceOnUse" width="41.57" height="24">
          <path d="M 0 12 L 20.78 0 L 41.57 12 L 20.78 24 Z" class="malha" />
        </pattern>
        <radialGradient id="cena-fade" cx="50%" cy="52%" r="58%">
          <stop offset="0" stop-color="white" stop-opacity="1" />
          <stop offset="0.7" stop-color="white" stop-opacity="0.5" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </radialGradient>
        <mask id="cena-mascara">
          <rect x="0" y="0" width="900" height="500" fill="url(#cena-fade)" />
        </mask>
      </defs>
      <rect x="0" y="0" width="900" height="500" fill="url(#cena-malha)" mask="url(#cena-mascara)" class="malha-fundo" />
      @for (f of cena; track $index) {
        <path [attr.d]="f.d" [attr.class]="f.classe" />
      }
    </svg>
  `,
})
export class CenaProva {
  protected readonly cena = montarCena();
}
