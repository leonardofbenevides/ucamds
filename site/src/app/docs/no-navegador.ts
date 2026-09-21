import { afterNextRender, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Roda o trecho SÓ no navegador, depois da primeira renderização.
 *
 * `afterNextRender` sozinho não basta neste site. A promessa do Angular é que
 * ele não roda no servidor — mas o prerender do Analog usa o platform-server
 * com emulação de DOM, e nessa combinação os callbacks EXECUTAM. O sintoma é
 * `ReferenceError: document is not defined` repetido uma vez por rota, com o
 * build ainda terminando "com sucesso" e as páginas saindo vazias.
 *
 * Por isso o guard é PLATFORM_ID e não `typeof document`: sob emulação de DOM
 * o `document` pode até existir, e aí o teste passaria enquanto tudo o que
 * depende de layout real (getBoundingClientRect, scrollY, ResizeObserver)
 * continuaria devolvendo zero.
 *
 * Precisa ser chamado de dentro de um contexto de injeção — construtor ou
 * inicializador de campo —, como o próprio afterNextRender.
 */
export function noNavegador(trecho: () => void): void {
  const ehNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  if (!ehNavegador) return;
  afterNextRender(trecho);
}
