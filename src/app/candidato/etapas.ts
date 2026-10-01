import { UcamStepItem } from '@ucam/ui';

/** As etapas do fluxo do candidato, como o stepper mostra nas telas. */
export const ETAPAS_CANDIDATO = ['Seus dados', 'Antes de começar', 'Prova', 'Resultado'] as const;

export function etapas(atual: number): UcamStepItem[] {
  return ETAPAS_CANDIDATO.map((label, i) => ({ label, state: i < atual ? 'done' : i === atual ? 'current' : 'todo' }));
}
