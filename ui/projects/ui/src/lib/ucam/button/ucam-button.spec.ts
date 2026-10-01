import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamButton } from './ucam-button';
import { UcamIconButton } from '../icon-button/ucam-icon-button';

@Component({
  imports: [UcamButton, UcamIconButton],
  template: `
    <ucam-button [disabled]="true">Salvar</ucam-button>
    <ucam-button [loading]="true">Enviar</ucam-button>
    <ucam-icon-button icon="x" label="Fechar" [disabled]="true" />
    <ucam-icon-button icon="x" label="Fechar" [loading]="true" />
  `,
})
class Host {}

describe('UcamButton e UcamIconButton — estados no primeiro render (ADR-042)', () => {
  let botoes: HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    botoes = [...(f.nativeElement as HTMLElement).querySelectorAll('button')];
  });

  it('desabilitado leva o atributo disabled já no primeiro render', () => {
    expect(botoes[0].hasAttribute('disabled')).toBe(true);
    expect(botoes[2].hasAttribute('disabled')).toBe(true);
  });

  it('carregando leva aria-disabled e aria-busy, nunca disabled', () => {
    for (const b of [botoes[1], botoes[3]]) {
      expect(b.getAttribute('aria-disabled')).toBe('true');
      expect(b.getAttribute('aria-busy')).toBe('true');
      expect(b.hasAttribute('disabled')).toBe(false);
    }
  });
});
