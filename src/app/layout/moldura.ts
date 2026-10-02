import { Component, computed, inject, signal } from '@angular/core';
import { UcamAppShell, UcamDescriptionList, UcamDrawer, UcamIcon } from '@ucam/ui';
import { InstrucoesLista } from '../candidato/instrucoes/instrucoes-lista';
import { CandidatoStore } from '../core/store/candidato.store';
import { environment } from '../../environments/environment';
import { EtapasLateral, GavetaEtapa } from './etapas-lateral';
import { LinksInternos } from './links-internos';
import { TemaToggle } from './tema-toggle';
import { RelogioFaixa } from './relogio-faixa';

/**
 * A moldura padrão do DS para toda tela depois da entrada: faixa com a marca
 * do sistema, o campus como contexto e a pessoa; coluna de navegação à
 * esquerda. No vestibular a coluna não é um menu — é o caminho: as etapas em
 * ordem, como stepper (EtapasLateral). As etapas já concluídas abrem aqui, em
 * gaveta: os dados da inscrição e as orientações ficam a um clique sem tirar
 * a pessoa da prova nem parar o relógio. Abaixo das etapas, quem está fazendo
 * a prova; no pé, ajuda e tema. O relógio da prova vai na faixa, ao lado do
 * campus, para acompanhar qualquer rolagem.
 */
@Component({
  selector: 'app-moldura',
  hostDirectives: [LinksInternos],
  imports: [UcamAppShell, UcamDescriptionList, UcamDrawer, UcamIcon, EtapasLateral, InstrucoesLista, TemaToggle, RelogioFaixa],
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="pessoas"
      [user]="usuario()"
      [homeHref]="home()"
    >
      <!-- O QUE CABE NA FAIXA. A 390px, menu, marca e conta já tomam a largura
           inteira: relógio, campus e ações embrulhavam para fora da faixa. O
           campus só entra a partir de 48rem e o resto a partir de 40rem;
           abaixo disso nada se perde — o tempo está na barra da prova, que
           gruda sob a faixa, e o campus e as orientações abrem pelas etapas.
           Os div sem classe do DS existem para o Tailwind decidir o display
           (contents: os filhos continuam sendo itens do cluster). -->
      <div ucamShellAcoes class="ucam-cluster">
        <div class="hidden sm:contents">
          <app-relogio-faixa />
        </div>
        @if (unidade(); as u) {
          <div class="hidden md:contents">
            <span class="ucam-campus ucam-campus--faixa">
              <ucam-icon name="mapPin" size="sm" aria-hidden="true" />
              <span class="ucam-sr-only">Campus:</span>
              <span>{{ u }}</span>
            </span>
            <span class="ucam-appbar__divider" aria-hidden="true"></span>
          </div>
        }
        <div class="hidden sm:contents">
          <ng-content select="[ucamShellAcoes]" />
        </div>
      </div>

      <app-etapas-lateral ucamShellNav (abrir)="abrir($event)" />

      <!-- Quem está na prova, como lista de descrição do DS (contrato
           description-list): um par por dado, o nome primeiro. -->
      <dl ucamShellNav class="ucam-descricao border-t border-[var(--ucam-color-border-subtle)] pt-[var(--ucam-space-stack-md)]" aria-label="Candidato">
        <div class="ucam-descricao__par">
          <dt class="ucam-descricao__rotulo">Candidato</dt>
          <dd class="ucam-descricao__valor">{{ store.nome() }}</dd>
        </div>
        <div class="ucam-descricao__par">
          <dt class="ucam-descricao__rotulo">CPF</dt>
          <dd class="ucam-descricao__valor">{{ store.cpf() }}</dd>
        </div>
        @if (store.curso(); as curso) {
          <div class="ucam-descricao__par">
            <dt class="ucam-descricao__rotulo">Curso</dt>
            <dd class="ucam-descricao__valor">{{ curso }}</dd>
          </div>
        }
        @if (store.turno(); as turno) {
          <div class="ucam-descricao__par">
            <dt class="ucam-descricao__rotulo">Turno</dt>
            <dd class="ucam-descricao__valor">{{ turno }}</dd>
          </div>
        }
      </dl>

      <div ucamShellNavRodape class="ucam-cluster ucam-cluster--entre">
        <a class="ucam-link ucam-cluster" [href]="'mailto:' + contato">
          <ucam-icon name="mail" size="sm" aria-hidden="true" />
          <span>Falar com a secretaria</span>
        </a>
        <app-tema-toggle />
      </div>

      <ng-content />
    </ucam-app-shell>

    <ucam-drawer [(open)]="dadosAbertos" title="Seus dados" description="Os dados desta inscrição." side="end" size="sm">
      <div class="ucam-stack">
        <ucam-description-list [items]="dados()" [columns]="1" layout="stacked" />
        <p class="ucam-field__hint">
          Se algo estiver errado, fale com a secretaria:
          <a class="ucam-link" [href]="'mailto:' + contato">{{ contato }}</a>
        </p>
      </div>
    </ucam-drawer>

    <ucam-drawer [(open)]="instrucoesAbertas" title="Como a prova funciona" side="end" size="sm">
      <app-instrucoes-lista />
    </ucam-drawer>
  `,
})
export class Moldura {
  readonly store = inject(CandidatoStore);
  readonly contato = environment.contatoSecretaria;

  readonly dadosAbertos = signal(false);
  readonly instrucoesAbertas = signal(false);

  readonly usuario = computed(() => (this.store.nome() ? { name: this.store.nome() } : null));
  readonly home = computed(() => `/candidato/${this.store.oidFip() ?? ''}`);
  readonly unidade = computed(() => this.store.unidade()?.nome ?? this.store.unidade()?.sigla ?? null);

  /** Tudo o que a inscrição diz sobre a pessoa, para conferir a qualquer momento. */
  readonly dados = computed(() => {
    const t = this.store.tentativas();
    return [
      { label: 'Nome', value: this.store.nome() },
      { label: 'CPF', value: this.store.cpf() },
      { label: 'Curso', value: this.store.curso() },
      { label: 'Turno', value: this.store.turno() },
      { label: 'Unidade', value: this.unidade() },
      ...(t ? [{ label: 'Tentativa', value: `${t.tentativaAtual} de ${t.totalTentativasPossiveis}` }] : []),
    ];
  });

  abrir(gaveta: GavetaEtapa): void {
    (gaveta === 'dados' ? this.dadosAbertos : this.instrucoesAbertas).set(true);
  }
}
