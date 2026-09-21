/**
 * Entrada auxiliar de MEDIÇÃO, não de distribuição.
 *
 * Registra só o Button — o componente mais simples do catálogo — para separar
 * o PISO do trilho (runtime do Angular zoneless + @angular/elements) do custo
 * marginal por componente. É de onde sai o número citado na ADR-010: sem esta
 * medição, "o piso domina" seria opinião.
 *
 *   UCAM_ENTRY=medir-piso.ts pnpm --filter @ucam/elements build
 *
 * Sai em dist/elements/medicao.js e não deve ser publicado.
 */
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

import { UcamButton } from '@ucam/ui';

import './styles.css';

createApplication({ providers: [provideZonelessChangeDetection()] }).then((app) => {
  customElements.define('ucam-button', createCustomElement(UcamButton, { injector: app.injector }));
});
