import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { UcamIcon } from '@ucam/ui';
import { filter, map } from 'rxjs';
import { CandidatoStore } from '../core/store/candidato.store';
import { ProvaStore } from '../core/store/prova.store';
import { environment } from '../../environments/environment';

export type EstadoEtapa = 'done' | 'current' | 'todo';
/** O que uma etapa já concluída abre sem tirar a pessoa de onde está. */
export type GavetaEtapa = 'dados' | 'instrucoes';

export interface EtapaLateral {
  id: 'dados' | 'instrucoes' | 'prova' | 'objetiva' | 'redacao' | 'resultado';
  label: string;
  estado: EstadoEtapa;
  dica: string | null;
  /** Etapa que é uma tela: a rota dela. */
  link: unknown[] | null;
  /** Etapa concluída que se consulta numa gaveta, por cima da tela atual. */
  abre: GavetaEtapa | null;
  /** É a tela que a pessoa está vendo agora. */
  vista: boolean;
}

const ESTADOS: Record<EstadoEtapa, string> = { done: 'concluída', current: 'atual', todo: 'a fazer' };

/**
 * O caminho do candidato como stepper vertical, na coluna da moldura: número
 * de cada etapa, check nas concluídas, a atual preenchida e o fio que as liga.
 * Etapa concluída continua consultável — os dados e as orientações abrem em
 * gaveta, para a prova e o relógio seguirem na tela; etapa futura não é
 * clicável (contrato do stepper). O arranjo vertical ainda não existe no DS:
 * as peças são as do `.ucam-stepper`, e só a direção é daqui.
 */
@Component({
  selector: 'app-etapas-lateral',
  imports: [NgTemplateOutlet, RouterLink, UcamIcon],
  templateUrl: './etapas-lateral.html',
  styles: `
    :host {
      display: block;
      margin-block-end: var(--ucam-space-stack-md);
    }
    .etapas__titulo {
      display: flex;
      justify-content: space-between;
      margin: 0 0 var(--ucam-space-stack-sm);
      padding-inline: var(--ucam-space-inline-sm);
      font-size: var(--ucam-typography-caption-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-secondary);
    }
    .etapas {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 0;
    }
    .etapas .ucam-stepper__passo {
      display: block;
      font-size: var(--ucam-typography-body-font-size);
    }
    .etapas .ucam-stepper__passo--done {
      color: var(--ucam-color-text-primary);
    }
    .etapas .ucam-stepper__marcador {
      inline-size: var(--ucam-size-control-sm);
      block-size: var(--ucam-size-control-sm);
    }
    /* O fio desce pelo eixo dos marcadores. */
    .etapas .ucam-stepper__conector {
      flex: none;
      min-inline-size: 0;
      inline-size: 1px;
      block-size: var(--ucam-space-stack-sm);
      margin-inline-start: calc(var(--ucam-space-inline-sm) + var(--ucam-size-control-sm) / 2);
    }
    .etapas__linha {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      inline-size: 100%;
      min-block-size: var(--ucam-size-touch-min);
      padding: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
      text-decoration: none;
    }
    a.etapas__linha,
    button.etapas__linha {
      cursor: pointer;
    }
    a.etapas__linha:hover,
    button.etapas__linha:hover {
      background: var(--ucam-color-interaction-hover);
    }
    .etapas__linha:focus-visible {
      outline: 2px solid var(--ucam-color-border-focus);
      outline-offset: 2px;
    }
    a.etapas__linha[aria-current='page'] {
      background: var(--ucam-color-action-primary-subtle);
    }
    .etapas__texto {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }
  `,
})
export class EtapasLateral {
  private readonly candidato = inject(CandidatoStore);
  private readonly prova = inject(ProvaStore);
  private readonly router = inject(Router);

  readonly abrir = output<GavetaEtapa>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly etapas = computed<EtapaLateral[]>(() => {
    const base = ['/candidato', this.candidato.oidFip()];
    const url = this.url();
    const situacao = this.candidato.situacao() ?? 'CADASTRADO';
    const antes = situacao === 'CADASTRADO';
    const fazendo = situacao === 'PROVA_INICIADA';
    const naRedacao = url.includes('/prova/redacao');
    const naProva = url.includes('/prova');

    const lista: EtapaLateral[] = [
      { id: 'dados', label: 'Seus dados', estado: 'done', dica: null, link: null, abre: 'dados', vista: false },
      antes
        ? {
            id: 'instrucoes',
            label: 'Antes de começar',
            estado: 'current',
            dica: null,
            link: [...base, 'instrucoes'],
            abre: null,
            vista: url.includes('/instrucoes'),
          }
        : { id: 'instrucoes', label: 'Antes de começar', estado: 'done', dica: null, link: null, abre: 'instrucoes', vista: false },
    ];

    // O caderno só é conhecido depois de carregado: antes disso a prova é uma etapa só.
    const total = this.prova.totalObjetivas();
    const redacao = !!this.prova.redacao();
    const estadoProva = (vista: boolean, completa: boolean): EstadoEtapa =>
      antes ? 'todo' : !fazendo ? 'done' : vista ? 'current' : completa ? 'done' : 'todo';

    if (!total && !redacao) {
      lista.push({
        id: 'prova',
        label: 'Prova',
        estado: antes ? 'todo' : fazendo ? 'current' : 'done',
        dica: null,
        link: fazendo ? [...base, 'prova'] : null,
        abre: null,
        vista: naProva,
      });
    }
    if (total) {
      const respondidas = this.prova.respondidas();
      lista.push({
        id: 'objetiva',
        label: 'Prova objetiva',
        estado: estadoProva(naProva && !naRedacao, respondidas === total),
        dica: fazendo ? `${respondidas} de ${total} respondidas` : null,
        link: fazendo ? [...base, 'prova'] : null,
        abre: null,
        vista: naProva && !naRedacao,
      });
    }
    if (redacao) {
      const caracteres = this.prova.caracteresRedacao();
      const minimo = caracteres >= environment.redacaoMin;
      lista.push({
        id: 'redacao',
        label: 'Redação',
        estado: estadoProva(naRedacao, minimo),
        dica: !fazendo ? null : caracteres === 0 ? 'Em branco' : minimo ? 'Mínimo atingido' : 'Rascunho',
        link: fazendo ? [...base, 'prova', 'redacao'] : null,
        abre: null,
        vista: naRedacao,
      });
    }

    const entregue = !antes && !fazendo;
    lista.push({
      id: 'resultado',
      label: 'Resultado',
      estado: entregue ? 'current' : 'todo',
      dica: null,
      link: entregue ? [...base, 'resultado'] : null,
      abre: null,
      vista: url.includes('/resultado'),
    });
    return lista;
  });

  /** Em que etapa do caminho a pessoa está: a atual ou, na falta, a primeira por fazer. */
  readonly posicao = computed(() => {
    const e = this.etapas();
    const atual = e.findIndex((x) => x.estado === 'current');
    return (atual >= 0 ? atual : Math.max(0, e.findIndex((x) => x.estado === 'todo'))) + 1;
  });

  rotuloEstado(estado: EstadoEtapa): string {
    return ESTADOS[estado];
  }
}
