import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamButton } from '../button/ucam-button';
import { UcamDialog } from './ucam-dialog';

@Component({
  imports: [UcamDialog, UcamButton],
  template: `
    <ucam-dialog title="Excluir setor" variant="destructive" size="sm" [(open)]="aberto" initialFocus="[data-foco]">
      <p>Excluir o setor Biblioteca? Esta ação não pode ser desfeita.</p>
      <footer>
        <ucam-button variant="secondary" data-foco>Cancelar</ucam-button>
        <ucam-button variant="primary" tone="danger">Excluir setor</ucam-button>
      </footer>
    </ucam-dialog>
  `,
})
class ComFooter {
  readonly aberto = signal(false);
}

@Component({
  imports: [UcamDialog, UcamButton],
  template: `
    <ucam-dialog title="Entregar a prova?" size="sm" [(open)]="aberto">
      <p>Depois de entregar você não poderá alterar as respostas.</p>
      <div ucamDialogAcoes>
        <ucam-button variant="primary">Entregar prova</ucam-button>
      </div>
    </ucam-dialog>
  `,
})
class ComAtributo {
  readonly aberto = signal(false);
}

// O jsdom não implementa showModal/close: o mínimo para o componente abrir.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open');
};

describe('UcamDialog — as ações e o foco inicial', () => {
  async function montar<T>(tipo: new () => T) {
    await TestBed.configureTestingModule({ imports: [tipo as never] }).compileComponents();
    const f = TestBed.createComponent(tipo as never);
    await f.whenStable();
    return f;
  }

  it('o <footer> do contrato vai para o rodapé do diálogo, não para o corpo', async () => {
    const f = await montar(ComFooter);
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.ucam-dialog__footer footer')).not.toBeNull();
    expect(el.querySelector('.ucam-dialog__body footer')).toBeNull();
    expect(el.querySelector('.ucam-dialog__body')?.textContent).toContain('Excluir o setor Biblioteca?');
  });

  it('o atributo ucamDialogAcoes continua levando as ações ao rodapé', async () => {
    const f = await montar(ComAtributo);
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.ucam-dialog__footer [ucamDialogAcoes] button')?.textContent).toContain('Entregar prova');
    expect(el.querySelector('.ucam-dialog__body [ucamDialogAcoes]')).toBeNull();
  });

  it('initialFocus num <ucam-button> foca o botão de dentro, que é quem recebe foco', async () => {
    const f = await montar(ComFooter);
    (f.componentInstance as ComFooter).aberto.set(true);
    await f.whenStable();
    const ativo = document.activeElement as HTMLElement | null;
    expect(ativo?.tagName).toBe('BUTTON');
    expect(ativo?.textContent).toContain('Cancelar');
  });
});
