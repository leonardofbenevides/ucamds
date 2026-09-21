// O bordô da marca e o vermelho de destruição continuam sendo duas cores?
//
// A ADR-002 decidiu que a rampa red.* é "deliberadamente distinta do bordô da
// marca para que as duas leituras não se confundam", e escreveu na terceira
// consequência: "o vermelho semântico precisa ser cromaticamente distinguível
// do bordô — restrição a respeitar em qualquer ajuste futuro da paleta".
//
// Nada verificava. É o mesmo buraco que a auditoria de setembro achou nos
// contratos e que a ADR-016 fechou para as séries de gráfico: regulamento
// escrito, portão ausente. Este arquivo fecha o terceiro.
//
// Por que importa mais aqui do que no gráfico: quando duas séries encostam, a
// tabela equivalente que o contrato do chart exige carrega a leitura sem cor.
// Quando o botão de salvar e o de excluir encostam, o que resta é o rótulo — e
// o rótulo é justamente o que a pessoa não relê quando já decidiu clicar.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { hexParaOklch } from './lib/color.mjs';
import { simula, distancia } from './check-daltonismo.mjs';

/* Os limiares e a matemática vêm inteiros da ADR-016. Não são "parecidos com"
 * os do daltonismo: são os mesmos, importados do mesmo módulo. Reimplementar a
 * distância aqui seria a falha que tools/lib/wcag.mjs existe para evitar — dois
 * portões discordando sobre o mesmo par. */
const LIMITE_DECISIVO = 0.10;
const LIMITE_COEXISTE = 0.06;
const TIPOS = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];
const ver = (hex, tipo) => (tipo === 'normal' ? hex : simula(hex, tipo));

/* O par DECISIVO é o mesmo papel em componentes de natureza oposta: o
 * preenchimento do primário contra o preenchimento do destrutivo, estado a
 * estado. É o par que decide a ação, e por isso responde pelo limiar de
 * vizinhança — o mais duro que o sistema tem.
 *
 * Casar por ESTADO e não todos contra todos é deliberado: default contra hover
 * nunca aparece, porque o ponteiro está num botão de cada vez. Comparar o que
 * não coexiste produz falha que ninguém pode consertar, e portão que grita sem
 * causa é portão que se aprende a ignorar. */
const DECISIVOS = [
  ['preenchimento em repouso', 'action-primary-default', 'action-danger-default'],
  ['preenchimento sob o ponteiro', 'action-primary-hover', 'action-danger-hover'],
  ['preenchimento sob pressão', 'action-primary-active', 'action-danger-active'],
];

/* O par primary-subtle × danger-subtle (o fundo do tom sobre secondary/ghost,
 * ADR-015) esteve aqui até a ADR-026 e SAIU — não por tolerância, por
 * aritmética. Cada um desses fundos carrega em cima a tinta do próprio tom
 * (wine.600 e red.600, ambas por volta de L 50) a 4,5:1, e 4,5:1 sobre uma
 * tinta de L 50 exige fundo de L 95 para cima. Dois fundos presos entre L 95
 * e L 100 nunca ficam a 0,06 um do outro, quanto mais a 0,10: o par é
 * insatisfazível enquanto a 1.4.3 valer, e portão que reprova o que não tem
 * conserto é portão que se aprende a ignorar. O que decide a ação nesse
 * estado é a TINTA em cima — que é o primeiro par da lista acima, medido. */

/* Estes não decidem uma ação sozinhos, mas dividem a tela: o realce de busca
 * numa lista que também tem linha em erro, o anel de foco — que é da MARCA —
 * pousando em cima de um botão destrutivo, o selo de erro ao lado do botão
 * primário. Coexistem, então respondem pelo limiar de coexistência. */
const COEXISTEM = [
  ['realce de busca × fundo de erro', 'realce-background', 'feedback-danger-background'],
  ['ação primária × filete de erro', 'action-primary-default', 'feedback-danger-border'],
  ['ação primária × barra de erro', 'action-primary-default', 'feedback-danger-graphic'],
  ['anel de foco × botão destrutivo', 'border-focus', 'action-danger-default'],
  ['anel de foco × filete de erro', 'border-focus', 'feedback-danger-border'],
  ['realce de busca × tinta de erro', 'realce-background', 'feedback-danger-foreground'],
  /* A categoria de atendimento leva a marca (wine.500) e pinta o ladrilho do
   * Protocolo na grade; ao lado dela pode haver um selo de erro. */
  ['categoria de atendimento × tinta de erro', 'categoria-atendimento', 'feedback-danger-foreground'],
];

function principal() {
  const NL = String.fromCharCode(10);
  const tokens = readFileSync('dist/tokens/ucam-tokens.css', 'utf8');
  /* Recorte por BLOCO, pelo mesmo motivo que o portão de daltonismo documenta:
   * entre o :root claro e o :root[data-theme="dark"] existe um @media
   * prefers-color-scheme que também carrega o escuro. */
  const blocoDe = (marca) => {
    const i = tokens.indexOf(marca);
    if (i < 0) return '';
    const ini = tokens.indexOf('{', i);
    return tokens.slice(ini, tokens.indexOf(NL + '}', ini));
  };
  const leVars = (txt) =>
    Object.fromEntries([...txt.matchAll(/--(ucam-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const resolve = (v, mapa, n = 0) => {
    if (n > 10 || !v) return v;
    const m = String(v).match(/^var\(--([a-z0-9-]+)\)$/);
    return m ? resolve(mapa[m[1]], mapa, n + 1) : String(v).trim();
  };

  const claro = leVars(blocoDe(NL + ':root {'));
  const escuro = { ...claro, ...leVars(blocoDe(':root[data-theme="dark"] {')) };

  const falhas = [];
  const desvios = [];
  const relatos = [];

  for (const [tema, mapa] of [['claro', claro], ['escuro', escuro]]) {
    const cor = (nome) => {
      const hex = resolve(`var(--ucam-color-${nome})`, mapa);
      return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : null;
    };

    for (const [grupo, lista, limite, balde] of [
      ['decisivo', DECISIVOS, LIMITE_DECISIVO, falhas],
      ['coexiste', COEXISTEM, LIMITE_COEXISTE, desvios],
    ]) {
      for (const [rotulo, aNome, bNome] of lista) {
        const a = cor(aNome);
        const b = cor(bNome);
        if (!a || !b) {
          falhas.push(`[${tema}] token ausente ou não resolvido no par "${rotulo}": ${!a ? aNome : bNome}`);
          continue;
        }

        let pior = { d: Infinity, tipo: 'normal' };
        for (const tipo of TIPOS) {
          const d = distancia(ver(a, tipo), ver(b, tipo));
          if (d < pior.d) pior = { d, tipo };
        }

        /* ΔL é o diagnóstico, não enfeite. Sob protanopia e deuteranopia o arco
         * vinho→vermelho→laranja colapsa num eixo só: matiz deixa de separar e
         * tudo o que sobra mora na luminosidade. Sem esta linha o relatório diz
         * QUE o par encostou e não diz que a saída é degrau de L — e a saída
         * intuitiva, girar mais a matiz, foi medida e não rende nada. */
        const dL = Math.abs(hexParaOklch(a).L - hexParaOklch(b).L);
        const linha = `[${tema}] ${rotulo}: ${a} × ${b} · pior d=${pior.d.toFixed(3)} (${pior.tipo}, mínimo ${limite.toFixed(2)}) · ΔL ${dL.toFixed(1)}`;

        if (pior.d < limite) balde.push(linha + (dL < 9 ? ' — sem degrau de luminosidade para sustentar a distinção' : ''));
        else relatos.push('  ✓ ' + linha);
      }
    }
  }

  console.log('marca × destrutivo — o bordô e o vermelho ainda são duas cores? (ADR-002)');
  for (const r of relatos) console.log(r);

  if (desvios.length) {
    console.log(`${NL}⚠ ${desvios.length} desvio(s) nomeado(s) — papéis diferentes que dividem a tela:`);
    for (const d of desvios) console.log('  ' + d);
  }

  if (falhas.length) {
    console.error(`${NL}✗ ${falhas.length} falha(s): o par que DECIDE a ação não se separa.`);
    for (const f of falhas) console.error('  ' + f);
    console.error(`${NL}  A mitigação em vigor é o diálogo de confirmação que a ADR-002 exige, e ele`);
    console.error('  não cobre o caso: o diálogo aparece DEPOIS do clique. O que a cor precisa');
    console.error('  fazer é evitar o clique errado, e nesta distância ela não faz.');
    process.exit(1);
  }

  console.log(`${NL}✓ marca e destrutivo separáveis nos dois temas, nas três dicromacias`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
