import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';
import { UcamIconButton } from '../icon-button/ucam-icon-button';

/**
 * Contrato: spec/components/anexo.json
 *
 * O arquivo como peça, a mesma dos dois lados do envio: no File Field é o que
 * foi escolhido, no detalhe do requerimento é o que chegou. O esquema do
 * arquivo é o UcamFile do contrato file-field, e vive aqui porque é o Anexo
 * que o desenha — o campo só monta a lista.
 *
 * Com url o nome vira link com download, esticado sobre o tile. Sem url e sem
 * removable, o nome é texto: o componente não inventa como baixar um arquivo
 * que está atrás do login — quem sabe é a aplicação, que passa a url assinada.
 */
export type UcamFileEstado = 'pendente' | 'enviando' | 'enviado' | 'erro' | 'recusado';

export interface UcamFile {
  id: string;
  nome: string;
  tamanho?: number | null;
  tipo?: string | null;
  estado: UcamFileEstado;
  progresso?: number | null;
  mensagem?: string | null;
  url?: string | null;
}

const IMAGEM = /^(jpe?g|png|gif|webp)$/i;
const DOCUMENTO = /^(pdf|docx?|odt|txt|rtf)$/i;

/** Tamanho em pt-BR com uma casa, piso de 1 KB — conteudo.tamanho do file-field. */
export function ucamTamanhoArquivo(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

let seq = 0;

@Component({
  selector: 'ucam-anexo',
  exportAs: 'ucamAnexo',
  imports: [UcamIcon, UcamIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()">
      <span class="ucam-anexo__figura" aria-hidden="true">
        <ucam-icon [name]="figura()" size="md" />
      </span>
      <span class="ucam-anexo__corpo">
        @if (file().url && !removable()) {
          <a class="ucam-anexo__nome" [href]="file().url" [attr.download]="file().nome" [title]="file().nome" [attr.aria-describedby]="apoioId">{{ file().nome }}</a>
        } @else {
          <span class="ucam-anexo__nome" [title]="file().nome">{{ file().nome }}</span>
        }
        <span class="ucam-anexo__apoio" [id]="apoioId">{{ apoio() }}</span>
        @if (file().estado === 'enviando' && file().progresso != null) {
          <span class="ucam-anexo__progresso" role="progressbar" aria-valuemin="0" aria-valuemax="100"
            [attr.aria-valuenow]="file().progresso" [attr.aria-label]="'Envio de ' + file().nome">
            <span [style.inline-size.%]="file().progresso"></span>
          </span>
        }
      </span>
      @if (file().estado === 'erro') {
        <ucam-icon-button class="ucam-anexo__acao" icon="refreshCw" size="sm" [label]="'Tentar de novo ' + file().nome" (click)="retry.emit(file())" />
      } @else if (removable()) {
        <ucam-icon-button class="ucam-anexo__acao" icon="x" size="sm" [label]="'Remover anexo ' + file().nome" (click)="remove.emit(file())" />
      } @else if (file().url) {
        <ucam-icon class="ucam-anexo__indicio" name="download" size="sm" aria-hidden="true" />
      }
    </span>
  `,
  styles: `
    /* Espelho da seção anexo de tools/build-css.mjs. O tile é o span interno
       e não o host, que é display:contents — assim o <li> do consumidor
       continua sendo o item da grade, e a ul/li de verdade que o contrato
       pede fica na mão de quem monta a lista. */
    ucam-anexo .ucam-anexo {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      min-inline-size: 0;
      padding: var(--ucam-space-inset-sm);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-default);
      transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
    }
    ucam-anexo .ucam-anexo__figura {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-sunken);
      color: var(--ucam-color-text-secondary);
    }
    ucam-anexo .ucam-anexo__corpo {
      flex: 1 1 auto;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    ucam-anexo .ucam-anexo__nome,
    ucam-anexo .ucam-anexo__apoio {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ucam-anexo .ucam-anexo__nome {
      font-size: var(--ucam-typography-body-sm-font-size);
      /* Declarada, não herdada: ver o mesmo comentário no Trilho A. */
      line-height: var(--ucam-typography-body-sm-line-height);
      color: var(--ucam-color-text-primary);
      text-decoration: none;
    }
    ucam-anexo a.ucam-anexo__nome::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--ucam-radius-control);
    }
    ucam-anexo .ucam-anexo:has(a.ucam-anexo__nome:hover) {
      border-color: var(--ucam-color-border-default);
    }
    ucam-anexo .ucam-anexo:has(a.ucam-anexo__nome:focus-visible) {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    ucam-anexo a.ucam-anexo__nome:focus-visible { outline: none; }
    ucam-anexo .ucam-anexo__apoio {
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }
    ucam-anexo .ucam-anexo__acao { position: relative; z-index: 1; flex: none; }
    ucam-anexo .ucam-anexo__indicio { flex: none; color: var(--ucam-color-text-secondary); }
    ucam-anexo .ucam-anexo__progresso {
      inline-size: 100%;
      block-size: 3px;
      margin-block-start: 0.25rem;
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-border-subtle);
      overflow: hidden;
    }
    ucam-anexo .ucam-anexo__progresso > span {
      display: block;
      block-size: 100%;
      background: var(--ucam-color-action-primary-default);
    }
    ucam-anexo .ucam-anexo--recusado,
    ucam-anexo .ucam-anexo--erro { border-color: var(--ucam-color-feedback-danger-border); }
    ucam-anexo .ucam-anexo--recusado .ucam-anexo__figura,
    ucam-anexo .ucam-anexo--erro .ucam-anexo__figura {
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    ucam-anexo .ucam-anexo--recusado .ucam-anexo__apoio,
    ucam-anexo .ucam-anexo--erro .ucam-anexo__apoio {
      color: var(--ucam-color-feedback-danger-foreground);
      white-space: normal;
    }
  `,
})
export class UcamAnexo {
  readonly file = input.required<UcamFile>();
  /** Mostra remover. O File Field liga; a leitura nunca liga. */
  readonly removable = input(false, { transform: booleanAttribute });

  readonly remove = output<UcamFile>();
  readonly retry = output<UcamFile>();

  protected readonly apoioId = `ucam-anexo-${++seq}`;

  private readonly ext = computed(() => {
    const partes = this.file().nome.split('.');
    return partes.length > 1 ? partes.pop()!.toUpperCase() : '';
  });

  private readonly falhou = computed(() => this.file().estado === 'erro' || this.file().estado === 'recusado');

  protected readonly figura = computed<UcamIconName>(() => {
    if (this.falhou()) return 'circleAlert';
    if (IMAGEM.test(this.ext())) return 'image';
    if (DOCUMENTO.test(this.ext())) return 'fileText';
    return 'file';
  });

  /** Formato · tamanho · estado; na falha, só o motivo — conteudo.apoio. */
  protected readonly apoio = computed(() => {
    const f = this.file();
    if (this.falhou()) return f.mensagem ?? '';
    const partes = [this.ext(), f.tamanho != null ? ucamTamanhoArquivo(f.tamanho) : ''];
    if (f.estado === 'enviando') partes.push(f.progresso != null ? `enviando ${f.progresso}%` : 'enviando');
    if (f.estado === 'enviado' && this.removable()) partes.push('anexado');
    return partes.filter(Boolean).join(' · ');
  });

  protected readonly classes = computed(() => {
    const e = this.file().estado;
    return ['ucam-anexo', e === 'recusado' ? 'ucam-anexo--recusado' : '', e === 'erro' ? 'ucam-anexo--erro' : '']
      .filter(Boolean)
      .join(' ');
  });
}
