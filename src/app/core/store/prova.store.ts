import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProvaApi } from '../api/prova.api';
import { CadernoProva, Questao, ehRedacao, rotuloTipoProva, slugTipoProva } from '../model/prova';
import { FilaRespostas } from '../offline/fila-respostas';

export interface Posicao {
  slug: string;
  n: number;
}
export interface EmBranco extends Posicao {
  numeroGlobal: number;
  /** Como o mapa chama o caderno: "Português 3". */
  rotulo: string;
}
export type EstadoProva = 'carregando' | 'pronto' | 'vazio' | 'erro';

/** Caracteres não brancos — a mesma régua do legado para o mínimo da redação. */
export function contarCaracteres(texto: string): number {
  return (texto.match(/\S/g) ?? []).length;
}

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Texto simples → parágrafos HTML escapados, que é o que a correção da banca renderiza. */
export function textoParaHtml(texto: string): string {
  const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ENTIDADES[c]);
  return texto
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .filter((p) => p.length)
    .map((p) => `<p>${escapar(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** HTML guardado (do Quill do legado ou daqui) → texto simples com parágrafos. */
export function htmlParaTexto(html: string): string {
  if (!/<[a-z!/]/i.test(html)) return html;
  const decodificar = (s: string) =>
    s
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  return decodificar(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

@Injectable({ providedIn: 'root' })
export class ProvaStore {
  private readonly api = inject(ProvaApi);
  private readonly fila = inject(FilaRespostas);
  private oidCp = '';

  readonly estado = signal<EstadoProva>('carregando');
  readonly cadernos = signal<CadernoProva[]>([]);
  readonly respostas = signal<Record<string, string | null>>({});
  /** O texto da redação como está no servidor (ou na fila). */
  readonly textoRedacao = signal('');
  /** O que a pessoa está digitando agora; null quando a redação não está aberta. */
  readonly rascunhoRedacao = signal<string | null>(null);
  /** null na redação: o mapa marca "Redação" como atual. */
  readonly posicao = signal<Posicao | null>(null);
  /** Depois de entregue nada mais é gravado. */
  readonly entregue = signal(false);

  readonly objetivos = computed(() => this.cadernos().filter((c) => !ehRedacao(c.tipoprova)));
  readonly redacao = computed(() => this.cadernos().find((c) => ehRedacao(c.tipoprova)) ?? null);
  readonly questaoRedacao = computed(() => this.redacao()?.questoes[0] ?? null);
  readonly totalObjetivas = computed(() => this.objetivos().reduce((s, c) => s + c.questoes.length, 0));
  readonly respondidas = computed(
    () => this.objetivos().flatMap((c) => c.questoes).filter((q) => !!this.respostas()[q.oid]).length,
  );
  /** Conta o que está sendo digitado, não só o que já foi salvo. */
  readonly caracteresRedacao = computed(() => contarCaracteres(this.rascunhoRedacao() ?? this.textoRedacao()));
  readonly redacaoAtingeMinimo = computed(() => !this.redacao() || this.caracteresRedacao() >= environment.redacaoMin);
  /** Em palavra, como o mapa e o cabeçalho da prova dizem em que pé está a redação. */
  readonly estadoRedacao = computed<'em branco' | 'rascunho' | 'mínimo atingido'>(() =>
    this.caracteresRedacao() === 0 ? 'em branco' : this.redacaoAtingeMinimo() ? 'mínimo atingido' : 'rascunho',
  );
  /** A pessoa está na tela da redação, e não numa questão objetiva. */
  readonly naRedacao = computed(() => this.rascunhoRedacao() !== null);

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
    this.respostas.set({});
    this.textoRedacao.set('');
    this.rascunhoRedacao.set(null);
    this.posicao.set(null);
    this.entregue.set(false);
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
      let texto = '';
      pares.forEach(({ q, redacao }, i) => {
        const r = respostas[i];
        if (r?.oidAlternativa) mapa[q.oid] = r.oidAlternativa;
        if (redacao && r?.respostaTextual) texto = htmlParaTexto(r.respostaTextual);
      });
      // O que ficou pendente na fila é mais novo que o que o servidor tem.
      for (const p of this.fila.pendentes()) {
        if (p.oidAlternativa) mapa[p.oidQuestao] = p.oidAlternativa;
        if (p.respostaTextual !== null && p.oidQuestao === this.questaoRedacaoOid(cadernos)) texto = htmlParaTexto(p.respostaTextual);
      }
      this.respostas.set(mapa);
      this.textoRedacao.set(texto);
      this.estado.set('pronto');
    } catch {
      this.estado.set('erro');
    }
  }

  private questaoRedacaoOid(cadernos: CadernoProva[]): string | undefined {
    return cadernos.find((c) => ehRedacao(c.tipoprova))?.questoes[0]?.oid;
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
      .flatMap((c) =>
        c.questoes.map((q, i) => ({ q, slug: slugTipoProva(c.tipoprova), n: i + 1, rotulo: `${rotuloTipoProva(c.tipoprova)} ${i + 1}` })),
      )
      .map((x, idx) => ({ ...x, numeroGlobal: idx + 1 }))
      .filter((x) => !r[x.q.oid])
      .map(({ slug, n, numeroGlobal, rotulo }) => ({ slug, n, numeroGlobal, rotulo }));
  }

  /** A primeira em branco ou, se todas estão respondidas, a primeira da prova. */
  primeiraEmBranco(): Posicao | null {
    const b = this.emBranco()[0];
    return b ? { slug: b.slug, n: b.n } : (this.sequencia()[0] ?? null);
  }

  async responder(oidQuestao: string, oidAlternativa: string): Promise<void> {
    if (this.entregue()) return;
    this.respostas.update((r) => ({ ...r, [oidQuestao]: oidAlternativa }));
    await this.fila.enviar(this.oidCp, { oidQuestao, oidAlternativa, respostaTextual: null });
  }

  async salvarRedacao(texto: string): Promise<void> {
    if (this.entregue()) return;
    this.textoRedacao.set(texto);
    const q = this.questaoRedacao();
    if (q) await this.fila.enviar(this.oidCp, { oidQuestao: q.oid, oidAlternativa: null, respostaTextual: textoParaHtml(texto) });
  }

  /** Grava o rascunho se ele mudou desde o último salvamento. */
  async descarregarRedacao(): Promise<void> {
    const r = this.rascunhoRedacao();
    if (r === null || r === this.textoRedacao()) return;
    await this.salvarRedacao(r);
  }
}
