import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { nomeCurso } from '../../core/store/candidato.store';
import { IsencaoApi } from '../../isencao/isencao.api';
import { CandidatoFila, CursoFila, Situacao, nomeProprio, situacaoDe } from '../../isencao/isencao.model';

type Estado = 'loading' | 'pronto' | 'error';

/** Uma solicitação da fila, já com o curso e a situação que as telas mostram. */
export interface SolicitacaoNaFila {
  oid: string;
  nome: string;
  curso: string;
  situacao: Situacao;
  candidato: CandidatoFila;
}

function achatar(cursos: CursoFila[]): SolicitacaoNaFila[] {
  return cursos.flatMap((c) =>
    (c.candidates ?? []).map((candidato) => ({
      oid: candidato.formaIngressoPessoa,
      nome: nomeProprio(candidato.nome),
      curso: nomeCurso(c.nome),
      situacao: situacaoDe(candidato.situacao ?? candidato.status, candidato.documentos ?? 1),
      candidato,
    })),
  );
}

/**
 * A fila de isenção em memória. Mora num serviço porque a análise de uma
 * solicitação precisa da linha dela na fila — o período letivo, a matriz já
 * escolhida, o contato de quem não enviou documento —, e o legado só entrega
 * isso nas duas listas, não numa consulta por solicitação.
 */
@Injectable({ providedIn: 'root' })
export class IsencaoStore {
  private readonly api = inject(IsencaoApi);

  readonly estado = signal<Estado>('loading');
  private readonly cursosEmAnalise = signal<CursoFila[]>([]);
  private readonly cursosConcluidos = signal<CursoFila[]>([]);
  private carregada = false;

  readonly emAnalise = computed(() => achatar(this.cursosEmAnalise()));
  /** Nas concluídas o backend não manda a contagem de documentos: a situação é a do status. */
  readonly concluidas = computed(() => achatar(this.cursosConcluidos()).map((s) => ({ ...s, situacao: 'concluida' as Situacao })));

  async carregar(): Promise<void> {
    if (!this.carregada) this.estado.set('loading');
    try {
      const [emAnalise, concluidas] = await Promise.all([firstValueFrom(this.api.emAnalise()), firstValueFrom(this.api.concluidas())]);
      this.cursosEmAnalise.set(emAnalise);
      this.cursosConcluidos.set(concluidas);
      this.carregada = true;
      this.estado.set('pronto');
    } catch {
      this.estado.set('error');
    }
  }

  achar(oid: string): SolicitacaoNaFila | null {
    return [...this.emAnalise(), ...this.concluidas()].find((s) => s.oid === oid) ?? null;
  }
}
