import { DestroyRef, Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { NG_VALIDATORS, type AbstractControl, type ValidationErrors, type Validator } from '@angular/forms';

/**
 * Contrato: spec/components/input-group.json (prop "mascara").
 *
 * A mesma regra do mascaraScript do Trilho A (tools/lib/shell.mjs): o campo
 * põe a pontuação enquanto se digita, e o que a pessoa digita é só dígito.
 * Nasceu de 06/11/2026 ("crie máscaras"): o campo de valor da demo do
 * InputGroup aceitava "980,0012123" com o R$ ao lado prometendo dinheiro.
 *
 * O ouvinte de input é de CAPTURA no próprio campo. Na fase do alvo, captura
 * roda antes de bolha, e é na bolha que o DefaultValueAccessor do ngModel lê
 * o valor: assim o modelo já recebe o texto formatado, sem segundo evento.
 *
 * Como validador (NG_VALIDATORS), devolve { mascara: frase } quando o valor
 * está incompleto ou o dígito do CPF/CNPJ não fecha. A frase é a do contrato,
 * pronta para o <ucam-field error>. Moeda não tem erro de formato.
 */
export type UcamMascaraTipo = 'moeda' | 'cpf' | 'cnpj' | 'telefone' | 'cep';

const REGRAS: Record<UcamMascaraTipo, { modo: string; max: number; molde?: string; frase?: string }> = {
  moeda: { modo: 'decimal', max: 13 },
  cpf: { modo: 'numeric', max: 11, molde: '000.000.000-00', frase: 'CPF inválido. Confira os 11 dígitos.' },
  cnpj: { modo: 'numeric', max: 14, molde: '00.000.000/0000-00', frase: 'CNPJ inválido. Confira os 14 dígitos.' },
  telefone: { modo: 'tel', max: 11, frase: 'Telefone incompleto. Use DDD e número.' },
  cep: { modo: 'numeric', max: 8, molde: '00000-000', frase: 'CEP incompleto. São 8 dígitos.' },
};

function digitos(v: string, max: number): string {
  return String(v).replace(/\D/g, '').slice(0, max);
}

function molda(d: string, molde: string): string {
  let s = '';
  let i = 0;
  for (let k = 0; k < molde.length && i < d.length; k++) s += molde[k] === '0' ? d[i++] : molde[k];
  return s;
}

function moeda(d: string): string {
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (!d) return '0,00';
  d = d.padStart(3, '0');
  return d.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d.slice(-2);
}

function dv(d: string, pesos: number[]): number {
  const s = pesos.reduce((acc, p, i) => acc + Number(d[i]) * p, 0);
  const r = s % 11;
  return r < 2 ? 0 : 11 - r;
}

/** Formata um valor qualquer pela máscara. Exportada para quem monta o valor inicial. */
export function formataMascara(tipo: UcamMascaraTipo, v: string): string {
  const r = REGRAS[tipo];
  const d = digitos(v, r.max);
  if (tipo === 'moeda') return moeda(d);
  if (tipo === 'telefone') return molda(d, d.length > 10 ? '(00) 00000-0000' : '(00) 0000-0000');
  return molda(d, r.molde!);
}

/** O valor está completo (e, em CPF e CNPJ, o dígito verificador fecha). */
export function mascaraValida(tipo: UcamMascaraTipo, v: string): boolean {
  const d = digitos(v, 99);
  if (tipo === 'cpf') {
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    return dv(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[9]) && dv(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
  }
  if (tipo === 'cnpj') {
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    return (
      dv(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
      dv(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
    );
  }
  if (tipo === 'telefone') return d.length === 10 || d.length === 11;
  if (tipo === 'cep') return d.length === 8;
  return true;
}

@Directive({
  selector: 'input[ucamMascara]',
  exportAs: 'ucamMascara',
  host: {
    '[attr.inputmode]': 'modo()',
    '[attr.data-mascara]': 'ucamMascara()',
    autocomplete: 'off',
  },
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => UcamMascara), multi: true }],
})
export class UcamMascara implements Validator {
  readonly ucamMascara = input.required<UcamMascaraTipo>();

  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  protected modo(): string {
    return REGRAS[this.ucamMascara()].modo;
  }

  constructor() {
    const aoDigitar = () => {
      const m = formataMascara(this.ucamMascara(), this.el.value);
      if (m !== this.el.value) {
        this.el.value = m;
        this.el.setSelectionRange(m.length, m.length);
      }
    };
    this.el.addEventListener('input', aoDigitar, true);
    inject(DestroyRef).onDestroy(() => this.el.removeEventListener('input', aoDigitar, true));
  }

  validate(c: AbstractControl): ValidationErrors | null {
    const v = c.value == null ? '' : String(c.value);
    const tipo = this.ucamMascara();
    if (!v || mascaraValida(tipo, v)) return null;
    return { mascara: REGRAS[tipo].frase };
  }
}
