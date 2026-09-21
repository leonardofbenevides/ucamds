/**
 * A frase de regra do campo de anexo, gerada de accept e maxSize.
 *
 * Mora aqui, e não dentro do portão, porque são DOIS os lugares que precisam
 * concordar sobre ela — a frase escrita nas telas e a que o Trilho B gera em
 * ucam-file-field.ts. Uma terceira implementação dentro do portão seria a
 * falha que tools/lib/wcag.mjs existe para evitar: dois verificadores
 * discordando sobre a mesma conta.
 *
 * Contrato: file-field.json, conteudo.regra.
 *   Um formato:      "PDF de até 10 MB."
 *   Dois:            "PDF ou JPG de até 10 MB."
 *   Três ou mais:    "PDF, JPG ou PNG de até 10 MB."
 *   Sem accept:      "Arquivo de até 10 MB."
 *   Sem os dois:     nenhuma frase.
 */

/** MIME → nome comum. A regra fala a língua de quem anexa, não a do protocolo. */
const NOME_DO_FORMATO = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/*': 'imagem',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
};

/** pt-BR, uma casa, piso de 1 KB — e sem a casa quando ela é zero. */
export function tamanhoDaRegra(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`.replace(',0 ', ' ');
}

export function formatosDe(accept = '') {
  return accept
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => NOME_DO_FORMATO[p.toLowerCase()] ?? p.replace(/^\./, '').toUpperCase())
    .filter((v, i, todos) => todos.indexOf(v) === i);
}

export function regraDeAnexo({ accept = '', maxSize = null } = {}) {
  const formatos = formatosDe(accept);
  if (!formatos.length && maxSize == null) return null;
  const oQue = formatos.length
    ? formatos.length === 1
      ? formatos[0]
      : `${formatos.slice(0, -1).join(', ')} ou ${formatos[formatos.length - 1]}`
    : 'Arquivo';
  return maxSize == null ? `${oQue}.` : `${oQue} de até ${tamanhoDaRegra(maxSize)}.`;
}
