import { Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { UcamAppShell } from '@ucam/ui';
import { CandidatoStore } from '../core/store/candidato.store';
import { TemaToggle } from './tema-toggle';

/**
 * A moldura de toda tela depois da entrada: faixa com o nome do sistema e o
 * nome do candidato. Sem navegação — o candidato tem um caminho só.
 *
 * O <ucam-app-shell> não tem a opção "sem navegação" que o shell do Trilho A
 * tem (ucam-shell--sem-nav): a coluna vazia e o botão de abrir a gaveta
 * continuam no DOM. Enquanto o contrato não ganha essa prop, a coluna vai a
 * zero e os dois saem daqui. Pedido registrado para o DS.
 */
@Component({
  selector: 'app-moldura',
  imports: [UcamAppShell, TemaToggle],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="academico"
      [user]="usuario()"
      [homeHref]="home()"
      [navGroups]="[]"
      [navCollapsed]="true"
      navWidth="0rem"
    >
      <div ucamShellAcoes class="ucam-cluster">
        <ng-content select="[ucamShellAcoes]" />
        <app-tema-toggle />
      </div>
      <ng-content />
    </ucam-app-shell>
  `,
  styles: `
    /* O nav fica na grade (com display:none o conteúdo cairia na coluna de 0rem
       que o navWidth reserva); só deixa de ser visto, focado e anunciado. */
    app-moldura ucam-app-shell > div > nav {
      visibility: hidden;
      border: 0;
    }
    app-moldura ucam-app-shell button[aria-label='Abrir navegação'],
    app-moldura ucam-app-shell button[aria-label='Fechar navegação'] {
      display: none;
    }
  `,
})
export class Moldura {
  private readonly store = inject(CandidatoStore);
  readonly usuario = computed(() => (this.store.nome() ? { name: this.store.nome() } : null));
  readonly home = computed(() => `/candidato/${this.store.oidFip() ?? ''}`);
}
