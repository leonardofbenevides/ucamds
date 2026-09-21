import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { UcamAnexo, ucamTamanhoArquivo, type UcamFile } from '../anexo/ucam-anexo';
import { UcamButton } from '../button/ucam-button';
import { nextFieldIds } from '../field/ucam-field';

/**
 * Contrato: spec/components/file-field.json
 *
 * O campo de anexo: escolhe, VALIDA, mostra e remove. Quem sobe é a aplicação.
 *
 * Por que ele precisou existir em código, e não só em folha de estilo: o
 * Trilho A entrega a aparência do gatilho, da lista e da linha recusada, e diz
 * por escrito que não valida accept nem maxSize e não anuncia nada. Enquanto
 * este arquivo não existiu, a validação de arquivo não era de ninguém — o
 * contrato prometia "a linha recusada FICA" e nada no parque produzia essa
 * linha. Era o único trilho_b do catálogo apontando para um arquivo ausente.
 *
 * A regra de formato e tamanho é GERADA de accept e maxSize. Escrita à mão,
 * ela diverge do que o campo aceita no primeiro ajuste — e a pessoa fica com
 * uma tela que promete 10 MB e um campo que recusa 8.
 */
export type UcamRecusaMotivo = 'formato' | 'tamanho' | 'quantidade';

export interface UcamArquivoRecusado {
  file: File;
  motivo: UcamRecusaMotivo;
}

/**
 * MIME → nome comum. A regra fala a língua de quem anexa: "PDF ou JPG", nunca
 * "application/pdf, image/jpeg".
 */
const NOME_DO_FORMATO: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/*': 'imagem',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
};

/** "10,0 MB" vira "10 MB": o limite é número redondo e a casa decimal é ruído. */
function tamanhoRedondo(bytes: number): string {
  return ucamTamanhoArquivo(bytes).replace(',0 ', ' ');
}

/** "PDF", "PDF ou JPG", "PDF, JPG ou PNG" — conteudo.regra do contrato. */
function lista(nomes: string[], conjuncao: 'ou' | 'nem'): string {
  if (nomes.length <= 1) return nomes[0] ?? '';
  return `${nomes.slice(0, -1).join(', ')} ${conjuncao} ${nomes[nomes.length - 1]}`;
}

let seq = 0;

@Component({
  selector: 'ucam-file-field',
  exportAs: 'ucamFileField',
  imports: [UcamAnexo, UcamButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <!--
      Fieldset, não label: com multiple há mais de um controle sob um rótulo
      só, e label não nomeia grupo. O arrasto é aceito sobre o CAMPO INTEIRO —
      a área tracejada ficou fora da 0.1.0 porque não há tela no parque que a
      peça, e prop sem evidência é especulação (limites do contrato).
    -->
    <fieldset
      class="ucam-file-field"
      [attr.data-readonly]="readonly() ? '' : null"
      [attr.data-sobre-o-alvo]="sobreOAlvo() ? '' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="descrito()"
      (dragover)="arrastando($event, true)"
      (dragleave)="arrastando($event, false)"
      (drop)="soltar($event)"
    >
      <legend class="ucam-file-field__legenda">
        {{ label() }}
        @if (required()) {
          <!-- decorativo: a obrigatoriedade real está no aria-required acima -->
          <span class="ucam-file-field__marca" aria-hidden="true">*</span>
        }
      </legend>

      @if (!readonly()) {
        <!--
          O input é ENCANAMENTO, não controle: fica fora da ordem de foco e
          fora da árvore de acessibilidade, e quem responde pelo campo é o
          botão ao lado.

          O contrato pedia o input focável, e a razão escrita era "nunca
          display:none, que o tira do foco e deixa o campo inalcançável pelo
          teclado". A razão está certa e o remédio, não: com um <button> de
          verdade acionando o input, o campo JÁ é alcançável — e deixar o input
          na ordem de foco produz dois pontos de parada que fazem a mesma
          coisa, um deles invisível e com rótulo escolhido pelo navegador, em
          inglês. Isso é o controle morto que o sistema persegue em outro
          lugar. Segue oculto pelo recorte, e não por display:none, porque um
          input recortado continua respondendo a .click() em todo navegador do
          parque.
        -->
        <input
          #entrada
          class="ucam-file-field__entrada"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          [id]="ids.controlId"
          [attr.accept]="accept() || null"
          [attr.multiple]="multiple() ? '' : null"
          [disabled]="bloqueado()"
          (change)="escolhidos($event)"
        />
        <ucam-button
          class="ucam-file-field__gatilho"
          variant="secondary"
          iconStart="paperclip"
          [disabled]="bloqueado()"
          (click)="entrada.click()"
        >{{ rotuloDoGatilho() }}</ucam-button>
      }

      <!--
        A regra vem antes da lista e nunca some: quem tem um .docx precisa
        saber que o campo não o quer ANTES de tentar. O accept sozinho filtra o
        seletor do sistema em silêncio, e o arquivo apenas "some" da janela.
      -->
      @if (regra(); as r) {
        <p class="ucam-field__hint" [id]="ids.hintId">{{ r }}</p>
      }
      @if (hint(); as h) {
        <p class="ucam-field__hint" [id]="idApoio">{{ h }}</p>
      }
      @if (invalid() && errorMessage()) {
        <p class="ucam-field__error" role="alert" [id]="ids.errorId">{{ errorMessage() }}</p>
      }

      @if (files().length) {
        <!-- ul/li de verdade: a contagem que o leitor de tela anuncia é a
             resposta para "quantos eu anexei". -->
        <ul class="ucam-anexos" [attr.aria-label]="'Arquivos de ' + label()">
          @for (f of files(); track f.id) {
            <li [attr.data-recusado]="f.estado === 'recusado' ? '' : null" [attr.tabindex]="f.estado === 'recusado' ? -1 : null">
              <ucam-anexo
                [file]="f"
                [removable]="!readonly() && !disabled()"
                (remove)="remover($event)"
                (retry)="retry.emit($event)"
              />
            </li>
          }
        </ul>
      }

      <!-- Arquivo escolhido, concluído ou recusado é dito em voz (WCAG 4.1.3).
           A região é do CAMPO: o resultado pertence a ele, e não à tela. -->
      <p class="ucam-file-field__anuncio" role="status">{{ anuncio() }}</p>
    </fieldset>
  `,
  styles: `
    /* Espelho da seção file-field de tools/build-css.mjs: os dois trilhos
       desenham a mesma coisa, e a divergência entre eles é o defeito que o
       repositório mais persegue. */
    ucam-file-field .ucam-file-field {
      border: 0;
      margin: 0;
      padding: 0;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ucam-space-stack-sm);
    }
    ucam-file-field .ucam-file-field__legenda {
      padding: 0;
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      line-height: var(--ucam-typography-label-line-height);
      color: var(--ucam-color-text-primary);
    }
    ucam-file-field .ucam-file-field__marca { color: var(--ucam-color-action-primary-default); }
    ucam-file-field .ucam-file-field__entrada {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
    ucam-file-field .ucam-file-field__gatilho { align-self: start; }
    /* O contorno do arrasto é do campo inteiro, que é a área que aceita soltar. */
    ucam-file-field .ucam-file-field[data-sobre-o-alvo] {
      outline: 2px dashed var(--ucam-color-border-focus);
      outline-offset: var(--ucam-space-inset-xs);
      border-radius: var(--ucam-radius-control);
    }
    ucam-file-field .ucam-field__hint {
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }
    ucam-file-field .ucam-field__error {
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    ucam-file-field .ucam-anexos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: var(--ucam-space-inline-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    ucam-file-field .ucam-anexos > li { min-inline-size: 0; }
    ucam-file-field .ucam-anexos > li[data-recusado]:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
      border-radius: var(--ucam-radius-control);
    }
    ucam-file-field .ucam-file-field[data-readonly] .ucam-anexo__acao { display: none; }
    ucam-file-field .ucam-file-field__anuncio {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class UcamFileField {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly label = input.required<string>();
  /** Sintaxe do atributo accept: .pdf, application/pdf ou image/*. */
  readonly accept = input('');
  /** Limite POR ARQUIVO, em bytes. Validado antes de qualquer envio. */
  readonly maxSize = input<number | null>(null);
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Teto de quantidade. Atingido, o gatilho desabilita — nunca some. */
  readonly max = input<number | null>(null);
  readonly hint = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly disabledReason = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);

  readonly files = model<UcamFile[]>([]);

  readonly rejected = output<UcamArquivoRecusado[]>();
  readonly remove = output<UcamFile>();
  readonly retry = output<UcamFile>();

  protected readonly ids = nextFieldIds('ucam-ff');
  protected readonly idApoio = `ucam-ff-apoio-${++seq}`;
  protected readonly sobreOAlvo = signal(false);
  protected readonly anuncio = signal('');

  /** Só os que contam para o teto: recusado não ocupa vaga. */
  private readonly aceitos = computed(() => this.files().filter((f) => f.estado !== 'recusado'));

  protected readonly noTeto = computed(() => {
    const teto = this.max();
    return teto != null && this.aceitos().length >= teto;
  });

  protected readonly bloqueado = computed(() => this.disabled() || this.noTeto());

  protected readonly rotuloDoGatilho = computed(() =>
    this.multiple() && this.aceitos().length ? 'Anexar outro arquivo' : 'Anexar arquivo',
  );

  /** Os formatos de accept, em nome comum e maiúsculo. */
  private readonly formatos = computed(() =>
    this.accept()
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => NOME_DO_FORMATO[p.toLowerCase()] ?? p.replace(/^\./, '').toUpperCase())
      .filter((v, i, todos) => todos.indexOf(v) === i),
  );

  /**
   * A REGRA, gerada. Sem accept, fala só do tamanho; sem os dois, não aparece.
   * Bloqueado, o lugar dela é do motivo: botão cinza sem explicação é a tela
   * inteira do Processar Acordo do SIGFIN.
   */
  protected readonly regra = computed(() => {
    if (this.disabled() && this.disabledReason()) return this.disabledReason();
    if (this.noTeto()) return `Limite de ${this.max()} arquivos atingido. Remova um para anexar outro.`;
    const formatos = this.formatos();
    const limite = this.maxSize();
    if (!formatos.length && limite == null) return null;
    const oQue = formatos.length ? lista(formatos, 'ou') : 'Arquivo';
    return limite == null ? `${oQue}.` : `${oQue} de até ${tamanhoRedondo(limite)}.`;
  });

  protected readonly descrito = computed(() => {
    const ids = [
      this.invalid() && this.errorMessage() ? this.ids.errorId : null,
      this.regra() ? this.ids.hintId : null,
      this.hint() ? this.idApoio : null,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  // --- escolha ---------------------------------------------------------------

  protected escolhidos(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.receber(Array.from(entrada.files ?? []), 'escolha');
    // Zerar permite escolher DE NOVO o mesmo arquivo depois de removê-lo: sem
    // isso o change não dispara e o campo parece quebrado.
    entrada.value = '';
  }

  protected arrastando(evento: DragEvent, dentro: boolean): void {
    if (this.readonly() || this.bloqueado()) return;
    evento.preventDefault();
    // dragleave também dispara ao passar de um filho para outro dentro do
    // campo. Sem esta conferência o contorno pisca durante o arrasto.
    if (!dentro) {
      const indo = evento.relatedTarget as Node | null;
      if (indo && (evento.currentTarget as HTMLElement).contains(indo)) return;
    }
    this.sobreOAlvo.set(dentro);
  }

  protected soltar(evento: DragEvent): void {
    if (this.readonly() || this.bloqueado()) return;
    evento.preventDefault();
    this.sobreOAlvo.set(false);
    this.receber(Array.from(evento.dataTransfer?.files ?? []), 'arrasto');
  }

  /**
   * A porta única: tudo que entra no campo passa por aqui, venha do seletor ou
   * do arrasto. O accept NÃO filtra arquivo arrastado — validar só na escolha
   * deixaria o arrasto sendo a porta dos fundos do formato.
   */
  private receber(arquivos: File[], origem: 'escolha' | 'arrasto'): void {
    if (!arquivos.length) return;

    const atuais = this.files();
    const teto = this.max();
    let vagas = teto == null ? Infinity : teto - this.aceitos().length;
    if (!this.multiple()) vagas = Math.min(vagas, 1);

    const novos: UcamFile[] = [];
    const recusados: UcamArquivoRecusado[] = [];
    const frases: string[] = [];
    let entraram = 0;

    for (const file of arquivos) {
      const motivo = this.motivoDaRecusa(file, vagas - entraram);
      const base = {
        id: `${Date.now().toString(36)}-${++seq}`,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type || null,
      };
      if (motivo) {
        recusados.push({ file, motivo });
        novos.push({ ...base, estado: 'recusado', mensagem: this.mensagemDaRecusa(file, motivo) });
        frases.push(`${file.name} ${this.mensagemDaRecusa(file, motivo)}.`);
      } else {
        entraram++;
        novos.push({ ...base, estado: 'pendente' });
      }
    }

    // Sem multiple, o arquivo novo SUBSTITUI o anterior: o campo é de um
    // documento só, e duas linhas ali seriam erro operacional.
    const mantidos = this.multiple() ? atuais : entraram ? [] : atuais.filter((f) => f.estado !== 'recusado');
    this.files.set([...mantidos, ...novos]);

    if (entraram) frases.unshift(entraram === 1 ? `${novos.find((f) => f.estado === 'pendente')!.nome} anexado.` : `${entraram} arquivos anexados.`);
    this.anunciar(frases.join(' '));

    if (recusados.length) {
      this.rejected.emit(recusados);
      // Foco na linha recusada só quando a recusa veio do teclado: no arrasto,
      // mover o foco é roubar o ponteiro no meio do gesto.
      if (origem === 'escolha') queueMicrotask(() => this.focarRecusado());
    }
  }

  private motivoDaRecusa(file: File, vagas: number): UcamRecusaMotivo | null {
    if (vagas <= 0) return 'quantidade';
    const limite = this.maxSize();
    if (limite != null && file.size > limite) return 'tamanho';
    if (!this.aceitaFormato(file)) return 'formato';
    return null;
  }

  /** Extensão, MIME exato ou família (image/*) — as três sintaxes do accept. */
  private aceitaFormato(file: File): boolean {
    const regras = this.accept().split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (!regras.length) return true;
    const nome = file.name.toLowerCase();
    const tipo = (file.type || '').toLowerCase();
    return regras.some((r) => {
      if (r.startsWith('.')) return nome.endsWith(r);
      if (r.endsWith('/*')) return tipo.startsWith(r.slice(0, -1));
      return tipo === r;
    });
  }

  /**
   * O motivo fica ao lado do nome, na própria linha — por isso não repete o
   * nome. Diz o número que a pessoa precisa: "tem 14,2 MB — o limite é 10 MB",
   * nunca "Arquivo inválido".
   */
  private mensagemDaRecusa(file: File, motivo: UcamRecusaMotivo): string {
    if (motivo === 'tamanho') {
      return `tem ${ucamTamanhoArquivo(file.size)} — o limite é ${tamanhoRedondo(this.maxSize()!)}`;
    }
    if (motivo === 'quantidade') return `não entrou: o limite é de ${this.max()} arquivos`;
    return `não é ${lista(this.formatos(), 'nem')}`;
  }

  private focarRecusado(): void {
    const li = this.host.nativeElement.querySelector<HTMLElement>('li[data-recusado]');
    li?.focus();
  }

  /** Esvazia antes: a mesma frase repetida sem limpar não é anunciada. */
  private anunciar(frase: string): void {
    if (!frase) return;
    this.anuncio.set('');
    setTimeout(() => this.anuncio.set(frase), 60);
  }

  // --- remoção ---------------------------------------------------------------

  protected remover(file: UcamFile): void {
    const lista = this.files();
    const i = lista.findIndex((f) => f.id === file.id);
    this.files.set(lista.filter((f) => f.id !== file.id));
    this.remove.emit(file);
    this.anunciar(`${file.nome} removido.`);
    // O foco vai para a linha seguinte, ou ao gatilho quando a lista esvazia —
    // nunca ao topo da página (contrato, teclado).
    queueMicrotask(() => {
      const itens = this.host.nativeElement.querySelectorAll<HTMLElement>('.ucam-anexos > li button');
      const proximo = itens[Math.min(i, itens.length - 1)];
      if (proximo) return proximo.focus();
      this.host.nativeElement.querySelector<HTMLElement>('.ucam-file-field__gatilho button')?.focus();
    });
  }
}
