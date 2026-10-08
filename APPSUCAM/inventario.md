# Inventário dos projetos da UCAM e mapa de telas contra o UCAMDS

Levantado em 06/10/2026. Leitura apenas: nenhum dos repositórios foi alterado.

## Alcance

A organização `universidade-candido-mendes` no GitHub tem um repositório público e os demais
privados. Sem login na organização, este inventário cobre o que estava ao alcance: o repositório
público e três projetos já clonados neste computador.

| Projeto | Origem | Stack | Último commit | Situação no inventário |
|---|---|---|---|---|
| `lib-ucam-workspace` | organização, público | Angular 22, lib de componentes | 01/10/2026 | lido; ver `proposta-lib-do-time.md` |
| `processo-seletivo-frontend` | organização, privado (clone local) | Angular 9, Material 9, Bootstrap 4, ngrx, `ucam-material`, `default-style` | 12/08/2026 (release 9.3.0) | lido por inteiro |
| `vestibular-online` | local, sem remoto | Angular 21, `@ucam/ui` 0.1.2, Tailwind 4 | 03/10/2026 | lido por inteiro |
| `cenpre-ui-angular-scss` | outra conta do GitHub | Angular 22 com SSR, SCSS, Storybook, lib `cenpre-ui-kit` | 01/10/2026 | lido |
| demais repositórios privados da organização | — | — | — | **não vistos** |

O clone de `processo-seletivo-frontend` é de agosto; o remoto pode estar à frente.

Os levantamentos completos, com cada regra apontando arquivo e linha, estão em
`levantamento-processo-seletivo-frontend.md` e `levantamento-vestibular-online-e-cenpre.md`.
Quatro afirmações do primeiro foram conferidas à mão contra o código e batem.

## O que os projetos revelam

**1. O vestibular online é um sistema só, em três gerações.** O legado em Angular 9
(`processo-seletivo-frontend`) está em produção. A reescrita (`vestibular-online`) já cobre candidato,
banca e isenção sobre o `@ucam/ui`. E o projeto `isencao` do UCAMDS, com 8 telas de referência, é o
módulo de isenção desse mesmo sistema. O resto do vestibular não tem tela de referência no DS.

**2. A lib do time é a sucessora de `default-style` e `ucam-material`.** O legado importa a moldura
administrativa de `default-style` (unidade, usuário, troca de unidade, sair) e botão, select,
datepicker e radio de `ucam-material`, publicadas num registro npm interno. A `lib-ucam-workspace`
declara os mesmos modelos (`Unidade {oid, sigla, razaosocial, oidUnidade}`, `UsuarioLogado {oid,
oidpessoa, nome, email, foto, token}`) e o mesmo papel. É o ponto por onde o UCAMDS entra em todos
os apps internos de uma vez.

**3. A reescrita mediu o que falta no DS.** Para montar 15 telas com `@ucam/ui`, o
`vestibular-online` escreveu 25 peças e contornos à mão. É a lista mais confiável de lacunas que
existe, porque veio de uso real (seção "Lacunas do UCAMDS").

**4. O CENPRE é outro produto.** Site institucional com identidade própria (magenta `#b4365b`,
Inter e Work Sans, sem tema escuro) e lib própria. Não usa nada do UCAMDS e não há sinal de que vá
usar. Fica fora do mapa de telas até alguém decidir.

## Mapa de telas: vestibular online (legado → UCAMDS)

Estados: **coberta** (há tela de referência do mesmo módulo), **parcial** (há padrão ou tela de
outro projeto que serve de base, ou faltam peças), **falta** (sem tela nem peça), **não migrar**.
"Reescrita" indica se o `vestibular-online` já tem a tela em `@ucam/ui`.

### Candidato

| Tela do legado | Rota | Estado | Base no UCAMDS | Reescrita | O que falta |
|---|---|---|---|---|---|
| Conferência de dados (entrada) | `/`, `/vestibularonline/:oid` | parcial | `portal/login` (bloco `.ucam-login`) | sim | tela de referência de entrada por link, sem senha |
| Folha de rosto (instruções) | `/folha_rosto` | falta | peças existem: stat, card, checkbox, alert, stepper | sim | tela de referência |
| Prova: questão objetiva | `/prova` | falta | choice-card, citacao, section-bar, progress | sim | mapa de questões, relógio, indicador de salvamento, botão de alternância |
| Prova: redação | `/prova` | falta | textarea | sim | contador de mínimo e máximo como parte do campo |
| Diálogo "Entregar a prova" | — | parcial | dialog de confirmação | sim | tela de referência do fluxo de entrega |
| Diálogo de mensagem | — | coberta | alert, dialog | sim | — |
| Conclusão (resultado) | `/conclusao` | falta | stat, card, badge, stepper | sim | tela de referência |
| Dados pessoais (passo 1 de 3) | `/formulario` | parcial | padrão `formulario-entidade`, `protocolo/novo-requerimento`, stepper | não | formulário em passos; decidir antes se o fluxo ainda existe |
| Upload de documentos (passo 2) | `/upload` | parcial | file-field, anexo | não | lista de documentos exigidos com obrigatoriedade |
| Diálogo do termo de compromisso | — | parcial | dialog | não | — |
| Contrato (passo 3) | `/contract` | falta | — | não | leitura de documento longo com aceite e impressão |
| Diálogo do contrato | — | falta | — | não | idem |
| Inscrição finalizada | `/finish` | parcial | empty-state, card | não | — |
| Boleto | `/bank-slip` | não migrar | — | não | nenhuma navegação leva à rota |
| Acompanhamento da isenção | `/isencao/:oid` | coberta | `isencao/acompanhamento`, `isencao/resultado` | sim | — |

### Banca (área administrativa)

| Tela do legado | Rota | Estado | Base no UCAMDS | Reescrita | O que falta |
|---|---|---|---|---|---|
| Volta do login único | `/admin/login/:token/:usuario` | parcial | skeleton, empty-state | sim | — |
| Boas-vindas | `/admin` | não migrar | — | redireciona | — |
| Correção de redação (em espera, corrigidas) | `/admin/correcao/redacao` | parcial | padrão `triagem-lista-detalhe`, `protocolo/analise-requerimento` | sim | tela de referência de correção com nota |
| Diálogo de correção | — | parcial | absorvido pela lista e detalhe | sim | — |
| Correção de questão | `/admin/correcao/questao` | não migrar | — | não | no legado é um esqueleto vazio |
| Cadastro de cadernos | `/admin/cadastro` | parcial | padrão `listagem-crud`, filtros em gaveta | sim | tela de referência |
| Diálogo de questão | — | parcial | `protocolo/natureza-form` | sim, em texto simples | editor de texto rico (fórmula, imagem, lista) |
| Análise de isenção | `/admin/isencao` | coberta | `isencao/fila`, `analise`, `consulta` | sim | — |
| Diálogo "sem documentos" | — | coberta | `isencao/sem-documentos` | sim | — |

**Totais (24 entradas):** 4 cobertas, 11 parciais, 6 em falta, 3 que não vale migrar.

## Fila de trabalho

**Agora, sem depender de ninguém.** Sete telas do `vestibular-online` já existem em `@ucam/ui` e
viram tela de referência quase diretas: entrada, instruções, questão, redação, resultado, correção
de redação e cadastro de cadernos. Com elas o DS passa a ter o vestibular inteiro, não só a isenção.

**Pede peça nova no DS** (ver lacunas): mapa de questões, relógio de prova, indicador de
salvamento, stepper vertical e botão de alternância. As quatro primeiras são o que separa a tela de
prova de uma tela de referência honesta.

**Pede decisão do time antes de desenhar:**
- o fluxo dados pessoais → upload → contrato → finalização ainda é usado? No código nenhuma
  navegação ativa leva a ele; a conclusão manda o aprovado para a "área do inscrito" externa;
- o editor de questão precisa de fórmula e imagem? A reescrita grava texto simples e perde a
  formatação de questões antigas ao regravar;
- a correção de questões objetivas pela banca deve existir? Hoje é uma tela vazia.

## Lacunas do UCAMDS medidas pela reescrita

Levantadas contra o `@ucam/ui` 0.1.2; o DS está em 0.1.3, então cada item pede conferência antes
de virar tarefa.

### Peças que não existem

| Peça | O que o app escreveu | Onde |
|---|---|---|
| Mapa de questões | grade de bolhas numeradas com quatro estados, legenda e atalho "próxima em branco" | `candidato/prova/mapa-questoes.ts` |
| Relógio de prova | contagem regressiva com tom por tempo restante e anúncio para leitor de tela | `layout/relogio-faixa.ts`, `core/tempo/relogio-prova.ts` |
| Indicador de salvamento | Salvando, Sem conexão, erro, Salvo, com região `aria-live` | `candidato/prova/cabecalho-prova.ts` |
| Stepper vertical | número, check, fio, dica por passo, passo clicável | `layout/etapas-lateral.ts` |
| Botão de alternância | `aria-pressed` com sinal próprio ("Marcar para revisar") | `candidato/prova/questao/questao.ts` |
| Entrada como componente | o bloco `.ucam-login` com 15 subclasses escrito à mão duas vezes | `candidato/entrada`, `candidato/sem-link` |
| Alternância de tema | serviço e botão próprios | `core/tema.ts`, `layout/tema-toggle.ts` |
| Editor de texto rico | não foi escrito; a reescrita caiu para texto simples | `banca/provas/questao-form.ts` |

### Peças que existem e não bastaram

- `ucam-button`: o hospedeiro é inline e não estica na coluna; o app voltou ao `<button class="ucam-btn">`.
- `ucam-text-field`: não tem o degrau `lg` nem adorno; o campo foi montado com `ucam-field` e `<input>` nativo.
- `ucam-textarea`: o app envolve o campo num `<div (focusout)>` para saber da saída (falta de evento: não confirmado).
- `ucam-file-field`: erro do arquivo escrito à mão abaixo do campo (falta de `errorMessage`: não confirmado).
- `ucam-card`: o apoio é de uma linha e cortava a frase com reticências.
- `ucam-description-list` em painel: a largura do rótulo só cedeu com `::ng-deep`.
- Links do `ucam-app-shell`: são `<a href>` comuns e recarregavam o app; o app escreveu uma diretiva para interceptar.
- `.ucam-cluster`: quebra linha com frase longa e o ícone sobe.
- CSS do DS sem camada: vence `lg:hidden` do Tailwind, e o app embrulha blocos em `<div>` só para esconder.
- Densidade: o candidato precisou de `html { font-size: 112.5% }`; o DS mede tela de trabalho.
- Nomes de entrada misturam idiomas: `variante="barra"` no page-header, `titulo/apoio/icone` no card, `title/label/variant` nos demais.
- `ucam_check_usage`: somava todos os primários do arquivo e acusava cinco onde só um aparece por vez; o app escreveu um auditor em volta.

## Padrões que se repetem

| Padrão | Onde aparece | No UCAMDS |
|---|---|---|
| Entrada por link, sem senha: o identificador vem na URL | candidato da prova, acompanhamento da isenção | falta tela de referência; há pergunta de segurança em aberto |
| Volta do login único do SIGU com token e usuário na URL, depois usuário, unidades e pessoa | legado, reescrita, e os modelos da lib do time | deveria morar na lib do time, uma vez |
| Moldura com unidade de trabalho e troca de unidade; cabeçalho `Unidade-Ref` nas chamadas | legado (`default-style`), reescrita, lib do time, Gerencial | `ucam-app-shell` cobre o desenho |
| Escopo em cascata antes da lista (período, forma de ingresso, captação, datas) | correção de redação, cadastro de cadernos | gaveta de filtros com chips do escopo; falta nomear como padrão |
| Lista paginada e ordenada no servidor (`size`, `page`, `sort`; resposta `content`, `totalElements`) | correção, fila de isenção | `ucam-data-table` e `ucam-pagination`; o contrato pode declarar esse formato |
| Lista e detalhe lado a lado para decidir item a item | correção de redação, análise de isenção, Protocolo | padrão `triagem-lista-detalhe` |
| Decisão por item com campos condicionais e fechamento barrado | análise de isenção | `isencao/analise` |
| Envio de documento com tipo, obrigatoriedade e formatos aceitos | upload do aprovado, isenção | `ucam-file-field`, `ucam-anexo`; falta a lista de exigidos |
| Formatos: CPF, turno, nome de curso, datas por extenso | todos | `spec/formats.json` |
| Tipo de unidade (EAD, semipresencial, presencial) deduzido do código da unidade | legado e reescrita, com dois critérios diferentes no legado | regra de negócio a unificar |

## Regras de negócio

O código responde bem ao que a tela faz. Foram lidas 115 regras no legado e 87 na reescrita, cada
uma com arquivo e linha nos levantamentos. As que mais pesam no desenho das telas:

**Prova**
- O candidato entra só pelo link; a tentativa vem em `?tentativa=` e o limite vem do servidor.
- O tempo máximo vem do servidor em `HH:MM:SS`; se a chamada falha, valem 2 horas. O relógio conta a partir do horário de início do servidor, então sair e voltar não devolve tempo.
- Cada alternativa marcada é gravada na hora; não há botão de salvar. Sem conexão, a resposta fica guardada no navegador e é reenviada.
- A navegação entre questões é livre e ninguém é obrigado a responder para avançar.
- Redação: mínimo de 300 caracteres sem contar espaços, máximo de 3000 contando.
- Sem redação, a prova objetiva é corrigida na hora e o candidato vê o desfecho; com redação, espera a banca.

**Correção**
- Nota única de 0 a 10, de meio em meio ponto. Não há critérios, segunda correção nem motivo para zero.
- A nota pode ser regravada depois de lançada.

**Isenção**
- Situações: aguardando envio, aguardando análise, aguardando candidato, concluída.
- Isentar exige disciplina de origem, instituição e carga horária; pedir documento exige o texto do pedido; recusar não exige justificativa.
- Pedido concluído vira somente leitura.

**Onde a reescrita mudou a regra do legado** (cada uma é decisão a confirmar):
- tempo esgotado: o legado só navega para a conclusão sem finalizar a prova; a reescrita entrega sozinha;
- correção de redação: no legado a rota está sem proteção; a reescrita exige sessão;
- isenção: o legado deixa finalizar com disciplina sem decisão; a reescrita barra;
- bloqueios: o legado bloqueia copiar, colar, F12, imprimir e PrintScreen no documento inteiro e não desfaz ao sair; a reescrita bloqueia copiar, colar e menu de contexto só na questão e na redação;
- redação: o rascunho local do legado sobrepõe o texto do servidor; na reescrita só é usado se o servidor não tiver texto.

## Perguntas que o código não responde

São 36 no legado e 13 na reescrita, listadas nos levantamentos. As que travam desenho de tela:

| Pergunta | Quem decide |
|---|---|
| Qual é a regra de aprovação (nota de corte, pesos) e o número de tentativas? Só existe suposição no mock. | Comissão do vestibular |
| O servidor encerra a prova e recusa resposta depois do tempo? | Time de backend |
| Quem pode corrigir redação e analisar isenção? O front não conhece perfil nenhum. | Secretaria e TI |
| O token da sessão nunca é enviado nas chamadas, no legado e na reescrita. O servidor autentica como? | TI |
| O acompanhamento da isenção e o download de documentos ficam sem autenticação em produção? | TI |
| Onde se cadastram as questões objetivas, alternativas e gabarito? Nenhum dos dois fronts cadastra. | Comissão do vestibular |
| O cadastro pós-aprovação (dados, upload, contrato) ainda é deste sistema? | Secretaria |
| O que o prazo `60` do termo de compromisso representa e o que acontece quando vence? | Secretaria |

## O que ficou de fora

- Os demais repositórios privados da organização: dependem de login no GitHub com uma conta que
  seja membro.
- `ucam-material` e `default-style`: as libs não estão instaladas no clone e vêm de um registro
  interno; o que elas desenham de fato não foi visto.
- Folhas `.sass` de componente do legado e `.scss` de página do CENPRE, lidas só em pontos.
- Nenhuma tela foi aberta no navegador: o inventário é de código, não de pixel.
