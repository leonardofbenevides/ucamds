import { Component, computed, inject } from '@angular/core';
import { UcamBadge, UcamIcon } from '@ucam/ui';
import { RelogioProva } from '../core/tempo/relogio-prova';

/**
 * O relógio da prova na faixa, compacto: hh:mm:ss num selo cujo tom segue o
 * do relógio (neutro, aviso no último terço, perigo nos últimos 10 min). O
 * cabeçalho da prova continua com a barra e o texto em palavra; aqui é o
 * lembrete que acompanha a pessoa em qualquer rolagem.
 */
@Component({
  selector: 'app-relogio-faixa',
  imports: [UcamBadge, UcamIcon],
  template: `
    @if (ativo()) {
      <span class="ucam-cluster">
        <ucam-icon name="clock" size="sm" aria-hidden="true" />
        <ucam-badge [tone]="tom()" variant="soft" [label]="relogio.hms()" />
      </span>
      <span class="ucam-sr-only">{{ relogio.texto() }}</span>
    }
  `,
})
export class RelogioFaixa {
  readonly relogio = inject(RelogioProva);
  readonly ativo = computed(() => this.relogio.total() > 0);
  readonly tom = computed<'neutral' | 'warning' | 'danger'>(() => this.relogio.tom());
}
