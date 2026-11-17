// As sondas das telas sob teste: telas plantadas com o defeito que cada uma
// procura, e uma tela boa que tem de passar em todas. Sonda que não acusa o
// defeito plantado é sonda quebrada — e passaria em tudo calada.
//
// Precisa de Chrome (CHROME troca o executável). Sem ele, o teste é pulado
// com o motivo, não reprovado: a suíte roda também em máquina sem navegador.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { achaChrome } from '../lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const semChrome = achaChrome() ? false : 'Chrome não encontrado (defina CHROME)';

const pagina = (corpo, script = '') => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>fixture</title>
<style>body{font:16px sans-serif;margin:16px} button{min-width:32px;min-height:32px}
:focus-visible{outline:2px solid #345;outline-offset:2px} .corta{overflow:hidden;width:200px}</style></head>
<body>${corpo}<script>${script}</script></body></html>`;

const TELAS = {
  boa: pagina(
    `<h1>Boa</h1><p id="ap">Apoio</p><button type="button" id="b" aria-describedby="ap" aria-pressed="false">Ligar</button><div role="status" data-anuncio></div>`,
    `document.getElementById('b').addEventListener('click', function () { this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });`,
  ),
  morto: pagina(`<h1>Morto</h1><button type="button">Não faz nada</button>`),
  mudo: pagina(
    `<h1>Mudo</h1><span class="selo" id="s">Aberto</span><button type="button" data-acao="concluir">Concluir</button>`,
    `document.querySelector('[data-acao]').addEventListener('click', function () { document.getElementById('s').className = 'selo selo--ok'; });`,
  ),
  semnome: pagina(`<h1>Sem nome</h1><button type="button" aria-describedby="nao-existe"><svg width="16" height="16" aria-hidden="true"></svg></button>`,
    `document.querySelector('button').addEventListener('click', function () { this.dataset.x = '1'; this.title = 'x'; });`),
  larga: pagina(`<h1>Larga</h1><div style="width:900px;height:20px;background:#ccc">tira larga</div>`),
  quebrada: pagina(`<h1>Quebrada</h1>`, `naoExiste();`),
  recortada: pagina(`<h1>Recortada</h1><div class="corta"><button type="button" style="width:200px" aria-pressed="false">Encostado</button></div>`,
    `document.querySelector('button').addEventListener('click', function () { this.setAttribute('aria-pressed', 'true'); });`),
};

test('sondas: cada defeito plantado é acusado e a tela boa passa', { skip: semChrome, timeout: 240000 }, () => {
  const raiz = mkdtempSync(join(tmpdir(), 'ucam-sondas-'));
  try {
    mkdirSync(join(raiz, 't', 'fixture'), { recursive: true });
    for (const [n, html] of Object.entries(TELAS)) writeFileSync(join(raiz, 't', 'fixture', n + '.html'), html);
    writeFileSync(join(raiz, 'sem-excecoes.json'), '{"excecoes": []}');
    let saida;
    try {
      saida = execFileSync(process.execPath, ['tools/sondas.mjs', '--raiz', raiz, '--excecoes', join(raiz, 'sem-excecoes.json'),
        '--so', 'erros,nomes,rolagem,foco,mortos,mudas', '--json', '--paralelo', '3'], { cwd: ROOT, encoding: 'utf8' });
    } catch (e) { saida = e.stdout; } // saída 1 é o esperado: há defeitos plantados
    const { novos } = JSON.parse(saida);
    const de = (tela, sonda) => novos.filter((n) => n.tela === `fixture/${tela}` && n.sonda === sonda).map((n) => n.chave);

    assert.deepEqual(novos.filter((n) => n.tela === 'fixture/boa'), [], 'a tela boa não pode ter achado');
    assert.ok(de('morto', 'mortos').some((c) => /Não faz nada/.test(c)), 'mortos: o botão sem efeito');
    assert.ok(de('mudo', 'mudas').includes('muda: concluir'), 'mudas: a ação que só troca a cor');
    assert.ok(de('semnome', 'nomes').some((c) => /^sem nome: button/.test(c)), 'nomes: o botão só de ícone');
    assert.ok(de('semnome', 'nomes').some((c) => /aria-describedby="nao-existe"/.test(c)), 'nomes: a referência quebrada');
    assert.ok(de('larga', 'rolagem').some((c) => /320/.test(c)), 'rolagem: a tira de 900px no telefone');
    assert.ok(de('quebrada', 'erros').some((c) => /naoExiste/.test(c)), 'erros: o ReferenceError');
    assert.ok(de('recortada', 'foco').some((c) => /anel recortado/.test(c)), 'foco: o anel cortado pelo pai');
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});
