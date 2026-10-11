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

/** O hospedeiro de teste: um sinal com as entradas, e a peça marcada com `data-peca` e a classe `minha`. */
export interface Hospede {
  e: WritableSignal<Record<string, unknown>>;
}

export function monta<T extends Hospede>(tipo: Type<T>, entradas: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(tipo);
  f.componentInstance.e.set(entradas);
  f.detectChanges();
  const el = f.nativeElement.querySelector('[data-peca]') as HTMLElement;
  return { f, el, classes: new Set((el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)) };
}

export function blocosComuns<T extends Hospede>(id: string, tipo: Type<T>): void {
  const { raiz } = contratoDe(id);

  it('cada valor do contrato aplica a classe que o contrato diz, e nenhuma outra de modificador', () => {
    const casos = casosDe(id);
    expect(casos.length).toBeGreaterThan(0);
    // Toda classe de modificador presente tem de ser uma que o contrato declara.
    const declaradas = new Set(casos.map((x) => x.classe).filter(Boolean));
    for (const c of casos) {
      const { classes } = monta(tipo, { [c.nome]: c.valor });
      expect(classes.has(raiz), `${c.nome}=${c.valor}: sem a raiz`).toBe(true);
      if (c.classe) expect(classes.has(c.classe), `${c.nome}=${c.valor}: falta ${c.classe}`).toBe(true);
      for (const cl of classes) {
        if (cl.startsWith(`${raiz}--`)) expect(declaradas.has(cl), `${c.nome}=${c.valor}: classe fora do contrato ${cl}`).toBe(true);
      }
    }
  });

  it('valor fora do contrato cai no padrão e não inventa classe', () => {
    const padrao = [...monta(tipo).classes].sort();
    for (const nome of new Set(casosDe(id).map((c) => c.nome))) {
      const { classes } = monta(tipo, { [nome]: 'valor-que-nao-existe' });
      expect([...classes].some((c) => c.includes('valor-que-nao-existe')), `${nome}: inventou classe`).toBe(false);
      // Entrada booleana lê qualquer texto como verdadeiro; a união é que cai no padrão.
      const p = contratoDe(id).props.find((x) => x.nome === nome)!;
      if (p.tipo !== 'boolean') expect([...classes].sort(), `${nome}: não caiu no padrão`).toEqual(padrao);
    }
  });

  it('a classe do consumidor sobrevive', () => {
    for (const c of casosDe(id)) expect(monta(tipo, { [c.nome]: c.valor }).classes.has('minha')).toBe(true);
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
