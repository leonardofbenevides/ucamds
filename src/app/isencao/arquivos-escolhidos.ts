import { Directive, ElementRef, inject, output } from '@angular/core';

/**
 * Entrega à tela os arquivos de verdade que a pessoa escolheu ou soltou num
 * `<ucam-file-field>`. O campo do DS valida e mostra o anexo, mas o modelo
 * dele (`files`) só carrega nome e tamanho — o `File`, que é o que se envia,
 * não sai de lá. Esta diretiva ouve os mesmos eventos por fora.
 *
 * Escuta em CAPTURA: o campo zera o `<input type="file">` no próprio
 * tratador, e quem chega depois encontra a lista vazia.
 */
@Directive({ selector: '[appArquivosEscolhidos]' })
export class ArquivosEscolhidos {
  readonly appArquivosEscolhidos = output<File[]>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    el.addEventListener(
      'change',
      (e) => {
        const alvo = e.target;
        if (alvo instanceof HTMLInputElement && alvo.type === 'file') this.appArquivosEscolhidos.emit(Array.from(alvo.files ?? []));
      },
      true,
    );
    el.addEventListener('drop', (e) => this.appArquivosEscolhidos.emit(Array.from(e.dataTransfer?.files ?? [])), true);
  }
}
