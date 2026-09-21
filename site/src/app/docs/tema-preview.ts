/**
 * Mantém as telas embutidas no mesmo tema da página que as hospeda.
 *
 * A tela de `/t/` é um DOCUMENTO próprio: ela não vê o `data-theme` que o
 * botão de tema escreve no `<html>` do site. Sem isto, uma documentação no
 * escuro mostra miniaturas brancas — foi o que apareceu ao trocar o preview
 * das telas de `innerHTML` para iframe, e vale igual para a moldura da página
 * de detalhe, que nunca passou o tema.
 *
 * São dois caminhos, e os dois são necessários:
 *
 *  - `?tema=` na URL, para a PRIMEIRA pintura. A tela autônoma lê a consulta
 *    no `<head>`, antes de pintar; sem isso haveria um quadro claro antes da
 *    correção. O valor sai do localStorage e não do `data-theme` porque o
 *    atributo é escrito por um effect que pode não ter rodado ainda quando a
 *    URL é montada.
 *  - escrita direta no documento aninhado, para as TROCAS. Mesma origem, então
 *    `contentDocument` é acessível, e trocar o atributo lá dentro repinta sem
 *    recarregar os doze iframes.
 *
 * Tema "sistema" não passa nada de propósito: sem `data-theme`, a folha da
 * tela cai no `@media (prefers-color-scheme: dark)` que os tokens já trazem, e
 * acompanha o sistema pelo mesmo caminho que o site.
 */

type Tema = 'dark' | 'light' | null;

/** O tema explícito do site, ou null quando ele está seguindo o sistema. */
export function temaDoSite(): Tema {
  if (typeof document === 'undefined') return null;
  const atributo = document.documentElement.getAttribute('data-theme');
  if (atributo === 'dark' || atributo === 'light') return atributo;
  try {
    const salvo = localStorage.getItem('ucam-theme');
    return salvo === 'dark' || salvo === 'light' ? salvo : null;
  } catch {
    return null;
  }
}

/** O que entra na consulta da tela autônoma. Vazio quando o tema é o sistema. */
export function consultaDeTema(): string {
  const t = temaDoSite();
  return t ? `&tema=${t}` : '';
}

/**
 * Aplica o tema do site a todo `iframe[data-preview]` e continua aplicando
 * enquanto a página viver. Devolve a função que desliga.
 */
export function sincronizaTemaDosPreviews(): () => void {
  if (typeof document === 'undefined') return () => undefined;

  const aplica = (quadro: HTMLIFrameElement): void => {
    // Mesma origem, mas o documento pode ainda ser about:blank num iframe
    // preguiçoso que não carregou — daí o try e o load abaixo.
    try {
      const doc = quadro.contentDocument;
      if (!doc?.documentElement) return;
      const t = temaDoSite();
      if (t) doc.documentElement.setAttribute('data-theme', t);
      else doc.documentElement.removeAttribute('data-theme');
    } catch {
      /* documento de outra origem: nada a fazer, e nada quebra */
    }
  };

  const todos = (): HTMLIFrameElement[] =>
    Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[data-preview]'));

  const aplicaEmTodos = (): void => todos().forEach(aplica);

  aplicaEmTodos();
  const aoCarregar = (e: Event): void => {
    const alvo = e.target;
    if (alvo instanceof HTMLIFrameElement && alvo.hasAttribute('data-preview')) aplica(alvo);
  };
  // Na fase de captura: load de iframe não borbulha.
  document.addEventListener('load', aoCarregar, true);

  const observador = new MutationObserver(aplicaEmTodos);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  return () => {
    document.removeEventListener('load', aoCarregar, true);
    observador.disconnect();
  };
}
