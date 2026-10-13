import { APP_ID, Injectable, inject } from '@angular/core';

/**
 * Ids para ligar rótulo, campo e mensagens quando o consumidor não dá um.
 *
 * É um serviço da aplicação, não um contador de módulo: no servidor um
 * contador de módulo atravessaria as requisições, e a segunda página renderizada
 * já nasceria com ids diferentes dos que o cliente gera ao hidratar. Por
 * aplicação, servidor e cliente criam as peças na mesma ordem e chegam aos
 * mesmos ids.
 *
 * Com mais de uma aplicação Angular na página, cada uma tem o seu APP_ID, e
 * ele entra no id: as duas começam a contar do 1. Com @defer ou hidratação
 * incremental a ordem de criação pode diferir entre servidor e cliente; aí
 * vale passar `fieldId`.
 */
@Injectable({ providedIn: 'root' })
export class UcamSiteIds {
  private n = 0;
  private readonly app = inject(APP_ID);

  proximo(prefixo: string): string {
    // 'ng' é o APP_ID de fábrica: fora dele, a aplicação se identifica no id.
    return `${prefixo}-${this.app === 'ng' ? '' : this.app + '-'}${++this.n}`;
  }
}
