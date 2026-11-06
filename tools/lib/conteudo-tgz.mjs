// Impressão digital do CONTEÚDO de um tarball, e não dos bytes dele.
//
// Por que não o sha do .tgz: o cabeçalho tar e a compressão dependem da versão
// do npm que empacotou. Duas máquinas empacotando a mesma árvore podem dar
// bytes diferentes, e o portão de versão acusaria mudança onde não há nenhuma.
// Aqui se abre o tar, se faz o hash de cada arquivo pelo nome e se combina a
// lista ordenada — o que muda é só o que o dev recebe.
//
// O campo `$generated` sai antes do hash. tools/build-tokens.mjs e
// tools/build-sites-tokens.mjs gravam nele a hora do build, e o ucam-tokens.json
// viaja em três pacotes: sem a limpeza, todo build pareceria versão nova.
//
// Sem dependência: gunzip do node:zlib e o formato ustar lido à mão (cabeçalho
// de 512 bytes, nome em 0..100, prefixo em 345..500, tamanho octal em 124..136).

import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const texto = (buf, ini, fim) => buf.subarray(ini, fim).toString('utf8').replace(/\0.*$/s, '');

/** Lê os arquivos regulares de um .tgz. Devolve [{ nome, dados }], nome sem o `package/` do npm. */
export function lerTgz(tgz) {
  const tar = gunzipSync(tgz);
  const arquivos = [];
  let longo = null;
  for (let p = 0; p + 512 <= tar.length; ) {
    const cab = tar.subarray(p, p + 512);
    if (cab.every((b) => b === 0)) break;
    const tamanho = parseInt(texto(cab, 124, 136).trim() || '0', 8);
    const tipo = String.fromCharCode(cab[156] || 48);
    const prefixo = texto(cab, 345, 500);
    let nome = longo ?? (prefixo ? `${prefixo}/${texto(cab, 0, 100)}` : texto(cab, 0, 100));
    longo = null;
    const dados = tar.subarray(p + 512, p + 512 + tamanho);
    if (tipo === 'L') longo = texto(dados, 0, dados.length);
    else if (tipo === '0' || tipo === '\0') arquivos.push({ nome: nome.replace(/^package\//, ''), dados });
    p += 512 + Math.ceil(tamanho / 512) * 512;
  }
  return arquivos;
}

/** Tira o carimbo de hora do build, que não é conteúdo. */
function normalizar(nome, dados) {
  if (!/\.json$/.test(nome)) return dados;
  return Buffer.from(dados.toString('utf8').replace(/"\$generated"\s*:\s*"[^"]*",?\s*/g, ''), 'utf8');
}

/** Impressão digital do conteúdo, mais o hash de cada arquivo (para dizer O QUE mudou). */
export function conteudoDoTgz(tgz) {
  const arquivos = lerTgz(tgz)
    .map(({ nome, dados }) => ({ nome, sha: sha(normalizar(nome, dados)) }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
  return {
    sha: sha(arquivos.map((a) => `${a.nome}\0${a.sha}\n`).join('')),
    arquivos: Object.fromEntries(arquivos.map((a) => [a.nome, a.sha])),
  };
}

/** Os nomes que diferem entre dois mapas { arquivo: sha }. */
export function diferencas(a, b) {
  const nomes = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...nomes].filter((n) => a[n] !== b[n]).sort();
}
