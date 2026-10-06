/* A COR DO AVATAR sai do NOME (ADR-062).
 *
 * A mesma pessoa tem de sair da mesma cor em qualquer tela, e isso não se
 * escreve à mão em 250 avatares: a conta mistura os códigos das letras das
 * iniciais, em caixa alta, e tira um número de 1 a 8. O UcamAvatar do Trilho B
 * faz a mesma conta sobre as iniciais que ele mesmo deriva do nome, e o
 * avatarScript (lib/shell.mjs) a repete para o avatar que nasce por script.
 *
 * MISTURA, e não soma. A primeira versão somava os códigos e tirava o resto
 * por 8: iniciais vizinhas davam somas vizinhas, e numa lista em ordem
 * alfabética AL, BC, BS, CB e CR saíam as cinco da mesma cor (medido na tela
 * de resultado dos Relatórios, 06/10/2026). O multiplicador é o de Knuth; os
 * bits altos é que entram no resto, porque são os que a mistura espalha.
 */
export function corDoAvatar(iniciais) {
  const t = String(iniciais).trim().toUpperCase();
  let h = 0;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 2654435761) >>> 0;
  return ((h >>> 16) % 8) + 1;
}

/* Marca cada avatar de iniciais de um trecho de HTML com data-cor.
 * Fica de fora o que já tem cor por outro motivo (--marca), o que já traz o
 * atributo e o avatar de foto, que não tem iniciais para somar.
 *
 * As telas escrevem atributo com aspas simples (o preview mora dentro de
 * JSON); o HTML escrito à mão, com duplas. Vale a que abrir. */
export function corDosAvatares(html) {
  return String(html).replace(
    /<span class=(["'])(ucam-avatar(?:\s[^"']*)?)\1([^>]*)>([^<]{1,4})<\/span>/g,
    (tudo, aspa, classes, resto, texto) => {
      if (/ucam-avatar--marca/.test(classes) || /data-cor=/.test(resto) || !texto.trim()) return tudo;
      return (
        '<span class=' + aspa + classes + aspa + ' data-cor=' + aspa + corDoAvatar(texto) + aspa + resto + '>' + texto + '</span>'
      );
    },
  );
}
