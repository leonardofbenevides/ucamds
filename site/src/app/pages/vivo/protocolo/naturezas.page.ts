import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  UcamAppShell,
  UcamBadge,
  UcamButton,
  UcamCelula,
  UcamDataTable,
  UcamIconButton,
  UcamPageHeader,
  UcamSegmented,
  UcamTextField,
  type UcamColumnDef,
  type UcamCrumb,
  type UcamNavGroup,
  type UcamNavItem,
  type UcamSegmentItem,
} from '@ucam/ui';

/**
 * TELA VIVA: Naturezas do requerimento, montada com @ucam/ui (Trilho B).
 *
 * É a tela de referência protocolo/naturezas de spec/templates.json, escrita
 * do jeito que uma aplicação Angular a escreveria — <ucam-*> para o que é
 * componente, classes de arranjo para o que é layout (ADR-012) — e existe para
 * responder com número à pergunta "o dev que monta a tela em Angular chega
 * 100% igual à referência?". A resposta é medida por
 * tools/prova-paridade-tela.mjs, que fotografa esta rota (/vivo/protocolo/
 * naturezas, sem o cromo do site) e a página autônoma do Trilho A
 * (/t/protocolo-naturezas.html) na mesma largura e compara pixel a pixel.
 *
 * O que esta tela NÃO faz: fingir o servidor. Exportar e arquivar são
 * ações de sistema; aqui só trocam um anúncio, como a aplicação faria antes
 * de chamar o serviço. Os dados são os mesmos doze registros da referência,
 * com as mesmas três linhas marcadas, para a foto comparar o mesmo estado.
 *
 * Os blocos de arranjo (.ucam-corpo, .ucam-toolbar, .ucam-card, .ucam-lote)
 * vêm da folha do Trilho A que o site já carrega sob .ucam — é a camada de
 * layout que o Trilho B não embute (ver migracao.json, trilho b, naoEntrega).
 */
interface Natureza extends Record<string, unknown> {
  nome: string;
  apoio: string;
  selo?: string;
  setor: string;
  unidades: string;
  requerimentos: number;
  modalidade: string;
}

const NATUREZAS: Natureza[] = [
  { nome: 'Acadêmico', apoio: 'Notas, disciplinas, revisão', setor: 'Secretaria Acadêmica', unidades: 'Todas as unidades', requerimentos: 312, modalidade: 'EAD Presencial' },
  { nome: 'Declaração', apoio: 'Matrícula, vínculo, histórico', setor: 'Secretaria Acadêmica', unidades: 'Todas as unidades', requerimentos: 268, modalidade: 'EAD Presencial' },
  { nome: 'Graduação EAD', apoio: 'Solicitações do EAD de graduação', setor: 'Secretaria Acadêmica', unidades: 'Campos, Araruama, Além Paraíba', requerimentos: 241, modalidade: 'EAD' },
  { nome: 'Acesso e senha', apoio: 'Portal, e-mail institucional, Wi-Fi', setor: 'CPD · Nível 1', unidades: 'Todas as unidades', requerimentos: 194, modalidade: 'EAD Presencial' },
  { nome: 'Financeiro', apoio: 'Boletos, negociação, restituição', setor: 'Financeiro', unidades: 'Todas as unidades', requerimentos: 188, modalidade: 'EAD Presencial' },
  { nome: 'Outros', apoio: 'Demais solicitações, com triagem manual', setor: 'Secretaria Acadêmica', unidades: 'Todas as unidades', requerimentos: 143, modalidade: 'EAD Presencial' },
  { nome: 'Estágio e prática', apoio: 'Convênio, termo de compromisso, relatório', setor: 'CENPRE', unidades: 'Campos, Rio', requerimentos: 129, modalidade: 'Presencial' },
  { nome: 'Trancamento e reabertura', apoio: 'Trancamento, cancelamento, retorno', setor: 'Secretaria Acadêmica', unidades: 'Todas as unidades', requerimentos: 90, modalidade: 'EAD Presencial' },
  { nome: 'Diploma e colação', apoio: 'Registro, segunda via, colação de grau', setor: 'Secretaria Acadêmica', unidades: 'Todas as unidades', requerimentos: 71, modalidade: 'EAD Presencial' },
  { nome: 'Pós-graduação EAD', apoio: 'Solicitações do EAD de pós', setor: 'Secretaria Acadêmica', unidades: 'Todas as unidades EAD', requerimentos: 63, modalidade: 'EAD' },
  { nome: 'Biblioteca', apoio: 'Empréstimo, nada consta, multa', setor: 'Biblioteca', unidades: 'Todas as unidades', requerimentos: 47, modalidade: 'EAD Presencial' },
  { nome: 'Impressão e material', apoio: 'Encerrada em 30/06 · pedidos em Outros', selo: 'Arquivada', setor: 'Centro Gráfico', unidades: 'Campos, Rio', requerimentos: 26, modalidade: 'Presencial' },
];

@Component({
  selector: 'ucam-vivo-protocolo-naturezas',
  imports: [
    UcamAppShell,
    UcamBadge,
    UcamButton,
    UcamCelula,
    UcamDataTable,
    UcamIconButton,
    UcamPageHeader,
    UcamSegmented,
    UcamTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* As regras de elemento do site (th em mono, td com recuo de documentação)
     não chegam aqui: o <body> leva a classe `vivo` nesta rota e styles.css as
     desliga por ela. Um reset local foi tentado e derrubou a navegação do
     shell — as utilitárias do Tailwind vivem numa @layer, e qualquer regra
     sem camada, mesmo de especificidade zero, vence todas elas. */
  host: { class: 'ucam block' },
  template: `
    <ucam-app-shell
      systemName="Protocolo"
      systemIcon="clipboardList"
      systemCategory="atendimento"
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
      (openNotifications)="agir('notificacoes')"
      (signOut)="agir('sair')"
    >
      <ng-container ucamShellAcoes>
        <ucam-icon-button icon="layoutGrid" variant="ghost" size="sm" label="Trocar de sistema" />
      </ng-container>
      <ng-container ucamShellNavRodape>
        <!-- Sem tela de referência desenhada, como na referência: link
             desabilitado, e não destino que não leva a lugar nenhum. -->
        <span class="ucam-nav__item" role="link" aria-disabled="true" data-sem-tela><svg class="ic" aria-hidden="true"><use href="#i-settings" /></svg><span>Configurações</span></span>
        <span class="ucam-nav__item" role="link" aria-disabled="true" data-sem-tela><svg class="ic" aria-hidden="true"><use href="#i-info" /></svg><span>Central de ajuda</span></span>
      </ng-container>

      <ucam-page-header variante="barra" title="Naturezas do requerimento" [breadcrumb]="trilha">
        <ucam-button variant="secondary" iconStart="download" (click)="agir('exportar')">Exportar</ucam-button>
        <ucam-button variant="primary" iconStart="plus" (click)="agir('nova')">Nova natureza</ucam-button>
        <ucam-segmented ucamFerramentas [items]="modalidades" [(value)]="modalidade" ariaLabel="Modalidade" />
      </ucam-page-header>

      <div class="ucam-corpo">
        <p class="ucam-lede" style="margin-block-end: 1.25rem">
          A natureza é o que decide o setor responsável por cada requerimento.
        </p>

        <div class="ucam-toolbar ucam-toolbar--compacta">
          <ucam-text-field
            class="ucam-field--grow"
            label="Pesquisar natureza"
            labelHidden
            type="search"
            placeholder="Nome da natureza"
            [value]="busca()"
            (valueChange)="busca.set($event)"
          />
        </div>

        <!-- Sem recuo e com recorte, como a referência: a tabela encosta na
             moldura do cartão. -->
        <div class="ucam-card" style="padding: 0; overflow: clip">
          <ucam-data-table
            caption="Naturezas de requerimento cadastradas, da mais aberta para a menos aberta no período de 01/02/2026 a 03/09/2026"
            [columns]="colunas"
            [rows]="linhas()"
            selectable="multiple"
            itemLabel="naturezas"
            identifierKey="nome"
            [selected]="marcadas()"
            [state]="linhas().length ? 'idle' : 'empty'"
            emptyReason="no-results"
            (selectionChange)="marcadas.set($event)"
          >
            <ng-template ucamCelula="nome" let-l>
              <span class="ucam-card__titulo"
                >{{ l.nome }}
                @if (l.selo) {
                  <ucam-badge tone="neutral" [label]="l.selo" />
                }
              </span>
              <span class="ucam-card__apoio">{{ l.apoio }}</span>
            </ng-template>
            <!-- O setor não quebra: é a mesma escolha por célula da referência
                 (style nowrap no td), que mantém "Secretaria Acadêmica" numa
                 linha e a fileira em 87px. -->
            <ng-template ucamCelula="setor" let-l>
              <span style="white-space: nowrap">{{ l.setor }}</span>
            </ng-template>
            <ng-template ucamCelula="acoes" let-l>
              <span class="ucam-cluster">
                <ucam-icon-button icon="pencil" variant="ghost" [label]="'Editar a natureza ' + l.nome" />
                <ucam-icon-button icon="archive" variant="ghost" [label]="'Arquivar a natureza ' + l.nome" (click)="agir('arquivar')" />
              </span>
            </ng-template>
          </ucam-data-table>

          @if (marcadas().length > 0) {
            <!-- A barra de lote consome a coluna de seleção (contrato data-table,
                 lote). O Trilho B ainda não a desenha dentro da tabela: aqui
                 vai como bloco, e a paridade mede a diferença. -->
            <div class="ucam-lote">
              <p class="ucam-lote__contagem" role="status">
                {{ marcadas().length }} {{ marcadas().length === 1 ? 'natureza selecionada' : 'naturezas selecionadas' }}
              </p>
              <div class="ucam-lote__acoes">
                <button type="button" class="ucam-lote__acao" (click)="agir('exportar')">
                  <svg class="ic" aria-hidden="true"><use href="#i-download" /></svg> Exportar
                </button>
                <button type="button" class="ucam-lote__acao" (click)="agir('arquivar')">
                  <svg class="ic" aria-hidden="true"><use href="#i-archive" /></svg> Arquivar
                </button>
              </div>
              <button type="button" class="ucam-lote__limpar" (click)="marcadas.set([])">Limpar</button>
            </div>
          }

          <!-- Só o resumo, como a referência: uma página de dados não pede
               controles de página. -->
          <div class="ucam-pagination">
            <span class="ucam-pagination__range"
              >1–{{ linhas().length }} de {{ linhas().length }} naturezas · 1.772 requerimentos de 01/02 a
              03/09/2026</span
            >
          </div>
        </div>
      </div>
    </ucam-app-shell>
  `,
})
export default class VivoProtocoloNaturezasPage {
  protected readonly usuario = { name: 'Leonardo F. Benevides' };
  protected readonly campi = [
    { value: 'campos', label: 'Campos' },
    { value: 'rio', label: 'Rio' },
    { value: 'araruama', label: 'Araruama' },
  ];
  protected readonly trilha: UcamCrumb[] = [{ label: 'Meus sistemas', link: '#' }, { label: 'Naturezas' }];

  /** O que a pessoa fixou. Quem persiste é a aplicação; aqui, a memória. */
  protected readonly favoritos = signal<UcamNavItem[]>([
    { label: 'Urgentes sem resposta', icon: 'triangleAlert', href: '#' },
    { label: 'Secretaria Acadêmica', icon: 'building2', href: '#' },
    { label: 'Parâmetros dos setores', icon: 'settings', href: '#' },
  ]);

  protected readonly nav: UcamNavGroup[] = [
    {
      label: 'Trabalho',
      items: [
        { label: 'Caixa de entrada', icon: 'inbox', href: '#', count: 9 },
        { label: 'Gerencial', icon: 'layoutGrid', href: '#' },
        { label: 'Analytics', icon: 'chartColumn', href: '#' },
      ],
    },
    {
      label: 'Cadastros',
      items: [
        { label: 'Setores', icon: 'building2', href: '#' },
        { label: 'Naturezas', icon: 'listFilter', href: '#', current: true },
        { label: 'Funcionários', icon: 'users', disabled: true },
      ],
    },
  ];

  protected readonly modalidades: UcamSegmentItem[] = [
    { id: '', label: 'Todas' },
    { id: 'EAD', label: 'EAD' },
    { id: 'Presencial', label: 'Presencial' },
  ];
  protected readonly modalidade = signal('');
  protected readonly busca = signal('');
  /** As três linhas marcadas da referência, para a foto comparar o mesmo estado. */
  protected readonly marcadas = signal<readonly Natureza[]>(NATUREZAS.slice(7, 10));
  protected readonly anuncio = signal('');

  protected readonly colunas: UcamColumnDef[] = [
    { key: 'nome', header: 'Natureza', icon: 'text', type: 'text', sortable: true },
    { key: 'setor', header: 'Setor responsável', icon: 'building2', type: 'text', width: 'min', sortable: true },
    // 'min' no cabeçalho e não na célula: a coluna mede o rótulo e o texto
    // longo das unidades quebra, como o th--min da referência.
    { key: 'unidades', header: 'Unidades atendidas', icon: 'mapPin', type: 'text', width: 'min', sortable: true },
    { key: 'requerimentos', header: 'Requerimentos', icon: 'hash', type: 'number', width: 'min', sortable: true },
    { key: 'acoes', header: 'Ações', type: 'actions' },
  ];

  protected readonly linhas = computed(() => {
    const m = this.modalidade();
    const b = this.busca().trim().toLowerCase();
    return NATUREZAS.filter((n) => (!m || n.modalidade.split(' ').includes(m)) && (!b || n.nome.toLowerCase().includes(b)));
  });

  protected desfixar(item: UcamNavItem): void {
    this.favoritos.update((lista) => lista.filter((f) => f !== item));
    this.anuncio.set(`${item.label} removido dos favoritos.`);
  }

  /** Ação de sistema: a aplicação chamaria o serviço; a tela viva só anuncia. */
  protected agir(acao: string): void {
    this.anuncio.set(`Ação ${acao}: a aplicação chama o serviço aqui.`);
  }
}
