/**
 * Servidor e depois cliente COM hidratação: nenhuma peça pode criar nó duas
 * vezes. O teste de servidor sozinho não via isto — o ícone criava o <use>
 * por Renderer2 num effect, o servidor o serializava e o cliente, ao
 * hidratar, acrescentava outro (revisão de 10/10/2026: 2 no servidor, 4
 * depois de hidratar, e o do servidor ficava órfão ao trocar o ícone).
 *
 * Vale para toda peça: o que não está no template não é hidratado.
 */
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { UCAM_SITE } from '../public-api';

@Component({
  selector: 'app-raiz',
  imports: [UCAM_SITE],
  template: `<a ucamSiteButton variant="secondary" href="/x">Ver <svg ucamSiteIcon="arrowRight"></svg></a><span ucamSiteIconChip><svg [ucamSiteIcon]="nome()"></svg></span><span ucamSiteTag tone="brand">EAD</span><span ucamSiteAvatar name="Ana de Souza">AS</span><header ucamSiteSectionHeading eyebrow="Carreiras" heading="Vagas" lede="Da semana."><div ucamSiteSectionHeadingAcoes><a ucamSiteButton href="/v">Todas</a></div></header>`,
})
class Raiz {
  readonly nome = signal('briefcase');
}

/** Quantos elementos de cada tag, e quantos nós no total: a forma da árvore. */
const forma = (raiz: Element) => {
  const tags: Record<string, number> = {};
  for (const el of raiz.querySelectorAll('*')) tags[el.localName] = (tags[el.localName] ?? 0) + 1;
  return tags;
};

describe('hidratação', () => {
  it('o cliente reaproveita o HTML do servidor sem duplicar nó, e a troca de ícone deixa um <use> só', async () => {
    const html = await renderApplication(
      (contexto) => bootstrapApplication(Raiz, { providers: [provideServerRendering(), provideZonelessChangeDetection(), provideClientHydration()] }, contexto),
      { document: '<!doctype html><html><head></head><body><app-raiz></app-raiz></body></html>', url: '/' },
    );
    TestBed.resetTestingModule();
    document.body.innerHTML = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)![1];
    const raiz = document.querySelector('app-raiz')!;
    const doServidor = forma(raiz);
    const botao = raiz.querySelector('a');
    expect(doServidor['use']).toBe(2);

    const avisos: string[] = [];
    const erro = console.error;
    const aviso = console.warn;
    console.error = (...a: unknown[]) => void avisos.push(String(a[0]));
    console.warn = (...a: unknown[]) => void avisos.push(String(a[0]));
    const app = await bootstrapApplication(Raiz, { providers: [provideZonelessChangeDetection(), provideClientHydration()] });
    try {
      await app.whenStable();
      app.tick();
      // Hidratou de fato: o nó é o mesmo que veio do servidor.
      expect(raiz.querySelector('a')).toBe(botao);
      expect(forma(raiz)).toEqual(doServidor);
      expect(avisos).toEqual([]);

      (app.components[0].instance as Raiz).nome.set('check');
      app.tick();
      await app.whenStable();
      const usos = raiz.querySelectorAll('.ucam-site-icon-chip use');
      expect(usos.length).toBe(1);
      expect(usos[0].getAttribute('href')).toBe('#i-check');
    } finally {
      console.error = erro;
      console.warn = aviso;
      app.destroy();
      document.body.innerHTML = '';
    }
  });
});
