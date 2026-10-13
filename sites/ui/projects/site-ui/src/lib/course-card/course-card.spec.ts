import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteCourseCard } from './course-card';

@Component({
  imports: [UcamSiteCourseCard],
  template: `<article ucamSiteCourseCard data-peca class="minha" name="Direito" [href]="$any(e()['href'] === undefined ? '/cursos/direito' : e()['href'])"
    [modality]="$any(e()['modality'])" [level]="$any(e()['level'])" [duration]="$any(e()['duration'])" [shift]="$any(e()['shift'])" [campus]="$any(e()['campus'])" [image]="$any(e()['image'])"></article>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const itens = (el: HTMLElement, sel: string) => [...el.querySelectorAll(`${sel} > li`)].map((li) => li.textContent);

describe('article[ucamSiteCourseCard]', () => {
  blocosComuns('course-card', Hospede);

  it('completo: foto, tags de nível e modalidade, o nome com o único link, e os metadados', () => {
    const { el } = monta(Hospede, { level: 'Graduação', modality: 'Presencial', duration: '5 anos', shift: 'Noturno', campus: 'Campus Centro', image: '/direito.jpg' });
    expect(el.querySelector('img.ucam-site-course-card__media')!.getAttribute('alt')).toBe('');
    expect([...el.querySelector('.ucam-site-course-card__body')!.children].map((c) => `${c.localName}.${c.className}`)).toEqual([
      'ul.ucam-site-course-card__tags', 'h3.ucam-site-course-card__title', 'ul.ucam-site-course-card__meta',
    ]);
    expect(itens(el, '.ucam-site-course-card__tags')).toEqual(['Graduação', 'Presencial']);
    expect([...el.querySelectorAll('.ucam-site-course-card__tags > li')].every((li) => li.className === 'ucam-site-tag')).toBe(true);
    expect(itens(el, '.ucam-site-course-card__meta')).toEqual(['5 anos', 'Noturno', 'Campus Centro']);
    const links = el.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].className).toBe('ucam-site-course-card__link');
    expect(links[0].getAttribute('href')).toBe('/cursos/direito');
    expect(links[0].textContent).toBe('Direito');
  });
  it('só entra o que veio: curso sem turno nem campus, e sem tags', () => {
    const { el } = monta(Hospede, { duration: '18 meses', shift: '  ', campus: null });
    expect(itens(el, '.ucam-site-course-card__meta')).toEqual(['18 meses']);
    expect(el.querySelector('.ucam-site-course-card__tags')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
    const vazio = monta(Hospede).el;
    expect(vazio.querySelectorAll('ul').length).toBe(0);
    expect(itens(monta(Hospede, { modality: 'EAD' }).el, '.ucam-site-course-card__tags')).toEqual(['EAD']);
  });
  it('sem href o nome é texto: não há link sem destino', () => {
    const { el } = monta(Hospede, { href: ' ' });
    expect(el.querySelector('a')).toBeNull();
    expect(el.querySelector('h3')!.textContent).toBe('Direito');
  });
});
