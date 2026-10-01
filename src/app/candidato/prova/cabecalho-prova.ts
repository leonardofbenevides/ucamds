import { Component, computed, effect, inject, signal } from '@angular/core';
import { UcamIcon, UcamProgress } from '@ucam/ui';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaStore } from '../../core/store/prova.store';
import { RelogioProva } from '../../core/tempo/relogio-prova';

/**
 * Barra fixa da prova: relógio em palavra e em barra, progresso e estado de
 * salvamento. O anúncio para leitor de tela acontece só nas trocas de tom e
 * no último minuto — nunca a cada segundo.
 */
@Component({
  selector: 'app-cabecalho-prova',
  imports: [UcamIcon, UcamProgress],
  template: `
    <header class="ucam-viewbar" aria-label="Andamento da prova">
      <div class="ucam-viewbar__fileira">
        <h1 class="ucam-page-header__title">Prova objetiva<span class="ucam-sr-only">, {{ progresso() }}</span></h1>
        <span class="ucam-viewbar__contagem" aria-hidden="true">{{ progresso() }}</span>
        <span class="ucam-viewbar__folga"></span>
        <p class="ucam-cluster" data-salvamento>
          @switch (fila.estado()) {
            @case ('salvando') {
              <ucam-icon name="loaderCircle" size="sm" aria-hidden="true" /> Salvando…
            }
            @case ('pendente') {
              <ucam-icon name="triangleAlert" size="sm" aria-hidden="true" />
              Sem conexão. {{ fila.pendentes().length }} {{ fila.pendentes().length === 1 ? 'resposta será enviada' : 'respostas serão enviadas' }} quando ela voltar.
            }
            @case ('erro') {
              <ucam-icon name="circleAlert" size="sm" aria-hidden="true" />
              {{ fila.ultimoErro() }}
            }
            @default {
              <ucam-icon name="circleCheck" size="sm" aria-hidden="true" /> Salvo
            }
          }
        </p>
      </div>
      <div class="ucam-viewbar__fileira">
        <ucam-progress
          label="Tempo da prova"
          [value]="relogio.decorrido()"
          [max]="relogio.total()"
          [tone]="relogio.tom()"
          [valueText]="relogio.texto()"
          [legendStart]="relogio.texto()"
          [legendEnd]="relogio.hms()"
        />
        <p class="ucam-sr-only" aria-live="polite">{{ anuncio() }}</p>
      </div>
    </header>
  `,
})
export class CabecalhoProva {
  readonly relogio = inject(RelogioProva);
  readonly fila = inject(FilaRespostas);
  readonly store = inject(ProvaStore);

  readonly progresso = computed(() => `${this.store.respondidas()} de ${this.store.totalObjetivas()} respondidas`);
  readonly anuncio = signal('');

  constructor() {
    let tomAnterior = this.relogio.tom();
    let avisouUmMinuto = false;
    effect(() => {
      const tom = this.relogio.tom();
      const restante = this.relogio.restante();
      if (tom !== tomAnterior) {
        tomAnterior = tom;
        if (tom === 'warning') this.anuncio.set(`Atenção: ${this.relogio.texto()}.`);
        if (tom === 'danger') this.anuncio.set(`Atenção: faltam menos de 10 minutos. ${this.relogio.texto()}.`);
      }
      if (!avisouUmMinuto && restante > 0 && restante <= 60_000) {
        avisouUmMinuto = true;
        this.anuncio.set('Falta 1 minuto. A prova será entregue automaticamente no fim do tempo.');
      }
    });
  }
}
