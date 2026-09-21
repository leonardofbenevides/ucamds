import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';

import { config } from './app/app.config.server';
import { AppComponent } from './app/app.component';

// O Analog chama este default export como render(url, document) durante o
// prerender — não como bootstrap. Quem cria o BootstrapContext exigido pelo
// Angular 22 é renderApplication; passá-lo adiante é obrigatório, senão toda
// rota falha com NG0401 e o build ainda assim termina "com sucesso",
// escrevendo páginas vazias.
//
// Sem zone.js: a aplicação é zoneless (provideZonelessChangeDetection).
export default function render(url: string, document: string): Promise<string> {
  return renderApplication(
    (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context),
    { document, url },
  );
}
