import { Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { UcamAppShell, UcamIcon } from '@ucam/ui';
import { CandidatoStore } from '../core/store/candidato.store';
import { TemaToggle } from './tema-toggle';

/**
 * A moldura de toda tela depois da entrada: faixa com o nome do sistema, a
 * unidade do candidato como contexto (no lugar em que as outras telas do DS
 * mostram o campus) e o nome do candidato. Sem navegação — o candidato tem
 * um caminho só.
 *
 * O <ucam-app-shell> não tem a opção "sem navegação" que o shell do Trilho A
 * tem (ucam-shell--sem-nav) nem o `context` do contrato: a coluna vazia e o
 * botão de abrir a gaveta continuam no DOM. Enquanto o contrato não ganha
 * essas props, a coluna vai a zero e os dois saem daqui. Pedido registrado.
 */
@Component({
  selector: 'app-moldura',
  imports: [UcamAppShell, UcamIcon, TemaToggle],
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
        @if (unidade(); as u) {
          <span class="ucam-campus ucam-campus--faixa">
            <ucam-icon name="mapPin" size="sm" aria-hidden="true" />
            <span class="ucam-sr-only">Campus:</span>
            <span>{{ u }}</span>
          </span>
          <span class="ucam-appbar__divider" aria-hidden="true"></span>
        }
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
  readonly unidade = computed(() => this.store.unidade()?.nome ?? this.store.unidade()?.sigla ?? null);
}
