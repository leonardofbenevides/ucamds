import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteField, UcamSiteInput } from './input';

@Component({
  imports: [UcamSiteField, UcamSiteInput],
  template: `<div ucamSiteField data-peca class="minha" [label]="$any(e()['label']) ?? 'E-mail'" [hint]="$any(e()['hint'])" [error]="$any(e()['error'])"
      [icon]="$any(e()['icon'])" [fieldId]="$any(e()['fieldId'])" [describedBy]="$any(e()['describedBy'])">
    <input ucamSiteInput type="email" autocomplete="email">
  </div>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

@Component({
  imports: [UcamSiteField, UcamSiteInput],
  template: `<div ucamSiteField label="Nome"><input ucamSiteInput type="text"></div><div ucamSiteField label="E-mail" hint="x"><input ucamSiteInput type="email"></div>`,
})
class Dois {}

@Component({ imports: [UcamSiteInput], template: `<input ucamSiteInput id="meu" aria-describedby="ajuda" aria-invalid="true" type="search">` })
class Solto {}

/** Todo id citado pelo campo existe no trecho, e uma vez só. */
const ligacao = (el: HTMLElement) => {
  const campo = el.querySelector('input')!;
  const descritos = (campo.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  return {
    rotulo: el.querySelector('label')!.getAttribute('for') === campo.id && !!campo.id,
    descritos: descritos.map((id) => el.querySelectorAll(`[id="${id}"]`).length),
    textos: descritos.map((id) => el.querySelector(`[id="${id}"]`)?.textContent ?? null),
    invalido: campo.getAttribute('aria-invalid'),
  };
};

describe('div[ucamSiteField] e input[ucamSiteInput]', () => {
  blocosComuns('input', Hospede);

  it('só com o rótulo: ligado ao campo, sem descrição e sem erro', () => {
    const { el } = monta(Hospede);
    expect(ligacao(el)).toEqual({ rotulo: true, descritos: [], textos: [], invalido: null });
    expect(el.querySelector('input')!.hasAttribute('aria-describedby')).toBe(false);
    expect(el.querySelectorAll('p').length).toBe(0);
    expect(el.querySelector('input')!.className).toBe('ucam-site-input__field');
    expect(el.querySelector('label')!.textContent).toBe('E-mail');
  });

  it('apoio e erro entram na descrição do campo, nessa ordem, e o erro o torna inválido', () => {
    expect(ligacao(monta(Hospede, { hint: 'Um por semana.' }).el)).toEqual({ rotulo: true, descritos: [1], textos: ['Um por semana.'], invalido: null });
    expect(ligacao(monta(Hospede, { error: 'Informe o e-mail.' }).el)).toEqual({ rotulo: true, descritos: [1], textos: ['Informe o e-mail.'], invalido: 'true' });
    expect(ligacao(monta(Hospede, { hint: 'Um por semana.', error: 'Informe o e-mail.' }).el)).toEqual({
      rotulo: true, descritos: [1, 1], textos: ['Um por semana.', 'Informe o e-mail.'], invalido: 'true',
    });
  });

  it('o erro que some não deixa id órfão nem o campo inválido', () => {
    const { f, el } = monta(Hospede, { hint: 'Um por semana.', error: 'Informe o e-mail.' });
    f.componentInstance.e.set({ hint: 'Um por semana.', error: null });
    f.detectChanges();
    expect(ligacao(el)).toEqual({ rotulo: true, descritos: [1], textos: ['Um por semana.'], invalido: null });
    f.componentInstance.e.set({});
    f.detectChanges();
    expect(el.querySelector('input')!.hasAttribute('aria-describedby')).toBe(false);
    expect(el.querySelector('input')!.hasAttribute('aria-invalid')).toBe(false);
    f.componentInstance.e.set({ error: 'De novo.' });
    f.detectChanges();
    expect(ligacao(el)).toEqual({ rotulo: true, descritos: [1], textos: ['De novo.'], invalido: 'true' });
  });

  it('texto só de espaços não é apoio nem erro', () => {
    const { el } = monta(Hospede, { hint: '   ', error: ' ' });
    expect(el.querySelectorAll('p').length).toBe(0);
    expect(ligacao(el).invalido).toBeNull();
  });

  it('descrição de fora do campo vem antes das mensagens dele', () => {
    const { el } = monta(Hospede, { describedBy: 'nota', error: 'Informe o e-mail.', fieldId: 'nl' });
    expect(el.querySelector('input')!.getAttribute('aria-describedby')).toBe('nota nl-erro');
  });

  it('fieldId é respeitado, e as mensagens derivam dele', () => {
    const { el } = monta(Hospede, { fieldId: 'contato-email', hint: 'x', error: 'y' });
    expect(el.querySelector('input')!.id).toBe('contato-email');
    expect(el.querySelector('label')!.getAttribute('for')).toBe('contato-email');
    expect([...el.querySelectorAll('p')].map((p) => p.id)).toEqual(['contato-email-hint', 'contato-email-erro']);
  });

  it('dois campos na página não compartilham id', () => {
    const f = TestBed.createComponent(Dois);
    f.detectChanges();
    const ids = [...f.nativeElement.querySelectorAll('[id]')].map((e) => (e as Element).id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(3);
    for (const campo of f.nativeElement.querySelectorAll('.ucam-site-input')) expect(ligacao(campo as HTMLElement).rotulo).toBe(true);
  });

  it('o ícone entra no controle, antes do campo, com a classe da parte', () => {
    const { el } = monta(Hospede, { icon: 'search' });
    const controle = el.querySelector('.ucam-site-input__control')!;
    expect(controle.firstElementChild!.localName).toBe('svg');
    expect(controle.firstElementChild!.getAttribute('class')!.split(' ').sort()).toEqual(['ic', 'ucam-site-input__icon']);
    expect(controle.querySelector('use')!.getAttribute('href')).toBe('#i-search');
    expect(monta(Hospede).el.querySelector('svg')).toBeNull();
  });

  it('o input sozinho só ganha a classe: o que o consumidor escreveu fica', () => {
    const f = TestBed.createComponent(Solto);
    f.detectChanges();
    const campo = f.nativeElement.querySelector('input') as HTMLInputElement;
    expect(campo.className).toBe('ucam-site-input__field');
    expect(campo.id).toBe('meu');
    expect(campo.getAttribute('aria-describedby')).toBe('ajuda');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
  });
});
