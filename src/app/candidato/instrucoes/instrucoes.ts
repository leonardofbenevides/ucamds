import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamButton, UcamCard, UcamCheckbox, UcamPageHeader, UcamStat, UcamStepper } from '@ucam/ui';
import { InstrucoesLista } from './instrucoes-lista';
import { etapas } from '../etapas';
import { ProvaApi } from '../../core/api/prova.api';
import { ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { CandidatoStore } from '../../core/store/candidato.store';
import { parseTempoMaximo, textoRestante } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-instrucoes',
  imports: [Moldura, InstrucoesLista, UcamAlert, UcamButton, UcamCard, UcamCheckbox, UcamPageHeader, UcamStat, UcamStepper],
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
  readonly cadernos = signal<{ tipoprova: string; questoes: number }[]>([]);
  /** A pessoa precisa dizer que leu: é o que separa "entrar na tela" de "começar a prova". */
  readonly confirmado = signal(false);
  /** Tentou começar sem confirmar: o erro vai na própria caixa, não num alerta solto. */
  readonly faltaConfirmar = signal(false);

  readonly redacaoMin = environment.redacaoMin;
  readonly etapas = etapas(1);
  readonly trilha = computed(() => [
    { label: 'Seus dados', link: `/candidato/${this.store.oidFip() ?? ''}` },
    { label: 'Antes de começar' },
  ]);

  /** "2 h", "1 h 30 min": o mesmo texto do relógio, sem o verbo. */
  readonly tempoTexto = computed(() => textoRestante(this.tempoMs()).replace(/^Faltam? /, ''));
  readonly objetivos = computed(() => this.cadernos().filter((c) => !ehRedacao(c.tipoprova)));
  readonly temRedacao = computed(() => this.cadernos().some((c) => ehRedacao(c.tipoprova)));
  readonly totalQuestoes = computed(() => this.objetivos().reduce((s, c) => s + c.questoes, 0));
  readonly cadernosTexto = computed(() => this.objetivos().map((c) => rotuloTipoProva(c.tipoprova)).join(', ') || 'Sem caderno cadastrado');

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
      this.cadernos.set((cadernos ?? []).map((c) => ({ tipoprova: c.tipoprova, questoes: c.questoes?.length ?? 0 })));
    } catch {
      this.erro.set('Não conseguimos carregar os dados da prova. Confira sua conexão e tente de novo.');
    } finally {
      this.carregando.set(false);
    }
  }

  async iniciar(): Promise<void> {
    if (this.iniciando()) return;
    if (!this.confirmado()) {
      this.faltaConfirmar.set(true);
      return;
    }
    this.faltaConfirmar.set(false);
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
