/**
 * No servidor o HTML já sai com as classes e os atributos do contrato: nada
 * depende de afterNextRender nem de `document`. Um site estático entrega este
 * HTML antes de qualquer script rodar.
 */
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { UCAM_SITE, provideUcamSite } from '../public-api';

@Component({
  selector: 'app-raiz',
  imports: [UCAM_SITE],
  template: `
    <a ucamSiteButton variant="secondary" size="lg" href="/x">Ver</a>
    <span ucamSiteTag tone="brand">EAD</span>
    <span ucamSiteIconChip size="lg"><svg ucamSiteIcon="briefcase"></svg></span>
    <span ucamSiteAvatar name="Ana de Souza">AS</span>
    <header ucamSiteSectionHeading eyebrow="Carreiras" heading="Vagas" level="3">
      <div ucamSiteSectionHeadingAcoes><a ucamSiteButton href="/vagas">Todas</a></div>
    </header>
  `,
})
class Raiz {}

describe('render no servidor', () => {
  it('as cinco peças saem prontas, sem tocar o navegador', async () => {
    const html = await renderApplication(
      (contexto) =>
        bootstrapApplication(
          Raiz,
          { providers: [provideServerRendering(), provideZonelessChangeDetection(), provideUcamSite({ sprite: '/icons/sprite.svg' })] },
          contexto,
        ),
      { document: '<!doctype html><html><head></head><body><app-raiz></app-raiz></body></html>', url: '/' },
    );
    // A ordem das classes é do Angular; o que se promete é o conjunto.
    const classesDoBotao = /<a[^>]*href="\/x"[^>]*class="([^"]*)"/.exec(html)?.[1].split(' ').sort();
    expect(classesDoBotao).toEqual(['ucam-site-btn', 'ucam-site-btn--lg', 'ucam-site-btn--secondary']);
    expect(html).toContain('class="ucam-site-tag ucam-site-tag--brand"');
    expect(html).toMatch(/<span[^>]*class="ucam-site-icon-chip ucam-site-icon-chip--lg"[^>]*aria-hidden="true"|<span[^>]*aria-hidden="true"[^>]*class="ucam-site-icon-chip ucam-site-icon-chip--lg"/);
    expect(html).toContain('href="/icons/sprite.svg#i-briefcase"');
    expect(html).toMatch(/<span[^>]*role="img"[^>]*>AS<\/span>/);
    expect(html).toContain('aria-label="Ana de Souza"');
    expect(html).toContain('<h3 class="ucam-site-section-heading__title">Vagas</h3>');
    expect(html).toContain('class="ucam-site-section-heading__acoes"');
  });
});
