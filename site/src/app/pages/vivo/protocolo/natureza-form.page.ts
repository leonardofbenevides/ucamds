import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  UcamAppShell,
  UcamButton,
  UcamCelula,
  UcamCheckbox,
  UcamDataTable,
  UcamDialog,
  UcamIconButton,
  UcamPageHeader,
  UcamSelect,
  UcamTabs,
  UcamTextField,
  type UcamColumnDef,
  type UcamCrumb,
  type UcamNavGroup,
  type UcamNavItem,
  type UcamOption,
  type UcamTabItem,
} from '@ucam/ui';

/**
 * TELA VIVA: Nova natureza (protocolo/natureza-form), montada com @ucam/ui.
 *
 * A segunda tela viva (17/11/2026), escolhida por ser a forma de FORMULÁRIO
 * com a mesma moldura da primeira (protocolo/naturezas): assim a prova de
 * paridade mede o formulário — seção lateral, campo, select, abas, tabela
 * compacta, diálogo e rodapé fixo — e não a moldura, que já foi medida.
 *
 * Montá-la achou uma lacuna: a barra do Trilho A tem meta ao lado do título
 * ("12 naturezas cadastradas") em 80 telas, e o ucam-page-header não a
 * desenhava. Entrou a prop `meta`.
 *
 * Como na primeira, a tela não finge o servidor: Criar natureza só anuncia.
 * Os blocos de arranjo (.ucam-corpo, .ucam-section, .ucam-form-grid,
 * .ucam-form-actions) vêm da folha do Trilho A (migracao.json, trilho b,
 * naoEntrega).
 */
interface Tipo extends Record<string, unknown> {
  nome: string;
  nivel: string;
  prazo: string;
  destino: string;
  docs: string;
}

interface Anexo extends Record<string, unknown> {
  nome: string;
  situacao: string;
}

const SETORES = ['Secretaria Acadêmica', 'Secretaria EAD', 'Coordenação de curso', 'Financeiro', 'Biblioteca', 'CENPRE', 'CPD'];
const ANEXOS = ['Prova corrigida', 'Requerimento assinado', 'Atestado ou comprovante', 'Documento de identidade'];

@Component({
  selector: 'ucam-vivo-protocolo-natureza-form',
  imports: [
    UcamAppShell,
    UcamButton,
    UcamCelula,
    UcamCheckbox,
    UcamDataTable,
    UcamDialog,
    UcamIconButton,
    UcamPageHeader,
    UcamSelect,
    UcamTabs,
    UcamTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ucam block' },
  template: `
    <ucam-app-shell
      systemName="Protocolo"
      systemIcon="clipboardList"
      systemCategory="atendimento"
      logoUrl="/marca/ucam-logo-horizontal.svg"
      homeHref="#"
      [user]="usuario"
      [navGroups]="nav"
      [contextOptions]="campi"
      [context]="'campos'"
      contextLabel="Campus"
      [announcement]="anuncio()"
      searchable
      searchLabel="Buscar requerimento, setor ou pessoa"
      searchShortcut="/"
      [notifications]="7"
      [navAction]="{ label: 'Novo requerimento', icon: 'plus', href: '#' }"
      [favorites]="favoritos()"
      (unpin)="desfixar($event)"
    >
      <ng-container ucamShellAcoes>
        <ucam-icon-button icon="layoutGrid" variant="ghost" size="sm" label="Trocar de sistema" />
      </ng-container>
      <ng-container ucamShellNavRodape>
        <span class="ucam-nav__item" role="link" aria-disabled="true" data-sem-tela><svg class="ic" aria-hidden="true"><use href="#i-settings" /></svg><span>Configurações</span></span>
        <span class="ucam-nav__item" role="link" aria-disabled="true" data-sem-tela><svg class="ic" aria-hidden="true"><use href="#i-info" /></svg><span>Central de ajuda</span></span>
      </ng-container>

      <ucam-page-header variante="barra" title="Nova natureza" meta="12 naturezas cadastradas" [breadcrumb]="trilha" />

      <div class="ucam-corpo">
        <section class="ucam-section ucam-section--lateral">
          <div><h3 class="ucam-section__title">Identificação</h3></div>
          <div class="ucam-card">
            <div class="ucam-form-grid">
              <ucam-text-field
                label="Descrição"
                required
                hint="Gravada em maiúsculas. É o que o requerente lê na lista de naturezas."
                [(value)]="descricao"
              />
              <ucam-select
                label="Quem abre"
                required
                hint="Separa o pedido do aluno do pedido interno."
                [options]="quemAbre"
                [(value)]="abre"
              />
            </div>
          </div>
        </section>

        <div class="ucam-stack">
          <ucam-tabs #abas="ucamTabs" ariaLabel="Configuração da natureza" [items]="abasItens" [(value)]="aba" />

          @if (aba() === 'tipos') {
            <div [id]="abas.idPainel('tipos')" role="tabpanel" [attr.aria-labelledby]="abas.idAba('tipos')" class="ucam-stack ucam-stack--sm">
              <p class="ucam-section__hint">O tipo é o que o requerente escolhe. Cada um tem nível, prazo em dias corridos, destino e anexos exigidos.</p>
              <ucam-data-table
                caption="Tipos desta natureza, com nível, prazo em dias corridos, setor de destino e anexos exigidos."
                density="compact"
                [columns]="colunasTipos"
                [rows]="tipos()"
              >
                <ng-template ucamCelula="nome" let-l><span class="ucam-card__titulo">{{ l.nome }}</span></ng-template>
                <!-- As colunas curtas não quebram: o nowrap por célula da referência. -->
                <ng-template ucamCelula="nivel" let-l><span style="white-space: nowrap">{{ l.nivel }}</span></ng-template>
                <ng-template ucamCelula="prazo" let-l><span style="white-space: nowrap">{{ l.prazo }}</span></ng-template>
                <ng-template ucamCelula="destino" let-l><span style="white-space: nowrap">{{ l.destino }}</span></ng-template>
              </ucam-data-table>
              <div><ucam-button variant="secondary" iconStart="plus" (click)="dialogoTipo.set(true)">Adicionar tipo</ucam-button></div>
            </div>
          }
          @if (aba() === 'destinos') {
            <div [id]="abas.idPainel('destinos')" role="tabpanel" [attr.aria-labelledby]="abas.idAba('destinos')" class="ucam-stack ucam-stack--sm">
              <p class="ucam-section__hint">Vale para os tipos sem destino próprio. Unidade sem destino recusa a abertura desta natureza no balcão.</p>
              <div class="ucam-card">
                <div class="ucam-form-grid">
                  @for (u of unidades; track u.id) {
                    <ucam-select [label]="u.label" [options]="setoresComVazio" [(value)]="u.valor" />
                  }
                </div>
              </div>
            </div>
          }
          @if (aba() === 'anexos') {
            <div [id]="abas.idPainel('anexos')" role="tabpanel" [attr.aria-labelledby]="abas.idAba('anexos')" class="ucam-stack ucam-stack--sm">
              <p class="ucam-section__hint">Um catálogo só, para todas as naturezas. Renomear muda o que o requerente lê em todos os tipos que exigem o documento.</p>
              <ucam-data-table
                caption="Tipos de anexo que os tipos de requerimento podem exigir."
                density="compact"
                [columns]="colunasAnexos"
                [rows]="anexos()"
              >
                <ng-template ucamCelula="nome" let-l><span class="ucam-card__titulo">{{ l.nome }}</span></ng-template>
              </ucam-data-table>
              <div><ucam-button variant="secondary" iconStart="plus" (click)="anunciar('Novo tipo de anexo')">Novo tipo de anexo</ucam-button></div>
            </div>
          }
        </div>

        <div class="ucam-form-actions ucam-form-actions--sticky">
          <!-- Cancelar NAVEGA, então é <a>; o ucam-button não tem href, e o
               link leva a classe do botão, como na referência. -->
          <a class="ucam-btn ucam-btn--ghost" href="#">Cancelar</a>
          <ucam-button variant="primary" iconStart="check" (click)="anunciar('Natureza ' + descricao() + ' criada. Ela recebe pedidos nas unidades com destino.')">Criar natureza</ucam-button>
        </div>
      </div>

      <ucam-dialog title="Adicionar tipo" [(open)]="dialogoTipo">
        <div class="ucam-stack">
          <ucam-text-field label="Nome do tipo" required hint="Gravado em maiúsculas. É o que o requerente escolhe ao abrir." [(value)]="novoNome" />
          <ucam-select label="Nível" hint="Só integrantes do setor com este nível ou acima veem os pedidos deste tipo." [options]="niveis" [(value)]="novoNivel" />
          <ucam-text-field label="Prazo, em dias corridos" type="number" hint="Conta da abertura, com fim de semana e feriado. Em branco, o tipo não tem prazo e nunca atrasa." [(value)]="novoPrazo" />
          <ucam-select label="Setor de destino" hint="Com um setor aqui, todo pedido deste tipo vai direto para ele, em qualquer unidade, na frente do destino da natureza." [options]="destinos" [(value)]="novoDestino" />
          <fieldset class="ucam-field">
            <legend class="ucam-field__label">Anexos exigidos</legend>
            <div class="ucam-cluster ucam-cluster--md">
              @for (a of anexosNomes; track a; let i = $index) {
                <ucam-checkbox [label]="a" [checked]="novoDocs()[i]" (checkedChange)="marcarDoc(i, $event)" />
              }
            </div>
            <span class="ucam-field__hint">A abertura é recusada se vierem menos arquivos do que os anexos marcados.</span>
          </fieldset>
        </div>
        <footer ucamDialogAcoes>
          <ucam-button variant="secondary" (click)="dialogoTipo.set(false)">Cancelar</ucam-button>
          <ucam-button variant="primary" (click)="adicionarTipo()">Adicionar</ucam-button>
        </footer>
      </ucam-dialog>
    </ucam-app-shell>
  `,
})
export default class VivoProtocoloNaturezaFormPage {
  protected readonly usuario = { name: 'Leonardo F. Benevides' };
  protected readonly campi = [
    { value: 'campos', label: 'Campos' },
    { value: 'rio', label: 'Rio' },
    { value: 'araruama', label: 'Araruama' },
  ];
  protected readonly trilha: UcamCrumb[] = [{ label: 'Naturezas', link: '#' }, { label: 'Nova natureza' }];

  protected readonly favoritos = signal<UcamNavItem[]>([
    { label: 'Urgentes sem resposta', icon: 'triangleAlert', href: '#' },
    { label: 'Secretaria Acadêmica', icon: 'building2', href: '#' },
    { label: 'Natureza Acadêmico', icon: 'listFilter', href: '#' },
  ]);

  /* A navegação da referência desde a leva 4 (spec/templates.json, shell do
     protocolo): o primeiro grupo sem título, Indicadores juntando Gerencial e
     Analytics pelo que mostram, e sem Funcionários. Estava na de outubro. */
  protected readonly nav: UcamNavGroup[] = [
    {
      items: [{ label: 'Caixa de entrada', icon: 'inbox', href: '#', count: 9 }],
    },
    {
      label: 'Indicadores',
      items: [
        { label: 'Por setor', icon: 'layoutGrid', href: '#' },
        { label: 'Tendências', icon: 'chartColumn', href: '#' },
      ],
    },
    {
      label: 'Cadastros',
      items: [
        { label: 'Setores', icon: 'building2', href: '#' },
        { label: 'Naturezas', icon: 'listFilter', href: '#', current: true },
      ],
    },
  ];

  protected readonly anuncio = signal('');
  protected readonly descricao = signal('Revisão de nota');
  protected readonly quemAbre: UcamOption[] = [
    { value: 'externa', label: 'O aluno, pelo portal (externa)' },
    { value: 'interna', label: 'Só funcionário (interna)' },
  ];
  protected readonly abre = signal('externa');

  protected readonly abasItens: UcamTabItem[] = [
    { id: 'tipos', label: 'Tipos de requerimento' },
    { id: 'destinos', label: 'Destinos por unidade' },
    { id: 'anexos', label: 'Tipos de anexo' },
  ];
  protected readonly aba = signal('tipos');

  protected readonly colunasTipos: UcamColumnDef[] = [
    { key: 'nome', header: 'Tipo', type: 'text', sortable: true },
    { key: 'nivel', header: 'Nível', type: 'text', width: 'min', sortable: true },
    { key: 'prazo', header: 'Prazo', type: 'text', width: 'min', sortable: true },
    { key: 'destino', header: 'Destino', type: 'text', width: 'min', sortable: true },
    { key: 'docs', header: 'Anexos exigidos', type: 'text', sortable: true },
  ];
  protected readonly tipos = signal<Tipo[]>([
    { nome: 'Revisão de prova', nivel: 'Nível 1', prazo: '5 dias', destino: 'Segue a natureza', docs: 'Prova corrigida' },
    { nome: 'Revisão de nota final', nivel: 'Nível 2', prazo: '10 dias', destino: 'Coordenação de curso', docs: 'Prova corrigida, Requerimento assinado' },
    { nome: 'Segunda chamada', nivel: 'Nível 1', prazo: 'Sem prazo', destino: 'Segue a natureza', docs: 'Atestado ou comprovante' },
  ]);

  protected readonly colunasAnexos: UcamColumnDef[] = [
    { key: 'nome', header: 'Tipo de anexo', type: 'text', sortable: true },
    { key: 'situacao', header: 'Situação', type: 'text', width: 'min', sortable: true },
  ];
  protected readonly anexos = signal<Anexo[]>(ANEXOS.map((nome) => ({ nome, situacao: 'Disponível' })));
  protected readonly anexosNomes = ANEXOS;

  protected readonly setoresComVazio: UcamOption[] = [{ value: '', label: 'Sem destino' }, ...SETORES.map((s) => ({ value: s, label: s }))];
  protected readonly unidades = [
    { id: 'campos', label: 'Campos · Presencial', valor: signal('Secretaria Acadêmica') },
    { id: 'rio', label: 'Rio · Presencial', valor: signal('Secretaria Acadêmica') },
    { id: 'araruama', label: 'Araruama · EAD', valor: signal('Secretaria EAD') },
    { id: 'anchieta', label: 'Anchieta · Híbrido', valor: signal('') },
    { id: 'alem', label: 'Além Paraíba · EAD', valor: signal('') },
  ];

  protected readonly niveis: UcamOption[] = ['Nível 1', 'Nível 2', 'Nível 3'].map((n) => ({ value: n, label: n }));
  protected readonly destinos: UcamOption[] = [{ value: 'Segue a natureza', label: 'Segue a natureza' }, ...SETORES.map((s) => ({ value: s, label: s }))];

  protected readonly dialogoTipo = signal(false);
  protected readonly novoNome = signal('');
  protected readonly novoNivel = signal('Nível 1');
  protected readonly novoPrazo = signal('');
  protected readonly novoDestino = signal('Segue a natureza');
  protected readonly novoDocs = signal<boolean[]>(ANEXOS.map(() => false));

  protected marcarDoc(i: number, marcado: boolean): void {
    this.novoDocs.update((d) => d.map((v, k) => (k === i ? marcado : v)));
  }

  protected adicionarTipo(): void {
    const nome = this.novoNome().trim();
    if (!nome) return;
    const prazo = this.novoPrazo() ? `${this.novoPrazo()} ${this.novoPrazo() === '1' ? 'dia' : 'dias'}` : 'Sem prazo';
    const docs = ANEXOS.filter((_, i) => this.novoDocs()[i]).join(', ') || 'Nenhum';
    this.tipos.update((t) => [...t, { nome, nivel: this.novoNivel(), prazo, destino: this.novoDestino(), docs }]);
    this.dialogoTipo.set(false);
    this.anunciar(`Tipo ${nome} adicionado à natureza.`);
    this.novoNome.set('');
  }

  protected desfixar(item: UcamNavItem): void {
    this.favoritos.update((lista) => lista.filter((f) => f !== item));
    this.anunciar(`${item.label} removido dos favoritos.`);
  }

  /** Ação de sistema: a aplicação chamaria o serviço; a tela viva só anuncia. */
  protected anunciar(msg: string): void {
    this.anuncio.set(msg);
  }
}
