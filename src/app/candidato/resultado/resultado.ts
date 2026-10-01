import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamBadge, UcamButton, UcamCard, UcamPageHeader, UcamSkeleton, UcamStat, UcamStepper } from '@ucam/ui';
import { CandidatoApi } from '../../core/api/candidato.api';
import { ProvaApi } from '../../core/api/prova.api';
import { ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { Navegador } from '../../core/navegador';
import { CandidatoStore } from '../../core/store/candidato.store';
import { formatarHms } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { etapas } from '../etapas';
import { environment } from '../../../environments/environment';

type Situacao = 'APROVADO' | 'REPROVADO' | null;

@Component({
  selector: 'app-resultado',
  imports: [Moldura, UcamAlert, UcamBadge, UcamButton, UcamCard, UcamPageHeader, UcamSkeleton, UcamStat, UcamStepper],
  templateUrl: './resultado.html',
})
export class ResultadoPage {
  readonly store = inject(CandidatoStore);
  private readonly provaApi = inject(ProvaApi);
  private readonly candidatoApi = inject(CandidatoApi);
  private readonly navegador = inject(Navegador);
  private readonly router = inject(Router);

  readonly contato = environment.contatoSecretaria;
  readonly etapas = etapas(3);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly tipos = signal<string[]>([]);
  readonly situacao = signal<Situacao>(null);
  readonly entregueDia = signal<string | null>(null);
  readonly entregueHora = signal<string | null>(null);
  readonly tempoUsado = signal<string | null>(null);

  readonly trilha = computed(() => [
    { label: 'Seus dados', link: `/candidato/${this.store.oidFip() ?? ''}` },
    { label: 'Prova entregue' },
  ]);
  readonly temRedacao = computed(() => this.tipos().some(ehRedacao));
  readonly totalTentativas = computed(() => this.store.tentativas()?.totalTentativasPossiveis ?? 0);
  readonly cadernosTexto = computed(() => this.tipos().map(rotuloTipoProva).join(', ') || null);

  constructor() {
    this.carregar();
  }

  private async carregar(): Promise<void> {
    const oidCp = this.store.oidCandidatoProva()!;
    try {
      const [tipos, dados] = await Promise.all([
        firstValueFrom(this.provaApi.tiposProva(oidCp)),
        firstValueFrom(this.candidatoApi.dados(oidCp)).catch(
          () => ({}) as { horarioinicio?: string | null; horariofim?: string | null },
        ),
      ]);
      this.tipos.set(tipos ?? []);
      if (dados.horariofim) {
        const fim = new Date(dados.horariofim);
        this.entregueDia.set(fim.toLocaleDateString('pt-BR'));
        this.entregueHora.set(`às ${fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
        if (dados.horarioinicio) this.tempoUsado.set(formatarHms(fim.getTime() - new Date(dados.horarioinicio).getTime()));
      }
      if (!this.temRedacao()) {
        const s = (await firstValueFrom(this.provaApi.corrigirObjetiva(oidCp))).trim().toUpperCase();
        this.situacao.set(s === 'APROVADO' ? 'APROVADO' : 'REPROVADO');
      }
    } catch {
      this.erro.set('Não conseguimos carregar o resultado. Tente de novo em instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  irParaSite(): void {
    this.navegador.irParaExterno(this.store.urlSite());
  }

  concluirMatricula(): void {
    this.navegador.irParaExterno(this.store.urlAreaDoInscrito());
  }

  tentarNovamente(): void {
    const proxima = (this.store.tentativas()?.tentativaAtual ?? 1) + 1;
    this.router.navigate(['/candidato', this.store.oidFip()], { queryParams: { tentativa: proxima } });
  }

  recarregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.carregar();
  }
}
