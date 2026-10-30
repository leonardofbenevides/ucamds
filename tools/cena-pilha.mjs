/* ------------------------------------------------------------------------
 * A PILHA DO LOGIN (29/10/2026): seis cartões de acesso empilhados, em traço.
 *
 * Pedido: "uma ilustração mais nesse sentido dessa skill aqui", com o link da
 * skill hairline-create (github.com/lucasmarkes/hairline), e o conceito
 * escolhido entre três foi a pilha, viva com o ponteiro. A figura foi feita
 * e conferida primeiro no motor da skill (validate.mjs e look.mjs passam: a
 * moldura, a leitura, o console e a resposta a 240px); aqui está o mesmo
 * desenho sem o motor, para o login não carregar setecentas linhas.
 *
 * O que a skill pede e esta figura cumpre:
 *   - UM objeto, uma ideia: a pilha do que o acesso abre. De baixo para
 *     cima: gráfico (barras), aprovado (selo e assinatura), livros, prova
 *     (bolhas, uma marcada por linha), carteirinha (foto e linhas) e
 *     sistemas (a grade 3 × 3). Nenhuma letra no desenho;
 *   - sólidos arredondados: o contorno e UMA dobra por dentro, nunca a
 *     quina vertical;
 *   - placas opacas, pintadas de baixo para cima: a de cima cobre a de baixo;
 *   - o traço é o único realce: em repouso, o ladrilho do meio da grade; com
 *     o ponteiro, o cartão escolhido, e o ladrilho larga o realce;
 *   - o repouso é composto: a pilha um pouco torta, três cartões já meio
 *     para fora;
 *   - o ponteiro escolhe pelo repouso, nunca pelo que está na tela: cada
 *     cartão tem um ponto fixo na beirada da frente e ganha o mais perto. Com
 *     o "meio mais perto" da skill, a carta de baixo ganhava sempre;
 *   - o escolhido desliza 700ms na curva (.32, .72, 0, 1), os de cima sobem
 *     para abrir o vão, com 45ms de atraso por cartão de distância.
 *
 * geometria() é autossuficiente de propósito: o estadoScript
 * (tools/lib/shell.mjs) embute o texto dela, e o build chama a mesma função
 * para gravar o repouso no SVG. Os dois lados desenham com o mesmo código, e
 * os caminhos do SVG estático saem na ordem que o script atualiza.
 * --------------------------------------------------------------------- */

export function geometria() {
  var W = 104, D = 78, T = 4, G = 12, OUT = 46, LIFT = 10, S = 1.72;
  var DX = [2, -3, 4, -1, 3, 0], DY = [-2, 2, -1, 3, 0, -2], REST = [5, 0, 9, 2, 13, 0];
  var NOMES = ['gráfico', 'aprovado', 'livros', 'prova', 'carteirinha', 'sistemas'];
  var U = W - 38;
  /* O rosto de cada cartão, nas coordenadas dele (u, v): caixas [u0, v0, u1,
   * v1, h], linhas [u, v0, v1], selo [u, v, R], bolhas [u, v, marcada]. */
  var bolhas = [];
  [2, 0, 3, 1].forEach(function (m, r) { for (var c = 0; c < 5; c++) bolhas.push([U + 6 + r * 8, 18 + c * 10, c === m]); });
  var grade = [];
  for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) grade.push([U + 2 + k * 11, 22 + j * 11, U + 10 + k * 11, 30 + j * 11, 2]);
  var ROSTOS = [
    { caixa: [[U + 10, 12, U + 18, 20, 3], [U + 10, 26, U + 18, 34, 6], [U + 10, 40, U + 18, 48, 4], [U + 10, 54, U + 18, 62, 7]] },
    { selo: [U + 16, 24, 10], linha: [[U + 8, 44, 70], [U + 16, 44, 64], [U + 24, 50, 70]] },
    { caixa: [[U + 4, 14, U + 32, 24, 4], [U + 8, 27, U + 34, 36, 5.5], [U + 2, 39, U + 28, 49, 3]] },
    { bolha: bolhas },
    { caixa: [[U + 6, 10, U + 24, 26, 2]], linha: [[U + 8, 36, 68], [U + 16, 36, 60], [U + 24, 36, 64]] },
    { caixa: grade },
  ];
  var MARCA = 4; // o ladrilho do meio da grade, o realce do repouso

  /* A câmera da skill: azimute 45°, k = 0,5 (a vista 2:1), centrada em (200, 166). */
  var c = Math.SQRT1_2, zf = Math.sqrt(0.75), ox = 0, oy = 0;
  function P(x, y, z) { var X = (x - y) * c, Y = (x + y) * c; return [ox + S * X, oy + S * (Y * 0.5 - z * zf)]; }
  function unP(sx, sy, z) { var X = (sx - ox) / S, Y = ((sy - oy) / S + z * zf) / 0.5; return [(X + Y) * c, (Y - X) * c]; }
  (function () {
    var pts = [[-6, -6, 0], [W + OUT + 6, -6, 0], [-6, D + 6, 0], [W + OUT + 6, D + 6, 0], [-6, -6, 5 * G + T + LIFT + 8]];
    var a = 1e9, b = -1e9, cc = 1e9, d = -1e9;
    pts.forEach(function (p) { var q = P(p[0], p[1], p[2]); a = Math.min(a, q[0]); b = Math.max(b, q[0]); cc = Math.min(cc, q[1]); d = Math.max(d, q[1]); });
    ox = 200 - (a + b) / 2; oy = 166 - (cc + d) / 2;
  })();

  var r2 = function (v) { return Math.round(v * 100) / 100; };
  var poly = function (pts) { return 'M' + pts.map(function (p) { return r2(p[0]) + ' ' + r2(p[1]); }).join('L') + 'Z'; };
  var open = function (pts) { return pts.length < 2 ? '' : 'M' + pts.map(function (p) { return r2(p[0]) + ' ' + r2(p[1]); }).join('L'); };
  var seg = function (a, b) { return 'M' + r2(a[0]) + ' ' + r2(a[1]) + 'L' + r2(b[0]) + ' ' + r2(b[1]); };
  function rrect(u0, v0, u1, v1, r) {
    r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
    var out = [];
    [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]].forEach(function (q) {
      for (var i = 0; i <= 4; i++) { var a = (q[2] + 22.5 * i) * Math.PI / 180; out.push({ u: q[0] + r * Math.cos(a), v: q[1] + r * Math.sin(a), nu: Math.cos(a), nv: Math.sin(a) }); }
    });
    return out;
  }
  function circ(cu, cv, R) {
    var out = [];
    for (var i = 0; i < 32; i++) { var a = i / 32 * Math.PI * 2; out.push({ u: cu + R * Math.cos(a), v: cv + R * Math.sin(a), nu: Math.cos(a), nv: Math.sin(a) }); }
    return out;
  }
  function hull(input) {
    var pts = input.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var x = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    var lo = [], up = [], i, p;
    for (i = 0; i < pts.length; i++) { p = pts[i]; while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (i = pts.length - 1; i >= 0; i--) { p = pts[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop();
    return lo.concat(up);
  }
  var noAnel = function (ring, z) { return ring.map(function (q) { return P(q.u, q.v, z); }); };
  var frente = function (q) { return q.nu * c + q.nv * c >= -1e-6; };
  /* A única sequência cíclica do anel que encara a câmera: a dobra. */
  function corrida(ring) {
    var n = ring.length, s = -1, i, out = [];
    for (i = 0; i < n; i++) if (frente(ring[i]) && !frente(ring[(i + n - 1) % n])) { s = i; break; }
    if (s < 0) return ring.slice();
    for (i = 0; i < n && frente(ring[(s + i) % n]); i++) out.push(ring[(s + i) % n]);
    return out;
  }
  /* Um sólido: contorno (casco do anel em cima e embaixo) e a dobra de cima. */
  function prisma(ring, inner, z0, z1) {
    return [poly(hull(noAnel(ring, z1).concat(noAnel(ring, z0)))), inner ? open(noAnel(corrida(inner), z1)) : ''];
  }
  function caixa(u0, v0, u1, v1, r, b, z0, z1) { return prisma(rrect(u0, v0, u1, v1, r), rrect(u0 + b, v0 + b, u1 - b, v1 - b, Math.max(0.3, r - b)), z0, z1); }
  /* A bolha deitada no plano do cartão: elipse de eixos retos, como o flatDot da skill. */
  function bolha(p, r) { var rx = r * S, ry = rx * 0.5; return 'M' + r2(p[0] - rx) + ' ' + r2(p[1]) + 'a' + r2(rx) + ' ' + r2(ry) + ' 0 1 0 ' + r2(2 * rx) + ' 0a' + r2(rx) + ' ' + r2(ry) + ' 0 1 0 ' + r2(-2 * rx) + ' 0Z'; }

  /* Um quadro: s e l são, por cartão, o quanto saiu e o quanto subiu; act é
   * o escolhido (-1 em repouso). Devolve [d, classe] na ordem de pintura. */
  function quadro(s, l, act) {
    var out = [];
    ROSTOS.forEach(function (f, i) {
      var x0 = DX[i] + s[i], y0 = DY[i], z = i * G + l[i], topo = z + T;
      var pl = caixa(x0, y0, x0 + W, y0 + D, 7, 1.8, z, topo);
      out.push([pl[0], i === act ? 'sil hi' : 'sil'], [pl[1], 'nf lo']);
      (f.linha ? [f.linha] : []).forEach(function (ls) {
        out.push([ls.map(function (q) { return seg(P(x0 + q[0], y0 + q[1], topo), P(x0 + q[0], y0 + q[2], topo)); }).join(''), 'nf lo']);
      });
      var marcas = (f.caixa || []).map(function (b, k) { return { k: 'c', b: b, n: k }; })
        .concat(f.selo ? [{ k: 's', b: f.selo }] : [])
        .concat((f.bolha || []).map(function (b) { return { k: 'b', b: b }; }))
        .sort(function (a, b) { return a.b[0] + a.b[1] - b.b[0] - b.b[1]; });
      marcas.forEach(function (m) {
        var b = m.b;
        if (m.k === 'c') {
          var cx = caixa(x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3], 1.8, 0.7, topo, topo + b[4]);
          out.push([cx[0], i === 5 && m.n === MARCA && act < 0 ? 'sil hi' : 'sil'], [cx[1], 'nf lo']);
        } else if (m.k === 's') {
          var R = circ(x0 + b[0], y0 + b[1], b[2]);
          out.push([poly(hull(noAnel(R, topo + 2).concat(noAnel(R, topo)))), 'sil'], [poly(noAnel(circ(x0 + b[0], y0 + b[1], b[2] - 2.5), topo + 2)), 'nf lo']);
        } else out.push([bolha(P(x0 + b[0], y0 + b[1], topo), 1.5), b[2] ? 'dot m' : 'dot off']);
      });
    });
    return out;
  }

  /* O ponteiro, em unidades do viewBox. Fora da pilha em repouso, -1; nela, o
   * cartão cujo ponto fixo da beirada da frente está mais perto. */
  var pontos = ROSTOS.map(function (f, i) { return P(DX[i] + REST[i] + W - 16, DY[i] + D / 2, i * G + T); });
  function alvo(sx, sy) {
    var na = ROSTOS.some(function (f, i) {
      var q = unP(sx, sy, i * G + T);
      return Math.abs(q[0] - DX[i] - REST[i] - W / 2) <= W / 2 + 4 && Math.abs(q[1] - DY[i] - D / 2) <= D / 2 + 4;
    });
    if (!na) return -1;
    var best = -1, bd = Infinity;
    pontos.forEach(function (p, i) { var d = Math.hypot(sx - p[0], sy - p[1]); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  return { N: ROSTOS.length, NOMES: NOMES, REST: REST, OUT: OUT, LIFT: LIFT, quadro: quadro, alvo: alvo };
}

/* O repouso, gravado no SVG das telas: é o que se vê sem script e o que o
 * script encontra para animar. O viewBox recorta a moldura 400 × 320 da skill
 * na caixa que a figura ocupa no pior quadro (o de cima para fora e erguido). */
export function cenaPilha() {
  const g = geometria();
  const paths = g.quadro(g.REST, g.REST.map(() => 0), -1).map(([d, c]) => `<path d='${d}' class='${c}'/>`).join('');
  return `<svg class='ucam-login__cena-svg' viewBox='56 44 288 254' aria-hidden='true' focusable='false'><g class='pilha'>${paths}</g></svg>`;
}
