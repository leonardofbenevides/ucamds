import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Os links que a moldura do DS desenha (marca, navegação, trilha) são <a href>
 * comuns: clicados, recarregavam o app inteiro a cada troca de tela. Esta
 * diretiva, hospedada pelas molduras do app (hostDirectives), entrega ao
 * roteador o clique simples num link interno. Clique com tecla (abrir em
 * outra aba), link externo e clique que alguém já tratou seguem como estavam.
 */
@Directive({ selector: '[appLinksInternos]', host: { '(click)': 'aoClicar($event)' } })
export class LinksInternos {
  private readonly router = inject(Router);

  aoClicar(evento: MouseEvent): void {
    if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    const link = (evento.target as Element | null)?.closest?.('a[href]');
    const href = link?.getAttribute('href');
    if (!link || !href || !href.startsWith('/') || href.startsWith('//') || link.hasAttribute('target') || link.hasAttribute('download')) return;
    evento.preventDefault();
    void this.router.navigateByUrl(href);
  }
}
