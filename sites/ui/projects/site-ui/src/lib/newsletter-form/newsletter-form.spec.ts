import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteNewsletter } from './newsletter-form';

@Component({
  imports: [UcamSiteNewsletter],
  template: `<form ucamSiteNewsletter data-peca class="minha" heading="Receba as vagas da semana" [note]="$any(e()['note'])" [inverse]="$any(e()['inverse'])"
    [fieldId]="$any(e()['fieldId'])" [state]="$any(e()['state'])" [message]="$any(e()['message'])" (submitted)="enviados.push($event)"></form>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly enviados: string[] = [];
}

@Component({
  imports: [UcamSiteNewsletter],
  template: `<form ucamSiteNewsletter heading="Um" note="a"></form><form ucamSiteNewsletter heading="Dois" note="b"></form>`,
})
class Dois {}

const envia = (form: HTMLElement, email: string) => {
  const campo = form.querySelector('input')!;
  campo.value = email;
  const ev = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(ev);
  return ev;
};

describe('form[ucamSiteNewsletter]', () => {
  blocosComuns('newsletter-form', Hospede);

  it('monta título, campo de e-mail, botão e a região de status vazia', () => {
    const { el } = monta(Hospede);
    expect(el.querySelector('h2.ucam-site-newsletter__titulo')!.textContent).toBe('Receba as vagas da semana');
    const campo = el.querySelector('input')!;
    expect(campo.type).toBe('email');
    expect(campo.getAttribute('autocomplete')).toBe('email');
    expect(el.querySelector('label')!.getAttribute('for')).toBe(campo.id);
    expect(el.querySelector('button')!.getAttribute('type')).toBe('submit');
    const status = el.querySelector('.ucam-site-newsletter__status')!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toBe('');
    expect(el.querySelector('.ucam-site-newsletter__nota')).toBeNull();
    expect(el.hasAttribute('aria-busy')).toBe(false);
  });

  it('a nota descreve o campo', () => {
    const { el } = monta(Hospede, { note: 'Um e-mail por semana.' });
    const nota = el.querySelector('.ucam-site-newsletter__nota')!;
    expect(nota.textContent).toBe('Um e-mail por semana.');
    expect(el.querySelector('input')!.getAttribute('aria-describedby')).toBe(nota.id);
  });

  it('e-mail válido é emitido aparado, e o envio nativo é barrado', () => {
    const { f, el } = monta(Hospede);
    const ev = envia(el, '  ana@ucam.edu.br ');
    expect(ev.defaultPrevented).toBe(true);
    expect(f.componentInstance.enviados).toEqual(['ana@ucam.edu.br']);
  });

  it('vazio e endereço que o navegador recusa não são emitidos, e o foco vai para o campo', () => {
    const { f, el } = monta(Hospede);
    for (const ruim of ['', '   ', 'ana@', 'sem-arroba']) {
      (document.activeElement as HTMLElement | null)?.blur();
      expect(envia(el, ruim).defaultPrevented, ruim).toBe(true);
      expect(document.activeElement, ruim).toBe(el.querySelector('input'));
    }
    expect(f.componentInstance.enviados).toEqual([]);
  });

  it('enviando: botão desabilitado, formulário ocupado, e um segundo envio não é emitido', () => {
    const { f, el } = monta(Hospede, { state: 'sending' });
    expect(el.querySelector('button')!.disabled).toBe(true);
    expect(el.getAttribute('aria-busy')).toBe('true');
    envia(el, 'ana@ucam.edu.br');
    expect(f.componentInstance.enviados).toEqual([]);
  });

  it('sucesso: a mensagem entra na região de status, que já existia', () => {
    const { f, el } = monta(Hospede);
    const status = el.querySelector('.ucam-site-newsletter__status')!;
    f.componentInstance.e.set({ state: 'success', message: 'Pronto. Confira seu e-mail.' });
    f.detectChanges();
    expect(el.querySelector('.ucam-site-newsletter__status')).toBe(status);
    expect(status.textContent).toBe('Pronto. Confira seu e-mail.');
    expect(el.querySelector('input')!.hasAttribute('aria-invalid')).toBe(false);
  });

  it('erro: a mensagem vira o erro do campo, junto com a nota, e o foco vai para ele', async () => {
    const { f, el } = monta(Hospede, { note: 'Um e-mail por semana.', fieldId: 'nl' });
    (document.activeElement as HTMLElement | null)?.blur();
    f.componentInstance.e.set({ note: 'Um e-mail por semana.', fieldId: 'nl', state: 'error', message: 'Não foi possível assinar agora.' });
    f.detectChanges();
    await f.whenStable();
    const campo = el.querySelector('input')!;
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(campo.getAttribute('aria-describedby')).toBe('nl-nota nl-erro');
    expect(el.querySelector('#nl-erro')!.textContent).toBe('Não foi possível assinar agora.');
    expect(el.querySelector('.ucam-site-newsletter__status')!.textContent).toBe('');
    expect(document.activeElement).toBe(campo);
  });

  it('estado fora do contrato é tratado como parado', () => {
    const { el } = monta(Hospede, { state: 'carregando', message: 'x' });
    expect(el.querySelector('button')!.disabled).toBe(false);
    expect(el.querySelector('.ucam-site-newsletter__status')!.textContent).toBe('');
  });

  it('dois formulários na página não compartilham id', () => {
    const f = TestBed.createComponent(Dois);
    f.detectChanges();
    const ids = [...f.nativeElement.querySelectorAll('[id]')].map((e) => (e as Element).id);
    expect(ids.length).toBe(4);
    expect(new Set(ids).size).toBe(4);
  });
});
