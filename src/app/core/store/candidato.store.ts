import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CandidatoProva, Tentativas } from '../model/candidato';

export type TipoUnidade = 'EAD' | 'SEMIPRESENCIAL' | 'PRESENCIAL';

const TURNOS: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  DIURNO: 'Diurno',
  NOTURNO: 'Noturno',
  M: 'Manhã',
  T: 'Tarde',
  N: 'Noturno',
};
/** 'N' → 'Noturno'. Sigla desconhecida fica como veio. */
export function nomeTurno(sigla: string): string {
  return TURNOS[sigla] ?? sigla;
}

export function formatarCpf(n: string): string {
  const d = (n ?? '').replace(/\D/g, '').padStart(11, '0');
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/** 'ENGENHARIA DE SOFTWARE' → 'Engenharia de software'. Por extenso: abreviação é jargão. */
export function nomeCurso(nome: string): string {
  if (!nome) return '';
  const t = nome.toLocaleLowerCase('pt-BR');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function slugUnidade(sigla: string): string {
  return sigla
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-');
}

@Injectable({ providedIn: 'root' })
export class CandidatoStore {
  readonly candidato = signal<CandidatoProva | null>(null);
  readonly oidFip = signal<string | null>(null);
  readonly tentativas = signal<Tentativas | null>(null);
  readonly erro = signal<string | null>(null);

  definir(c: CandidatoProva, oidFip: string): void {
    this.candidato.set(c);
    this.oidFip.set(oidFip);
    this.erro.set(null);
  }

  readonly oidCandidatoProva = computed(() => this.candidato()?.oid ?? null);
  readonly situacao = computed(() => this.candidato()?.situacao ?? null);
  readonly pessoa = computed(() => this.candidato()?.formaingressopessoa.pessoa ?? null);
  readonly nome = computed(() => this.pessoa()?.nome ?? '');
  readonly cpf = computed(() => formatarCpf(this.pessoa()?.cpf.numero ?? ''));
  readonly curso = computed(() =>
    nomeCurso(this.candidato()?.formaingressopessoa.periodounidadecurso.unidadecurso.curso.nome ?? ''),
  );
  readonly turno = computed(() => nomeTurno(this.candidato()?.formaingressopessoa.periodounidadecurso.turnoLabel ?? ''));
  readonly unidade = computed(
    () => this.candidato()?.formaingressopessoa.periodounidadecurso.unidadecurso.unidade ?? null,
  );
  readonly podeTentarDeNovo = computed(() => {
    const t = this.tentativas();
    return !!t && t.tentativaAtual < t.totalTentativasPossiveis;
  });

  readonly tipoUnidade = computed<TipoUnidade>(() => {
    const oid = this.unidade()?.oid ?? '';
    if (oid.startsWith('polo') || oid.startsWith('hibri') || oid === 'unid32') return 'EAD';
    if (oid.startsWith('semi')) return 'SEMIPRESENCIAL';
    return 'PRESENCIAL';
  });

  readonly urlSite = computed(() => {
    if (environment.unidRef === 'unid32') return environment.siteEad;
    const sigla = this.unidade()?.sigla ?? this.unidade()?.nome ?? '';
    return environment.sitePresencialBase + slugUnidade(sigla);
  });

  readonly urlAreaDoInscrito = computed(() => `${environment.formUrl}/${this.pessoa()?.cpf.numero ?? ''}`);
}
