import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CorpoResposta, ProvaApi } from '../api/prova.api';

export interface RespostaPendente extends CorpoResposta {
  em: number;
}
export type EstadoSalvamento = 'salvo' | 'salvando' | 'pendente' | 'erro';
export type ResultadoEnvio = 'enviada' | 'pendente' | 'erro';

const INTERVALO_REENVIO = 30_000;

/**
 * Toda resposta vai ao backend na hora. Se a REDE falha, fica numa fila por
 * candidato no localStorage e é reenviada depois (ao voltar a conexão, a cada
 * 30 s e antes de entregar). Se o SERVIDOR recusa, não é "sem conexão": a
 * resposta não entra na fila e o erro é dito, para a pessoa escolher de novo.
 * Envios da mesma questão são serializados: a última escolha é a que fica.
 */
@Injectable({ providedIn: 'root' })
export class FilaRespostas {
  private readonly api = inject(ProvaApi);
  private readonly salvando = signal(0);
  private readonly cadeias = new Map<string, Promise<unknown>>();
  private periodico: ReturnType<typeof setInterval> | null = null;

  readonly pendentes = signal<RespostaPendente[]>([]);
  readonly ultimoErro = signal<string | null>(null);
  readonly estado = computed<EstadoSalvamento>(() =>
    this.salvando() > 0 ? 'salvando' : this.pendentes().length ? 'pendente' : this.ultimoErro() ? 'erro' : 'salvo',
  );

  private chave(oidCp: string): string {
    return `fila:${oidCp}`;
  }

  carregar(oidCp: string): void {
    this.ultimoErro.set(null);
    try {
      this.pendentes.set(JSON.parse(localStorage.getItem(this.chave(oidCp)) ?? '[]'));
    } catch {
      this.pendentes.set([]);
    }
  }

  private persistir(oidCp: string, lista: RespostaPendente[]): void {
    this.pendentes.set(lista);
    try {
      localStorage.setItem(this.chave(oidCp), JSON.stringify(lista));
    } catch {
      /* sem storage: fica só em memória */
    }
  }

  enviar(oidCp: string, corpo: CorpoResposta): Promise<ResultadoEnvio> {
    const anterior = this.cadeias.get(corpo.oidQuestao) ?? Promise.resolve();
    const atual = anterior.then(() => this.enviarAgora(oidCp, corpo));
    this.cadeias.set(corpo.oidQuestao, atual.catch(() => undefined));
    return atual;
  }

  private async enviarAgora(oidCp: string, corpo: CorpoResposta): Promise<ResultadoEnvio> {
    this.salvando.update((n) => n + 1);
    try {
      await firstValueFrom(this.api.responder(oidCp, corpo));
      this.persistir(
        oidCp,
        this.pendentes().filter((p) => p.oidQuestao !== corpo.oidQuestao),
      );
      this.ultimoErro.set(null);
      return 'enviada';
    } catch (e) {
      if (recusaDoServidor(e)) {
        this.ultimoErro.set(`O servidor não aceitou a resposta da questão ${corpo.oidQuestao}. Escolha a alternativa de novo.`);
        return 'erro';
      }
      const semEsta = this.pendentes().filter((p) => p.oidQuestao !== corpo.oidQuestao);
      this.persistir(oidCp, [...semEsta, { ...corpo, em: Date.now() }]);
      return 'pendente';
    } finally {
      this.salvando.update((n) => n - 1);
    }
  }

  /** Tenta esvaziar a fila; devolve quantas continuam pendentes. */
  async reenviar(oidCp: string): Promise<number> {
    for (const p of [...this.pendentes()]) {
      const { em: _em, ...corpo } = p;
      await this.enviar(oidCp, corpo);
    }
    return this.pendentes().length;
  }

  iniciarReenvioPeriodico(oidCp: string): void {
    this.pararReenvioPeriodico();
    this.periodico = setInterval(() => {
      if (this.pendentes().length && this.salvando() === 0) void this.reenviar(oidCp);
    }, INTERVALO_REENVIO);
  }

  pararReenvioPeriodico(): void {
    if (this.periodico) clearInterval(this.periodico);
    this.periodico = null;
  }

  limpar(oidCp: string): void {
    this.persistir(oidCp, []);
    this.ultimoErro.set(null);
  }
}

/** Status HTTP > 0 é resposta do servidor; 0 (ou erro sem status) é rede. */
function recusaDoServidor(e: unknown): boolean {
  return e instanceof HttpErrorResponse && e.status > 0;
}
