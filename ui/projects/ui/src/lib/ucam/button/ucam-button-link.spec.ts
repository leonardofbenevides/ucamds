import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamButton } from './ucam-button';

/* Com href o botão é link (17/11/2026): Cancelar e "Nova natureza" navegam. */
@Component({
  imports: [UcamButton],
  template: `<ucam-button variant="ghost" href="/naturezas" [disabled]="off()">Cancelar</ucam-button>`,
})
class Host {
  readonly off = signal(false);
}

describe('UcamButton — href', () => {
  it('desenha <a> com o href e sem type', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const a = (f.nativeElement as HTMLElement).querySelector('a');
    expect(a?.getAttribute('href')).toBe('/naturezas');
    expect(a?.hasAttribute('type')).toBe(false);
    expect((f.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('indisponível, perde o href e diz aria-disabled — link não tem disabled', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.componentInstance.off.set(true);
    await f.whenStable();
    const a = (f.nativeElement as HTMLElement).querySelector('a')!;
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-disabled')).toBe('true');
    expect(a.hasAttribute('disabled')).toBe(false);
  });
});
