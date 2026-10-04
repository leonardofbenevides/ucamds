import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UcamDateField } from './ucam-date-field';

/**
 * O calendário do DS no Trilho B (29/09/2026). O mesmo comportamento do
 * dataScript do Trilho A: o clique no campo abre, Tab não abre, o dia
 * escolhido vira dd/mm/aaaa no campo e ISO no modelo, Esc devolve o foco,
 * e dia fora de min/max não se escolhe.
 */
@Component({
  imports: [UcamDateField],
  template: `<ucam-date-field label="Vencimento" [(value)]="valor" [min]="min()" [max]="max()" />`,
})
class Hospedeiro {
  readonly valor = signal('2026-03-10');
  readonly min = signal<string | null>(null);
  readonly max = signal<string | null>(null);
}

describe('UcamDateField — calendário do DS', () => {
  async function monta() {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();
    const fx = TestBed.createComponent(Hospedeiro);
    fx.detectChanges();
    await fx.whenStable();
    const el: HTMLElement = fx.nativeElement;
    const campo = el.querySelector('input[aria-haspopup="dialog"]') as HTMLInputElement;
    return { fx, el, campo };
  }
  const calendario = (el: HTMLElement) => el.querySelector('.ucam-calendario');

  it('tem o ícone dentro do campo e não abre no foco', async () => {
    const { fx, el, campo } = await monta();
    expect(el.querySelector('.ucam-date-field__icone')).toBeTruthy();
    expect(campo).toBeTruthy();
    campo.focus();
    fx.detectChanges();
    expect(calendario(el)).toBeNull();
  });

  it('abre no clique, no mês do valor, e escolher um dia preenche o campo e o modelo', async () => {
    const { fx, el, campo } = await monta();
    campo.click();
    fx.detectChanges();
    const cal = calendario(el)!;
    expect(cal).toBeTruthy();
    expect(cal.getAttribute('role')).toBe('dialog');
    expect(campo.getAttribute('aria-expanded')).toBe('true');
    expect(cal.querySelector('.ucam-calendario__mes')!.textContent!.toLowerCase()).toContain('março');
    const dias = [...cal.querySelectorAll<HTMLButtonElement>('.ucam-calendario__dia')];
    expect(dias.length).toBe(31);
    expect(dias.find((d) => d.getAttribute('aria-pressed') === 'true')!.textContent!.trim()).toBe('10');
    dias.find((d) => d.textContent!.trim() === '15')!.click();
    fx.detectChanges();
    await fx.whenStable();
    expect(campo.value).toBe('15/03/2026');
    expect(fx.componentInstance.valor()).toBe('2026-03-15');
    expect(calendario(el)).toBeNull();
  });

  it('Esc fecha e devolve o foco ao campo', async () => {
    const { fx, el, campo } = await monta();
    campo.click();
    fx.detectChanges();
    const dia = calendario(el)!.querySelector<HTMLButtonElement>('.ucam-calendario__dia[tabindex="0"]')!;
    dia.focus();
    dia.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fx.detectChanges();
    expect(calendario(el)).toBeNull();
    expect(document.activeElement).toBe(campo);
  });

  it('dia fora de min/max fica indisponível e não é escolhido', async () => {
    const { fx, el, campo } = await monta();
    fx.componentInstance.min.set('2026-03-05');
    fx.componentInstance.max.set('2026-03-20');
    fx.detectChanges();
    campo.click();
    fx.detectChanges();
    const dias = [...calendario(el)!.querySelectorAll<HTMLButtonElement>('.ucam-calendario__dia')];
    const d2 = dias.find((d) => d.textContent!.trim() === '2')!;
    expect(d2.getAttribute('aria-disabled')).toBe('true');
    d2.click();
    fx.detectChanges();
    expect(fx.componentInstance.valor()).toBe('2026-03-10');
  });
});
