import { TestBed } from '@angular/core/testing';
import { SemLinkPage } from './sem-link';

it('explica como chegar à prova', async () => {
  await TestBed.configureTestingModule({ imports: [SemLinkPage] }).compileComponents();
  const f = TestBed.createComponent(SemLinkPage);
  await f.whenStable();
  expect(f.nativeElement.textContent).toContain('link');
  expect(f.nativeElement.textContent).toContain('secretaria');
});
