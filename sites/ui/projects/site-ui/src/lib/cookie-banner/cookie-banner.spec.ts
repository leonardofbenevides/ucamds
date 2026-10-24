import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteCookieBanner } from './cookie-banner';

@Component({
  imports: [UcamSiteCookieBanner],
  template: `@if (!e()['fora']) {<section ucamSiteCookieBanner data-peca class="minha" [policyHref]="$any(e()['policyHref'])" [actionLabel]="$any(e()['actionLabel'])" (dismiss)="respostas = respostas + 1">Usamos cookies para medir as visitas.</section>}`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  respostas = 0;
}

describe('section[ucamSiteCookieBanner]', () => {
  blocosComuns('cookie-banner', Hospede);

  it('é uma região com nome, não um diálogo, e não toma o foco', () => {
    const { el } = monta(Hospede);
    expect(el.getAttribute('aria-label')).toBe('Aviso de cookies');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.contains(document.activeElement)).toBe(false);
  });

  it('a frase é projetada e vem antes do link da política', () => {
    const { el } = monta(Hospede, { policyHref: '/privacidade' });
    const texto = el.querySelector('.ucam-site-cookie-banner__texto')!;
    expect(texto.textContent).toContain('Usamos cookies para medir as visitas.');
    expect(texto.querySelector('a')!.getAttribute('href')).toBe('/privacidade');
  });

  it('endereço e rótulo vazios voltam ao padrão', () => {
    const { el } = monta(Hospede, { policyHref: ' ', actionLabel: '' });
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/politica-de-privacidade');
    expect(el.querySelector('button')!.textContent).toBe('Entendi');
  });

  it('a ação é secundária e emite dismiss', () => {
    const { f, el } = monta(Hospede);
    const b = el.querySelector('button')!;
    expect(b.classList.contains('ucam-site-btn--secondary')).toBe(true);
    b.click();
    expect(f.componentInstance.respostas).toBe(1);
  });
});
