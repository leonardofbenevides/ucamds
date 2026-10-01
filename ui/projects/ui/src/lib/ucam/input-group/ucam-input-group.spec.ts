import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamInputGroup } from './ucam-input-group';

@Component({
  imports: [UcamInputGroup],
  template: `
    <ucam-input-group icon="search" size="lg">
      <input type="text" />
    </ucam-input-group>
  `,
})
class Host {}

describe('UcamInputGroup — uma moldura só', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    host = (f.nativeElement as HTMLElement).querySelector('ucam-input-group')!;
  });

  it('o host não leva a classe do Trilho A, que desenharia a segunda moldura', () => {
    expect(host.classList.contains('ucam-input-group')).toBe(false);
  });

  it('quem desenha a moldura e a altura é o div de dentro', () => {
    const moldura = host.querySelector(':scope > div')!;
    expect(moldura.classList.contains('border')).toBe(true);
    expect(moldura.classList.contains('h-10')).toBe(true);
    expect(moldura.querySelector('input')).not.toBeNull();
  });
});
