import { Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { Router } from '@angular/router';
import { UcamBadge, UcamButton, UcamIcon, UcamTooltip } from '@ucam/ui';
import { ProvaProtegida } from '../../../core/directives/prova-protegida';
import { rotuloTipoProva } from '../../../core/model/prova';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { ProvaStore } from '../../../core/store/prova.store';
import { ProvaPage } from '../prova';

const LETRAS = 'ABCDEFG';

@Component({
  selector: 'app-questao',
  imports: [UcamBadge, UcamButton, UcamIcon, UcamTooltip, ProvaProtegida],
  templateUrl: './questao.html',
  styles: `
    /* O cartão do DS alinha pelo topo porque prevê título + linha de apoio;
       a alternativa é uma linha só, e o texto precisa ficar no eixo da letra. */
    :host .ucam-choice-card {
      align-items: center;
    }
  `,
})
export class QuestaoPage {
  readonly caderno = input.required<string>();
  readonly n = input.required<number, string | number>({ transform: numberAttribute });

  readonly store = inject(ProvaStore);
  private readonly candidato = inject(CandidatoStore);
  private readonly router = inject(Router);
  private readonly pagina = inject(ProvaPage);

  readonly rotuloCaderno = computed(() => rotuloTipoProva(this.store.cadernoAtual()?.tipoprova ?? ''));
  readonly totalNoCaderno = computed(() => this.store.cadernoAtual()?.questoes.length ?? 0);
  readonly questao = this.store.questaoAtual;
  readonly escolhida = computed(() => this.store.respostas()[this.questao()?.oid ?? ''] ?? null);
  readonly alternativas = computed(() => (this.questao()?.alternativas ?? []).map((a, i) => ({ ...a, letra: LETRAS[i] })));
  readonly ehPrimeira = computed(() => this.store.anterior() === null);
  readonly proximaEhFim = computed(() => this.store.proxima() === 'fim');
  readonly proximaEhRedacao = computed(() => this.store.proxima() === 'redacao');
  readonly rotuloProxima = computed(() =>
    this.proximaEhFim() ? 'Entregar prova' : this.proximaEhRedacao() ? 'Ir para a redação' : 'Próxima',
  );

  constructor() {
    effect(() => this.store.definirPosicao(this.caderno(), this.n()));
  }

  escolher(oidAlternativa: string): void {
    const q = this.questao();
    if (q) this.store.responder(q.oid, oidAlternativa);
  }

  private base(): unknown[] {
    return ['/candidato', this.candidato.oidFip(), 'prova'];
  }

  anterior(): void {
    const p = this.store.anterior();
    if (p) this.router.navigate([...this.base(), p.slug, p.n]);
  }

  proxima(): void {
    const p = this.store.proxima();
    if (p === 'fim') {
      this.pagina.pedirEntrega.set('manual');
      return;
    }
    if (p === 'redacao') {
      this.router.navigate([...this.base(), 'redacao']);
      return;
    }
    this.router.navigate([...this.base(), p.slug, p.n]);
  }
}
