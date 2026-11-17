import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamPageHeader } from './ucam-page-header';

/* A meta da barra (17/11/2026): o fato curto ao lado do título, que 80 telas
   de referência têm e o Trilho B não desenhava. */
@Component({
  imports: [UcamPageHeader],
  template: `<ucam-page-header variante="barra" title="Nova natureza" [meta]="meta()" />`,
})
class Host {
  readonly meta = signal<string | null>('12 naturezas cadastradas');
}

async function montar() {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  return f;
}

describe('UcamPageHeader — meta da barra', () => {
  it('desenha a meta ao lado do título, fora do h1', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    const meta = el.querySelector('.ucam-viewbar__meta');
    expect(meta?.textContent?.trim()).toBe('12 naturezas cadastradas');
    expect(el.querySelector('h1')?.contains(meta!)).toBe(false);
  });

  it('sem meta, não sobra separador nem caixa vazia', async () => {
    const f = await montar();
    f.componentInstance.meta.set(null);
    await f.whenStable();
    expect((f.nativeElement as HTMLElement).querySelector('.ucam-viewbar__meta')).toBeNull();
  });
});
