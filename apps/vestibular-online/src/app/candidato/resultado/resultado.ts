import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UcamAlert, UcamBadge, UcamButton, UcamCard, UcamIcon, UcamPageHeader, UcamProgress, UcamSkeleton, UcamStat, UcamStepItem, UcamStepper } from '@ucam/ui';
import { CandidatoApi } from '../../core/api/candidato.api';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoProva } from '../../core/model/candidato';
import { Desempenho, ehRedacao, rotuloTipoProva } from '../../core/model/prova';
import { Navegador } from '../../core/navegador';
import { CandidatoStore } from '../../core/store/candidato.store';
import { ProvaStore } from '../../core/store/prova.store';
import { duracaoEmPalavra } from '../../core/tempo/relogio-prova';
import { Moldura } from '../../layout/moldura';
import { etapas } from '../etapas';
import { environment } from '../../../environments/environment';

type Situacao = 'APROVADO' | 'REPROVADO' | null;

/** O desfecho de uma prova já corrigida; null enquanto a correção não saiu. */
function desfecho(c: CandidatoProva | null): Situacao {
  if (c?.situacao !== 'PROVA_CORRIGIDA') return null;
  return ['APROVADO', 'MATRICULADO'].includes(c.formaingressopessoa.situacao) ? 'APROVADO' : 'REPROVADO';
}

@Component({
  selector: 'app-resultado',
  imports: [Moldura, UcamAlert, UcamBadge, UcamButton, UcamCard, UcamIcon, UcamPageHeader, UcamProgress, UcamSkeleton, UcamStat, UcamStepper],
  templateUrl: './resultado.html',
})
export class ResultadoPage {
  readonly store = inject(CandidatoStore);
  private readonly prova = inject(ProvaStore);
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
  /** A consulta à banca feita pelo botão: em curso, e a hora da última que voltou sem correção. */
  readonly verificando = signal(false);
  readonly verificadoAs = signal<string | null>(null);
  readonly erroVerificacao = signal(false);
  /** Acertos por caderno e nota da redação, quando o servidor os entrega; null quando não. */
  readonly desempenho = signal<Desempenho | null>(null);

  /** Enquanto a correção não sai, o que há a dizer é que a prova foi entregue; depois, é o resultado. */
  readonly titulo = computed(() => (this.situacao() === null ? 'Prova entregue' : 'Resultado'));
  readonly trilha = computed(() => [
    { label: 'Seus dados', link: `/candidato/${this.store.oidFip() ?? ''}` },
    { label: this.titulo() },
  ]);
  readonly temRedacao = computed(() => this.tipos().some(ehRedacao));

  /** A notícia chama a pessoa pelo primeiro nome, em caixa de nome próprio — o cadastro costuma vir em maiúsculas. */
  readonly primeiroNome = computed(() => {
    const n = this.store.nome().trim().split(/\s+/)[0] ?? '';
    return n ? n.charAt(0).toLocaleUpperCase('pt-BR') + n.slice(1).toLocaleLowerCase('pt-BR') : '';
  });
  /** A que a aprovação se refere: curso, turno e campus, o que houver. */
  readonly vaga = computed(() =>
    [this.store.curso(), this.store.turno(), this.store.unidade()?.nome ?? this.store.unidade()?.sigla].filter(Boolean).join(' · '),
  );

  /** A soma dos cadernos objetivos: "4 de 5" e o aproveitamento. */
  readonly acertos = computed(() => {
    const c = this.desempenho()?.cadernos ?? [];
    const total = c.reduce((s, x) => s + x.total, 0);
    if (!total) return null;
    const certas = c.reduce((s, x) => s + x.acertos, 0);
    return { texto: `${certas} de ${total}`, aproveitamento: `${Math.round((100 * certas) / total)}% de aproveitamento` };
  });
  readonly porCaderno = computed(() =>
    (this.desempenho()?.cadernos ?? []).map((c) => ({
      rotulo: rotuloTipoProva(c.tipoprova),
      acertos: c.acertos,
      total: c.total,
      texto: `${c.acertos} de ${c.total}`,
    })),
  );
  /** "8,0": a nota como o boletim a escreve. */
  readonly notaRedacao = computed(() => {
    const n = this.desempenho()?.notaRedacao;
    return n === null || n === undefined ? null : n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  });
  readonly notaRedacaoNumero = computed(() => this.desempenho()?.notaRedacao ?? 0);

  /** O que vem depois da aprovação. A prova já foi; a matrícula é o passo de agora. */
  readonly passos: UcamStepItem[] = [
    { label: 'Fazer a prova', state: 'done', hint: 'Entregue e corrigida' },
    { label: 'Concluir a matrícula', state: 'current', hint: 'Na área do inscrito' },
    { label: 'Começar as aulas', state: 'todo', hint: 'A secretaria confirma a data' },
  ];
  readonly totalTentativas = computed(() => this.store.tentativas()?.totalTentativasPossiveis ?? 0);
  readonly cadernosTexto = computed(() => this.tipos().map(rotuloTipoProva).join(', ') || null);
  /** Só existe na sessão em que a prova foi feita: quem volta pelo link depois não tem o caderno carregado. */
  readonly respondidas = computed(() =>
    this.prova.totalObjetivas() > 0 ? `${this.prova.respondidas()} de ${this.prova.totalObjetivas()}` : null,
  );

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
        if (dados.horarioinicio) this.tempoUsado.set(duracaoEmPalavra(fim.getTime() - new Date(dados.horarioinicio).getTime()));
      }
      // Prova já corrigida tem desfecho, com ou sem redação: quem volta depois
      // de a banca terminar vê o resultado, não a espera.
      const corrigida = desfecho(this.store.candidato());
      if (corrigida) {
        this.situacao.set(corrigida);
      } else if (!this.temRedacao()) {
        const s = (await firstValueFrom(this.provaApi.corrigirObjetiva(oidCp))).trim().toUpperCase();
        this.situacao.set(s === 'APROVADO' ? 'APROVADO' : 'REPROVADO');
      }
      // Com desfecho, pergunta pelo desempenho. Não trava a tela: chega depois e, se não vier, nada muda.
      if (this.situacao() !== null) this.carregarDesempenho(oidCp);
    } catch {
      this.erro.set('Não conseguimos carregar o resultado. Tente de novo em instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  /** Pergunta de novo ao servidor se a banca já corrigiu. */
  async verificar(): Promise<void> {
    if (this.verificando()) return;
    const oidFip = this.store.oidFip()!;
    this.verificando.set(true);
    this.erroVerificacao.set(false);
    try {
      const candidato = await firstValueFrom(this.candidatoApi.buscar(oidFip));
      if (candidato) this.store.definir(candidato, oidFip);
      const corrigida = desfecho(candidato);
      this.situacao.set(corrigida);
      if (corrigida && candidato) this.carregarDesempenho(candidato.oid);
      this.verificadoAs.set(
        corrigida ? null : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      );
    } catch {
      this.erroVerificacao.set(true);
    } finally {
      this.verificando.set(false);
    }
  }

  private async carregarDesempenho(oidCp: string): Promise<void> {
    this.desempenho.set(await firstValueFrom(this.provaApi.desempenho(oidCp)).catch(() => null));
  }

  /** O comprovante é a própria tela, impressa: a folha de impressão do DS tira a moldura e as ações. */
  imprimir(): void {
    window.print();
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
