import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteContactCard, hrefDeTelefone } from './contact-card';

@Component({
  imports: [UcamSiteContactCard],
  template: `<section ucamSiteContactCard data-peca class="minha" heading="Campos dos Goytacazes" [address]="$any(e()['address'])" [phone]="$any(e()['phone'])" [email]="$any(e()['email'])" [level]="$any(e()['level'])"></section>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const TUDO = { address: 'Rua Anita Peçanha, 100', phone: '(22) 2726-2400', email: 'selecaoucam@ucam-campos.br' };
const linhas = (el: HTMLElement) => [...el.querySelectorAll('.ucam-site-contact-card__line')].map((p) => {
  const icone = p.querySelector('svg use')!.getAttribute('href');
  const fim = p.lastElementChild!;
  return `${icone} ${fim.localName}${fim.getAttribute('href') ? `[${fim.getAttribute('href')}]` : ''} ${fim.textContent}`;
});

describe('section[ucamSiteContactCard]', () => {
  blocosComuns('contact-card', Hospede);

  it('título, depois um address com uma linha por dado, cada uma com o seu ícone', () => {
    const { el } = monta(Hospede, TUDO);
    expect([...el.children].map((c) => `${c.localName}.${c.className}`)).toEqual(['h3.ucam-site-contact-card__title', 'address.ucam-site-contact-card__lines']);
    expect(linhas(el)).toEqual([
      '#i-mapPin span Rua Anita Peçanha, 100',
      '#i-phone a[tel:+552227262400] (22) 2726-2400',
      '#i-mail a[mailto:selecaoucam@ucam-campos.br] selecaoucam@ucam-campos.br',
    ]);
    expect(el.querySelectorAll('svg[aria-hidden="true"]').length).toBe(3);
  });
  it('dado ausente some com o seu ícone; sem nenhum, só o título', () => {
    expect(linhas(monta(Hospede, { phone: TUDO.phone }).el)).toEqual(['#i-phone a[tel:+552227262400] (22) 2726-2400']);
    const { el } = monta(Hospede, { address: '  ', phone: '', email: null });
    expect([...el.children].map((c) => c.localName)).toEqual(['h3']);
  });
  it('telefone sem dígito e e-mail sem @ não viram link para lugar nenhum', () => {
    expect(linhas(monta(Hospede, { phone: 'a combinar', email: 'secretaria' }).el)).toEqual([]);
    expect(linhas(monta(Hospede, { email: 'a b@c.br' }).el)).toEqual([]);
    // Num mailto:, ? e # acrescentam destinatário e assunto.
    for (const email of ['a@b.com?cc=x@y.com', 'a@b.com#x', 'a@b.com,c@d.com', 'a@b.com&bcc=x']) expect(linhas(monta(Hospede, { email }).el)).toEqual([]);
  });
  it('o href do telefone: nacional, ramal, longa distância e número curto', () => {
    expect(hrefDeTelefone('0800 026 2400')).toBe('tel:08000262400');
    expect(hrefDeTelefone('0xx22 2726-2400')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('(022) 2726-2400')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('(22) 2726-2400 ramal 210')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('(22) 2726-2400 r. 210')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('190')).toBeNull();
    expect(hrefDeTelefone('+12')).toBeNull();
  });
  it('o href do telefone: só dígitos e +, com o DDI 55 quando faltar', () => {
    expect(hrefDeTelefone('(22) 2726-2400')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('22 99876-5432')).toBe('tel:+5522998765432');
    expect(hrefDeTelefone('+55 (22) 2726-2400')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('55 22 2726-2400')).toBe('tel:+552227262400');
    expect(hrefDeTelefone('+1 202 555 0100')).toBe('tel:+12025550100');
    expect(hrefDeTelefone('ramal')).toBeNull();
  });
  it('o nível do título é 3, e pode ser 2 ou 4', () => {
    expect(monta(Hospede, { level: 2 }).el.firstElementChild!.localName).toBe('h2');
    expect(monta(Hospede, { level: '4' }).el.firstElementChild!.localName).toBe('h4');
    expect(monta(Hospede, { level: 9 }).el.firstElementChild!.localName).toBe('h3');
  });
});
