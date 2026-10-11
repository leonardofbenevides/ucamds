import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

/**
 * Endereço do sprite de ícones. Vazio é o padrão e quer dizer "o sprite está
 * em linha na página": o <use> aponta para `#i-nome`. Com um endereço, aponta
 * para `endereço#i-nome`, que é como um site estático costuma servir o
 * arquivo de @ucam/site-css/icons/sprite.svg.
 */
export const UCAM_SITE_SPRITE = new InjectionToken<string>('UCAM_SITE_SPRITE', {
  providedIn: 'root',
  factory: () => '',
});

export interface UcamSiteOpcoes {
  sprite?: string;
}

export function provideUcamSite(opcoes: UcamSiteOpcoes = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: UCAM_SITE_SPRITE, useValue: opcoes.sprite ?? '' }]);
}
