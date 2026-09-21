import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

import type { Bloco } from '../spec/spec.types';

type Entrada =
  | { tipo: 'texto'; rotulo: string; valor: string; mudo?: boolean }
  | { tipo: 'lista'; rotulo: string; itens: string[]; mudo?: boolean }
  | { tipo: 'tabela'; rotulo: string; linhas: { chave: string; pares: { k: string; v: string }[]; texto: string }[] };

/**
 * Renderiza as seções de extensão dos contratos — `limites`, `foco`, `rolagem`,
 * `responsividade`, `dependencia`, `obrigatoriedade`, `conteudo`, `schemas`.
 *
 * Cada componente molda essas seções de um jeito: `conteudo` do Button tem
 * `regras` e `exemplos`, o da DataTable tem `vazio`, `cabecalho` e `resumo`.
 * Um renderizador específico por forma significaria editar o site toda vez que
 * um contrato crescesse — que é exatamente o acoplamento que o SDD evita.
 */
@Component({
  selector: 'ucam-loose-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (e of entradas(); track e.rotulo) {
      @switch (e.tipo) {
        @case ('texto') {
          @if ($any(e).mudo) {
            <p>{{ $any(e).valor }}</p>
          } @else {
            <p><strong class="k">{{ e.rotulo }}.</strong> {{ $any(e).valor }}</p>
          }
        }
        @case ('lista') {
          @if (!$any(e).mudo) {
            <h4>{{ e.rotulo }}</h4>
          }
          <ul class="list">
            @for (i of $any(e).itens; track i) {
              <li>{{ i }}</li>
            }
          </ul>
        }
        @case ('tabela') {
          <h4>{{ e.rotulo }}</h4>
          <div class="scroller">
            <table>
              <tbody>
                @for (l of $any(e).linhas; track l.chave) {
                  <tr>
                    <td><code>{{ l.chave }}</code></td>
                    <td>
                      @if (l.pares.length) {
                        @for (p of l.pares; track p.k) {
                          <div><strong class="k">{{ p.k }}:</strong> {{ p.v }}</div>
                        }
                      } @else {
                        {{ l.texto }}
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    }
  `,
})
export class LooseBlockComponent {
  // Sem input.required() — ver a nota em page-header.component.ts.
  readonly bloco = input<Bloco | undefined>(undefined);

  /**
   * Chaves cujo rótulo NÃO deve ser impresso — só o conteúdo.
   *
   * Existe por causa da seção "Quando usar": ali o bloco de `limites` já vem
   * debaixo do título "Não use quando", e o renderizador genérico imprimia
   * "regras" logo abaixo dele. Dois cabeçalhos empilhados dizendo a mesma
   * coisa, e o segundo em jargão de arquivo JSON.
   *
   * A alternativa seria um renderizador próprio para `limites`, que é
   * exatamente o acoplamento que este componente existe para evitar.
   */
  readonly semRotulo = input<string[]>([]);

  protected readonly entradas = computed<Entrada[]>(() => {
    const b = this.bloco();
    if (!b) return [];

    const saida: Entrada[] = [];
    for (const [chave, valor] of Object.entries(b)) {
      // `$descricao` é metadado da seção, não conteúdo — mas vale como texto
      // introdutório, então entra sem o cifrão.
      const rotulo = chave.replace(/^\$/, '').replace(/_/g, ' ');

      const mudo = this.semRotulo().includes(chave);

      if (typeof valor === 'string') {
        saida.push({ tipo: 'texto', rotulo, valor, mudo });
      } else if (Array.isArray(valor)) {
        saida.push({
          tipo: 'lista',
          rotulo,
          itens: valor.map((i) => (typeof i === 'string' ? i : JSON.stringify(i))),
          mudo,
        });
      } else if (valor && typeof valor === 'object') {
        const linhas = Object.entries(valor as Record<string, unknown>).map(([k, v]) => {
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            return {
              chave: k,
              pares: Object.entries(v as Record<string, unknown>).map(([a, b2]) => ({
                k: a,
                v: Array.isArray(b2) ? b2.join(' · ') : String(b2),
              })),
              texto: '',
            };
          }
          return {
            chave: k,
            pares: [],
            texto: Array.isArray(v) ? v.join(' · ') : String(v),
          };
        });
        saida.push({ tipo: 'tabela', rotulo, linhas });
      }
    }
    return saida;
  });
}
