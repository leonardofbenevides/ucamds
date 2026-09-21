import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import {
  UcamAnexo,
  UcamAvatar,
  UcamChart,
  UcamCommand,
  UcamButton,
  UcamCheckbox,
  UcamChoiceCard,
  UcamCombobox,
  UcamDescriptionList,
  UcamDrawer,
  UcamEmptyState,
  UcamIconButton,
  UcamAppShell,
  UcamListItem,
  UcamPageHeader,
  UcamProgress,
  UcamRealce,
  UcamSectionBar,
  UcamSegmented,
  UcamSelect,
  UcamSkeleton,
  UcamBadge,
  UcamStepper,
  UcamSwitch,
  UcamTextField,
  UcamTextarea,
  UcamTimeline,
  type UcamFile,
  type UcamChartRow,
  type UcamCommandGroup,
  type UcamCommandItem,
  type UcamChartSeries,
  type UcamComboboxOption,
  type UcamDescriptionItem,
  type UcamDrawerCloseReason,
  type UcamOption,
  type UcamSegmentItem,
  type UcamBadgeTone,
  type UcamStepItem,
  type UcamTimelineItem,
  type UcamTimelineFilter,
} from '@ucam/ui';

/**
 * Quais componentes têm demo viva. A página do catálogo consulta este conjunto
 * para decidir se mostra o componente real antes do preview estático.
 *
 * O app-shell entrou em 20/09/2026 e fechou a lista: os 49 contratos têm
 * componente. A demo dele é EMBUTIDA — o shell é a moldura da janela, e
 * dentro de um cartão de documentação ele troca 100dvh pela altura do pai.
 */
export const TEM_DEMO_VIVA = new Set([
  'anexo',
  'app-shell',
  'avatar',
  'chart',
  'command',
  'choice-card',
  'description-list',
  'drawer',
  'list-item',
  'progress',
  'realce',
  'stepper',
  'timeline',
  'button',
  'checkbox',
  'combobox',
  'empty-state',
  'icon-button',
  'page-header',
  'section-bar',
  'segmented',
  'select',
  'skeleton',
  'badge',
  'switch',
  'text-field',
  'textarea',
]);

/**
 * O componente REAL de @ucam/ui, rodando na página do catálogo.
 *
 * Existe porque as demos de spec/demos.json são HTML estático com as classes
 * de @ucam/css: servem para o Trilho A, mas não provam nada sobre a biblioteca
 * Angular. Componente que só foi visto compilando não foi visto funcionando.
 *
 * O registro é um @switch explícito, não carregamento dinâmico: o compilador
 * verifica cada template, e uma demo que quebrar derruba o build do site em
 * vez de aparecer torta em produção.
 *
 * Cada demo mostra a REGRA do contrato, não só o componente renderizado — o
 * select encena a dependência que falha em silêncio no legado, o checkbox o
 * estado indeterminado que a DataTable exige, o skeleton a troca que substitui
 * o overlay bloqueante. Demo que só desenha a peça já existe: é o preview.
 */
@Component({
  selector: 'ucam-demo-viva',
  imports: [
    UcamAnexo,
    UcamAvatar,
    UcamChart,
    UcamCommand,
    UcamButton,
    UcamCheckbox,
    UcamChoiceCard,
    UcamCombobox,
    UcamDescriptionList,
    UcamDrawer,
    UcamEmptyState,
    UcamIconButton,
    UcamAppShell,
    UcamListItem,
    UcamPageHeader,
    UcamProgress,
    UcamRealce,
    UcamSectionBar,
    UcamSegmented,
    UcamSelect,
    UcamSkeleton,
    UcamBadge,
    UcamStepper,
    UcamSwitch,
    UcamTextField,
    UcamTextarea,
    UcamTimeline,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (registrado()) {
      <section>
        <h2>Componente real</h2>
        <p class="small muted">
          Não é imagem nem HTML de mentira: é o <code>&lt;{{ seletor() }}&gt;</code> de
          <code>&#64;ucam/ui</code>, compilado por fonte junto com este site. Mexa nele.
        </p>

        <div class="palco-vivo">
          @switch (componenteId()) {
            @case ('button') {
              <div class="linha">
                <ucam-button variant="primary" [loading]="salvando()" (click)="salvar()">
                  {{ salvando() ? 'Salvando' : 'Salvar' }}
                </ucam-button>
                <ucam-button variant="secondary">Cancelar</ucam-button>
                <ucam-button variant="ghost" iconStart="scrollText">Ver histórico</ucam-button>
              </div>
              <p class="small muted retorno">
                Clique em Salvar: o <code>loading</code> troca o ícone por spinner, marca
                <code>aria-busy</code> e bloqueia o segundo clique. Uma primária só na cena — é o
                limite que o contrato impõe.
              </p>

              <div class="linha">
                <ucam-button variant="primary" tone="danger" iconStart="trash2">
                  Excluir setor
                </ucam-button>
                <ucam-button variant="secondary" tone="danger" size="sm">Excluir</ucam-button>
                <ucam-button variant="ghost" tone="danger" iconStart="trash2">Excluir</ucam-button>
              </div>
              <p class="small muted retorno">
                A mesma ação destrutiva em três pesos — é a ADR-015. O <code>tone</code> diz que
                destrói; o <code>variant</code> diz quanto pesa. O preenchido pertence ao diálogo
                que confirma, o contornado à linha de tabela, o de texto ao menu. Antes existia só
                o primeiro, e uma exclusão discreta tinha de sair cinza.
              </p>
            }

            @case ('icon-button') {
              <div class="linha">
                <ucam-icon-button icon="pencil" label="Editar setor Biblioteca" variant="ghost" />
                <ucam-icon-button icon="copy" label="Duplicar setor Biblioteca" variant="ghost" />
                <ucam-icon-button
                  icon="trash2"
                  label="Excluir setor Biblioteca"
                  tone="danger"
                  (click)="excluiu.set(true)"
                />
              </div>
              <p class="small muted retorno">
                Passe o teclado (Tab) por eles: cada um anuncia a ação <em>e o alvo</em>. No
                Protocolo os mesmos três botões são anônimos para leitor de tela.
                @if (excluiu()) {
                  <br />Você acionou “Excluir setor Biblioteca”.
                }
              </p>

              <div class="linha">
                <ucam-icon-button
                  icon="star"
                  [pressed]="fixado()"
                  [label]="
                    fixado()
                      ? 'Remover Protocolo dos favoritos'
                      : 'Fixar Protocolo nos favoritos'
                  "
                  (click)="fixado.set(!fixado())"
                />
                <ucam-icon-button icon="star" [pressed]="false" label="Fixar Financeiro nos favoritos" />
                <ucam-icon-button icon="star" [pressed]="true" label="Remover Relatórios dos favoritos" />
              </div>
              <p class="small muted retorno">
                Clique na primeira. O que muda não é só a cor: a estrela vai de traçado a
                <em>sólida</em>, porque cor sozinha não distingue numa grade de vinte iguais. E o
                nome acessível é o verbo do PRÓXIMO clique — “Fixar…” quando solta, “Remover…”
                quando pressionada —, enquanto o <code>aria-pressed</code> anuncia o estado. No
                redesenho interno do SIGU esse botão existe e não tem estado nenhum no ARIA: o
                único sinal é o preenchimento do desenho.
              </p>
            }

            @case ('realce') {
              <ucam-text-field
                label="Buscar sistema"
                hint="Tente “acad pos”, ou “dipl”."
                [(value)]="termoBusca"
                width="content"
              />
              <ul class="coluna" style="list-style:none;margin:0;padding:0">
                @for (nome of modulosFiltrados(); track nome) {
                  <li><ucam-realce [texto]="nome" [termo]="termoBusca()" /></li>
                } @empty {
                  <li class="small muted">Nenhum sistema para “{{ termoBusca() }}”.</li>
                }
              </ul>
              <p class="small muted retorno">
                Digite <strong>acad pos</strong>: o termo quebra nos espaços e acha
                <em>Acadêmico pós-graduação e extensão</em> — o nome mais longo da grade e o mais
                buscado. O redesenho interno do SIGU exige a sequência contígua e devolve nada
                para essa busca. A comparação ignora acento e caixa; o texto exibido, não —
                “pos” casa com “pós” e o acento continua na tela.
                @if (termoBusca().trim().length === 1) {
                  <br />Com uma letra só não há marca: uma tela em que cada nome tem uma letra
                  pintada não informa nada e parece defeito.
                }
              </p>
            }

            @case ('segmented') {
              <ucam-segmented
                label="Modalidade"
                ariaLabel="Modalidade"
                [items]="modalidades"
                [(value)]="modalidade"
              />
              <p class="small muted retorno">
                Escolhido: <strong>{{ rotuloModalidade() }}</strong>. A escolha não é comunicada só
                pela superfície: o <code>aria-pressed</code> carrega o estado, e o rótulo escolhido
                muda de tinta e de peso além de ganhar plano (WCAG 1.4.1). O
                <code>label</code> é a PERGUNTA — no SIGFIN o par Sim/Não são dois botões soltos, e
                quem usa leitor de tela ouve “Sim, botão. Não, botão” sem saber o que está
                respondendo.
              </p>
            }
            @case ('text-field') {
              <ucam-text-field
                label="CPF"
                mask="cpf"
                hint="Somente números. A máscara formata sozinha."
                [(value)]="cpf"
                width="content"
              />
              <p class="small muted retorno">
                Valor cru no formulário: <code>{{ cpf() || '—' }}</code
                >. O rótulo fica acima e não some ao digitar — é a ADR-004, que aposentou o rótulo
                flutuante do Material.
              </p>
            }

            @case ('textarea') {
              <ucam-textarea
                label="Descrição da solicitação"
                hint="Descreva o pedido com o máximo de detalhes."
                [maxLength]="280"
                [(value)]="descricao"
              />
              <p class="small muted retorno">
                Digite várias linhas: o campo cresce até <code>maxRows</code> em vez de abrir barra
                de rolagem própria. É o que evita a rolagem aninhada do diálogo do legado.
              </p>
            }

            @case ('select') {
              <div class="coluna">
                <ucam-select
                  label="Natureza"
                  [options]="naturezas"
                  [(value)]="natureza"
                  width="full"
                />
                <ucam-select
                  label="Tipo do requerimento"
                  [options]="tiposVisiveis()"
                  [(value)]="tipo"
                  dependsOn="Natureza"
                  [dependencyFilled]="!!natureza()"
                  width="full"
                />
              </div>
              <p class="small muted retorno">
                Escolha a Natureza primeiro. Antes disso o segundo campo diz de quem depende, em vez
                de aparecer vazio e habilitado — que é como o Protocolo falha, em silêncio.
              </p>
            }

            @case ('combobox') {
              <ucam-combobox
                label="Setor"
                [options]="setores"
                [(value)]="setorEscolhido"
                clearable
                emptyText="Nenhum setor encontrado. Revise a busca."
                hint="A mesma lista que no legado obrigava a rolar 6 páginas."
              />
              <p class="small muted retorno">
                Valor no formulário: <code>{{ setorEscolhido() || '—' }}</code
                >. Digite “col” para filtrar; “zzzz” mostra o estado vazio do contrato.
              </p>
            }

            @case ('checkbox') {
              <div class="coluna">
                <ucam-checkbox
                  label="Selecionar todas as linhas desta página"
                  [checked]="todasMarcadas()"
                  [indeterminate]="parcial()"
                  (checkedChange)="marcarTodas($event)"
                />
                <div class="filhos">
                  @for (r of requerimentos; track r.id) {
                    <ucam-checkbox
                      [label]="'Selecionar requerimento ' + r.id"
                      [checked]="selecionados().has(r.id)"
                      (checkedChange)="alternar(r.id, $event)"
                    />
                  }
                </div>
              </div>
              <p class="small muted retorno">
                Marque uma linha só: o cabeçalho vai para o estado indeterminado, que não mente sobre
                quantas linhas a ação em massa vai atingir. Selecionadas:
                {{ selecionados().size }} de {{ requerimentos.length }}.
              </p>
            }

            @case ('switch') {
              <div class="coluna">
                <ucam-switch
                  label="Mostrar requerimentos de nível abaixo do meu"
                  [(checked)]="nivelAbaixo"
                />
                <ucam-switch label="Registrar boleto" [(checked)]="boleto" />
                <ucam-switch label="Impressão pelo banco" [disabled]="!boleto()" />
              </div>
              <p class="small muted retorno">
                O rótulo nomeia o que fica ligado; o estado vem do controle. Nada de par SIM/NÃO, que
                no legado não deixa claro se é o estado atual ou a ação de mudá-lo.
              </p>
            }

            @case ('badge') {
              <div class="linha">
                @for (e of estados; track e.label) {
                  <ucam-badge [tone]="e.tone" [label]="e.label" />
                }
              </div>
              <div class="linha">
                @for (e of estados; track e.label) {
                  <ucam-badge [tone]="e.tone" [label]="e.label" variant="dot" />
                }
              </div>
              <p class="small muted retorno">
                A máquina de estados do requerimento, com vocabulário do domínio. O texto vai junto
                da cor sempre — cor sozinha não é informação acessível (WCAG 1.4.1).
              </p>
            }

            @case ('avatar') {
              <div class="linha alinhada">
                @for (p of pessoas; track p) {
                  <ucam-avatar [name]="p" size="md" />
                }
              </div>
              <p class="small muted retorno">
                Iniciais do primeiro e do último nome, sem preposições: “Ana de Souza” vira AS. O
                clipart genérico do legado era igual para todos — não identificava ninguém.
              </p>
            }

            @case ('skeleton') {
              <div class="coluna">
                @if (carregando()) {
                  <ucam-skeleton variant="heading" />
                  <ucam-skeleton variant="text" [lines]="3" />
                } @else {
                  <h3 class="titulo-falso">12 requerimentos</h3>
                  <p class="small">
                    Conteúdo que chegou. O anúncio é do resultado, não do processo — fim do “Aguarde
                    enquanto as informações estão sendo processadas”.
                  </p>
                }
                <ucam-button variant="secondary" (click)="recarregar()">
                  {{ carregando() ? 'Carregando' : 'Recarregar' }}
                </ucam-button>
              </div>
              <p class="small muted retorno">
                O skeleton ocupa o lugar do conteúdo que está chegando. Ele não cobre a tela: o
                overlay bloqueante saiu do catálogo pela ADR-005.
              </p>
            }

            @case ('empty-state') {
              <div class="coluna">
                <div class="linha">
                  <ucam-button
                    variant="ghost"
                    (click)="motivo.set('no-data')"
                  >
                    Nada cadastrado
                  </ucam-button>
                  <ucam-button variant="ghost" (click)="motivo.set('no-results')">
                    Busca sem resultado
                  </ucam-button>
                </div>

                @if (motivo() === 'no-data') {
                  <ucam-empty-state
                    reason="no-data"
                    title="Nenhum setor cadastrado ainda"
                    description="Cadastre o primeiro para começar a distribuir requerimentos."
                  >
                    <ucam-button variant="primary" iconStart="plus">Novo setor</ucam-button>
                  </ucam-empty-state>
                } @else {
                  <ucam-empty-state
                    reason="no-results"
                    title="Nenhum requerimento encontrado para “biblioteca”"
                    description="Tente outros termos ou limpe os filtros."
                  >
                    <ucam-button variant="secondary">Limpar filtros</ucam-button>
                  </ucam-empty-state>
                }
              </div>
              <p class="small muted retorno">
                Troque entre os dois: são situações opostas. Uma pede criar o primeiro registro, a
                outra pede corrigir o filtro — e por isso a ação muda de peso junto com a mensagem.
              </p>
            }

            @case ('page-header') {
              <ucam-page-header
                title="Setores"
                [count]="58"
                description="Setores que recebem requerimentos, por campus."
                [breadcrumb]="migalhas"
              >
                <ucam-button variant="secondary" iconStart="download">Exportar</ucam-button>
                <ucam-button variant="primary" iconStart="plus">Novo setor</ucam-button>
              </ucam-page-header>
              <p class="small muted retorno">
                Ação primária à direita do título, sempre no mesmo lugar. No legado a mesma ação
                aparece em três posições diferentes dentro da mesma aplicação.
              </p>
            }

            @case ('section-bar') {
              <div class="coluna">
                <ucam-section-bar title="Rio de Janeiro" [count]="13" />
                <p class="small muted">Cartões dos módulos deste campus.</p>
                <ucam-section-bar title="Campos" [count]="6" />
                <p class="small muted">Cartões dos módulos deste campus.</p>
              </div>
              <p class="small muted retorno">
                A hierarquia vem de peso tipográfico e de um fio. A barra cinza preenchida do legado
                dava à seção mais peso visual do que ao conteúdo que ela agrupa.
              </p>

              <ucam-section-bar title="ITECAM" [count]="6" collapsible [(open)]="grupoAberto">
                <p ucamSecao class="small muted" style="margin:0">
                  Financeiro · Gerencial · Relatórios · Acadêmico extensão
                </p>
              </ucam-section-bar>
              <p class="small muted retorno">
                Abra e feche pelo cabeçalho. A CONTAGEM não some quando recolhe — é ela que
                responde se vale abrir; grupo fechado sem número é rótulo sem conteúdo. E o gatilho
                é um <code>button</code> DENTRO do cabeçalho: o inverso, que o SIGU faz nos quatro
                grupos, achata o título no nome acessível do botão e apaga as quatro unidades da
                lista de marcos da página.
              </p>
            }

            @case ('anexo') {
              <ul class="ucam-anexos">
                @for (a of anexos(); track a.id) {
                  <li><ucam-anexo [file]="a" removable (remove)="tirarAnexo($event)" (retry)="reenviar($event)" /></li>
                }
              </ul>
              <p class="small muted retorno">
                Três arquivos no mesmo estado em que o campo os entrega: um anexado, um subindo e um
                recusado. Tire o recusado pelo × — ele SAI porque alguém mandou, e não sozinho: no
                parque o arquivo grande some em silêncio, e quem anexou tenta o mesmo arquivo três
                vezes. O motivo traz o número, que é o que diz o que fazer com o arquivo.
                @if (anexos().length === 0) {
                  <br />A grade sumiu junto com o último arquivo: lista vazia com moldura é ruído.
                }
              </p>
            }

            @case ('app-shell') {
              <!-- A moldura inteira dentro de um quadro: faixa, navegação,
                   conta e conteúdo. É o mesmo componente que uma tela usa;
                   o que muda é o embedded, que troca a altura da janela pela
                   do pai. -->
              <div class="h-[26rem] overflow-hidden rounded-[var(--ucam-radius-surface)] border border-[var(--ucam-color-border-subtle)]">
                <ucam-app-shell
                  embedded
                  systemName="Protocolo"
                  systemIcon="clipboardList"
                  systemCategory="atendimento"
                  homeHref="#"
                  [user]="{ name: 'Leonardo F. Benevides' }"
                  [navGroups]="menuDemo"
                >
                  <div class="p-[var(--ucam-space-inset-lg)]">
                    <h4 class="m-0 text-[length:var(--ucam-typography-section-title-font-size)]">Caixa de entrada</h4>
                    <p class="small muted">
                      O conteúdo é projetado: o shell não sabe o que a tela mostra, só onde ela cabe.
                    </p>
                  </div>
                </ucam-app-shell>
              </div>
              <p class="small muted retorno">
                Abaixo de 64rem a navegação sai do fluxo e passa a sobrepor, com escurecimento
                atrás e <code>inert</code> quando fechada — fechada ela não recebe foco.
              </p>
            }

            @case ('list-item') {
              <ul class="lista-demo">
                @for (r of fila; track r.id) {
                  <ucam-list-item
                    [title]="r.nome"
                    [name]="r.nome"
                    [support]="r.assunto"
                    [time]="r.quando"
                    [timeValue]="r.iso"
                    [tone]="r.tom"
                    [unread]="r.naoLido"
                    [selected]="r.id === abertoNaLista()"
                    href="#"
                    (open)="abertoNaLista.set(r.id)"
                  >
                    <ucam-badge [tone]="r.tom" [label]="r.situacao" />
                  </ucam-list-item>
                }
              </ul>
              <p class="small muted retorno">
                Escolha uma linha: a aberta declara <code>aria-current</code>, ganha realce
                tinto e uma barra de 4px na borda de entrada — uma por lista, e não uma por
                linha. Quem informa a situação continua sendo o selo, em palavra.
              </p>
            }

            @case ('description-list') {
              <div class="coluna coluna--cheia">
                <ucam-segmented
                  size="sm"
                  ariaLabel="Colunas da lista"
                  [items]="opcoesColunas"
                  [(value)]="colunasEscolhidas"
                />
                <div class="cheia">
                  <ucam-description-list [columns]="colunas()" [items]="dadosRequerimento" />
                </div>
              </div>
              <p class="small muted retorno">
                Troque o número de colunas: o par rótulo e valor não se separa. Sem o embrulho do
                par, uma grade de três colunas põe o rótulo de um ao lado do valor do outro — foi o
                defeito encontrado na primeira captura da tela de requerimento. O número é TETO, e
                não contagem: estreite a janela e a terceira coluna desce de linha em vez de
                espremer o valor até quebrar — cada coluna tem piso de 12rem. O telefone mostra a
                outra regra: ausência vira travessão, nunca célula vazia.
              </p>
            }

            @case ('timeline') {
              <div style="max-inline-size: 24rem">
                <div style="margin-block-end: 0.75rem">
                  <ucam-segmented
                    size="sm"
                    ariaLabel="Mostrar na atividade"
                    [items]="naturezasAtividade"
                    [(value)]="naturezaAtividade"
                  />
                </div>
                <ucam-timeline density="compact" groupBy="phase" [filter]="filtroAtividade()" [items]="atividade" />
              </div>
              <p class="small muted retorno">
                Duas naturezas de item, distinguidas por FORMA e pelo papel escrito: a fala do
                aluno ganha o filete de citação, a mudança de estado é texto secundário. O corte é
                pela situação do registro, e o parecer pedido ao professor mostra os passos que
                faltam. Escolha Mensagens: a fase que fica sem item some junto, e o fio termina no
                último item visível.
              </p>
            }

            @case ('progress') {
              <div class="coluna">
                <ucam-progress
                  label="Carga do CPD · Nível 1"
                  [value]="carga()"
                  [max]="40"
                  [tone]="carga() > 32 ? 'danger' : carga() > 20 ? 'warning' : 'success'"
                  [valueText]="carga() + ' de 40 requerimentos abertos'"
                  [legendStart]="carga() + ' de 40 abertos'"
                  legendEnd="SLA médio 6,4 dias"
                />
                <div class="linha">
                  <ucam-button variant="secondary" (click)="carga.set(max(0, carga() - 6))">
                    Distribuir 6
                  </ucam-button>
                  <ucam-button variant="secondary" (click)="carga.set(min(40, carga() + 6))">
                    Receber 6
                  </ucam-button>
                </div>
              </div>
              <p class="small muted retorno">
                O que a barra anuncia é <code>24 de 40 requerimentos abertos</code>, não
                <code>60</code>: o total real é o número que quem distribui conhece. E a legenda
                continua ali porque entre 58% e 64% ninguém distingue comprimento.
              </p>
            }

            @case ('stepper') {
              <div class="coluna">
                <ucam-stepper
                  label="Progresso do novo requerimento"
                  [current]="etapa()"
                  [steps]="etapas()"
                  navigable
                  (stepSelect)="etapa.set($event)"
                />
                <div class="linha">
                  <ucam-button variant="secondary" (click)="etapa.set(max(0, etapa() - 1))">
                    Voltar
                  </ucam-button>
                  <ucam-button variant="secondary" (click)="etapa.set(min(2, etapa() + 1))">
                    Avançar
                  </ucam-button>
                  <ucam-button variant="ghost" (click)="comErro.set(!comErro())">
                    {{ comErro() ? 'Corrigir a etapa 2' : 'Deixar a etapa 2 pendente' }}
                  </ucam-button>
                </div>
              </div>
              <p class="small muted retorno">
                Clique numa etapa já concluída: ela é <code>&lt;button&gt;</code> e leva de volta.
                A futura nunca é focável — o caminho para a frente passa pela validação. Deixe a
                etapa 2 pendente e veja o erro ancorado nela, com contagem, em vez de numa lista
                solta no topo depois do envio.
              </p>
            }

            @case ('choice-card') {
              <div class="coluna">
                <fieldset class="grade-escolha">
                  <legend class="titulo-falso">Natureza do requerimento</legend>
                  @for (n of naturezasCartao; track n.id) {
                    <ucam-choice-card
                      name="natureza-demo"
                      [value]="n.id"
                      [label]="n.nome"
                      [description]="n.descricao"
                      [icon]="n.icone"
                      [checked]="escolhida() === n.id"
                      (checkedChange)="$event && escolhida.set(n.id)"
                    />
                  }
                </fieldset>
                <p class="small muted">
                  Escolhida: <code>{{ escolhida() }}</code>
                </p>
              </div>
              <p class="small muted retorno">
                Ande pelas opções com as setas: são radios de verdade por baixo, e o comportamento
                é o do navegador. Div com clique não entra na tabulação, não é anunciada como
                escolha e não vai no envio do formulário.
              </p>
            }

            @case ('command') {
              <div class="coluna">
                <ucam-button (click)="paleta.set(true)">Abrir a paleta</ucam-button>
                <p class="small muted retorno">
                  Ou aperte <strong>Ctrl+K</strong> (⌘K no Mac) com o foco em qualquer lugar desta página —
                  o ouvinte é do componente, não desta demo. Esc fecha e devolve o foco ao botão.
                </p>
                @if (escolhido()) {
                  <p class="small retorno">Escolhido: <code>{{ escolhido()!.id }}</code> — {{ escolhido()!.label }}</p>
                }
                <ucam-command [(open)]="paleta" [groups]="comandos" (escolher)="escolhido.set($event)" />
              </div>
            }
            @case ('chart') {
              <ucam-chart
                type="bar"
                label="Requerimentos abertos e concluídos por mês — primeiro semestre de 2026"
                unit="requerimentos"
                categoryKey="mes"
                categoryLabel="Mês"
                [data]="volume"
                [series]="seriesVolume"
              />
              <p class="small muted retorno">
                A tabela ao pé não é opcional: <code>showTable</code> só a recolhe num
                <code>&lt;details&gt;</code>, nunca a tira do DOM. Sem equivalente textual o dado
                não existe para leitor de tela nem para impressão em preto e branco.
              </p>
            }

            @case ('drawer') {
              <div class="coluna">
                <div class="linha">
                  <ucam-button variant="primary" iconStart="plus" (click)="gaveta.set(true)">
                    Novo integrante
                  </ucam-button>
                </div>
                @if (motivoFechou(); as m) {
                  <p class="small muted">
                    Fechou por: <code>{{ m }}</code>
                  </p>
                }
                <ucam-drawer
                  [(open)]="gaveta"
                  size="sm"
                  title="Novo integrante"
                  description="Adiciona um funcionário ao setor Biblioteca."
                  (close)="motivoFechou.set($event)"
                >
                  <div class="coluna">
                    <ucam-text-field label="Buscar funcionário" hint="Nome ou e-mail institucional." />
                    <ucam-select label="Nível de prioridade" [options]="niveis" width="full" />
                  </div>
                  <ucam-button ucamDrawerFooter variant="secondary" (click)="gaveta.set(false)">
                    Cancelar
                  </ucam-button>
                  <ucam-button ucamDrawerFooter variant="primary" (click)="gaveta.set(false)">
                    Adicionar integrante
                  </ucam-button>
                </ucam-drawer>
              </div>
              <p class="small muted retorno">
                Feche pelo véu, pela tecla Esc e pelo botão: o motivo aparece acima. Ele importa —
                fechar pelo véu com formulário sujo pede confirmação, fechar pela ação não. A base
                colapsava os três caminhos numa chamada só.
              </p>
            }
          }
        </div>
      </section>
    }
  `,
  styles: `
    /* Sem moldura: logo abaixo vem o painel de preview, que TEM moldura porque
       tem abas. Duas caixas coladas para o mesmo assunto é contenção dupla —
       aqui o que separa é o respiro e o fundo.

       O FUNDO era o cinza de palco, a convenção do site para "isto é uma
       amostra", e sem borda o que delimitava a região era onde o tom acabava.
       BRANCO desde 20/09/2026 (ADR-040): com o palco claro, "onde o tom acaba"
       deixa de existir como limite, então o filete ENTRA — é a mesma troca de
       tom por filete que o chão da aplicação fez. A distinção com o painel
       emoldurado logo abaixo passa a ser o raio e o respiro, não a tinta. */
    .palco-vivo {
      padding: 1.75rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background-color: var(--ucam-color-surface-canvas);
    }
    /* O palco não impõe largura: quem manda é o componente. O page-header
       precisa da linha inteira; o campo de CPF, não. */
    .linha {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .linha + .linha {
      margin-block-start: 0.6rem;
    }
    .linha.alinhada {
      align-items: center;
      gap: 0.75rem;
    }
    .coluna {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      align-items: flex-start;
      max-inline-size: 28rem;
    }
    /* A demo de colunas precisa de largura: com o piso de 12rem por coluna,
       três colunas só existem a partir de 616px, e as 28rem da coluna padrão
       nunca chegariam lá. O <dl> é o item do flex (o host é display:contents)
       e sem inline-size ele encolhe — e a fatia em porcentagem da fórmula de
       colunas perde a base contra a qual calcular. */
    .coluna--cheia { max-inline-size: none; }
    /* A largura mora num nó DA DEMO, não no <dl>: com encapsulamento emulado,
       uma regra escrita aqui não alcança elemento que veio de dentro de outro
       componente — ela compila com um atributo que aquele nó não carrega, e
       falha em silêncio. O host da lista é display:contents, então quem tem de
       ter largura é este invólucro. */
    .cheia { inline-size: 100%; }
    .coluna > ucam-select,
    .coluna > ucam-switch,
    .coluna > ucam-checkbox,
    .coluna > ucam-empty-state,
    .coluna > ucam-section-bar,
    .coluna > ucam-skeleton {
      inline-size: 100%;
    }
    .filhos {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-inline-start: 1.5rem;
      border-inline-start: 1px solid var(--ucam-color-border-subtle);
    }
    .titulo-falso {
      margin: 0;
      font-size: 1rem;
      font-weight: 560;
    }
    .lista-demo {
      list-style: none;
      margin: 0;
      padding: 0;
      inline-size: 100%;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      overflow: hidden;
      background: var(--ucam-color-surface-chrome);
    }
    .grade-escolha {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
      gap: 0.5rem;
      border: 0;
      padding: 0;
      margin: 0;
      min-inline-size: 0;
      inline-size: 100%;
    }
    .retorno {
      margin-block-start: 1rem;
      padding-block-start: 0.75rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
  `,
})
export class DemoVivaComponent {
  readonly componenteId = input.required<string>();

  protected readonly registrado = computed(() => TEM_DEMO_VIVA.has(this.componenteId()));
  protected readonly seletor = computed(() => `ucam-${this.componenteId()}`);

  /* --------------------------------------------------------- list-item --- */
  protected readonly abertoNaLista = signal('rafael');
  protected readonly menuDemo = [
    { label: 'TRABALHO', items: [
      { label: 'Caixa de entrada', icon: 'inbox' as const, href: '#', current: true, count: 9 },
      { label: 'Gerencial', icon: 'chartColumn' as const, href: '#' },
    ] },
    { label: 'CADASTROS', items: [
      { label: 'Setores', icon: 'building2' as const, href: '#' },
      { label: 'Naturezas', icon: 'listChecks' as const, href: '#' },
    ] },
  ];

  protected readonly fila = [
    {
      id: 'rafael',
      nome: 'Rafael Augusto Cordeiro',
      assunto: 'Revisão de nota — divergência entre gabarito e correção',
      quando: 'há 4h',
      iso: '2026-09-03T09:10',
      tom: 'danger' as UcamBadgeTone,
      situacao: 'Urgente',
      naoLido: false,
    },
    {
      id: 'carlos',
      nome: 'Carlos Eduardo Martins Souza',
      assunto: 'Carteira do estudante — foto',
      quando: '16/08/2026',
      iso: '2026-08-16',
      tom: 'danger' as UcamBadgeTone,
      situacao: 'Atrasado',
      naoLido: true,
    },
    {
      id: 'ana',
      nome: 'Ana Beatriz Ferreira Lima',
      assunto: 'Declaração de matrícula',
      quando: 'há 3 dias',
      iso: '2026-08-31',
      tom: 'info' as UcamBadgeTone,
      situacao: 'Em análise',
      naoLido: false,
    },
  ];

  /* -------------------------------------------------- description-list --- */
  /* O segmented fala em string; o componente pede 1 | 2 | 3. A conversão mora
   * aqui, num lugar só, e não em três handlers de clique. */
  protected readonly opcoesColunas = [
    { id: '3', label: '3 colunas' },
    { id: '2', label: '2 colunas' },
    { id: '1', label: '1 coluna' },
  ];
  protected readonly colunasEscolhidas = signal('3');
  protected readonly colunas = computed(() => Number(this.colunasEscolhidas()) as 1 | 2 | 3);
  protected readonly dadosRequerimento: UcamDescriptionItem[] = [
    { label: 'Natureza', value: 'Acadêmico' },
    { label: 'Tipo', value: 'Revisão de nota' },
    { label: 'Prazo', value: 'vence em 1 dia', tone: 'warning' },
    { label: 'Setor responsável', value: 'Secretaria Acadêmica' },
    { label: 'Polo', value: 'Campos' },
    { label: 'Telefone', value: null },
  ];

  /* ----------------------------------------------------------- timeline --- */
  protected readonly naturezasAtividade: UcamSegmentItem[] = [
    { id: 'all', label: 'Todos' },
    { id: 'message', label: 'Mensagens' },
    { id: 'event', label: 'Tramitação' },
  ];
  protected readonly naturezaAtividade = signal('all');
  protected readonly filtroAtividade = computed(() => this.naturezaAtividade() as UcamTimelineFilter);

  protected readonly atividade: UcamTimelineItem[] = [
    {
      kind: 'event',
      author: 'Marina Duarte',
      role: 'Atendente',
      at: '2026-09-03T13:10',
      phase: 'Em análise',
      text: 'Pediu parecer ao professor da disciplina',
      icon: 'send',
      tone: 'info',
      steps: [
        { label: 'Enviado ao professor', state: 'done' },
        { label: 'Parecer sobre a questão 4', state: 'current' },
        { label: 'Resposta ao aluno', state: 'pending' },
      ],
    },
    {
      kind: 'message',
      author: 'Rafael Augusto Cordeiro',
      role: 'Aluno',
      at: '2026-09-03T09:10',
      phase: 'Aguardando análise',
      text: 'Solicito revisão da nota da AV2 de Cálculo III: divergência entre o gabarito e a correção da questão 4.',
      icon: 'messageSquare',
      tone: 'info',
    },
    {
      kind: 'event',
      author: 'Marina Duarte',
      role: 'Atendente',
      at: '2026-09-03T09:20',
      phase: 'Em análise',
      icon: 'refreshCw',
      tone: 'warning',
      from: 'Aguardando análise',
      to: 'Em análise',
    },
    {
      kind: 'event',
      author: 'Sistema',
      role: 'Automático',
      at: '2026-09-03T09:08',
      phase: 'Aguardando análise',
      text: 'Protocolo aberto e distribuído para Secretaria Acadêmica.',
      icon: 'check',
      tone: 'success',
    },
  ];

  /* ----------------------------------------------------------- progress --- */
  /* -------------------------------------------------------- segmented --- */
  /* O componente ficou 24 versões sem demo viva, e foi por isso que os dois
     trilhos puderam desenhar controles diferentes sem ninguém notar: o
     catálogo mostrava só o preview estático do Trilho A. */
  protected readonly modalidades: UcamSegmentItem[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'ead', label: 'EAD' },
    { id: 'presencial', label: 'Presencial' },
  ];
  protected readonly modalidade = signal('todas');
  protected readonly rotuloModalidade = computed(
    () => this.modalidades.find((m) => m.id === this.modalidade())?.label ?? '—',
  );
  protected readonly carga = signal(24);
  protected readonly max = Math.max;
  protected readonly min = Math.min;

  /* ------------------------------------------------------------ stepper --- */
  protected readonly etapa = signal(1);
  protected readonly comErro = signal(false);
  protected readonly etapas = computed<UcamStepItem[]>(() => {
    const nomes = ['Requerente', 'Solicitação', 'Revisão'];
    return nomes.map((label, i) => {
      if (this.comErro() && i === 1 && this.etapa() > 1) {
        return { label, state: 'error' as const, hint: '2 campos obrigatórios' };
      }
      if (i === this.etapa()) return { label, state: 'current' as const };
      return { label, state: i < this.etapa() ? ('done' as const) : ('todo' as const) };
    });
  });

  /* -------------------------------------------------------- choice-card --- */
  protected readonly escolhida = signal('decl');
  protected readonly naturezasCartao = [
    { id: 'decl', nome: 'Declaração', descricao: 'Matrícula, vínculo, histórico', icone: 'scrollText' as const },
    { id: 'acad', nome: 'Acadêmico', descricao: 'Notas, disciplinas, revisão', icone: 'graduationCap' as const },
    { id: 'fin', nome: 'Financeiro', descricao: 'Boletos, negociação, restituição', icone: 'wallet' as const },
    { id: 'out', nome: 'Outros', descricao: 'Demais solicitações', icone: 'fileText' as const },
  ];

  /* ------------------------------------------------------------ command --- */
  protected readonly paleta = signal(false);
  protected readonly escolhido = signal<UcamCommandItem | null>(null);
  // A ordem é a de uso PROVÁVEL, não a alfabética: abrir e apertar Enter sem
  // digitar nada tem de acertar o destino mais comum.
  protected readonly comandos: UcamCommandGroup[] = [
    { titulo: 'Ir para', itens: [
      { id: 'caixa', label: 'Caixa de entrada', icone: 'inbox' },
      { id: 'gerencial', label: 'Gerencial', icone: 'layoutGrid' },
      { id: 'analytics', label: 'Analytics', icone: 'chartColumn' },
      { id: 'setores', label: 'Setores', icone: 'building2' },
      { id: 'naturezas', label: 'Naturezas', icone: 'listFilter' },
    ]},
    { titulo: 'Criar', itens: [
      { id: 'novo', label: 'Novo requerimento', icone: 'plus', atalho: 'N' },
      { id: 'setor', label: 'Novo setor', icone: 'plus' },
    ]},
  ];
  /* -------------------------------------------------------------- chart --- */
  // Uma LINHA por categoria, e cada série aponta a chave que lê dentro dela.
  // O formato anterior (vetor de categorias mais vetor de valores por série)
  // dependia de os dois terem o mesmo comprimento e a mesma ordem, sem nada
  // que verificasse isso — um valor a menos numa série deslocava a série
  // inteira em silêncio.
  protected readonly volume: UcamChartRow[] = [
    { mes: 'Fev', abertos: 180, concluidos: 150 },
    { mes: 'Mar', abertos: 210, concluidos: 190 },
    { mes: 'Abr', abertos: 240, concluidos: 232 },
    { mes: 'Mai', abertos: 205, concluidos: 210 },
    { mes: 'Jun', abertos: 262, concluidos: 240 },
    { mes: 'Jul', abertos: 231, concluidos: 226 },
  ];
  protected readonly seriesVolume: UcamChartSeries[] = [
    { key: 'abertos', name: 'Abertos', slot: 1 },
    { key: 'concluidos', name: 'Concluídos', slot: 2 },
  ];

  /* ------------------------------------------------------------- drawer --- */
  protected readonly gaveta = signal(false);
  protected readonly motivoFechou = signal<UcamDrawerCloseReason | null>(null);
  protected readonly niveis: UcamOption[] = [
    { value: '1', label: 'Nível 1' },
    { value: '2', label: 'Nível 2' },
    { value: '3', label: 'Nível 3' },
  ];

  /* ------------------------------------------------------------- button --- */
  protected readonly salvando = signal(false);
  protected salvar() {
    if (this.salvando()) return;
    this.salvando.set(true);
    setTimeout(() => this.salvando.set(false), 1400);
  }

  /* -------------------------------------------------------- icon-button --- */
  protected readonly excluiu = signal(false);
  /* Interruptor de ícone: o estado é do consumidor, não do botão. */
  protected readonly fixado = signal(false);
  /* Seção recolhível: o open é model, então quem guarda a preferência é a tela. */
  protected readonly grupoAberto = signal(true);

  /* Realce: a busca e a lista que ela filtra. Nomes reais da grade do SIGU. */
  protected readonly termoBusca = signal('');
  private readonly modulos = [
    'Acadêmico graduação',
    'Acadêmico pós-graduação e extensão',
    'Registro de diplomas',
    'Área do aluno — pós e extensão',
    'Relatórios financeiros',
    'Gestão de polos',
  ];
  /*
   * Filtra com a MESMA dobra que o realce usa para marcar. Se as duas
   * divergissem, a lista mostraria item sem marca — e a pessoa ficaria sem
   * saber por que aquele resultado ficou.
   */
  protected readonly modulosFiltrados = computed(() => {
    const termo = this.termoBusca().trim();
    const dobra = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const pedacos = termo
      .split(/\s+/)
      .filter((p) => p.length >= 2)
      .map(dobra);
    if (!pedacos.length) return this.modulos;
    return this.modulos.filter((m) => pedacos.every((p) => dobra(m).includes(p)));
  });

  /* ---------------------------------------------------------- campos ------ */
  protected readonly cpf = signal('');
  protected readonly descricao = signal('');

  /* ------------------------------------------------------------- select --- */
  protected readonly natureza = signal('');
  protected readonly tipo = signal('');

  protected readonly naturezas: UcamOption[] = [
    { value: 'academico', label: 'Requerimento acadêmico' },
    { value: 'financeiro', label: 'Requerimento financeiro' },
    { value: 'documentos', label: 'Emissão de documentos' },
  ];

  private readonly tiposPorNatureza: Record<string, UcamOption[]> = {
    academico: [
      { value: 'trancamento', label: 'Trancamento de matrícula' },
      { value: 'dispensa', label: 'Dispensa de disciplina' },
      { value: 'revisao', label: 'Revisão de prova' },
    ],
    financeiro: [
      { value: 'segunda-via', label: 'Segunda via de boleto' },
      { value: 'renegociacao', label: 'Renegociação de débito' },
    ],
    documentos: [
      { value: 'historico', label: 'Histórico escolar' },
      { value: 'declaracao', label: 'Declaração de matrícula' },
      { value: 'diploma', label: 'Segunda via de diploma' },
    ],
  };

  /** Vazio enquanto a Natureza não foi escolhida — a dependência é visível. */
  protected readonly tiposVisiveis = computed(
    () => this.tiposPorNatureza[this.natureza()] ?? [],
  );

  /* ----------------------------------------------------------- combobox --- */
  protected readonly setorEscolhido = signal('');

  /** Os setores reais do Protocolo, na caixa natural que o contrato pede. */
  protected readonly setores: UcamComboboxOption[] = [
    { value: 'assessoria-pedagogica', label: 'Assessoria Pedagógica' },
    { value: 'biblioteca', label: 'Biblioteca' },
    { value: 'cenpre', label: 'CENPRE' },
    { value: 'centro-informatica', label: 'Centro de Informática' },
    { value: 'centro-grafico', label: 'Centro Gráfico' },
    { value: 'cepecam', label: 'CEPECAM' },
    { value: 'col-administracao', label: 'Colegiado Administração', group: 'Colegiados' },
    { value: 'col-computacao', label: 'Colegiado Ciência da Computação', group: 'Colegiados' },
    { value: 'col-contabeis', label: 'Colegiado Ciências Contábeis', group: 'Colegiados' },
    { value: 'col-direito', label: 'Colegiado Direito', group: 'Colegiados' },
    { value: 'col-enfermagem', label: 'Colegiado Enfermagem', group: 'Colegiados' },
    { value: 'col-engenharia', label: 'Colegiado Engenharia Civil', group: 'Colegiados' },
    { value: 'col-medicina', label: 'Colegiado Medicina', group: 'Colegiados' },
    { value: 'col-psicologia', label: 'Colegiado Psicologia', group: 'Colegiados' },
    { value: 'coordenacao-estagio', label: 'Coordenação de Estágio' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'protocolo', label: 'Protocolo' },
    { value: 'registro-diplomas', label: 'Registro de Diplomas' },
    { value: 'secretaria-academica', label: 'Secretaria Acadêmica' },
    { value: 'tesouraria', label: 'Tesouraria' },
  ];

  /* ----------------------------------------------------------- checkbox --- */
  protected readonly requerimentos = [
    { id: '2024-0031' },
    { id: '2024-0032' },
    { id: '2024-0033' },
  ];
  protected readonly selecionados = signal(new Set<string>());

  protected readonly todasMarcadas = computed(
    () => this.selecionados().size === this.requerimentos.length,
  );
  /** Nem vazio nem cheio: é exatamente o caso que o indeterminado existe para dizer. */
  protected readonly parcial = computed(() => {
    const n = this.selecionados().size;
    return n > 0 && n < this.requerimentos.length;
  });

  protected alternar(id: string, marcado: boolean) {
    const proximo = new Set(this.selecionados());
    if (marcado) proximo.add(id);
    else proximo.delete(id);
    this.selecionados.set(proximo);
  }

  protected marcarTodas(marcado: boolean) {
    this.selecionados.set(marcado ? new Set(this.requerimentos.map((r) => r.id)) : new Set());
  }

  /* ------------------------------------------------------------- switch --- */
  protected readonly nivelAbaixo = signal(true);
  protected readonly boleto = signal(false);

  /* ------------------------------------------------------- badge --- */
  protected readonly estados: { tone: UcamBadgeTone; label: string }[] = [
    { tone: 'neutral', label: 'Aguardando análise' },
    { tone: 'info', label: 'Em análise' },
    { tone: 'success', label: 'Deferido' },
    { tone: 'danger', label: 'Indeferido' },
    { tone: 'warning', label: 'Aguardando documento' },
  ];

  /* ------------------------------------------------------------- avatar --- */
  protected readonly pessoas = [
    'Leonardo Fagundes Benevides',
    'Ana de Souza',
    'Marina',
    'Carlos Eduardo Nogueira Lima',
  ];

  /* ----------------------------------------------------------- skeleton --- */
  /**
   * Começa carregando e resolve sozinho: quem chega na página precisa VER a
   * troca acontecer, que é a coisa que o contrato descreve. Sem isto o
   * skeleton ficava eterno — parecia o defeito que ele existe para corrigir.
   */
  protected readonly carregando = signal(true);
  protected recarregar() {
    this.carregando.set(true);
    setTimeout(() => this.carregando.set(false), 1600);
  }

  /* -------------------------------------------------------- empty-state --- */
  protected readonly motivo = signal<'no-data' | 'no-results'>('no-data');

  /* ------------------------------------------------------------- anexo --- */
  protected readonly anexos = signal<UcamFile[]>([
    { id: 'a1', nome: 'prova-av2-calculo3.pdf', tamanho: 1153433, estado: 'enviado' },
    { id: 'a2', nome: 'gabarito-oficial.pdf', tamanho: 3565158, estado: 'enviando', progresso: 60 },
    {
      id: 'a3',
      nome: 'digitalizacao.tiff',
      tamanho: 14889779,
      estado: 'recusado',
      mensagem: 'tem 14,2 MB — o limite é 10 MB',
    },
  ]);

  protected tirarAnexo(a: UcamFile): void {
    this.anexos.update((lista) => lista.filter((x) => x.id !== a.id));
  }

  protected reenviar(a: UcamFile): void {
    this.anexos.update((lista) =>
      lista.map((x) => (x.id === a.id ? { ...x, estado: 'enviando' as const, progresso: 0 } : x)),
    );
  }

  /* -------------------------------------------------------- page-header --- */
  protected readonly migalhas = [{ label: 'Início', link: '/' }, { label: 'Setores' }];

  constructor() {
    // Resolve o carregamento inicial da demo do skeleton. Fica no construtor,
    // não num effect: é uma vez só, e não depende de sinal nenhum.
    setTimeout(() => this.carregando.set(false), 1400);
  }
}
