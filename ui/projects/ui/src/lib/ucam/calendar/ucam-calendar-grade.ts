/**
 * A GRADE DO MÊS, UMA SÓ (ADR-074). O popover do UcamDateField e o
 * UcamCalendar montam o mês por aqui — é o par Trilho B do FN_CALENDARIO de
 * tools/lib/shell.mjs. Duas grades teriam dois nomes de dia, dois desenhos do
 * intervalo e dois jeitos de bloquear min/max, e o primeiro defeito corrigido
 * numa delas não chegaria à outra.
 */

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const SEMANA: [string, string][] = [
  ['D', 'domingo'], ['S', 'segunda'], ['T', 'terça'], ['Q', 'quarta'],
  ['Q', 'quinta'], ['S', 'sexta'], ['S', 'sábado'],
];

export const doisD = (n: number) => (n < 10 ? '0' : '') + n;
export const isoDe = (d: Date) => `${d.getFullYear()}-${doisD(d.getMonth() + 1)}-${doisD(d.getDate())}`;
export const deIso = (iso: string) => new Date(iso + 'T00:00:00');
export const hojeLocal = () => {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
};

/** Um período em ISO. O fim pode faltar enquanto a pessoa ainda escolhe. */
export interface UcamDateRange {
  start: string | null;
  end: string | null;
}

export type UcamCalendarTone = 'danger' | 'warning' | 'info' | 'success';

/** Um evento da agenda: o que cai num dia. */
export interface UcamCalendarEvent {
  /** ISO, aaaa-mm-dd. */
  date: string;
  title: string;
  /** Apoio, nunca a informação: o título diz o que é. Sem tom, o ponto é neutro (feriado). */
  tone?: UcamCalendarTone;
}

export interface DiaCal {
  iso: string;
  dia: number;
  rotulo: string;
  /** Fora de min/max: aria-disabled, focável, não se escolhe. */
  fora: boolean;
  /** Ponta escolhida: o dia, ou o início e o fim do período. */
  escolhido: boolean;
  /** Miolo do período, entre as duas pontas. */
  noPeriodo: boolean;
  hoje: boolean;
  eventos: UcamCalendarEvent[];
}

export interface OpcoesMes {
  escolhido?: string | null;
  periodo?: UcamDateRange | null;
  min?: string | null;
  max?: string | null;
  eventos?: Record<string, UcamCalendarEvent[]>;
}

/** As semanas do mês do foco, de domingo a sábado, com vazio antes do dia 1. */
export function montarMes(foco: Date, o: OpcoesMes = {}): (DiaCal | null)[][] {
  const ano = foco.getFullYear();
  const mes = foco.getMonth();
  const dias = new Date(ano, mes + 1, 0).getDate();
  const hj = isoDe(hojeLocal());
  const de = o.periodo?.start || '';
  const ate = o.periodo?.end || '';
  const linhas: (DiaCal | null)[][] = [];
  let linha: (DiaCal | null)[] = Array(new Date(ano, mes, 1).getDay()).fill(null);
  for (let dia = 1; dia <= dias; dia++) {
    const d = new Date(ano, mes, dia);
    const iso = isoDe(d);
    const escolhido = iso === o.escolhido || (!!de && iso === de) || (!!ate && iso === ate);
    const noPeriodo = !escolhido && !!de && !!ate && iso > de && iso < ate;
    const eventos = o.eventos?.[iso] ?? [];
    let rotulo = `${dia} de ${MESES[mes]} de ${ano}, ${SEMANA[d.getDay()][1]}`;
    if (noPeriodo) rotulo += ', no período';
    if (eventos.length) {
      rotulo += `, ${eventos.length} ${eventos.length > 1 ? 'eventos' : 'evento'}: ${eventos.map((e) => e.title).join(', ')}`;
    }
    linha.push({
      iso,
      dia,
      rotulo,
      fora: (!!o.min && iso < o.min) || (!!o.max && iso > o.max),
      escolhido,
      noPeriodo,
      hoje: iso === hj,
      eventos,
    });
    if (d.getDay() === 6 || dia === dias) {
      linhas.push(linha);
      linha = [];
    }
  }
  return linhas;
}

/** Um dia, uma semana ou um mês. Mês mantém o dia, ou para no último quando o seguinte é mais curto. */
export function passoCal(foco: Date, dias: number, meses = 0): Date {
  let d = new Date(foco.getFullYear(), foco.getMonth() + meses, foco.getDate() + dias);
  if (meses && d.getDate() !== foco.getDate()) d = new Date(foco.getFullYear(), foco.getMonth() + meses + 1, 0);
  return d;
}

/** O teclado da grade, o mesmo do Trilho A: [dias, meses]. Home/End dependem do foco. */
export const TECLAS_CAL: Record<string, [number, number?]> = {
  ArrowLeft: [-1],
  ArrowRight: [1],
  ArrowUp: [-7],
  ArrowDown: [7],
  PageUp: [0, -1],
  PageDown: [0, 1],
};

/**
 * A pele da grade, a do .ucam-calendario do Trilho A, para os dois
 * hospedeiros que a desenham. Constante, e não função do seletor: o
 * compilador do Angular precisa ler os estilos sem executar nada.
 */
export const CSS_GRADE = `
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__cabeca {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ucam-space-inline-xs);
      margin-block-end: var(--ucam-space-inline-xs);
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__mes {
      font-weight: var(--ucam-typography-label-font-weight);
      font-size: var(--ucam-typography-body-sm-font-size);
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__mes::first-letter { text-transform: uppercase; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__grade { inline-size: 100%; border-collapse: collapse; table-layout: fixed; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__grade th {
      padding-block: 0.25rem;
      background: none;
      border: 0;
      font-family: inherit;
      letter-spacing: normal;
      font-size: var(--ucam-typography-caption-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-secondary);
      text-align: center;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__grade td { padding: 1px; text-align: center; background: none; border: 0; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia {
      inline-size: 100%;
      aspect-ratio: 1;
      min-block-size: 2rem;
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: none;
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      font-variant-numeric: tabular-nums;
      color: var(--ucam-color-text-primary);
      cursor: pointer;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia:hover { background: var(--ucam-color-interaction-hover); }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 1px;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[aria-current='date'] {
      font-weight: var(--ucam-typography-action-font-weight);
      text-decoration: underline;
      text-underline-offset: 0.25em;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[aria-pressed='true'] {
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-action);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[data-intervalo]:not([aria-pressed='true']) {
      background: var(--ucam-color-action-primary-subtle);
      border-radius: 0;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[aria-disabled='true'] {
      color: var(--ucam-color-text-disabled);
      background: none;
      cursor: not-allowed;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__pe {
      display: flex;
      justify-content: flex-end;
      margin-block-start: var(--ucam-space-inline-xs);
      padding-block-start: var(--ucam-space-inline-xs);
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    @media (forced-colors: active) {
      :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[aria-pressed='true'] { outline: 2px solid CanvasText; }
      :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[data-intervalo] { outline: 1px dashed CanvasText; outline-offset: -2px; }
    }
`;
