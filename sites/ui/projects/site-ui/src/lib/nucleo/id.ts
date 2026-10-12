import { Injectable } from '@angular/core';

/**
 * Ids para ligar rótulo, campo e mensagens quando o consumidor não dá um.
 *
 * É um serviço da aplicação, não um contador de módulo: no servidor um
 * contador de módulo atravessaria as requisições, e a segunda página renderizada
 * já nasceria com ids diferentes dos que o cliente gera ao hidratar. Por
 * aplicação, servidor e cliente criam as peças na mesma ordem e chegam aos
 * mesmos ids.
 */
@Injectable({ providedIn: 'root' })
export class UcamSiteIds {
  private n = 0;

  proximo(prefixo: string): string {
    return `${prefixo}-${++this.n}`;
  }
}
