import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  UcamAppShell,
  UcamButton,
  UcamCelula,
  UcamDataTable,
  UcamIconButton,
  UcamPageHeader,
  UcamSegmented,
  UcamTextField,
  type UcamColumnDef,
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
 * (/t/protocolo/naturezas.html) na mesma largura e compara pixel a pixel.
 *
 * O que esta tela NÃO faz: fingir o servidor. Exportar e arquivar são
 * ações de sistema; aqui só trocam um anúncio, como a aplicação faria antes
 * de chamar o serviço. Os dados são os mesmos doze registros da referência,
 * para a foto comparar o mesmo estado. Refeita em 17/11/2026 sobre a
 * referência de 12/10 ("simples, uma linha"), que ela vinha copiando velha.
 *
 * Os blocos de arranjo (.ucam-corpo, .ucam-toolbar, .ucam-card, .ucam-lote)
 * vêm da folha do Trilho A que o site já carrega sob .ucam — é a camada de
 * layout que o Trilho B não embute (ver migracao.json, trilho b, naoEntrega).
 */
interface Natureza extends Record<string, unknown> {
  nome: string;
  abertura: 'externa' | 'interna';
  destinos: string;
  requerimentos: number;
}

const ABERTA_POR = { externa: 'Aluno', interna: 'Funcionário' } as const;

const NATUREZAS: Natureza[] = [
  { nome: 'Acadêmico', abertura: 'externa', destinos: '5 de 5 unidades', requerimentos: 312 },
  { nome: 'Declaração', abertura: 'externa', destinos: '5 de 5 unidades', requerimentos: 268 },
  { nome: 'Graduação EAD', abertura: 'externa', destinos: '3 de 5 unidades', requerimentos: 241 },
  { nome: 'Acesso e senha', abertura: 'externa', destinos: '5 de 5 unidades', requerimentos: 194 },
  { nome: 'Financeiro', abertura: 'externa', destinos: '5 de 5 unidades', requerimentos: 188 },
  { nome: 'Outros', abertura: 'interna', destinos: '5 de 5 unidades', requerimentos: 143 },
  { nome: 'Estágio e prática', abertura: 'externa', destinos: '2 de 5 unidades', requerimentos: 129 },
  { nome: 'Trancamento e reabertura', abertura: 'externa', destinos: '5 de 5 unidades', requerimentos: 90 },
  { nome: 'Diploma e colação', abertura: 'externa', destinos: '5 de 5 unidades', requerimentos: 71 },
  { nome: 'Pós-graduação EAD', abertura: 'externa', destinos: '2 de 5 unidades', requerimentos: 63 },
  { nome: 'Biblioteca', abertura: 'interna', destinos: '5 de 5 unidades', requerimentos: 47 },
  { nome: 'Impressão e material', abertura: 'interna', destinos: '2 de 5 unidades', requerimentos: 26 },
];

@Component({
  selector: 'ucam-vivo-protocolo-naturezas',
  imports: [
    UcamAppShell,
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

      <!-- A referência desde 12/10/2026 ("simples, uma linha"): sem trilha, sem
           Exportar, sem seleção e sem linha de apoio; o recorte é por quem abre. -->
      <ucam-page-header variante="barra" title="Naturezas do requerimento">
        <ucam-button variant="primary" iconStart="plus" (click)="agir('nova')">Nova natureza</ucam-button>
        <ucam-segmented ucamFerramentas [items]="recortes" [(value)]="recorte" ariaLabel="Quem abre" />
      </ucam-page-header>

      <div class="ucam-corpo">
        <div class="ucam-toolbar ucam-toolbar--compacta">
          <ucam-text-field
            class="ucam-field ucam-field--grow"
            label="Pesquisar natureza"
            labelHidden
            type="search"
            placeholder="Nome da natureza"
            [value]="busca()"
            (valueChange)="busca.set($event)"
          />
        </div>

        <div class="ucam-card" style="padding: 0; overflow: clip">
          <ucam-data-table
            caption="Naturezas de requerimento cadastradas, da mais aberta para a menos aberta no período de 01/02/2026 a 03/09/2026"
            [columns]="colunas"
            [rows]="linhas()"
            itemLabel="naturezas"
            identifierKey="nome"
            [sort]="{ column: 'requerimentos', direction: 'desc' }"
            [state]="linhas().length ? 'idle' : 'empty'"
            emptyReason="no-results"
          >
            <!-- O nome abre a natureza: link na tinta de texto, cor do app no
                 hover (ADR-084). -->
            <ng-template ucamCelula="nome" let-l><a class="ucam-link" href="#">{{ l.nome }}</a></ng-template>
            <ng-template ucamCelula="abertura" let-l><span style="white-space: nowrap">{{ abertaPor(l) }}</span></ng-template>
            <ng-template ucamCelula="destinos" let-l><span style="white-space: nowrap">{{ l.destinos }}</span></ng-template>
            <ng-template ucamCelula="acoes" let-l>
              <ucam-icon-button icon="pencil" variant="ghost" [label]="'Editar a natureza ' + l.nome" (click)="agir('editar')" />
            </ng-template>
          </ucam-data-table>

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
  /** O que a pessoa fixou. Quem persiste é a aplicação; aqui, a memória. */
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

  protected readonly recortes: UcamSegmentItem[] = [
    { id: '', label: 'Todas' },
    { id: 'externa', label: 'Abertas pelo aluno' },
    { id: 'interna', label: 'Internas' },
  ];
  protected readonly recorte = signal('');
  protected readonly busca = signal('');
  protected readonly anuncio = signal('');
  protected readonly abertaPor = (n: Natureza) => ABERTA_POR[n.abertura];

  protected readonly colunas: UcamColumnDef[] = [
    { key: 'nome', header: 'Natureza', type: 'text' },
    { key: 'abertura', header: 'Aberta por', type: 'text', width: 'min' },
    { key: 'destinos', header: 'Destinos', type: 'text', width: 'min' },
    { key: 'requerimentos', header: 'Requerimentos', type: 'number', width: 'min', sortable: true },
    { key: 'acoes', header: 'Ações', type: 'actions' },
  ];

  protected readonly linhas = computed(() => {
    const r = this.recorte();
    const b = this.busca().trim().toLowerCase();
    return NATUREZAS.filter((n) => (!r || n.abertura === r) && (!b || n.nome.toLowerCase().includes(b)));
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
