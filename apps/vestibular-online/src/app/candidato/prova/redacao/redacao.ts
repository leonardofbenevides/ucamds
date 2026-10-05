import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UcamButton, UcamCitacao, UcamSectionBar, UcamTextarea } from '@ucam/ui';
import { ProvaProtegida } from '../../../core/directives/prova-protegida';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { ProvaStore, contarCaracteres } from '../../../core/store/prova.store';
import { ProvaPage } from '../prova';
import { environment } from '../../../../environments/environment';

const INTERVALO_SALVAR = 30_000;

/**
 * Redação em texto simples. O que a pessoa digita vai para o rascunho do
 * store (de onde a entrega descarrega) e para o localStorage (que sobrevive
 * a recarregar); o servidor recebe ao sair do campo e a cada 30 s.
 */
@Component({
  selector: 'app-redacao',
  imports: [DecimalPipe, UcamButton, UcamCitacao, UcamSectionBar, UcamTextarea, ProvaProtegida],
  templateUrl: './redacao.html',
  styles: `
    /* Foco por programa: sem anel quando veio do ponteiro, com o anel do DS
       quando veio do teclado. */
    :host article:focus:not(:focus-visible) {
      outline: none;
    }
  `,
})
export class RedacaoPage {
  readonly store = inject(ProvaStore);
  private readonly candidato = inject(CandidatoStore);
  private readonly router = inject(Router);
  private readonly pagina = inject(ProvaPage);
  private readonly artigo = viewChild<ElementRef<HTMLElement>>('artigo');

  readonly minimo = environment.redacaoMin;
  readonly maximo = environment.redacaoMax;
  readonly questao = this.store.questaoRedacao;
  readonly texto = signal('');

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
    this.restaurarRascunho();
    // Já aqui, e não só no effect: é o rascunho que diz ao cabeçalho da prova
    // que a etapa é a redação, e ele não pode nascer dizendo "Prova objetiva".
    this.store.rascunhoRedacao.set(this.texto());

    afterNextRender(() => this.artigo()?.nativeElement.focus());

    const timer = setInterval(() => void this.store.descarregarRedacao(), INTERVALO_SALVAR);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      if (!this.store.entregue()) void this.store.descarregarRedacao();
      this.store.rascunhoRedacao.set(null);
    });

    effect(() => {
      const t = this.texto();
      this.store.rascunhoRedacao.set(t);
      try {
        localStorage.setItem(this.chaveRascunho, JSON.stringify({ texto: t, em: Date.now() }));
      } catch {
        /* sem storage */
      }
    });
  }

  /** O rascunho local só vale quando o servidor não tem texto: outro aparelho pode ter o mais novo. */
  private restaurarRascunho(): void {
    if (this.texto().length > 0) return;
    try {
      const r = JSON.parse(localStorage.getItem(this.chaveRascunho) ?? 'null') as { texto: string } | null;
      if (r?.texto) this.texto.set(r.texto);
    } catch {
      /* rascunho inválido: ignora */
    }
  }

  aoSair(): void {
    // O effect que espelha o texto no store só roda no próximo ciclo; aqui o
    // valor atual precisa ir antes do envio.
    this.store.rascunhoRedacao.set(this.texto());
    void this.store.descarregarRedacao();
  }

  /** Volta à primeira questão em branco ou, se não há, à primeira da prova. */
  voltarParaObjetiva(): void {
    const p = this.store.primeiraEmBranco();
    if (p) this.router.navigate(['/candidato', this.candidato.oidFip(), 'prova', p.slug, p.n]);
  }

  entregar(): void {
    this.pagina.pedirEntrega.set('manual');
  }
}
