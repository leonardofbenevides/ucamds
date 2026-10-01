import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { UcamAppShell, UcamIcon, UcamNavGroup, UcamNavItem } from '@ucam/ui';
import { filter, map } from 'rxjs';
import { CandidatoStore } from '../core/store/candidato.store';
import { ProvaStore } from '../core/store/prova.store';
import { Tela, telaPermitida } from '../core/guards/destino-por-situacao';
import { environment } from '../../environments/environment';
import { TemaToggle } from './tema-toggle';
import { RelogioFaixa } from './relogio-faixa';

/**
 * A moldura padrão do DS para toda tela depois da entrada: faixa com a marca
 * do sistema, o campus como contexto e a pessoa; coluna de navegação à
 * esquerda. No vestibular a coluna não é um menu — é o caminho: as etapas em
 * ordem, a atual marcada, as que a situação ainda não libera apagadas (a
 * mesma tabela que o guarda usa, para a navegação não prometer o que ele
 * nega). Abaixo das etapas, quem está fazendo a prova; no pé, ajuda e tema.
 * O relógio da prova vai na faixa, ao lado do campus, para acompanhar
 * qualquer rolagem.
 */
@Component({
  selector: 'app-moldura',
  imports: [UcamAppShell, UcamIcon, TemaToggle, RelogioFaixa],
  template: `
    <ucam-app-shell
      systemName="Vestibular Online"
      systemIcon="graduationCap"
      systemCategory="pessoas"
      [user]="usuario()"
      [homeHref]="home()"
      [navGroups]="grupos()"
    >
      <div ucamShellAcoes class="ucam-cluster">
        <app-relogio-faixa />
        @if (unidade(); as u) {
          <span class="ucam-campus ucam-campus--faixa">
            <ucam-icon name="mapPin" size="sm" aria-hidden="true" />
            <span class="ucam-sr-only">Campus:</span>
            <span>{{ u }}</span>
          </span>
          <span class="ucam-appbar__divider" aria-hidden="true"></span>
        }
        <ng-content select="[ucamShellAcoes]" />
      </div>

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
  `,
})
export class Moldura {
  readonly store = inject(CandidatoStore);
  private readonly prova = inject(ProvaStore);
  private readonly router = inject(Router);
  readonly contato = environment.contatoSecretaria;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly usuario = computed(() => (this.store.nome() ? { name: this.store.nome() } : null));
  readonly home = computed(() => `/candidato/${this.store.oidFip() ?? ''}`);
  readonly unidade = computed(() => this.store.unidade()?.nome ?? this.store.unidade()?.sigla ?? null);

  /** Onde a pessoa está, pela URL: a etapa marcada na coluna. */
  private readonly etapaAtual = computed<Etapa>(() => {
    const url = this.url();
    if (url.includes('/prova/redacao')) return 'redacao';
    if (url.includes('/prova')) return 'objetiva';
    if (url.includes('/instrucoes')) return 'instrucoes';
    if (url.includes('/resultado')) return 'resultado';
    return 'entrada';
  });

  readonly grupos = computed<UcamNavGroup[]>(() => {
    const base = this.home();
    const situacao = this.store.situacao();
    const atual = this.etapaAtual();
    const item = (etapa: Etapa, tela: Tela, label: string, icon: UcamNavItem['icon'], sufixo: string, count?: number): UcamNavItem => {
      const liberada = telaPermitida(situacao, tela);
      return {
        label,
        icon,
        href: liberada ? base + sufixo : undefined,
        current: atual === etapa,
        disabled: !liberada,
        count: count ?? null,
      };
    };
    const itens: UcamNavItem[] = [
      item('entrada', 'entrada', 'Seus dados', 'user', ''),
      item('instrucoes', 'instrucoes', 'Antes de começar', 'listChecks', '/instrucoes'),
      item('objetiva', 'prova', 'Prova objetiva', 'fileText', '/prova', this.contagemObjetiva()),
    ];
    if (this.prova.redacao()) {
      itens.push(item('redacao', 'prova', 'Redação', 'pencil', '/prova/redacao'));
    }
    itens.push(item('resultado', 'resultado', 'Resultado', 'circleCheck', '/resultado'));
    return [{ label: 'Etapas', items: itens }];
  });

  /** Respondidas só enquanto há caderno carregado; antes disso a contagem não existe. */
  private readonly contagemObjetiva = computed(() => (this.prova.totalObjetivas() > 0 ? this.prova.respondidas() : undefined));
}

type Etapa = 'entrada' | 'instrucoes' | 'objetiva' | 'redacao' | 'resultado';
