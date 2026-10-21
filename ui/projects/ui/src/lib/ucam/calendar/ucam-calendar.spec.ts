import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UcamCalendar } from './ucam-calendar';
import { montarMes, passoCal, type UcamCalendarEvent, type UcamDateRange } from './ucam-calendar-grade';

/**
 * A grade do mês é UMA (ADR-074): o DateField e o Calendar montam por
 * montarMes. Estes testes protegem o que os dois herdam — e a regra do
 * período em dois toques, que só o Calendar tem.
 */
describe('montarMes — a grade compartilhada', () => {
  const outubro = new Date(2026, 9, 1);

  it('começa no domingo, com vazio antes do dia 1', () => {
    const semanas = montarMes(outubro);
    // 01/10/2026 é quinta: quatro vazios antes.
    expect(semanas[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(semanas[0][4]?.iso).toBe('2026-10-01');
    expect(semanas.flat().filter(Boolean).length).toBe(31);
  });

  it('marca as pontas do período como escolhidas e o miolo como no período', () => {
    const dias = montarMes(outubro, { periodo: { start: '2026-10-19', end: '2026-10-23' } }).flat();
    const d = (iso: string) => dias.find((x) => x?.iso === iso)!;
    expect(d('2026-10-19').escolhido).toBe(true);
    expect(d('2026-10-23').escolhido).toBe(true);
    expect(['20', '21', '22'].every((n) => d(`2026-10-${n}`).noPeriodo)).toBe(true);
    expect(d('2026-10-21').rotulo).toContain('no período');
    expect(d('2026-10-24').noPeriodo).toBe(false);
  });

  it('bloqueia o que está fora de min/max', () => {
    const dias = montarMes(outubro, { min: '2026-10-05', max: '2026-10-25' }).flat().filter(Boolean);
    expect(dias.filter((x) => x!.fora).map((x) => x!.dia)).toEqual([1, 2, 3, 4, 26, 27, 28, 29, 30, 31]);
  });

  it('diz no nome do dia quantos eventos e quais', () => {
    const eventos: Record<string, UcamCalendarEvent[]> = {
      '2026-10-21': [
        { date: '2026-10-21', title: 'Prova de Estatística I', tone: 'danger' },
        { date: '2026-10-21', title: 'Entrega do projeto', tone: 'warning' },
      ],
    };
    const d = montarMes(outubro, { eventos }).flat().find((x) => x?.iso === '2026-10-21')!;
    expect(d.rotulo).toBe('21 de outubro de 2026, quarta, 2 eventos: Prova de Estatística I, Entrega do projeto');
  });

  it('PageDown em 31/01 para no último dia de fevereiro', () => {
    const d = passoCal(new Date(2026, 0, 31), 0, 1);
    expect([d.getMonth(), d.getDate()]).toEqual([1, 28]);
  });
});

@Component({
  imports: [UcamCalendar],
  template: `<ucam-calendar label="Semana de provas" selection="range" month="2026-10" [(range)]="periodo" />`,
})
class Hospedeiro {
  readonly periodo = signal<UcamDateRange | null>(null);
}

describe('UcamCalendar — período em dois toques', () => {
  it('primeiro toque abre, segundo fecha, terceiro recomeça; antes do início vira o novo início', async () => {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();
    const fx = TestBed.createComponent(Hospedeiro);
    fx.detectChanges();
    await fx.whenStable();
    const el: HTMLElement = fx.nativeElement;
    const toca = async (iso: string) => {
      (el.querySelector(`[data-dia="${iso}"]`) as HTMLButtonElement).click();
      fx.detectChanges();
      await fx.whenStable();
    };

    await toca('2026-10-19');
    expect(fx.componentInstance.periodo()).toEqual({ start: '2026-10-19', end: null });
    await toca('2026-10-12');
    expect(fx.componentInstance.periodo()).toEqual({ start: '2026-10-12', end: null });
    await toca('2026-10-16');
    expect(fx.componentInstance.periodo()).toEqual({ start: '2026-10-12', end: '2026-10-16' });
    expect(el.querySelectorAll('[data-intervalo]').length).toBe(3);
    await toca('2026-10-20');
    expect(fx.componentInstance.periodo()).toEqual({ start: '2026-10-20', end: null });
  });
});

@Component({
  imports: [UcamCalendar],
  template: `
    <ucam-calendar id="dia" label="Nascimento" [(value)]="nascimento" />
    <ucam-calendar id="sem" label="Semestre de ingresso" precision="semester" [(value)]="semestre" />
  `,
})
class Niveis {
  readonly nascimento = signal<string | null>('2026-10-21');
  readonly semestre = signal<string | null>(null);
}

describe('UcamCalendar — tipos e níveis (ADR-077)', () => {
  async function monta() {
    await TestBed.configureTestingModule({ imports: [Niveis] }).compileComponents();
    const fx = TestBed.createComponent(Niveis);
    fx.detectChanges();
    await fx.whenStable();
    const el: HTMLElement = fx.nativeElement;
    const clica = async (alvo: Element | null) => {
      (alvo as HTMLElement).click();
      fx.detectChanges();
      await fx.whenStable();
    };
    return { fx, el, clica };
  }

  it('o título sobe para meses e anos, e escolher desce de volta aos dias', async () => {
    const { fx, el, clica } = await monta();
    const cal = el.querySelector('#dia')!;
    await clica(cal.querySelector('.ucam-calendario__titulo'));
    expect(cal.querySelectorAll('[data-chave]').length).toBe(12);
    expect(cal.querySelector('.ucam-calendario__mes')!.textContent!.trim()).toBe('2026');
    await clica(cal.querySelector('.ucam-calendario__titulo'));
    expect(cal.querySelector('.ucam-calendario__mes')!.textContent!.trim()).toBe('2016 – 2027');
    // "Anos anteriores" de página em página até 1968–1979.
    while (!cal.querySelector('[data-chave="1974"]')) await clica(cal.querySelectorAll('ucam-icon-button button')[0]);
    await clica(cal.querySelector('[data-chave="1974"]'));
    expect(cal.querySelector('.ucam-calendario__mes')!.textContent!.trim()).toBe('1974');
    await clica(cal.querySelector('[data-chave="1974-03"]'));
    expect(cal.querySelector('.ucam-calendario__mes')!.textContent!.toLowerCase()).toContain('março de 1974');
    await clica(cal.querySelector('[data-dia="1974-03-14"]'));
    expect(fx.componentInstance.nascimento()).toBe('1974-03-14');
  });

  it('escolhe semestre na notação aaaa.s', async () => {
    const { fx, el, clica } = await monta();
    const cal = el.querySelector('#sem')!;
    const opcoes = [...cal.querySelectorAll('[data-chave]')].map((b) => b.getAttribute('data-chave'));
    expect(opcoes).toEqual([`${new Date().getFullYear()}.1`, `${new Date().getFullYear()}.2`]);
    await clica(cal.querySelector('[data-chave$=".2"]'));
    expect(fx.componentInstance.semestre()).toBe(`${new Date().getFullYear()}.2`);
    expect(cal.querySelector('[data-chave$=".2"]')!.getAttribute('aria-pressed')).toBe('true');
  });
});
