import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamDrawer, UcamEmptyState, UcamSkeleton } from '@ucam/ui';
import { ProvaApi } from '../../core/api/prova.api';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Posicao, ProvaStore } from '../../core/store/prova.store';
import { RelogioProva, parseTempoMaximo } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { CabecalhoProva } from './cabecalho-prova';
import { MapaQuestoes } from './mapa-questoes';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-prova',
  imports: [RouterOutlet, Moldura, CabecalhoProva, MapaQuestoes, UcamAlert, UcamButton, UcamDrawer, UcamEmptyState, UcamSkeleton],
  templateUrl: './prova.html',
})
export class ProvaPage {
  readonly store = inject(ProvaStore);
  readonly candidato = inject(CandidatoStore);
  readonly relogio = inject(RelogioProva);
  readonly fila = inject(FilaRespostas);
  private readonly provaApi = inject(ProvaApi);
  private readonly router = inject(Router);

  readonly mapaAberto = signal(false);
  readonly contato = environment.contatoSecretaria;
  /** Pedido de entrega: 'manual' pelo botão, 'tempo' pelo relógio. Ligado ao diálogo de entrega. */
  readonly pedirEntrega = signal<'manual' | 'tempo' | null>(null);

  constructor() {
    const oidCp = this.candidato.oidCandidatoProva()!;
    this.store.carregar(oidCp);
    this.ligarRelogio(oidCp);

    const reenviar = () => this.fila.reenviar(oidCp);
    window.addEventListener('online', reenviar);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', reenviar);
      this.relogio.parar();
    });

    effect(() => {
      if (this.relogio.esgotado()) this.pedirEntrega.set('tempo');
    });
  }

  private async ligarRelogio(oidCp: string): Promise<void> {
    const inicioServidor = this.candidato.candidato()?.horarioinicio;
    const inicio = inicioServidor ? new Date(inicioServidor) : new Date();
    const tempo = await firstValueFrom(this.provaApi.tempoMaximo(oidCp)).catch(() => ({ tempomaximo: '' }));
    const ms = parseTempoMaximo(tempo.tempomaximo);
    this.relogio.iniciar(inicio, Number.isNaN(ms) ? environment.duracaoPadraoMs : ms);
  }

  irPara(destino: Posicao | 'redacao'): void {
    this.mapaAberto.set(false);
    const base = ['/candidato', this.candidato.oidFip(), 'prova'];
    this.router.navigate(destino === 'redacao' ? [...base, 'redacao'] : [...base, destino.slug, destino.n]);
  }

  recarregar(): void {
    this.store.carregar(this.candidato.oidCandidatoProva()!);
  }
}
