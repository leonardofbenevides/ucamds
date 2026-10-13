/**
 * O que a revisão da fatia 3a-3 achou (13/10/2026).
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamSiteCard } from '../lib/card/card';
import { UcamSiteCourseCard } from '../lib/course-card/course-card';
import { UcamSiteCta } from '../lib/editorial-cta/editorial-cta';
import { UcamSitePageHero } from '../lib/editorial-page-hero/editorial-page-hero';
import { UcamSiteHero } from '../lib/hero/hero';
import { UcamSiteMarquee } from '../lib/logo-marquee/logo-marquee';
import { UcamSiteStats } from '../lib/stats-band/stats-band';
import { UcamSiteTestimonial } from '../lib/testimonial/testimonial';

const monta = <T>(tipo: new () => T) => {
  const f = TestBed.createComponent(tipo);
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement, c: f.componentInstance };
};
const filhos = (el: Element | null) => [...(el?.children ?? [])].map((c) => `${c.localName}.${c.className.split(' ')[0]}`);

/* ---- I1: a parte escrita em HTML puro, com a classe da folha, entra no lugar certo ---- */
@Component({
  imports: [UcamSiteHero, UcamSitePageHero, UcamSiteCta, UcamSiteCard],
  template: `
    <section ucamSiteHero heading="Hero" lede="Frase.">
      <div class="ucam-site-hero__actions"><a href="/v">Ver</a></div>
      <ul class="ucam-site-hero__pills"><li class="ucam-site-hero-pill">Desde 2001</li></ul>
    </section>
    <header ucamSitePageHero heading="Página" eyebrow="Palavra">
      <div class="ucam-site-page-hero__actions"><a href="/v">Ver</a></div>
      <ul class="ucam-site-page-hero__pills"><li>x</li></ul>
      <nav class="ucam-site-breadcrumb" aria-label="Trilha"><ol class="ucam-site-breadcrumb__list"></ol></nav>
    </header>
    <section ucamSiteCta heading="Chamada" text="Apoio."><div class="ucam-site-cta__actions"><a href="/v">Ver</a></div></section>
    <article ucamSiteCard heading="Cartão" text="Resumo."><ul class="ucam-site-card__meta"><li class="ucam-site-tag">Tag</li></ul></article>`,
})
class EmHtmlPuro {}

describe('partes escritas em HTML puro', () => {
  it('a classe da folha vale como o atributo da lib: a ordem é a do contrato', () => {
    const { el } = monta(EmHtmlPuro);
    expect(filhos(el.querySelector('.ucam-site-hero__content'))).toEqual(['h1.ucam-site-hero__title', 'p.ucam-site-hero__lede', 'ul.ucam-site-hero__pills', 'div.ucam-site-hero__actions']);
    expect(filhos(el.querySelector('.ucam-site-page-hero__inner'))).toEqual([
      'nav.ucam-site-breadcrumb', 'p.ucam-site-page-hero__eyebrow', 'h1.ucam-site-page-hero__title', 'ul.ucam-site-page-hero__pills', 'div.ucam-site-page-hero__actions',
    ]);
    expect(filhos(el.querySelector('.ucam-site-cta__content'))).toEqual(['h2.ucam-site-cta__title', 'p.ucam-site-cta__text', 'div.ucam-site-cta__actions']);
    expect(filhos(el.querySelector('.ucam-site-card__body'))).toEqual(['ul.ucam-site-card__meta', 'h3.ucam-site-card__title', 'p.ucam-site-card__text']);
  });
});

/* ---- I4: o encaixe geral, nas peças em que não havia teste ---- */
@Component({
  imports: [UcamSitePageHero, UcamSiteCta, UcamSiteCard],
  template: `
    <header ucamSitePageHero heading="Página">@if (sim) {<p id="a1">um</p><p id="a2">dois</p>}</header>
    <section ucamSiteCta heading="Chamada">@if (sim) {<p id="b1">um</p><p id="b2">dois</p>}</section>
    <article ucamSiteCard heading="Cartão" text="Resumo.">@if (sim) {<p id="c1">um</p><p id="c2">dois</p>}</article>`,
})
class VariosNos { readonly sim = true; }

describe('conteúdo que não casa com nenhum encaixe', () => {
  it('não some: vai para o fim do bloco, nas três peças', () => {
    const { el } = monta(VariosNos);
    for (const [bloco, ids] of [['.ucam-site-page-hero__inner', ['a1', 'a2']], ['.ucam-site-cta__content', ['b1', 'b2']], ['.ucam-site-card__body', ['c1', 'c2']]] as const) {
      const ultimos = [...el.querySelector(bloco)!.children].slice(-2).map((c) => c.id);
      expect(ultimos, bloco).toEqual([...ids]);
    }
  });
});

/* ---- I2: nenhum link sem nome ---- */
@Component({
  imports: [UcamSiteMarquee, UcamSiteCard, UcamSiteCourseCard],
  template: `
    <div ucamSiteMarquee [logos]="logos"></div>
    <article ucamSiteCard id="cartao" [heading]="vazio" href="/x"></article>
    <article ucamSiteCourseCard id="curso" [name]="vazio" href="/y"></article>`,
})
class SemNome {
  readonly vazio = '  ';
  readonly logos = [{ src: '/a.svg', alt: 'Aurora', href: '/aurora' }, { src: '/b.svg', alt: '  ', href: '/brisa' }, { src: '/c.svg', href: '/cais' } as never];
}

describe('link sem nome', () => {
  it('logo com destino e sem nome não vira link: a imagem fica, o link não', () => {
    const { el } = monta(SemNome);
    const primeiro = el.querySelector('.ucam-site-marquee__group')!;
    expect(primeiro.querySelectorAll('img').length).toBe(3);
    const links = [...primeiro.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/aurora']);
    for (const a of el.querySelectorAll('.ucam-site-marquee__group:not([aria-hidden]) a')) expect(a.querySelector('img')!.getAttribute('alt')).toBeTruthy();
  });
  it('cartão e curso sem título não esticam um link vazio sobre o cartão', () => {
    const { el } = monta(SemNome);
    expect(el.querySelector('#cartao a')).toBeNull();
    expect(el.querySelector('#curso a')).toBeNull();
  });
});

/* ---- dado de tipo errado não derruba a página ---- */
@Component({
  imports: [UcamSiteStats, UcamSiteMarquee],
  template: `<dl ucamSiteStats [items]="$any(numeros)"></dl><div ucamSiteMarquee id="m1" [logos]="$any(logos)"></div><div ucamSiteMarquee id="m2" [logos]="$any('não é lista')"></div><dl ucamSiteStats id="s2" [items]="$any({ a: 1 })"></dl>`,
})
class TipoErrado {
  readonly numeros = [{ value: 24, label: 2026 }, { value: '9', label: ['x'] }, 'solto', { value: null, label: 'sem valor' }];
  readonly logos = [{ src: 42, alt: 'Número' }, { src: '/a.svg', alt: 7 }, { src: '/b.svg', alt: 'Brisa' }, 'solto'];
}

describe('dado de tipo errado', () => {
  it('rótulo numérico, endereço que não é texto e lista que não é lista não lançam', () => {
    const { el } = monta(TipoErrado);
    expect(el.querySelector('dl')!.querySelectorAll('dt').length).toBeGreaterThan(0);
    expect(el.querySelector('dl dt')!.textContent).toBe('2026');
    expect(el.querySelectorAll('#m1 .ucam-site-marquee__group:not([aria-hidden]) img').length).toBe(2);
    expect(el.querySelector('#m2')!.children.length).toBe(0);
    expect(el.querySelector('#s2')!.children.length).toBe(0);
  });
});

/* ---- iniciais do depoimento ---- */
@Component({ imports: [UcamSiteTestimonial], template: `<figure ucamSiteTestimonial quote="x" [author]="autor()"></figure>` })
class Depoimento { readonly autor = signal('Ana de Souza'); }

describe('iniciais do depoimento', () => {
  it('saem da primeira LETRA do primeiro e do último nome, pulando o que não é letra', () => {
    const { f, el, c } = monta(Depoimento);
    const para = (nome: string) => { c.autor.set(nome); f.detectChanges(); return el.querySelector('.ucam-site-avatar')?.textContent; };
    expect(para('Ana de Souza')).toBe('AS');
    expect(para('(Ana) souza')).toBe('AS');
    expect(para('"Zé" da Silva')).toBe('ZS');
    expect(para('Ana Souza (ex-aluna)')).toBe('AE');
    expect(para('Élcio Ávila')).toBe('ÉÁ');
    expect(para('Ana 2026')).toBe('A');
    expect(para('😀 Ana Lima')).toBe('AL');
  });
});

/* ---- o desfile acompanha o logo, não a posição ---- */
@Component({ imports: [UcamSiteMarquee], template: `<div ucamSiteMarquee [logos]="logos()"></div>` })
class Desfile { readonly logos = signal([{ src: '/a.svg', alt: 'A', href: '/a' }, { src: '/b.svg', alt: 'B', href: '/b' }]); }

describe('desfile reordenado', () => {
  it('o link de cada logo continua sendo o mesmo elemento', () => {
    const { f, el, c } = monta(Desfile);
    const linkDeB = el.querySelector('.ucam-site-marquee__group a[href="/b"]')!;
    c.logos.set([{ src: '/b.svg', alt: 'B', href: '/b' }, { src: '/a.svg', alt: 'A', href: '/a' }]);
    f.detectChanges();
    expect(el.querySelector('.ucam-site-marquee__group a[href="/b"]')).toBe(linkDeB);
  });
});
