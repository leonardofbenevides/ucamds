import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamDescriptionList, UcamPageHeader, UcamSkeleton } from '@ucam/ui';
import { InstrucoesLista } from './instrucoes-lista';
import { ProvaApi } from '../../core/api/prova.api';
import { ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { CandidatoStore } from '../../core/store/candidato.store';
import { parseTempoMaximo, textoRestante } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-instrucoes',
  imports: [Moldura, InstrucoesLista, UcamAlert, UcamButton, UcamDescriptionList, UcamPageHeader, UcamSkeleton],
  templateUrl: './instrucoes.html',
})
export class InstrucoesPage {
  private readonly api = inject(ProvaApi);
  private readonly store = inject(CandidatoStore);
  private readonly router = inject(Router);

  readonly carregando = signal(true);
  readonly iniciando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly tempoMs = signal(environment.duracaoPadraoMs);
  readonly tipos = signal<string[]>([]);

  /** "2 h", "1 h 30 min": o mesmo texto do relógio, sem o verbo. */
  readonly tempoTexto = computed(() => textoRestante(this.tempoMs()).replace(/^Faltam? /, ''));
  readonly resumo = computed(() => [
    { label: 'Tempo', value: this.tempoTexto() },
    {
      label: 'Cadernos',
      value: this.tipos().filter((t) => !ehRedacao(t)).map(rotuloTipoProva).join(', ') || null,
    },
    { label: 'Redação', value: this.tipos().some(ehRedacao) ? 'Sim' : 'Não' },
  ]);

  constructor() {
    this.carregar();
  }

  private async carregar(): Promise<void> {
    const oid = this.store.oidCandidatoProva()!;
    try {
      const [tempo, cadernos] = await Promise.all([
        firstValueFrom(this.api.tempoMaximo(oid)).catch(() => ({ tempomaximo: '' })),
        firstValueFrom(this.api.cadernos(oid)),
      ]);
      const ms = parseTempoMaximo(tempo.tempomaximo);
      if (!Number.isNaN(ms)) this.tempoMs.set(ms);
      this.tipos.set((cadernos ?? []).map((c) => c.tipoprova));
    } catch {
      this.erro.set('Não conseguimos carregar os dados da prova. Confira sua conexão e tente de novo.');
    } finally {
      this.carregando.set(false);
    }
  }

  async iniciar(): Promise<void> {
    if (this.iniciando()) return;
    this.iniciando.set(true);
    this.erro.set(null);
    try {
      const c = await firstValueFrom(this.api.iniciar(this.store.oidCandidatoProva()!));
      this.store.definir(c, this.store.oidFip()!);
      await this.router.navigate(['/candidato', this.store.oidFip(), 'prova']);
    } catch {
      this.erro.set('Não conseguimos iniciar a prova. Tente de novo.');
    } finally {
      this.iniciando.set(false);
    }
  }
}
