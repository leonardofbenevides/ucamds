import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideFileRouter } from '@analogjs/router';
import { withInMemoryScrolling, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideZardCharts } from '@/shared/components/chart/chart-echarts.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(
      // Sem isto, as páginas [id] só leriam o parâmetro no primeiro carregamento.
      withComponentInputBinding(),
      // anchorScrolling é o que faz os links do sumário de cada página funcionarem.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withFetch()),
    // O motor do ECharts entra por import dinâmico: a página que não desenha
    // gráfico não baixa o megabyte. Sem este provider o z-chart não renderiza.
    provideZardCharts(),
  ],
};
