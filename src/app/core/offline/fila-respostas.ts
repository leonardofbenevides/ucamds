import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CorpoResposta, ProvaApi } from '../api/prova.api';

export interface RespostaPendente extends CorpoResposta {
  em: number;
}
export type EstadoSalvamento = 'salvo' | 'salvando' | 'pendente' | 'erro';

/**
 * Toda resposta vai ao backend na hora. Se a rede falha, fica numa fila por
 * candidato no localStorage e é reenviada depois — a tela nunca bloqueia e a
 * escolha nunca some.
 */
@Injectable({ providedIn: 'root' })
export class FilaRespostas {
  private readonly api = inject(ProvaApi);
  private readonly salvando = signal(0);
  readonly pendentes = signal<RespostaPendente[]>([]);
  readonly estado = computed<EstadoSalvamento>(() =>
    this.salvando() > 0 ? 'salvando' : this.pendentes().length ? 'pendente' : 'salvo',
  );

  private chave(oidCp: string): string {
    return `fila:${oidCp}`;
  }

  carregar(oidCp: string): void {
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

  async enviar(oidCp: string, corpo: CorpoResposta): Promise<'enviada' | 'pendente'> {
    this.salvando.update((n) => n + 1);
    try {
      await firstValueFrom(this.api.responder(oidCp, corpo));
      this.persistir(
        oidCp,
        this.pendentes().filter((p) => p.oidQuestao !== corpo.oidQuestao),
      );
      return 'enviada';
    } catch {
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

  limpar(oidCp: string): void {
    this.persistir(oidCp, []);
  }
}
