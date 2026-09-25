// Formas que o site consome de site/src/generated/spec.data.json.
//
// O núcleo é tipado com precisão. As seções de extensão (limites, foco,
// rolagem, responsividade, dependencia, obrigatoriedade, conteudo) são
// deliberadamente frouxas: cada componente as molda de um jeito, e um tipo
// rígido aqui obrigaria a editar código toda vez que um contrato crescesse.
// Quem valida a forma real é tools/validate-spec.mjs contra o JSON Schema.

export type Valor = string | number | boolean | null;
export type Bloco = Record<string, unknown>;

export type Status = 'draft' | 'stable' | 'deprecated' | string;
export type Tom = 'good' | 'warn' | 'bad' | 'muted';

export interface Wcag {
  label: string;
  tone: Tom;
}

/* ------------------------------------------------------------ contratos --- */

export interface Anatomia {
  parte: string;
  obrigatorio: boolean;
  descricao: string;
  /**
   * A classe do Trilho A que É esta parte. 193 das 313 partes a declaram, e é
   * ela que o diagrama de anatomia procura no preview para saber onde pôr a
   * chamada numerada — ver anatomia-diagrama.component.ts.
   */
  classe?: string;
}

export interface ValorProp {
  uso: string;
  tokens?: Record<string, string>;
  limite?: string;
}

export interface Prop {
  nome: string;
  tipo: string;
  default?: Valor;
  descricao: string;
  valores?: Record<string, ValorProp>;
}

export interface Ocorrencia {
  tela: string;
  rotulo?: string;
  problema: string;
  /** Só existe depois da auditoria do segundo app. Ver Fase 4. */
  origem?: string;
}

export interface Evidencia {
  origem: string;
  ocorrencias: Ocorrencia[];
  conclusao?: string;
}

export interface Tecla {
  tecla: string;
  comportamento: string;
}

export interface Acessibilidade {
  papel?: string;
  teclado?: Tecla[];
  requisitos: string[];
  criterios_wcag: string[];
}

export interface LinhaMigracao {
  legado: string;
  novo: string;
  nota?: string;
}

export interface Migracao {
  de: string;
  mapa: LinhaMigracao[];
}

export interface Exemplo {
  titulo: string;
  codigo: string;
}

/**
 * Par faça/evite. O schema exige os dois lados: um "faça" sem o "evite"
 * correspondente vira conselho vago, que ninguém aplica nem revisa.
 */
export interface BoaPratica {
  faca: string;
  evite: string;
  porque?: string;
}

/**
 * Desambiguação contra o componente vizinho. Sempre simétrica — o validador
 * falha se um lado explicar e o outro não —, porque a dúvida "qual dos dois eu
 * uso?" chega pelos dois caminhos e quem abre o Dialog primeiro precisa achar
 * o Drawer ali.
 */
export interface Desambiguacao {
  componente: string;
  diferenca: string;
  escolha?: string;
}

/**
 * Uma demo de spec/demos.json, já resolvida por tools/build-index.mjs.
 *
 * `preview` é HTML real do Trilho A — as classes de @ucam/css, renderizadas
 * pelo mesmo arquivo que os apps legados carregam. Não é maquete.
 */
export interface DemoPainel {
  preview?: string;
  codigo: string;
  titulo?: string;
  descricao?: string;
}

export interface Demo {
  instalacao?: string;
  importacao?: string;
  principal?: DemoPainel;
  exemplos?: DemoPainel[];
  /**
   * Retrato ESTÁTICO para o card do catálogo, só onde o Trilho A não desenha
   * o componente (chart, combobox, command). Não é preview: não conta como
   * Trilho A disponível e não entra na página do componente.
   */
  miniatura?: string;
  /** Por que este componente não tem preview estático, quando não tem. */
  $nota?: string;
}

/**
 * Em qual trilho o componente existe hoje. Derivado no build a partir das
 * fontes que mandam — ver trilhosDe() em tools/build-index.mjs.
 */
export interface TrilhoDisponivel {
  id: 'a' | 'a-mais' | 'b';
  rotulo: string;
  meio: string;
  /** `null` = a fonte não estava no workspace. Não é o mesmo que `false`. */
  disponivel: boolean | null;
  detalhe: string | null;
}

export interface Composicao {
  $descricao?: string;
  usa?: string[];
  usada_por?: string[];
}

export interface Componente {
  id: string;
  name: string;
  selector: string;
  status: Status;
  version: string;
  since?: string;
  category: string;
  description: string;
  quando_usar?: string[];

  anatomia: Anatomia[];
  props: Prop[];
  estados: string[];
  acessibilidade: Acessibilidade;
  exemplos: Exemplo[];
  boas_praticas?: BoaPratica[];
  vs?: Desambiguacao[];
  demo?: Demo;
  trilhos?: TrilhoDisponivel[];

  evidencia?: Evidencia;
  migracao?: Migracao;
  composicao?: Composicao;

  // Extensões livres — renderizadas pelo bloco genérico.
  conteudo?: Bloco;
  limites?: Bloco;
  schemas?: Bloco;
  responsividade?: Bloco;
  foco?: Bloco;
  rolagem?: Bloco;
  dependencia?: Bloco;
  obrigatoriedade?: Bloco;
  formatacao?: Bloco;
}

/* -------------------------------------------------------------- padrões --- */

export interface Padrao {
  id: string;
  nome: string;
  status: Status;
  /** Uma frase: a tarefa que o padrão resolve. É o texto do cartão em /padroes. */
  resumo: string;
  frequencia: string;
  problema: string;
  estrutura?: string[];
  regras: string[];
  usa: string[];
  evidencia: string;
}

/* ------------------------------------------------------------- decisões --- */

export interface Adr {
  id: string;
  slug: string;
  titulo: string;
  status: string;
  data: string;
  contexto: string;
  decisao: string;
  consequencias: string[];
  afeta: string[];
}

/* ------------------------------------------------------------- fundações --- */

export interface Degrau {
  degrau: string;
  valor: string;
  descricao: string;
  /** Tinta legível sobre este degrau, escolhida por contraste. */
  tinta: string;
}

export interface Rampa {
  nome: string;
  descricao: string;
  degraus: Degrau[];
}

export interface LinhaTexto {
  token: string;
  ref: string;
  hex: string;
  fundo: string;
  razao: number;
  wcag: Wcag;
  isento: boolean;
  descricao: string;
}

export interface LinhaAcao {
  token: string;
  hex: string;
  ref: string;
  razao: number;
  wcag: Wcag;
  descricao: string;
}

export interface LinhaEscala {
  token: string;
  ref?: string;
  valor: string;
  descricao: string;
}

export interface PapelTipografico {
  papel: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string | null;
}

export interface Amostra {
  token: string;
  /** O nome dentro da família: `sunken`, não `color.surface.sunken`. */
  nome: string;
  ref: string;
  hex: string;
  /** Tinta legível sobre a amostra, escolhida por contraste. */
  tinta: string;
  descricao: string;
}

export interface FamiliaCor {
  id: string;
  descricao: string;
  amostras: Amostra[];
}

/** Um tom de feedback: o único lugar do sistema onde tinta e fundo vêm
 *  declarados aos pares, e portanto o único onde o contraste é verificável
 *  token contra token. */
export interface TomFeedback {
  tom: string;
  descricao: string;
  background: string | null;
  foreground: string | null;
  border: string | null;
  graphic: string | null;
  razao: number | null;
  wcag: Wcag | null;
}

export interface Elevacao {
  descricao: string;
  sombras: LinhaEscala[];
  papeis: LinhaEscala[];
  escuroDescricao: string;
  papeisEscuro: LinhaEscala[];
  camadasDescricao: string;
  camadas: { token: string; valor: number; descricao: string }[];
}

export interface LinhaBreakpoint extends LinhaEscala {
  px: number;
  /** Qual degrau primitivo o papel referencia. Só nos papéis. */
  degrau?: string;
}

export interface Breakpoints {
  descricao: string;
  papeisDescricao: string;
  escala: LinhaBreakpoint[];
  papeis: LinhaBreakpoint[];
  /** Papéis de CONTÊINER (ADR-028): largura do painel, não da janela. */
  contentoresDescricao: string;
  contentores: LinhaBreakpoint[];
}

export interface Movimento {
  descricao: string;
  curvas: LinhaEscala[];
  duracoes: LinhaEscala[];
  curvasPrimitivas: LinhaEscala[];
  duracoesPrimitivas: LinhaEscala[];
}

export interface Fontes {
  descricao: string;
  origem: string;
  familias: LinhaEscala[];
  tamanhos: LinhaEscala[];
  pesos: LinhaEscala[];
}

export interface GrupoIcones {
  id: string;
  nome: string;
  icones: { lucide: string; uso: string }[];
}

export interface Icones {
  descricao: string;
  /** A chamada curta do cabeçalho. O racional longo é o outro campo, e vai
   *  para o bloco "Por quê" — ver tools/check-lede.mjs. */
  lede: string;
  regras: string[];
  meta: Record<string, string>;
  total: number;
  grupos: GrupoIcones[];
}

export interface Estado {
  id: string;
  gatilho: string;
  aparencia: string;
  /** Menor número vence quando dois estados se aplicam ao mesmo tempo. */
  precedencia: number;
}

export interface Estados {
  descricao: string;
  /** A chamada curta do cabeçalho. O racional longo é o outro campo, e vai
   *  para o bloco "Por quê" — ver tools/check-lede.mjs. */
  lede: string;
  origem: string;
  divergencia: string;
  lista: Estado[];
  precedencia: { ordem: string[]; regra: string; excecao: string };
  disabled: {
    regra: string;
    motivo: string;
    /** ADR-042: o degrau único em que todo controle bloqueado assenta. */
    chao_unico: { regra: string; motivo: string };
    /** ADR-042: o chão pesado mais a perda da aresta — e o que separa de readonly. */
    dois_sinais: { regra: string; motivo: string; nao_confundir: string };
    acessibilidade: string[];
  };
  loading: {
    regra: string;
    motivo: string;
    posicao_do_indicador: { componente: string; posicao: string }[];
  };
  movimento: {
    regra: string;
    mapa: { propriedade: string; duracao: string; easing: string }[];
    proibido: string[];
  };
}

/* -------------------------------------------------------------- escrita --- */

export interface EixoDeVoz {
  eixo: string;
  regra: string;
  bom: string;
  ruim: string;
}

export interface PrincipioDeEscrita {
  id: string;
  titulo: string;
  regra: string;
  porque: string;
  /** Quando o princípio já foi decidido formalmente. */
  adr?: string;
  bom: string[];
  ruim: string[];
  /** Onde o parque legado faz o contrário. Ausente quando o princípio é geral. */
  ocorrencias?: string[];
}

export interface TermoDeVocabulario {
  use: string;
  evite: string;
  nota: string;
}

export interface FormaDeTexto {
  id: string;
  peca: string;
  forma: string;
  bom: string;
  ruim: string;
  componente: string;
  componenteNome: string;
}

/** Um bloco `conteudo` de contrato, achatado. */
export interface BlocoDeConteudo {
  chave: string;
  regras: string[];
  bom: string[];
  ruim: string[];
}

export interface ConteudoDeComponente {
  id: string;
  nome: string;
  categoria: string;
  blocos: BlocoDeConteudo[];
}

export interface Escrita {
  descricao: string;
  /** A chamada curta do cabeçalho. O racional longo é o outro campo, e vai
   *  para o bloco "Por quê" — ver tools/check-lede.mjs. */
  lede: string;
  meta: Record<string, string>;
  voz: { resumo: string; eixos: EixoDeVoz[] };
  principios: PrincipioDeEscrita[];
  vocabulario: { regra: string; termos: TermoDeVocabulario[] };
  formas: FormaDeTexto[];
  proibido: string[];
  /** Agregado dos 46 contratos — não é conteúdo próprio desta fundação. */
  porComponente: ConteudoDeComponente[];
  totais: {
    contratos: number;
    regras: number;
    bons: number;
    ruins: number;
    semConteudo: string[];
  };
}

/* ---------------------------------------------------- dados (visualização) --- */

export interface VeiculoDeDado {
  pergunta: string;
  componente: string;
  componenteNome: string;
  forma: string;
  evite: string;
  porque: string;
}

export interface FormaDeGrafico {
  id: string;
  uso: string;
  limite: string;
}

export interface RegraDeIntegridade {
  id: string;
  regra: string;
  porque: string;
}

export interface Dados {
  descricao: string;
  /** A chamada curta do cabeçalho. O racional longo é o outro campo, e vai
   *  para o bloco "Por quê" — ver tools/check-lede.mjs. */
  lede: string;
  meta: Record<string, string>;
  veiculos: VeiculoDeDado[];
  /** Lida do contrato do chart, não recopiada. */
  formas: FormaDeGrafico[];
  paleta: {
    descricao: string;
    regra: string;
    ordem: string;
    identidade: string;
    fronteira: string;
    limite_honesto: string;
    slots: Amostra[];
    slotsEscuro: Amostra[];
  };
  integridade: RegraDeIntegridade[];
  equivalente: { regra: string; porque: string; forma: string };
  portao: {
    ferramenta: string;
    adr: string;
    o_que_faz: string;
    limiar: string;
    quando_roda: string;
    historia: string;
  };
  limites: { regras: string[]; motivo: string };
  proibido: string[];
}

/* ------------------------------------------------------------- formatos --- */

export interface Formato {
  id: string;
  nome: string;
  forma: string;
  exemplo: string;
  modelo: string;
  onde: string;
  regra: string;
}

export interface Formatos {
  descricao: string;
  /** A chamada curta do cabeçalho. O racional longo é o outro campo, e vai
   *  para o bloco "Por quê" — ver tools/check-lede.mjs. */
  lede: string;
  meta: Record<string, string>;
  fronteira: { modelo: string; tela: string; regra: string };
  formatos: Formato[];
  regras: RegraDeIntegridade[];
  ondeFormata: {
    regra: string;
    excecoes: {
      componente: string;
      componenteNome: string;
      o_que_faz: string;
      limite: string;
    }[];
  };
  evidencia: {
    origem: string;
    ocorrencias: { tela: string; campo: string; problema: string }[];
    conclusao: string;
  };
}

/* ------------------------------------------------------------ densidade --- */

export interface PapelDeLargura {
  token: string;
  valor: string;
  papel: string;
  porque: string;
}

export interface PapelDeAltura {
  token: string;
  papel: string;
  quem_usa: string;
  /** Resolvido de semantic.size pelo gerador. */
  tokens: { token: string; valor: string | null; px: number | null; descricao: string }[];
}

export interface Densidade {
  descricao: string;
  /** A chamada curta do cabeçalho. O racional longo é o outro campo, e vai
   *  para o bloco "Por quê" — ver tools/check-lede.mjs. */
  lede: string;
  meta: Record<string, string>;
  larguras: { regra: string; papeis: PapelDeLargura[] };
  leitura: { regra: string; medidas: { medida: string; onde: string; porque: string }[] };
  alturas: { regra: string; papeis: PapelDeAltura[]; excecao_de_densidade: string };
  alvos: {
    regra: string;
    patamares: { ponteiro: string; alvo: string; criterio: string; porque: string }[];
    medicao: {
      metodo: string;
      achados: { alvo: string; media: string; nota: string }[];
      conclusao: string;
    };
    fora_da_lista: string[];
  };
  portao: { ferramenta: string; o_que_faz: string; porque: string; custo_assumido: string };
  proibido: string[];
}

export interface Fundamentos {
  descricao: string;
  regraCamadas: string;
  temaEscuro: { descricao: string; regra: string };
  rampas: Rampa[];
  texto: LinhaTexto[];
  textoEscuro: LinhaTexto[];
  acao: LinhaAcao[];
  acaoEscuro: LinhaAcao[];
  espacoPrimitivo: LinhaEscala[];
  espacoSemantico: LinhaEscala[];
  raio: LinhaEscala[];
  duracao: LinhaEscala[];
  tipografia: PapelTipografico[];
  tamanhos: LinhaEscala[];
  foco: { larguraAnel: string; offset: string };
  raioPapeis: LinhaEscala[];
  familias: FamiliaCor[];
  familiasEscuro: FamiliaCor[];
  feedback: TomFeedback[];
  feedbackEscuro: TomFeedback[];
  elevacao: Elevacao;
  breakpoints: Breakpoints;
  movimento: Movimento;
  fontes: Fontes;
  icones: Icones;
  estados: Estados;
  escrita: Escrita;
  dados: Dados;
  formatos: Formatos;
  densidade: Densidade;
}

/* ------------------------------------------------------------- recursos --- */

export interface Pacote {
  nome: string;
  conteudo: string;
  consumidores: string;
  estado: string;
  nota?: string;
}

export interface FerramentaMcp {
  nome: string;
  faz: string;
  estado: string;
}

export interface Skill {
  nome: string;
  faz: string;
  onde: string;
}

/**
 * Como se consome o design system num trilho. PARA QUEM ele é não mora aqui:
 * mora em migracao.escolhaDoTrilho, que é o seletor único, e a página de
 * instalação casa os dois pelo id.
 */
export interface Trilho {
  id: string;
  nome: string;
  como: string;
  codigo: string;
  limite: string;
  /** Quantos contratos este trilho entrega hoje. Derivado no build. */
  componentes?: number;
}

export interface Recursos {
  /** Onde o design system é servido. O sitemap, os exemplos de instalação e o
   *  portão tools/build-publicacao.mjs leem daqui — host em um lugar só. */
  publicacao: {
    $description: string;
    host: string;
    /** As rotas servidas ao lado do site. Espelham a árvore do dist/, porque
     *  as folhas publicadas se referem umas às outras por caminho relativo. */
    tokens: string;
    css: string;
    icones: string;
    fontes: string;
    elements: string;
    pacotes: string;
  };
  pacotes: { $description: string; itens: Pacote[] };
  formatosToken: {
    $description: string;
    referencia: string;
    itens: { formato: string; arquivo: string; para: string }[];
  };
  mcp: { $lede: string; $description: string; config: unknown; ferramentas: FerramentaMcp[] };
  skills: { $lede: string; $description: string; itens: Skill[] };
  instalacao: { $lede: string; $description: string; trilhos: Trilho[] };
  figma: { $description: string; estado: string };
}

/* -------------------------------------------------- blocos de layout --- */
/* Contrato: spec/layouts.json. A camada entre componente e tela: um
   componente resolve um controle, um bloco resolve onde as coisas ficam. */

export interface ParteLayout {
  classe: string;
  descricao: string;
}

export interface VarianteLayout {
  classe: string;
  quando: string;
  nota?: string;
}

export interface VariavelLayout {
  nome: string;
  default?: string;
  descricao?: string;
}

export interface BlocoLayout {
  id: string;
  nome: string;
  classe: string;
  papel: string;
  quando: string;
  decisao?: string;
  substitui?: string;
  variantes?: VarianteLayout[];
  partes?: ParteLayout[];
  variaveis?: VariavelLayout[];
  exemplo: string;
}

export interface AreaShell {
  area: string;
  classe: string;
  obrigatorio: boolean;
  descricao: string;
  partes?: ParteLayout[];
}

export interface Shell {
  id: string;
  nome: string;
  classe: string;
  componente: string;
  papel: string;
  grade: string;
  evidencia: string;
  areas: AreaShell[];
  variantes?: VarianteLayout[];
  estado: { atributo: string; valores: string[]; descricao: string };
  variaveis: VariavelLayout[];
  acessibilidade: string[];
}

export interface Layouts {
  $lede: string;
  $description: string;
  _meta: { regra: string; prefixo: string; taxonomia: string };
  shell: Shell;
  blocos: BlocoLayout[];
  boas_praticas: BoaPratica[];
}

/* ------------------------------------------------------------- telas --- */
/* Contrato: spec/templates.json. A tela inteira, montada com os componentes
   e os blocos — o degrau acima do bloco de layout. */

export interface Tela {
  id: string;
  nome: string;
  padrao: string;
  origem: string;
  descricao: string;
  usa: string[];
  notas?: string[];
  problemas?: string[];
  codigo?: string;
  /** Página autônoma em docs/t/, para abrir a tela em tamanho real. */
  arquivo: string;
  /** De onde se chega e o que cada ação faz (ADR-033). */
  fluxos?: FluxoTela;
}

/**
 * (a) leva a outra tela, (b) não tem tela neste conjunto e fica indisponível
 * com o motivo, (c) age na própria tela. `destino` é "projeto/tela".
 */
export interface AcaoFluxo {
  rotulo: string;
  classe: 'a' | 'b' | 'c';
  destino?: string;
  efeito: string;
}

export interface FluxoTela {
  /** "projeto/tela" de quem aponta para esta, ou "menu do sistema". */
  chega_de: string[];
  acoes: AcaoFluxo[];
}

export interface ProjetoTelas {
  id: string;
  nome: string;
  descricao: string;
  stack_atual: string;
  /** Símbolo do sprite (sem o prefixo `i-`). Estava em templates.json e chegava
   *  ao dado gerado desde sempre; só não constava do tipo, e por isso a galeria
   *  de telas não tinha como usá-lo. */
  icone: string;
  templates: Tela[];
}

/* ----------------------------------------------------------------- topo --- */

export interface Meta {
  geradoEm: string;
  /** Versão do design system, lida do package.json da raiz. */
  versao: string;
  /** Estado majoritário dos contratos: o que o selo do cabeçalho anuncia. */
  estado: Status;
  componentes: number;
  padroes: number;
  adrs: number;
  evidencias: number;
  requisitosA11y: number;
  criteriosWcag: number;
  conversoesMigracao: number;
  telas: number;
  projetos: number;
  blocos: number;
  /** Soma dos blocos `conteudo` dos 46 contratos — não é constante digitada. */
  regrasDeTexto: number;
  formatos: number;
  avisoCores: { origem: string; pendencia: string };
}

export interface Release {
  id: string;
  nome: string;
  versao: string;
  desde: string;
  status: Status;
}

export interface ItemBusca {
  tipo: string;
  titulo: string;
  subtitulo: string;
  url: string;
  texto: string;
}

/**
 * O guia de migração. Só carrega o que não existe em outro arquivo: o mapa
 * legado→novo por componente vive em cada contrato, e a página o compõe a
 * partir de `componentes`.
 */
export interface Migracao {
  $lede: string;
  $description: string;
  /**
   * O seletor de trilho, e o único: a pergunta que decide, o papel de cada
   * trilho e o para-quem de cada um. A home e a página de instalação leem
   * daqui — antes, `alvo` em resources.json dizia o mesmo com outras palavras,
   * e as duas versões já divergiam.
   */
  escolhaDoTrilho: {
    /** A pergunta que decide. Uma só, e vem antes dos cartões. */
    pergunta: string;
    $descricao: string;
    /** Ponte e destino: por que são três e não um. */
    nota: string;
    trilhos: {
      id: string;
      nome: string;
      quando: string;
      entrega: string;
      naoEntrega: string;
      custo: string;
      armadilha: string;
    }[];
    misturar: string;
  };
  ordem: {
    $descricao: string;
    passos: { n: number; titulo: string; o_que: string; por_que: string; verificar: string }[];
  };
  mudancasVisiveis: {
    $descricao: string;
    itens: { mudanca: string; adr: string; resposta: string }[];
  };
  anatomiaDeTela: {
    $descricao: string;
    camadas: { camada: string; quem: string; responde: string; erro_comum: string }[];
  };
  checklistDeTela: {
    $descricao: string;
    grupos: { grupo: string; itens: string[] }[];
  };
  errosQueSobrevivem: {
    $descricao: string;
    itens: { erro: string; porque_sobrevive: string; certo: string }[];
  };
  ondeEstaOQue: {
    $descricao: string;
    itens: { pergunta: string; onde: string }[];
  };
  aindaNaoExiste: {
    $descricao: string;
    regra: string;
    avisos: string[];
    /** Derivado no build da diferença entre contratos e a biblioteca Angular. */
    semAngular: { id: string; name: string; selector: string }[];
  };
}

export interface SpecData {
  meta: Meta;
  fundamentos: Fundamentos;
  componentes: Componente[];
  padroes: Padrao[];
  layouts: Layouts;
  telas: ProjetoTelas[];
  adrs: Adr[];
  recursos: Recursos;
  migracao: Migracao;
  releases: Release[];
  busca: ItemBusca[];
}
