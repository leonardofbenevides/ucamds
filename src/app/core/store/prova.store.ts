import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProvaApi } from '../api/prova.api';
import { CadernoProva, Questao, ehRedacao, slugTipoProva } from '../model/prova';
import { FilaRespostas } from '../offline/fila-respostas';

export interface Posicao {
  slug: string;
  n: number;
}
export interface EmBranco extends Posicao {
  numeroGlobal: number;
}
export type EstadoProva = 'carregando' | 'pronto' | 'vazio' | 'erro';

/** Caracteres não brancos — a mesma régua do legado para o mínimo da redação. */
export function contarCaracteres(texto: string): number {
  return (texto.match(/\S/g) ?? []).length;
}

@Injectable({ providedIn: 'root' })
export class ProvaStore {
  private readonly api = inject(ProvaApi);
  private readonly fila = inject(FilaRespostas);
  private oidCp = '';

  readonly estado = signal<EstadoProva>('carregando');
  readonly cadernos = signal<CadernoProva[]>([]);
  readonly respostas = signal<Record<string, string | null>>({});
  readonly textoRedacao = signal('');
  /** null na redação: o mapa marca "Redação" como atual. */
  readonly posicao = signal<Posicao | null>(null);

  readonly objetivos = computed(() => this.cadernos().filter((c) => !ehRedacao(c.tipoprova)));
  readonly redacao = computed(() => this.cadernos().find((c) => ehRedacao(c.tipoprova)) ?? null);
  readonly questaoRedacao = computed(() => this.redacao()?.questoes[0] ?? null);
  readonly totalObjetivas = computed(() => this.objetivos().reduce((s, c) => s + c.questoes.length, 0));
  readonly respondidas = computed(
    () => this.objetivos().flatMap((c) => c.questoes).filter((q) => !!this.respostas()[q.oid]).length,
  );
  readonly caracteresRedacao = computed(() => contarCaracteres(this.textoRedacao()));
  readonly redacaoAtingeMinimo = computed(() => !this.redacao() || this.caracteresRedacao() >= environment.redacaoMin);

  readonly cadernoAtual = computed(() => {
    const p = this.posicao();
    return p ? (this.objetivos().find((c) => slugTipoProva(c.tipoprova) === p.slug) ?? null) : null;
  });
  readonly questaoAtual = computed<Questao | null>(
    () => this.cadernoAtual()?.questoes[(this.posicao()?.n ?? 1) - 1] ?? null,
  );

  async carregar(oidCp: string): Promise<void> {
    this.oidCp = oidCp;
    this.estado.set('carregando');
    this.fila.carregar(oidCp);
    try {
      const cadernos = (await firstValueFrom(this.api.cadernos(oidCp))) ?? [];
      this.cadernos.set(cadernos);
      if (!cadernos.length) {
        this.estado.set('vazio');
        return;
      }
      // Estado inicial do mapa: uma consulta por questão, em paralelo — é o
      // que o backend oferece hoje; um endpoint agregado fica como pedido.
      const pares = cadernos.flatMap((c) => c.questoes.map((q) => ({ q, redacao: ehRedacao(c.tipoprova) })));
      const respostas = await Promise.all(
        pares.map(({ q }) => firstValueFrom(this.api.resposta(q.oid, oidCp)).catch(() => null)),
      );
      const mapa: Record<string, string | null> = {};
      pares.forEach(({ q, redacao }, i) => {
        const r = respostas[i];
        if (r?.oidAlternativa) mapa[q.oid] = r.oidAlternativa;
        if (redacao && r?.respostaTextual) this.textoRedacao.set(r.respostaTextual);
      });
      this.respostas.set(mapa);
      this.estado.set('pronto');
    } catch {
      this.estado.set('erro');
    }
  }

  definirPosicao(slug: string, n: number): void {
    this.posicao.set({ slug, n });
  }

  private sequencia(): Posicao[] {
    return this.objetivos().flatMap((c) => c.questoes.map((_, i) => ({ slug: slugTipoProva(c.tipoprova), n: i + 1 })));
  }

  private indiceAtual(): number {
    const p = this.posicao();
    return p ? this.sequencia().findIndex((s) => s.slug === p.slug && s.n === p.n) : -1;
  }

  proxima(): Posicao | 'redacao' | 'fim' {
    const seq = this.sequencia();
    const i = this.indiceAtual();
    if (i >= 0 && i < seq.length - 1) return seq[i + 1];
    return this.redacao() ? 'redacao' : 'fim';
  }

  anterior(): Posicao | null {
    const i = this.indiceAtual();
    return i > 0 ? this.sequencia()[i - 1] : null;
  }

  emBranco(): EmBranco[] {
    const r = this.respostas();
    return this.objetivos()
      .flatMap((c) => c.questoes.map((q, i) => ({ q, slug: slugTipoProva(c.tipoprova), n: i + 1 })))
      .map((x, idx) => ({ ...x, numeroGlobal: idx + 1 }))
      .filter((x) => !r[x.q.oid])
      .map(({ slug, n, numeroGlobal }) => ({ slug, n, numeroGlobal }));
  }

  /** A primeira em branco ou, se todas estão respondidas, a primeira da prova. */
  primeiraEmBranco(): Posicao | null {
    const b = this.emBranco()[0];
    return b ? { slug: b.slug, n: b.n } : (this.sequencia()[0] ?? null);
  }

  async responder(oidQuestao: string, oidAlternativa: string): Promise<void> {
    this.respostas.update((r) => ({ ...r, [oidQuestao]: oidAlternativa }));
    await this.fila.enviar(this.oidCp, { oidQuestao, oidAlternativa, respostaTextual: null });
  }

  async salvarRedacao(texto: string): Promise<void> {
    this.textoRedacao.set(texto);
    const q = this.questaoRedacao();
    if (q) await this.fila.enviar(this.oidCp, { oidQuestao: q.oid, oidAlternativa: null, respostaTextual: texto });
  }
}
