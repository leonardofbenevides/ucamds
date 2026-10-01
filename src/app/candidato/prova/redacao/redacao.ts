import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UcamBadge, UcamButton, UcamTextarea } from '@ucam/ui';
import { ProvaProtegida } from '../../../core/directives/prova-protegida';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { ProvaStore, contarCaracteres } from '../../../core/store/prova.store';
import { ProvaPage } from '../prova';
import { environment } from '../../../../environments/environment';

const INTERVALO_SALVAR = 30_000;

/**
 * Redação em texto simples. Salva ao sair do campo e a cada 30 s se houve
 * mudança; o rascunho local sobrevive a recarregar a página.
 */
@Component({
  selector: 'app-redacao',
  imports: [DecimalPipe, UcamBadge, UcamButton, UcamTextarea, ProvaProtegida],
  templateUrl: './redacao.html',
})
export class RedacaoPage {
  readonly store = inject(ProvaStore);
  private readonly candidato = inject(CandidatoStore);
  private readonly router = inject(Router);
  private readonly pagina = inject(ProvaPage);

  readonly minimo = environment.redacaoMin;
  readonly maximo = environment.redacaoMax;
  readonly questao = this.store.questaoRedacao;
  readonly texto = signal('');
  private ultimoSalvo = '';

  readonly caracteres = computed(() => contarCaracteres(this.texto()));
  readonly faltam = computed(() => Math.max(0, this.minimo - this.caracteres()));
  readonly atingeMinimo = computed(() => this.faltam() === 0);
  readonly contador = computed(
    () => `${this.caracteres().toLocaleString('pt-BR')} de ${this.maximo.toLocaleString('pt-BR')} caracteres`,
  );
  readonly temObjetiva = computed(() => this.store.objetivos().length > 0);

  private get chaveRascunho(): string {
    return `rascunho:${this.candidato.oidCandidatoProva()}`;
  }

  constructor() {
    // Na redação não há posição de questão objetiva: o mapa marca "Redação".
    this.store.posicao.set(null);
    this.texto.set(this.store.textoRedacao());
    this.ultimoSalvo = this.texto();
    this.restaurarRascunho();

    const timer = setInterval(() => {
      if (this.texto() !== this.ultimoSalvo) this.salvar();
    }, INTERVALO_SALVAR);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      if (this.texto() !== this.ultimoSalvo) this.salvar();
    });

    effect(() => {
      // Rascunho local a cada mudança: sobrevive a recarregar a página.
      try {
        localStorage.setItem(this.chaveRascunho, JSON.stringify({ texto: this.texto(), em: Date.now() }));
      } catch {
        /* sem storage */
      }
    });
  }

  private restaurarRascunho(): void {
    try {
      const r = JSON.parse(localStorage.getItem(this.chaveRascunho) ?? 'null') as { texto: string; em: number } | null;
      if (r && r.texto.length > 0 && r.texto !== this.texto()) this.texto.set(r.texto);
    } catch {
      /* rascunho inválido: ignora */
    }
  }

  aoSair(): void {
    if (this.texto() !== this.ultimoSalvo) this.salvar();
  }

  private salvar(): void {
    const t = this.texto();
    this.ultimoSalvo = t;
    this.store.salvarRedacao(t);
  }

  /** Volta à primeira questão em branco ou, se não há, à primeira da prova. */
  voltarParaObjetiva(): void {
    const p = this.store.primeiraEmBranco();
    if (p) this.router.navigate(['/candidato', this.candidato.oidFip(), 'prova', p.slug, p.n]);
  }

  entregar(): void {
    this.aoSair();
    this.pagina.pedirEntrega.set('manual');
  }
}
