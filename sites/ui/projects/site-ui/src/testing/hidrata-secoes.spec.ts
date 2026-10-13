/**
 * As doze peças da fatia 3a-3 — hero, seções, cartões e prosa —, no servidor
 * e depois no cliente com hidratação: a mesma árvore, nenhum aviso, e o
 * desfile de logos com exatamente dois grupos antes e depois.
 */
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { UCAM_SITE } from '../public-api';

@Component({
  selector: 'app-raiz',
  imports: [UCAM_SITE],
  template: `<section ucamSiteHero eyebrow="CENPRE" heading="Seu estágio começa aqui" lede="Vagas e convênios." image="/campus.jpg">
      <ul ucamSiteHeroPills><li ucamSiteHeroPill><svg ucamSiteIcon="briefcase"></svg> 1.700 empresas</li></ul>
      <div ucamSiteHeroActions><a ucamSiteButton inverse href="/vagas">Ver vagas</a></div>
    </section>
    <header ucamSitePageHero width="prosa" eyebrow="Currículo" heading="Como montar o currículo" lede="O que entra.">
      <nav ucamSiteBreadcrumb inverse [items]="trilha"></nav>
    </header>
    <dl ucamSiteStats [items]="numeros"></dl>
    <div ucamSiteMarquee [logos]="logos()"></div>
    <article ucamSiteCard interactive heading="Primeiro currículo" href="/curriculo" image="/c.jpg" text="Resumo.">
      <ul ucamSiteCardMeta><li ucamSiteTag>Currículo</li></ul>
    </article>
    <article ucamSiteCourseCard name="Direito" href="/direito" level="Graduação" modality="Presencial" duration="5 anos"></article>
    <section ucamSiteDocCard label="Estágio obrigatório" [items]="documentos"></section>
    <ol ucamSiteSteps><li ucamSiteStep [number]="1" heading="Cadastre o currículo" text="Na plataforma." href="/plataforma" linkLabel="Acessar"></li></ol>
    <figure ucamSiteTestimonial quote="Consegui o estágio." author="Ana de Souza" authorRole="Direito"></figure>
    <div ucamSiteProse><p>Texto <strong>corrido</strong>.</p></div>
    <section ucamSiteCta heading="Pronto?" text="Cadastre o currículo." image="/a.jpg"><div ucamSiteCtaActions><a ucamSiteButton inverse href="/vagas">Ver vagas</a></div></section>`,
})
class Raiz {
  readonly trilha = [{ label: 'Início', href: '/' }, { label: 'Currículo' }];
  readonly numeros = [{ value: '5.000+', label: 'alunos' }, { value: '24', label: 'anos' }];
  readonly logos = signal([{ src: '/a.svg', alt: 'Aurora' }, { src: '/b.svg', alt: 'Brisa', href: '/brisa' }]);
  readonly documentos = ['Termo de compromisso', 'Plano de atividades'];
}

const forma = (raiz: Element) => {
  const tags: Record<string, number> = {};
  for (const el of raiz.querySelectorAll('*')) tags[el.localName] = (tags[el.localName] ?? 0) + 1;
  return tags;
};

describe('hidratação das peças de hero, seções, cartões e prosa', () => {
  it('o cliente reaproveita o HTML do servidor sem duplicar nó', async () => {
    const html = await renderApplication(
      (contexto) => bootstrapApplication(Raiz, { providers: [provideServerRendering(), provideZonelessChangeDetection(), provideClientHydration()] }, contexto),
      { document: '<!doctype html><html><head></head><body><app-raiz></app-raiz></body></html>', url: '/' },
    );
    TestBed.resetTestingModule();
    document.body.innerHTML = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)![1];
    const raiz = document.querySelector('app-raiz')!;
    const doServidor = { forma: forma(raiz), hero: raiz.querySelector('.ucam-site-hero'), cartao: raiz.querySelector('.ucam-site-card__link') };

    // O servidor já entrega a página pronta.
    expect(raiz.querySelectorAll('h1').length).toBe(2);
    expect(raiz.querySelector('.ucam-site-hero')!.className).toContain('ucam-site-hero--com-foto');
    expect(raiz.querySelectorAll('.ucam-site-marquee__group').length).toBe(2);
    expect(raiz.querySelectorAll('.ucam-site-marquee__group[aria-hidden="true"] a[tabindex="-1"]').length).toBe(1);
    expect(raiz.querySelectorAll('.ucam-site-card a').length).toBe(1);
    expect(raiz.querySelector('.ucam-site-avatar')!.textContent).toBe('AS');
    expect(raiz.querySelector('.ucam-site-steps')!.getAttribute('role')).toBe('list');

    const avisos: string[] = [];
    const erro = console.error;
    const aviso = console.warn;
    console.error = (...a: unknown[]) => void avisos.push(String(a[0]));
    console.warn = (...a: unknown[]) => void avisos.push(String(a[0]));
    const app = await bootstrapApplication(Raiz, { providers: [provideZonelessChangeDetection(), provideClientHydration()] });
    try {
      await app.whenStable();
      app.tick();
      expect(raiz.querySelector('.ucam-site-hero')).toBe(doServidor.hero);
      expect(raiz.querySelector('.ucam-site-card__link')).toBe(doServidor.cartao);
      expect(forma(raiz)).toEqual(doServidor.forma);
      expect(avisos).toEqual([]);

      // Trocar os logos depois de hidratar atualiza os dois grupos, sem sobra da cópia do servidor.
      (app.components[0].instance as Raiz).logos.set([{ src: '/x.svg', alt: 'Xisto' }, { src: '/y.svg', alt: 'Ypê' }, { src: '/z.svg', alt: 'Zinco' }]);
      app.tick();
      await app.whenStable();
      const grupos = raiz.querySelectorAll('.ucam-site-marquee__group');
      expect(grupos.length).toBe(2);
      expect([...grupos].map((g) => g.querySelectorAll('img').length)).toEqual([3, 3]);
      expect(raiz.querySelectorAll('.ucam-site-marquee a').length).toBe(0);
    } finally {
      console.error = erro;
      console.warn = aviso;
      app.destroy();
      document.body.innerHTML = '';
    }
  });
});
