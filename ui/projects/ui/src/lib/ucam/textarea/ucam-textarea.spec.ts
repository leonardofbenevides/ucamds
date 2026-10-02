import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamTextarea } from './ucam-textarea';

@Component({
  imports: [UcamTextarea],
  template: `
    <ucam-textarea label="Seu texto" [rows]="22" [maxRows]="60" />
    <ucam-textarea label="Observação" />
  `,
})
class Host {}

describe('UcamTextarea — rows é o piso da altura', () => {
  it('a área nasce com a altura das linhas pedidas, a 1,5rem por linha como o teto', async () => {
    // A base dimensiona pelo conteúdo (field-sizing) com um mínimo fixo de
    // 6rem: sem piso próprio, rows=22 nascia com quatro linhas.
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const [folha, padrao] = [...(f.nativeElement as HTMLElement).querySelectorAll('textarea')];
    expect(folha.style.minHeight).toBe('33rem');
    expect(folha.style.maxHeight).toBe('90rem');
    expect(padrao.style.minHeight).toBe('6rem');
  });
});
