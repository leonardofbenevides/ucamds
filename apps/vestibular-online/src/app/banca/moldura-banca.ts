import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { UcamAppShell, UcamButton, UcamIcon, UcamNavGroup } from '@ucam/ui';
import { Navegador } from '../core/navegador';
import { environment } from '../../environments/environment';
import { LinksInternos } from '../layout/links-internos';
import { TemaToggle } from '../layout/tema-toggle';
import { SessaoBanca } from './sessao';

/**
 * A moldura de quem trabalha no vestibular por dentro: a mesma faixa do
 * sistema, com a navegação na coluna — a fila de redações, a fila de isenção
 * e o cadastro das provas. Só aparece o que existe: item de menu que não leva
 * a lugar nenhum não se desenha.
 *
 * QUEM É A PESSOA: vem da sessão (SessaoBanca), aberta na volta do login
 * único — o nome na conta da faixa e a unidade ao lado, como no legado. Sair
 * encerra a sessão e devolve ao login.
 */
@Component({
  selector: 'app-moldura-banca',
  hostDirectives: [LinksInternos],
  imports: [UcamAppShell, UcamButton, UcamIcon, TemaToggle],
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="pessoas"
      homeHref="/banca"
      [user]="usuario()"
      [navGroups]="grupos()"
    >
      <!-- A unidade em que a pessoa trabalha, como contexto na faixa. Só a
           partir de 48rem: abaixo disso menu, marca e conta tomam a largura.
           O div sem classe do DS existe para o Tailwind decidir o display. -->
      @if (sessao.nomeUnidade(); as unidade) {
        <div ucamShellAcoes class="hidden md:block">
          <span class="ucam-campus ucam-campus--faixa">
            <ucam-icon name="mapPin" size="sm" aria-hidden="true" />
            <span class="ucam-sr-only">Unidade:</span>
            <span>{{ unidade }}</span>
          </span>
        </div>
      }

      <div ucamShellNavRodape class="ucam-cluster ucam-cluster--entre">
        <ucam-button variant="ghost" iconStart="logOut" (click)="sair()">Sair</ucam-button>
        <app-tema-toggle />
      </div>

      <ng-content />
    </ucam-app-shell>
  `,
})
export class MolduraBanca {
  /** Em que destino a pessoa está. */
  readonly secao = input.required<'redacoes' | 'isencao' | 'provas'>();
  /** Quantas redações esperam correção: a contagem ao lado do destino. */
  readonly emEspera = input<number | null>(null);
  /** Quantas solicitações de isenção ainda não foram concluídas. */
  readonly isencoes = input<number | null>(null);

  readonly sessao = inject(SessaoBanca);
  private readonly router = inject(Router);
  private readonly navegador = inject(Navegador);

  readonly usuario = computed(() => {
    const nome = this.sessao.usuario()?.nome;
    return nome ? { name: nome } : null;
  });

  /** Encerra a sessão e devolve ao login único; no protótipo, à porta de entrada. */
  sair(): void {
    this.sessao.encerrar();
    if (environment.loginUrl) this.navegador.irParaExterno(environment.loginUrl);
    else void this.router.navigate(['/']);
  }

  readonly grupos = computed<UcamNavGroup[]>(() => [
    {
      label: 'Correção',
      items: [
        { label: 'Redações', icon: 'pencil', href: '/banca/redacoes', current: this.secao() === 'redacoes', count: this.emEspera() },
      ],
    },
    {
      label: 'Isenção',
      items: [
        { label: 'Fila de análise', icon: 'clipboardCheck', href: '/banca/isencao', current: this.secao() === 'isencao', count: this.isencoes() },
      ],
    },
    {
      label: 'Cadastro',
      items: [{ label: 'Provas', icon: 'fileText', href: '/banca/provas', current: this.secao() === 'provas' }],
    },
  ]);
}
