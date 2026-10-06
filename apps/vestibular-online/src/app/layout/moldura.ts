import { Component, computed, inject, signal } from '@angular/core';
import { UcamAppShell, UcamAvatar, UcamCard, UcamDescriptionList, UcamDrawer, UcamIcon, type UcamDescriptionItem } from '@ucam/ui';
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
  imports: [UcamAppShell, UcamAvatar, UcamCard, UcamDescriptionList, UcamDrawer, UcamIcon, EtapasLateral, InstrucoesLista, TemaToggle, RelogioFaixa],
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="pessoas"
      maxContentWidth="none"
      [user]="usuario()"
      [homeHref]="home()"
    >
      <!-- O QUE CABE NA FAIXA. A 390px, menu, marca e conta já tomam a largura
           inteira: relógio, campus e ações embrulhavam para fora da faixa. O
           relógio e as ações entram a partir de 40rem e o campus só a partir
           de 64rem — em 48rem, com a escala ampla, os três juntos quebravam a
           faixa em duas linhas (medido em 07/10/2026). Abaixo disso nada se
           perde: o tempo está na barra da prova, que gruda sob a faixa, e o
           campus está no cartão do candidato, na coluna. A fileira não
           embrulha nunca: o que não cabe sai, não desce.
           Os div sem classe do DS existem para o Tailwind decidir o display
           (contents: os filhos continuam sendo itens do cluster). -->
      <div ucamShellAcoes class="ucam-cluster" style="flex-wrap: nowrap">
        <div class="hidden sm:contents">
          <app-relogio-faixa />
        </div>
        @if (unidade(); as u) {
          <div class="hidden lg:contents">
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

      <!-- Quem está na prova. O cartão é a IDENTIDADE de quem a tela é: o
           avatar veste a superfície de marca (o par da faixa), o nome é o
           título do cartão, e os dados da inscrição vêm empilhados — rótulo em
           cima, valor embaixo, um por linha: num cartão de 16rem nem o CPF cabe
           em meia coluna. Até 06/10/2026 era uma lista em duas colunas com um ícone
           por rótulo: o nome do curso quebrava em três linhas numa coluna de
           7rem, e três ícones cinza disputavam com três palavras. O avatar é
           decorativo porque o nome está ao lado. -->
      <div ucamShellNav>
        <ucam-card as="section">
          <div class="ucam-stack">
            <div class="ucam-card__cabecalho" data-candidato>
              <ucam-avatar [name]="store.nome()" size="lg" tone="marca" decorative />
              <span class="ucam-card__cabecalho-texto">
                <span class="ucam-card__titulo">{{ store.nome() }}</span>
                <span class="ucam-card__apoio">Sua inscrição</span>
              </span>
            </div>
            <div data-dados-candidato>
              <ucam-description-list [items]="dadosColuna()" [columns]="1" />
            </div>
          </div>
        </ucam-card>
      </div>

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

  /**
   * Os dados da inscrição no cartão da coluna, na ordem do que a pessoa
   * confere primeiro: para que curso, em que campus, em que turno — e o CPF,
   * que é como a secretaria a acha.
   */
  readonly dadosColuna = computed<UcamDescriptionItem[]>(() => {
    const curso = this.store.curso();
    const turno = this.store.turno();
    const campus = this.unidade();
    return [
      ...(curso ? [{ label: 'Curso', value: curso }] : []),
      ...(campus ? [{ label: 'Campus', value: campus }] : []),
      ...(turno ? [{ label: 'Turno', value: turno }] : []),
      { label: 'CPF', value: this.store.cpf() },
    ];
  });

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
