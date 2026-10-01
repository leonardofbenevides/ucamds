import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamDialog } from '@ucam/ui';
import { ProvaApi } from '../../core/api/prova.api';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Posicao, ProvaStore } from '../../core/store/prova.store';
import { environment } from '../../../environments/environment';

/**
 * Confirmação da entrega. Nomeia o que fica em branco e oferece revisar;
 * com o tempo esgotado entrega sozinho e diz isso. Nunca entrega com
 * resposta pendente de envio.
 */
@Component({
  selector: 'app-entrega-dialog',
  imports: [UcamAlert, UcamButton, UcamDialog],
  template: `
    <ucam-dialog
      [title]="titulo()"
      variant="confirm"
      size="sm"
      [open]="aberto()"
      (openChange)="!$event && fechar.emit()"
      [dismissible]="modo() === 'manual' && !entregando()"
      [loading]="entregando()"
      initialFocus="[data-foco]"
    >
      <div class="ucam-stack">
        @if (modo() === 'tempo') {
          <p>O tempo acabou. Estamos entregando sua prova com as respostas que você já deu.</p>
        } @else {
          <p>Depois de entregar você não poderá alterar as respostas.</p>
          @if (emBranco().length) {
            <p>
              <strong>{{ emBranco().length }} {{ emBranco().length === 1 ? 'questão está' : 'questões estão' }} em branco:</strong>
              {{ nomes() }}.
            </p>
          }
          @if (!store.redacaoAtingeMinimo()) {
            <ucam-alert tone="warning">A redação ainda não tem o mínimo de {{ minimo }} caracteres.</ucam-alert>
          }
        }
        @if (erro()) {
          <ucam-alert tone="danger" live="assertive">{{ erro() }}</ucam-alert>
        }
      </div>
      <footer class="ucam-cluster ucam-cluster--fim">
        @if (modo() === 'manual') {
          <ucam-button variant="secondary" data-foco (click)="revisarAgora()">Revisar</ucam-button>
          <ucam-button
            variant="primary"
            iconStart="send"
            [loading]="entregando()"
            [disabled]="!store.redacaoAtingeMinimo()"
            (click)="entregar()"
          >
            Entregar prova
          </ucam-button>
        } @else if (erro()) {
          <ucam-button variant="primary" data-foco [loading]="entregando()" (click)="entregar()">Tentar de novo</ucam-button>
        }
      </footer>
    </ucam-dialog>
  `,
})
export class EntregaDialog {
  readonly modo = input.required<'manual' | 'tempo' | null>();
  readonly fechar = output<void>();
  readonly revisar = output<Posicao>();
  readonly entregue = output<void>();

  readonly store = inject(ProvaStore);
  private readonly fila = inject(FilaRespostas);
  private readonly api = inject(ProvaApi);
  private readonly candidato = inject(CandidatoStore);

  readonly minimo = environment.redacaoMin;
  readonly entregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aberto = computed(() => this.modo() !== null);
  readonly titulo = computed(() => (this.modo() === 'tempo' ? 'Tempo esgotado' : 'Entregar a prova?'));
  readonly emBranco = computed(() => this.store.emBranco());
  readonly nomes = computed(
    () =>
      this.emBranco()
        .slice(0, 10)
        .map((e) => e.rotulo)
        .join(', ') + (this.emBranco().length > 10 ? '…' : ''),
  );

  constructor() {
    // Só o `modo` é dependência: `entregar()` lê outros signals e, rastreado,
    // o effect rodava de novo a cada falha — um laço de finalizarprova.
    effect(() => {
      const modo = this.modo();
      if (modo === 'tempo') untracked(() => void this.entregar());
    });
  }

  revisarAgora(): void {
    const p = this.store.primeiraEmBranco();
    if (p) this.revisar.emit(p);
    this.fechar.emit();
  }

  async entregar(): Promise<void> {
    if (this.entregando()) return;
    this.entregando.set(true);
    this.erro.set(null);
    const oidCp = this.candidato.oidCandidatoProva()!;
    try {
      await this.store.descarregarRedacao();
      const pendentes = await this.fila.reenviar(oidCp);
      if (pendentes > 0 && this.modo() === 'manual') {
        this.erro.set(`${pendentes} respostas não foram enviadas por falta de conexão. Confira a rede e tente de novo.`);
        return;
      }
      await firstValueFrom(this.api.entregar(oidCp));
      this.entregue.emit();
    } catch {
      this.erro.set('Não conseguimos registrar a entrega. Confira a conexão e tente de novo.');
    } finally {
      this.entregando.set(false);
    }
  }
}
