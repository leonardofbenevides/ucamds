import { Component, computed, inject } from '@angular/core';
import { UcamAppShell } from '@ucam/ui';
import { CandidatoStore } from '../core/store/candidato.store';

/**
 * A moldura de toda tela depois da entrada: faixa com o nome do sistema e o
 * nome do candidato. Sem navegação lateral — o candidato tem um caminho só.
 */
@Component({
  selector: 'app-moldura',
  imports: [UcamAppShell],
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="academico"
      [user]="usuario()"
      [homeHref]="home()"
      [navGroups]="[]"
      [navCollapsed]="true"
      maxContentWidth="72rem"
    >
      <ng-content select="[ucamShellAcoes]" />
      <ng-content />
    </ucam-app-shell>
  `,
})
export class Moldura {
  private readonly store = inject(CandidatoStore);
  readonly usuario = computed(() => (this.store.nome() ? { name: this.store.nome() } : null));
  readonly home = computed(() => `/candidato/${this.store.oidFip() ?? ''}`);
}
