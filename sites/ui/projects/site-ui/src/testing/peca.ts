/**
 * Os blocos de teste que toda peça repete: o contrato manda nas classes, o
 * valor fora do contrato cai no padrão, a classe do consumidor sobrevive e
 * cada demo Angular produz a árvore da demo em HTML.
 */
import { type Type, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { casosDe, contratoDe } from './contrato';
import { DEMOS } from './demos.gerado';
import { mesmaArvore } from './paridade';

/**
 * O hospedeiro de teste: um sinal com as entradas, e a peça marcada com
 * `data-peca` e a classe `minha`.
 *
 * Peça feita de várias diretivas (a moldura da página: seção e contêiner)
 * marca com `data-peca-<entrada>` o elemento que recebe aquela entrada; o
 * teste do contrato olha a classe ali, e não na raiz.
 */
export interface Hospede {
  e: WritableSignal<Record<string, unknown>>;
}

export function monta<T extends Hospede>(tipo: Type<T>, entradas: Record<string, unknown> = {}, entrada?: string) {
  const f = TestBed.createComponent(tipo);
  f.componentInstance.e.set(entradas);
  f.detectChanges();
  const proprio = entrada ? (f.nativeElement.querySelector(`[data-peca-${entrada.toLowerCase()}]`) as HTMLElement | null) : null;
  const el = proprio ?? (f.nativeElement.querySelector('[data-peca]') as HTMLElement);
  return { f, el, naRaiz: !proprio, classes: new Set((el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)) };
}

export function blocosComuns<T extends Hospede>(id: string, tipo: Type<T>): void {
  const { raiz } = contratoDe(id);

  it('a raiz leva a classe do contrato', () => {
    expect(monta(tipo).classes.has(raiz)).toBe(true);
  });

  it('cada valor do contrato aplica a classe que o contrato diz, e nenhuma outra de modificador', () => {
    const casos = casosDe(id);
    // Toda classe de modificador presente tem de ser uma que o contrato declara.
    const declaradas = new Set(casos.map((x) => x.classe).filter(Boolean));
    for (const c of casos) {
      const { classes, naRaiz } = monta(tipo, { [c.nome]: c.valor }, c.nome);
      if (naRaiz) expect(classes.has(raiz), `${c.nome}=${c.valor}: sem a raiz`).toBe(true);
      if (c.classe) expect(classes.has(c.classe), `${c.nome}=${c.valor}: falta ${c.classe}`).toBe(true);
      for (const cl of classes) {
        if (cl.startsWith('ucam-site-') && cl.includes('--')) expect(declaradas.has(cl), `${c.nome}=${c.valor}: classe fora do contrato ${cl}`).toBe(true);
      }
    }
  });

  it('valor fora do contrato cai no padrão e não inventa classe', () => {
    for (const nome of new Set(casosDe(id).map((c) => c.nome))) {
      const padrao = [...monta(tipo, {}, nome).classes].sort();
      const { classes } = monta(tipo, { [nome]: 'valor-que-nao-existe' }, nome);
      expect([...classes].some((c) => c.includes('valor-que-nao-existe')), `${nome}: inventou classe`).toBe(false);
      // Entrada booleana lê qualquer texto como verdadeiro; a união é que cai no padrão.
      const p = contratoDe(id).props.find((x) => x.nome === nome)!;
      if (p.tipo !== 'boolean') expect([...classes].sort(), `${nome}: não caiu no padrão`).toEqual(padrao);
    }
  });

  it('a classe do consumidor sobrevive', () => {
    expect(monta(tipo).classes.has('minha')).toBe(true);
    for (const c of casosDe(id)) {
      const { classes, naRaiz } = monta(tipo, { [c.nome]: c.valor }, c.nome);
      if (naRaiz) expect(classes.has('minha'), `${c.nome}=${c.valor}`).toBe(true);
    }
  });

  it('cada demo Angular produz a árvore da demo em HTML', () => {
    const demos = DEMOS[id];
    expect(demos?.length, `${id} sem demo Angular`).toBeGreaterThan(0);
    for (const d of demos) {
      const f = TestBed.createComponent(d.componente);
      f.detectChanges();
      const r = mesmaArvore(d.html, f.nativeElement);
      expect(r.igual, `${d.titulo}: ${r.diferenca}`).toBe(true);
    }
  });
}
