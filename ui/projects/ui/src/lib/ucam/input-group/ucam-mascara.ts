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
export type UcamMascaraTipo = 'moeda' | 'cpf' | 'cnpj' | 'telefone' | 'cep' | 'digitos' | 'nota' | 'molde';

/** digitos usa `max`; molde usa `molde`, onde 0 é dígito e o resto é literal. */
export interface UcamMascaraOpcoes {
  max?: number;
  molde?: string;
}

const REGRAS: Record<UcamMascaraTipo, { modo: string; max: number; molde?: string; frase?: string }> = {
  digitos: { modo: 'numeric', max: 20 },
  nota: { modo: 'decimal', max: 3, frase: 'Nota vai de 0,0 a 10,0.' },
  molde: { modo: 'numeric', max: 0 },
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

/** Nota de 0 a 10 com uma casa: 75 vira 7,5, 100 vira 10,0, e 10 espera o próximo dígito. */
function nota(v: string): string {
  let s = String(v).replace(/\./g, ',').replace(/[^\d,]/g, '');
  const i = s.indexOf(',');
  if (i >= 0) return (s.slice(0, i).slice(0, 2) || '0') + ',' + s.slice(i + 1).replace(/,/g, '').slice(0, 1);
  s = s.slice(0, 3);
  if (s.length < 2 || s === '10') return s;
  return s.length === 2 ? s[0] + ',' + s[1] : s.slice(0, 2) + ',' + s[2];
}

/** A nota como fica ao sair do campo: 9 vira 9,0 e "7," vira 7,0. */
export function fechaNota(v: string): string {
  if (!v) return '';
  const s = nota(v);
  return !s.includes(',') ? s + ',0' : s.endsWith(',') ? s + '0' : s;
}

function tamanhoDoMolde(molde: string): number {
  return molde.replace(/[^0]/g, '').length;
}

/** Formata um valor qualquer pela máscara. Exportada para quem monta o valor inicial. */
export function formataMascara(tipo: UcamMascaraTipo, v: string, opcoes: UcamMascaraOpcoes = {}): string {
  if (tipo === 'nota') return nota(v);
  if (tipo === 'digitos') return digitos(v, opcoes.max && opcoes.max > 0 ? opcoes.max : REGRAS.digitos.max);
  if (tipo === 'molde') {
    const m = opcoes.molde ?? '';
    return molda(digitos(v, tamanhoDoMolde(m)), m);
  }
  const r = REGRAS[tipo];
  const d = digitos(v, r.max);
  if (tipo === 'moeda') return moeda(d);
  if (tipo === 'telefone') return molda(d, d.length > 10 ? '(00) 00000-0000' : '(00) 0000-0000');
  return molda(d, r.molde!);
}

/** O valor está completo (e, em CPF e CNPJ, o dígito verificador fecha). */
export function mascaraValida(tipo: UcamMascaraTipo, v: string, opcoes: UcamMascaraOpcoes = {}): boolean {
  const d = digitos(v, 99);
  if (tipo === 'nota') return Number(fechaNota(v).replace(',', '.')) <= 10;
  if (tipo === 'molde') return d.length === tamanhoDoMolde(opcoes.molde ?? '');
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
    '[attr.data-molde]': 'ucamMolde() || null',
    autocomplete: 'off',
    '(blur)': 'aoSair()',
  },
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => UcamMascara), multi: true }],
})
export class UcamMascara implements Validator {
  readonly ucamMascara = input.required<UcamMascaraTipo>();
  /** Formato do tipo molde: 0 é dígito, o resto é literal ("REC 0000"). */
  readonly ucamMolde = input<string>('');

  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  protected modo(): string {
    return REGRAS[this.ucamMascara()].modo;
  }

  private opcoes(): UcamMascaraOpcoes {
    return { max: this.el.maxLength, molde: this.ucamMolde() };
  }

  /** Fecha a nota ao sair, avisando o ngModel do valor final. */
  protected aoSair(): void {
    if (this.ucamMascara() !== 'nota' || !this.el.value) return;
    const f = fechaNota(this.el.value);
    if (f === this.el.value) return;
    this.el.value = f;
    this.el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** O cursor fica depois do mesmo dígito: corrigir o meio não joga para o fim. */
  private poe(m: string): void {
    const c = this.el;
    const inicio = c.selectionStart ?? c.value.length;
    const fim = inicio === c.value.length;
    let n = c.value.slice(0, inicio).replace(/\D/g, '').length;
    c.value = m;
    let p = 0;
    if (fim) p = m.length;
    else {
      while (p < m.length && n > 0) {
        if (/\d/.test(m[p])) n--;
        p++;
      }
      if (p === 0) while (p < m.length && !/\d/.test(m[p])) p++;
    }
    c.setSelectionRange(p, p);
  }

  constructor() {
    const aoDigitar = () => {
      const m = formataMascara(this.ucamMascara(), this.el.value, this.opcoes());
      if (m !== this.el.value) this.poe(m);
    };
    this.el.addEventListener('input', aoDigitar, true);
    inject(DestroyRef).onDestroy(() => this.el.removeEventListener('input', aoDigitar, true));
  }

  validate(c: AbstractControl): ValidationErrors | null {
    const v = c.value == null ? '' : String(c.value);
    const tipo = this.ucamMascara();
    const opcoes = this.opcoes();
    if (!v || mascaraValida(tipo, v, opcoes)) return null;
    return { mascara: tipo === 'molde' ? `Incompleto. Use o formato ${opcoes.molde}.` : REGRAS[tipo].frase };
  }
}
