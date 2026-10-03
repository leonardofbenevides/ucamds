import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { UcamFile } from '../anexo/ucam-anexo';
import { UcamFileField } from './ucam-file-field';

@Component({
  imports: [UcamFileField],
  template: `<ucam-file-field label="Comprovante" accept=".pdf" [(files)]="files" />`,
})
class Host {
  readonly files = signal<UcamFile[]>([]);
}

/** Simula a escolha no seletor do sistema: o input oculto recebe os arquivos e dispara change. */
function escolher(input: HTMLInputElement, ...arquivos: File[]): void {
  Object.defineProperty(input, 'files', { value: arquivos, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('UcamFileField — o File escolhido chega ao modelo', () => {
  let host: Host;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    host = f.componentInstance;
    input = (f.nativeElement as HTMLElement).querySelector('input[type=file]')!;
  });

  it('a linha aceita carrega o File, que é o que a aplicação envia', () => {
    const pdf = new File(['%PDF'], 'historico.pdf', { type: 'application/pdf' });
    escolher(input, pdf);
    expect(host.files().length).toBe(1);
    expect(host.files()[0].estado).toBe('pendente');
    expect(host.files()[0].file).toBe(pdf);
  });

  it('a linha recusada também carrega o File, para quem quiser registrar a recusa', () => {
    const doc = new File(['x'], 'ementa.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    escolher(input, doc);
    expect(host.files()[0].estado).toBe('recusado');
    expect(host.files()[0].file).toBe(doc);
  });
});
