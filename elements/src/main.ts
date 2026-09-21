/**
 * Trilho A+ — @ucam/ui empacotado como custom elements.
 *
 * PROTÓTIPO DE MEDIÇÃO (ADR-010). O propósito deste bundle é responder uma
 * pergunta com número, não com opinião: quanto custa entregar ao parque legado
 * os componentes que o CSS sozinho não consegue carregar.
 *
 * O Trilho A (@ucam/css) resolve tudo que é aparência e estado declarável em
 * classe. Não resolve o que precisa de comportamento: o combobox com busca, a
 * retenção de foco do diálogo, a paginação acessível. Para esses, o legado hoje
 * reimplementa à mão — e reimplementa errado, que é o que a evidência dos
 * contratos registra.
 *
 * Zoneless é obrigatório aqui, não preferência: o AngularJS do Protocolo tem o
 * próprio ciclo de digest, e zone.js sobre ele significa dois laços de detecção
 * disputando a mesma página.
 */
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, type Type } from '@angular/core';

import {
  UcamButton,
  UcamCombobox,
  UcamDialog,
  UcamPagination,
  UcamSelect,
  UcamTextField,
} from '@ucam/ui';

import './styles.css';

/**
 * Os nomes de tag são os mesmos do contrato — `ucam-button` aqui é o mesmo
 * `<ucam-button>` que uma aplicação Angular importa. É a regra da ADR-006 vista
 * do outro lado: o consumidor não precisa saber por qual trilho o componente
 * chegou.
 *
 * Consequência que precisa estar escrita: uma página NÃO pode carregar este
 * bundle e a biblioteca Angular ao mesmo tempo. O registro do custom element é
 * global no documento e a segunda definição do mesmo nome lança.
 */
const REGISTRO: [string, Type<unknown>][] = [
  ['ucam-button', UcamButton],
  ['ucam-text-field', UcamTextField],
  ['ucam-select', UcamSelect],
  ['ucam-combobox', UcamCombobox],
  // Os dois que a ADR-010 cita como motivo e o protótipo não registrava: o
  // diálogo, pela retenção de foco, e a paginação, pelo nome acessível. Eram
  // justamente os casos que o legado reimplementava errado — deixá-los de fora
  // era entregar o trilho sem as peças que o justificam.
  ['ucam-dialog', UcamDialog],
  ['ucam-pagination', UcamPagination],
];

createApplication({ providers: [provideZonelessChangeDetection()] })
  .then((app) => {
    for (const [nome, componente] of REGISTRO) {
      if (customElements.get(nome)) continue;
      customElements.define(nome, createCustomElement(componente, { injector: app.injector }));
    }
  })
  .catch((erro) => {
    // Falhar em silêncio deixaria a página legada com tags inertes e sem
    // pista do motivo — pior do que o erro no console.
    console.error('[ucam] falha ao registrar os custom elements', erro);
  });
