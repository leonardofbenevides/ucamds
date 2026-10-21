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

/* ------------------------------------------------- os tipos (ADR-077) --- */

/** Dia, mês, semestre ou ano: o que o calendário ESCOLHE. */
export type UcamCalendarPrecision = 'day' | 'month' | 'semester' | 'year';
/** O que está à vista: a precisão, ou um nível acima dela enquanto se navega. */
export type NivelCal = 'dia' | 'mes' | 'semestre' | 'ano';

export const NIVEL_DA: Record<UcamCalendarPrecision, NivelCal> = { day: 'dia', month: 'mes', semester: 'semestre', year: 'ano' };
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * A chave de cada tipo: dia aaaa-mm-dd, mês aaaa-mm, semestre aaaa.1
 * (jan–jun) ou aaaa.2 (jul–dez) — a notação que as telas já usam —, ano aaaa.
 * Dentro de um tipo, comparar as chaves como texto é comparar as datas.
 */
export function chaveDe(d: Date, nivel: NivelCal): string {
  if (nivel === 'mes') return isoDe(d).slice(0, 7);
  if (nivel === 'semestre') return `${d.getFullYear()}.${d.getMonth() < 6 ? 1 : 2}`;
  if (nivel === 'ano') return String(d.getFullYear());
  return isoDe(d);
}

/** O primeiro e o último dia que a chave cobre, em ISO. */
export function cobre(chave: string, nivel: NivelCal): [string, string] {
  if (nivel === 'mes') {
    const [a, m] = chave.split('-').map(Number);
    return [`${chave}-01`, isoDe(new Date(a, m, 0))];
  }
  if (nivel === 'semestre') {
    const a = chave.slice(0, 4);
    return chave.slice(5) === '1' ? [`${a}-01-01`, `${a}-06-30`] : [`${a}-07-01`, `${a}-12-31`];
  }
  if (nivel === 'ano') return [`${chave}-01-01`, `${chave}-12-31`];
  return [chave, chave];
}

export interface OpcaoCal {
  chave: string;
  texto: string;
  sub?: string;
  rotulo: string;
  fora: boolean;
  escolhido: boolean;
  noPeriodo: boolean;
  atual: boolean;
}

/** As opções de um nível acima do dia: 12 meses, 2 semestres ou 12 anos. */
export function montarOpcoes(
  nivel: Exclude<NivelCal, 'dia'>,
  foco: Date,
  o: { escolhido?: string | null; periodo?: UcamDateRange | null; min?: string | null; max?: string | null; marca: boolean },
): OpcaoCal[] {
  const ano = foco.getFullYear();
  const b0 = ano - (ano % 12);
  const base: { chave: string; texto: string; sub?: string; rotulo: string }[] = [];
  if (nivel === 'mes') for (let m = 0; m < 12; m++) base.push({ chave: `${ano}-${doisD(m + 1)}`, texto: MESES_CURTOS[m], rotulo: `${MESES[m]} de ${ano}` });
  if (nivel === 'semestre') {
    base.push({ chave: `${ano}.1`, texto: '1º semestre', sub: `${ano}.1 · jan – jun`, rotulo: `1º semestre de ${ano}, janeiro a junho` });
    base.push({ chave: `${ano}.2`, texto: '2º semestre', sub: `${ano}.2 · jul – dez`, rotulo: `2º semestre de ${ano}, julho a dezembro` });
  }
  if (nivel === 'ano') for (let a = b0; a < b0 + 12; a++) base.push({ chave: String(a), texto: String(a), rotulo: String(a) });
  const hj = chaveDe(hojeLocal(), nivel);
  const de = o.marca ? o.periodo?.start || '' : '';
  const ate = o.marca ? o.periodo?.end || '' : '';
  return base.map((b) => {
    const [ini, fim] = cobre(b.chave, nivel);
    const escolhido = o.marca && (b.chave === o.escolhido || (!!de && b.chave === de) || (!!ate && b.chave === ate));
    const noPeriodo = !escolhido && !!de && !!ate && b.chave > de && b.chave < ate;
    return {
      ...b,
      rotulo: b.rotulo + (noPeriodo ? ', no período' : ''),
      fora: (!!o.min && fim < o.min) || (!!o.max && ini > o.max),
      escolhido,
      noPeriodo,
      atual: b.chave === hj,
    };
  });
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
    /* OS NÍVEIS (ADR-077). O título é botão quando há nível acima: dias →
     * meses → anos. Diz que é clicável em repouso pelo chevron (a seta de
     * destino de 25/09/2026), sem caixa até o hover. */
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__titulo {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-block-size: 2rem;
      padding: 0 0.5rem;
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: none;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__titulo:hover { background: var(--ucam-color-interaction-hover); }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__titulo:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 1px;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__titulo .ic { inline-size: var(--ucam-size-icon-xs); block-size: var(--ucam-size-icon-xs); color: var(--ucam-color-text-secondary); }
    /* As grades de mês, semestre e ano ocupam a mesma caixa da grade de dias:
     * trocar de nível não pode fazer o calendário pular de tamanho. */
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcoes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.25rem;
      min-block-size: 15.25rem;
      align-content: start;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcoes--semestres { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      min-block-size: 3.5rem;
      padding: 0.25rem;
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: none;
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      font-variant-numeric: tabular-nums;
      color: var(--ucam-color-text-primary);
      cursor: pointer;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcoes--semestres :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao { min-block-size: 5rem; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao-texto::first-letter { text-transform: uppercase; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao-sub {
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao:hover { background: var(--ucam-color-interaction-hover); }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 1px;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[aria-current='date'] {
      font-weight: var(--ucam-typography-action-font-weight);
      text-decoration: underline;
      text-underline-offset: 0.25em;
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[aria-pressed='true'] {
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-action);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[aria-pressed='true'] :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao-sub { color: inherit; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[data-intervalo]:not([aria-pressed='true']) { background: var(--ucam-color-action-primary-subtle); }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[aria-disabled='true'] { color: var(--ucam-color-text-disabled); cursor: not-allowed; }
    :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[aria-disabled='true']:hover { background: none; }
    @media (forced-colors: active) {
      :is(ucam-calendar, ucam-date-field) .ucam-calendario__opcao[aria-pressed='true'] { outline: 2px solid CanvasText; }
    }

    @media (forced-colors: active) {
      :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[aria-pressed='true'] { outline: 2px solid CanvasText; }
      :is(ucam-calendar, ucam-date-field) .ucam-calendario__dia[data-intervalo] { outline: 1px dashed CanvasText; outline-offset: -2px; }
    }
`;
