import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CadernoCadastro, EscopoProvas, Opcao, ProvasApi } from './provas.api';

type Estado = 'loading' | 'pronto' | 'error';

/**
 * O cadastro de provas em memória: o escopo escolhido e os cadernos dele.
 * Mora num serviço, e não na tela, porque a listagem e o formulário da
 * questão são duas páginas que olham os mesmos cadernos — o legado não tem
 * consulta de UMA questão, só a dos cadernos do escopo.
 */
@Injectable({ providedIn: 'root' })
export class ProvasStore {
  private readonly api = inject(ProvasApi);

  readonly processos = signal<Opcao[]>([]);
  readonly formas = signal<Opcao[]>([]);
  readonly captacoes = signal<Opcao[]>([]);
  readonly escopo = signal<EscopoProvas | null>(null);
  readonly vigencia = signal<string | null>(null);
  readonly cadernos = signal<CadernoCadastro[]>([]);
  readonly estado = signal<Estado>('loading');
  private opcoesCarregadas = false;

  readonly rotulos = computed(() => {
    const e = this.escopo();
    const de = (lista: Opcao[], oid: string | undefined) => lista.find((o) => o.oid === oid)?.rotulo ?? null;
    return { processo: de(this.processos(), e?.processo), forma: de(this.formas(), e?.forma), captacao: de(this.captacoes(), e?.captacao) };
  });

  /** Carrega as opções do escopo uma vez e os cadernos do escopo atual. */
  async iniciar(): Promise<void> {
    this.estado.set('loading');
    try {
      if (!this.opcoesCarregadas) {
        const [processos, formas, captacoes] = await Promise.all([
          firstValueFrom(this.api.processos()),
          firstValueFrom(this.api.formas()),
          firstValueFrom(this.api.captacoes()),
        ]);
        this.processos.set(processos);
        this.formas.set(formas);
        this.captacoes.set(captacoes);
        this.opcoesCarregadas = true;
        if (processos.length && formas.length && captacoes.length) {
          this.escopo.set({ processo: processos[0].oid, forma: formas[0].oid, captacao: captacoes[0].oid });
        }
      }
      await this.buscarCadernos();
    } catch {
      this.estado.set('error');
    }
  }

  async mudarEscopo(parte: Partial<EscopoProvas>): Promise<void> {
    const atual = this.escopo();
    if (!atual) return;
    this.escopo.set({ ...atual, ...parte });
    await this.recarregar();
  }

  async recarregar(): Promise<void> {
    this.estado.set('loading');
    try {
      await this.buscarCadernos();
    } catch {
      this.estado.set('error');
    }
  }

  private async buscarCadernos(): Promise<void> {
    const e = this.escopo();
    if (!e) {
      this.vigencia.set(null);
      this.cadernos.set([]);
      this.estado.set('pronto');
      return;
    }
    const [vigencia, cadernos] = await Promise.all([firstValueFrom(this.api.vigencia(e)), firstValueFrom(this.api.cadernos(e))]);
    // A pessoa pode ter trocado o escopo enquanto esta consulta voltava.
    if (this.escopo() !== e) return;
    this.vigencia.set(vigencia);
    this.cadernos.set(cadernos);
    this.estado.set('pronto');
  }

  caderno(oid: string): CadernoCadastro | null {
    return this.cadernos().find((c) => c.oid === oid) ?? null;
  }
}
