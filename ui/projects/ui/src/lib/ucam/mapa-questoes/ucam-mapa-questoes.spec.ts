import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamMapaQuestoes, type UcamMapaItem } from './ucam-mapa-questoes';

@Component({
  imports: [UcamMapaQuestoes],
  template: `<ucam-mapa-questoes [itens]="itens()" [atual]="atual()" [colunas]="4" (ir)="foi = $event" />`,
})
class Host {
  readonly itens = signal<UcamMapaItem[]>([
    { numero: 1, estado: 'respondida', grupo: 'Português' },
    { numero: 2, estado: 'respondida', revisar: true, grupo: 'Português' },
    { numero: 3, estado: 'em-branco', grupo: 'Matemática' },
    { numero: 4, estado: 'em-branco', revisar: true, grupo: 'Matemática' },
    { numero: 5, estado: 'em-branco', rotulo: 'Redação', grupo: 'Matemática' },
  ]);
  readonly atual = signal(3);
  foi: number | null = null;
}

describe('UcamMapaQuestoes (mapa-questoes.json)', () => {
  async function montar() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    return { f, el: f.nativeElement as HTMLElement };
  }

  it('é uma navegação com nome, uma grade por caderno e a legenda obrigatória', async () => {
    const { el } = await montar();
    const nav = el.querySelector('nav.ucam-mapa')!;
    expect(nav.getAttribute('aria-label')).toBe('Questões da prova');
    expect([...el.querySelectorAll('.ucam-mapa__grupo')].map((g) => g.textContent?.trim())).toEqual(['Português', 'Matemática']);
    expect(el.querySelectorAll('ol.ucam-mapa__grade').length).toBe(2);
    expect(el.querySelectorAll('.ucam-mapa__legenda li').length).toBe(3);
    expect((nav as HTMLElement).style.getPropertyValue('--ucam-mapa-colunas')).toBe('4');
  });

  it('cada bolha diz número, estado, marca e posição por extenso — nunca só cor', async () => {
    const { el } = await montar();
    const b = [...el.querySelectorAll<HTMLButtonElement>('button.ucam-mapa__item')];
    expect(b.map((x) => x.getAttribute('aria-label'))).toEqual([
      'Questão 1, respondida',
      'Questão 2, respondida, marcada para revisar',
      'Questão 3, em branco, atual',
      'Questão 4, em branco, marcada para revisar',
      'Redação, em branco',
    ]);
    expect(b[0].getAttribute('data-estado')).toBe('respondida');
    expect(b[2].hasAttribute('data-estado')).toBe(false);
    expect(b[1].hasAttribute('data-revisar')).toBe(true);
    expect(b[2].getAttribute('aria-current')).toBe('true');
    expect(b.filter((x) => x.hasAttribute('aria-current')).length).toBe(1);
    expect(b[4].classList.contains('ucam-mapa__item--largo')).toBe(true);
  });

  it('clicar emite ir com o número da questão', async () => {
    const { f, el } = await montar();
    el.querySelectorAll<HTMLButtonElement>('button.ucam-mapa__item')[3].click();
    expect(f.componentInstance.foi).toBe(4);
  });
});
