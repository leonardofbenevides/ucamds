import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteTestimonial } from './testimonial';

@Component({
  imports: [UcamSiteTestimonial],
  template: `<figure ucamSiteTestimonial data-peca class="minha" quote="Consegui o estágio." [author]="$any(e()['author'])" [authorRole]="$any(e()['authorRole'])"
    [initials]="$any(e()['initials'])" [inverse]="$any(e()['inverse'])"></figure>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const iniciais = (entradas: Record<string, unknown>) => monta(Hospede, entradas).el.querySelector('.ucam-site-avatar')?.textContent ?? null;

describe('figure[ucamSiteTestimonial]', () => {
  blocosComuns('testimonial', Hospede);

  it('a fala num blockquote, e quem falou na legenda, com o avatar decorativo', () => {
    const { el } = monta(Hospede, { author: 'Ana de Souza', authorRole: 'Direito, turma de 2024' });
    expect(el.querySelector('blockquote.ucam-site-testimonial__quote')!.textContent).toBe('Consegui o estágio.');
    const legenda = el.querySelector('figcaption.ucam-site-testimonial__autor')!;
    expect(legenda.querySelector('.ucam-site-avatar')!.getAttribute('aria-hidden')).toBe('true');
    expect(legenda.querySelector('.ucam-site-testimonial__nome')!.textContent).toBe('Ana de Souza');
    expect(legenda.querySelector('.ucam-site-testimonial__papel')!.textContent).toBe('Direito, turma de 2024');
  });
  it('as iniciais saem do primeiro e do último nome, ou do que for passado', () => {
    expect(iniciais({ author: 'Ana de Souza' })).toBe('AS');
    expect(iniciais({ author: 'Ana' })).toBe('A');
    expect(iniciais({ author: '  maria  clara   dos  santos ' })).toBe('MS');
    expect(iniciais({ author: 'Ana de Souza', initials: 'AdS' })).toBe('AdS');
    expect(iniciais({ author: 'Ana de Souza', initials: '  ' })).toBe('AS');
  });
  it('sem autor não há legenda; sem papel não sobra elemento vazio', () => {
    expect(monta(Hospede).el.querySelector('figcaption')).toBeNull();
    expect(monta(Hospede, { author: '  ' }).el.querySelector('figcaption')).toBeNull();
    const { el } = monta(Hospede, { author: 'Ana de Souza' });
    expect(el.querySelector('.ucam-site-testimonial__papel')).toBeNull();
    expect(el.querySelector('.ucam-site-testimonial__nome')).not.toBeNull();
  });
});
