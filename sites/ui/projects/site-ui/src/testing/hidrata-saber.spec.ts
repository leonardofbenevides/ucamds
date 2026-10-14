/**
 * A fase A do saber-mais na mesma prova das outras: servidor, depois cliente
 * com hidratação. As peças novas (ficha, abas de seção, linha do tempo,
 * cartão de contato) e as variantes novas (hero de página sobre foto, frase
 * nos números, cartão de destaque) numa página só: a árvore do servidor é a
 * do cliente, o nó é o mesmo e nenhum aviso sai. As abas rolam até a atual
 * depois de desenhar, no cliente: rolar não pode criar nem mover nó.
 */
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { UCAM_SITE } from '../public-api';

@Component({
  selector: 'app-raiz',
  imports: [UCAM_SITE],
  template: `<header ucamSitePageHero image="/sites/fotos/campos.jpg" eyebrow="Pós-graduação" heading="Mestrado em Planejamento Regional"><div ucamSitePageHeroActions><a ucamSiteButton inverse href="/processo">Processo seletivo</a></div></header>
    <nav ucamSiteSectionTabs ariaLabel="Seções do curso" current="/mestrado#docentes" [items]="abas"></nav>
    <article ucamSiteCard featured level="2" heading="Turma 2026.2" text="Inscrições abertas até 30 de novembro."></article>
    <dl ucamSiteFactSheet columns="2" [items]="ficha"></dl>
    <dl ucamSiteStats [items]="numeros"></dl>
    <ol ucamSiteTimeline [items]="marcos"></ol>
    <section ucamSiteContactCard heading="Campos dos Goytacazes" address="Rua Anita Peçanha, 100" phone="(22) 2726-2400" email="selecaoucam@ucam-campos.br"></section>`,
})
class Raiz {
  readonly abas = [{ label: 'Apresentação', href: '/mestrado#apresentacao' }, { label: 'Pesquisa', href: '/mestrado#pesquisa' }, { label: 'Docentes', href: '/mestrado#docentes' }];
  readonly ficha = [{ term: 'Duração', value: '24 meses' }, { term: 'Modalidade', value: 'Presencial' }];
  readonly numeros = [{ value: '5', label: 'Conceito CAPES', text: 'A maior nota da área.' }, { value: '2001', label: 'Primeira turma' }];
  readonly marcos = [{ year: '2000', title: 'Mestrado implantado', text: 'Reconhecido pela CAPES no mesmo ano.' }, { year: '2001', title: 'Primeira turma do Mestrado' }];
}

const forma = (raiz: Element) => {
  const tags: Record<string, number> = {};
  for (const el of raiz.querySelectorAll('*')) tags[el.localName] = (tags[el.localName] ?? 0) + 1;
  return tags;
};

describe('hidratação da fase A do saber-mais', () => {
  it('as peças e variantes novas hidratam sem duplicar nó nem avisar', async () => {
    const html = await renderApplication(
      (contexto) => bootstrapApplication(Raiz, { providers: [provideServerRendering(), provideZonelessChangeDetection(), provideClientHydration()] }, contexto),
      { document: '<!doctype html><html><head></head><body><app-raiz></app-raiz></body></html>', url: '/' },
    );
    TestBed.resetTestingModule();
    document.body.innerHTML = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)![1];
    const raiz = document.querySelector('app-raiz')!;
    const doServidor = forma(raiz);
    const foto = raiz.querySelector('.ucam-site-page-hero__media');
    const aba = raiz.querySelector('[aria-current="location"]');
    expect(foto).not.toBeNull();
    expect(aba?.textContent).toBe('Docentes');
    expect(doServidor['use']).toBe(3);

    const avisos: string[] = [];
    const erro = console.error;
    const aviso = console.warn;
    console.error = (...a: unknown[]) => void avisos.push(String(a[0]));
    console.warn = (...a: unknown[]) => void avisos.push(String(a[0]));
    const app = await bootstrapApplication(Raiz, { providers: [provideZonelessChangeDetection(), provideClientHydration()] });
    try {
      await app.whenStable();
      app.tick();
      expect(raiz.querySelector('.ucam-site-page-hero__media')).toBe(foto);
      expect(raiz.querySelector('[aria-current="location"]')).toBe(aba);
      expect(forma(raiz)).toEqual(doServidor);
      expect(avisos).toEqual([]);
    } finally {
      console.error = erro;
      console.warn = aviso;
      app.destroy();
      document.body.innerHTML = '';
    }
  });
});
