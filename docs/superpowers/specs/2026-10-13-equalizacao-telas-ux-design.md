# Equalização das telas de app e UX nova (leva 3)

Data: 13/10/2026. Estado: proposta, aguardando revisão.

## De onde vem

Auditoria das 86 telas de `docs/t/` a 1440px, tema claro: censo estrutural por CDP (cabeçalho, filtros, tabela, formulário, rodapé), leitura de 25 capturas e benchmarking em Carbon, Polaris, Atlassian, Primer, Stripe Apps, GOV.UK, NN/g e Baymard. Material 3, gov.br, Workday, Attio e Lightning não abriram na fonte e não sustentam nada aqui.

As levas 1 e 2 (defeitos e equalização) já estão aplicadas na árvore de trabalho. Esta spec cobre o que muda comportamento ou contrato e por isso pede decisão.

## O que já foi feito (levas 1 e 2)

| Mudança | Onde | Medida |
|---|---|---|
| Dica "dd/mm/aaaa" visível vira texto só para leitor de tela | 6 telas | 8 → 0 |
| Cálculo individual: grupo Referência/Vencimento/Desconto em duas trilhas | `sigfin/calculo-mensalidade` | campo vazava 50px → 0 |
| Cabeçalho da linha do tempo em grade de três trilhas | `build-css.mjs` | hora e papel na mesma linha do autor |
| Resumo do pé da tabela sem a margem do `<p>` | `build-css.mjs` | vão de 15px some |
| Gerencial: listagem de 1º nível sem trilha; demais sem "Início /" | 19 telas | título em y=116: 38 → 29 telas |
| Botões do cabeçalho em 36px | 7 telas | 17 → 7 botões de 32px |
| Selo com ponto em Relatórios | `relatorios/resultado` | 24 selos |
| Parágrafo que explica a tela sai | 18 telas | 29 → 11 |
| Selo + apoio numa linha, com `<span class='td--linha'>` | Cartões de segurança, Feriados | uma altura de linha |
| Carga por setor: barra de uma cor só, atraso em tinta de perigo no texto | `protocolo/gerencial` | cor deixa de contradizer o comprimento |
| Item 1: fileiras do formulário a 16px (ADR-072) | `build-css.mjs` | vão entre campos 52–58px → 36px; Unidade 1.603 → 1.419px de página |
| Item 2: rodapé de ações fixo onde ele nascia fora da janela | 6 formulários | Salvar visível na primeira dobra, a 1440 e a 390px |
| Item 3: coluna de ações sem fio, no corpo e no cabeçalho | `build-css.mjs`, 13 listagens | fio medido transparente |
| Item 5 (opção A): motivo curto dentro do selo | Usuários, Sala de matrícula | Sala: 3 alturas de linha → 1; recortes devolvem as mesmas linhas |
| Item 8: regra de cor da barra no contrato do Progress (ADR-073) | `progress.json` | nenhuma tela muda |
| Item 4 (parte): uma redação para o vazio de filtro | 27 listagens | 14 frases → 1 (toda listagem com vazio tem busca e outro filtro) |
| Item 7: coluna só de menu usa ⋮ em vez de ↓; ícone de tipo da ADR-051 mantido | 9 colunas em 4 telas, e o Trilho B | a seta ↓ passa a significar só "ordenada em ordem decrescente" |
| Item 6 (parte): J e K andam na fila | Caixa de entrada, Setores, Redações | sonda de teclado nas três |

Correção ao item 4: a frase "uma tela mostra estado vazio" valia para o que aparece em repouso. Das 31 listagens com filtro, 25 já tinham o vazio de filtro ligado; o que mudou foi a redação. Plano: `docs/superpowers/plans/2026-10-13-equalizacao-vazio-e-teclado.md`, executado em 13/10. Do item 4 faltam skeleton, vazio de "nenhum registro ainda" e o vazio da Auditoria; do item 6 falta o desfazer.

Plano dos itens 1, 2, 3, 5 e 8: `docs/superpowers/plans/2026-10-13-equalizacao-contratos.md`, executado em 13/10. Duas diferenças em relação ao plano: "Pendente · documentos e pagamento" virou "Pendente · 2 itens" (o texto longo vazava a tabela), e a Extensão ficou de fora porque a tela já não tinha selo com apoio.

Ficaram de fora, com motivo:

- **Selo + apoio numa linha em Usuários, Sala de matrícula e Extensão.** A coluna não comporta os dois a 1440px: a tabela entra em arranjo apertado e a coluna vizinha vai a três linhas. Voltou ao arranjo anterior. Resolver exige tirar o apoio da célula (decisão 5).
- **Tabelas que rolam de lado** (Baixar e Enviar mensalidades, Extensão). O mecanismo existe: primeira coluna fixa e barra fina. Não é defeito de CSS; é excesso de colunas para a largura.
- **Contagem ao lado do título.** `viewbar__contagem` e `viewbar__meta` têm papéis diferentes no contrato (número × fato). Unificar é reescrever a frase de umas 30 telas.
- **Botões pequenos na barra da Análise da isenção e da Caixa de entrada.** São barras densas, com sete controles; em 36px não cabem.
- **Cinco arquivos órfãos em `docs/t/`** (`vestibular-cadernos`, `-correcao-redacao`, `-entrada`, `-prova-questao`, `-prova-redacao`), de 06/10, sem template na spec. Eram eles que faziam o Vestibular parecer estar em duas escalas. Não foram apagados.

## Decisões pedidas

### 1. Formulário mais compacto

Hoje o vão entre um controle e o rótulo do campo seguinte é de 52 a 58px: `row-gap` de 32px na grade, mais a fileira de apoio da subgrade, que existe mesmo vazia. Proposta: `row-gap` da `.ucam-form-grid` em `stack-md` (16px), o que dá cerca de 36px entre campos sem apoio. A subgrade de três fileiras fica, porque é ela que alinha controles lado a lado.

Efeito medido a esperar: Unidade e Matrícula encolhem cerca de 250px cada.

### 2. Rodapé de ações fixo em formulário longo

Unidade (1.603px), Matrícula (1.706px), Natureza (1.554px) e Usuário (1.390px) deixam o Salvar fora da primeira dobra. Só Grupo × Menu fixa o rodapé (`ucam-form-actions--sticky`). Proposta: todo formulário de página com mais de uma dobra usa a variante fixa; os curtos seguem como estão.

Fora do escopo: aviso de "alterações não salvas". Pede estado sujo no script das telas e é outra peça.

### 3. Coluna de ações sem fio e sem cabeçalho

As ações aparecem no hover (decisão de 25/09). Em repouso a coluna é um retângulo vazio de 96px delimitado pelo fio vertical da ADR-051, em 13 listagens. Proposta: a `.td--acoes` e a `th` correspondente perdem o fio à esquerda; a coluna continua reservada, só deixa de parecer uma coluna de dado sem dado.

### 4. Estados vazio, carregando e erro

Das 86 telas, uma mostra estado vazio em repouso e nenhuma mostra carregamento. Proposta:

- `ucam-empty` em dois textos por listagem: "nenhum registro ainda" (com a ação de criar) e "nenhum resultado para o filtro" (com Limpar filtros). O segundo já existe em parte das telas, escondido (`data-filtra-vazio`); falta padronizar a redação.
- Skeleton de tabela: cinco linhas com a altura da linha real, no lugar do corpo, sem cabeçalho falso.
- Uma tela de demonstração por projeto mostrando os três estados, em vez de um estado por tela.

### 5. Célula com selo e motivo

Usuários ("Bloqueado" + "5 tentativas de senha"), Sala de matrícula ("Com pendência" + "Falta o pagamento") e Extensão seguem com duas linhas na célula. Opções:

- **A (recomendada):** o motivo entra no selo quando é curto ("Bloqueado · senha", "Pendente · pagamento") e vai para a ficha quando é longo.
- **B:** o motivo sai da tabela e aparece só na ficha e no `title` do selo.
- **C:** fica como está.

### 6. Fila e análise: teclado e desfazer

Caixa de entrada do Protocolo, Fila da isenção e Redações do vestibular. Proposta: J/K para andar na fila, Enter para abrir, e toast com Desfazer no lugar do diálogo de confirmação para decisão reversível (encaminhar, concluir). Confirmação continua para o irreversível. Referências: Linear (triagem), Gmail, NN/g.

### 7. Cabeçalho de tabela: ícone de tipo e seta de ordenação

O ícone de tipo da ADR-051 some quando a tabela aperta, então a 1440px aparece em Bancos e não em Usuários. A seta de ordenação tem três desenhos. Opções para o ícone: manter o comportamento atual, ou tirar o ícone de tipo de todas as tabelas. Para a seta: um desenho só, e a decidir se ela aparece em toda coluna ordenável ou só na ordenada (Carbon). Nada foi mexido aqui.

### 8. Cor da barra de progresso

Hoje há sete tons de preenchimento em uso e nenhuma regra de quando usar qual. Proposta de regra para o contrato do Progress: a cor acompanha a mesma grandeza que o comprimento. Barra de carga é `--info` até 80% da capacidade, `--warning` de 80% a 100% e `--danger` acima; nenhuma outra grandeza (atraso, situação) pinta a barra.

## Fluxos novos (do benchmarking de 13/10)

Três fluxos escolhidos do benchmarking por sistema. Os três supõem regra de negócio que o DS não decide: cada um entra nas `regras_negocio` da tela como `proposta`, com quem decide.

Limite das fontes: as pesquisas de financeiro e de requerimentos leram só resumos de busca. As referências abaixo indicam a direção; a redação exata de cada uma não foi conferida.

### 9. Portal: aviso antes de a sessão expirar

**Hoje.** A sessão termina após 20 minutos sem uso e a pessoa cai em `portal/sessao-encerrada`, que avisa que o que não foi salvo se perdeu. Não há aviso antes.

**Proposta.**
- Dois minutos antes do fim, um diálogo modal em qualquer sistema: título "Sua sessão vai terminar", o tempo restante em contagem regressiva, primário "Continuar conectado" e fantasma "Sair agora". Continuar renova a sessão e devolve o foco a onde estava.
- A contagem é anunciada ao leitor de tela ao abrir e de novo aos 30 segundos, não a cada segundo.
- Se o tempo acabar com o diálogo aberto, a tela vai para `sessao-encerrada` como hoje.
- O rascunho do formulário em edição fica guardado no navegador e é oferecido de volta depois do novo login ("Recuperar o que você estava preenchendo"). Campos de senha e de arquivo ficam de fora.

**Peças.** Diálogo e botão já existem. Novo: o comportamento de contagem e renovação no script das telas, e uma variante de `sessao-encerrada` com a oferta de recuperar o rascunho. É peça de moldura, então vale para os oito projetos de uma vez.

**Regras a confirmar com o time do Portal.** Se a sessão pode ser renovada sem nova senha; se 20 minutos é requisito (o NIST recomenda até 1 hora como teto para inatividade); se guardar rascunho no navegador é aceitável em máquina compartilhada de secretaria.

**Referência.** WCAG 2.2.1 (nível A) para o aviso com extensão; 2.2.5 (AAA) para a recuperação.

### 10. SigFin: página da competência

**Hoje.** A cobrança do mês são cinco telas no grupo "Cobrança em lote" do menu (Datas de vencimento, Cálculo em lote, Enviar mensalidades, Baixar mensalidades, Sincronização). Cada uma pede a competência de novo e nenhuma diz em que ponto do mês a tesouraria está.

**Proposta.** Uma tela nova, `sigfin/competencia`, que passa a ser o primeiro item do grupo:
- Cabeçalho: "Cobrança de outubro de 2026", com seletor de competência.
- Cinco etapas em ordem, uma por linha: nome, situação (não iniciada, em andamento, com pendência, concluída), o número que resume a etapa ("8 planos com data", "4 de 4 cursos calculados", "37 enviadas, 3 de fora", "5 de 8 baixadas", "8 sem resposta da Principia") e a seta que leva à tela atual, já na competência escolhida.
- A etapa com pendência é a única com cor. As concluídas ficam neutras.
- As cinco telas atuais não mudam de lugar nem de conteúdo; ganham a trilha "Cobrança de outubro / Enviar mensalidades" e deixam de pedir a competência quando chegam por ali.

Na mesma leva, duas correções nas telas de lote:
- O aviso depois de Enviar, Baixar e Sincronizar vira um resultado com a contagem de sucesso primeiro e a lista das que ficaram de fora, com o motivo de cada uma.
- A confirmação antes de Enviar e de Baixar mostra a contagem e o total em reais.

**Peças.** Lista de etapas com situação: o `stepper` vertical e o `list-item` cobrem; a decidir qual. Selo e seta de destino já existem.

**Regras a confirmar com a tesouraria.** Se as etapas têm ordem obrigatória (dá para enviar sem ter calculado tudo?); o que define "concluída" em cada uma; se há mais de uma competência aberta ao mesmo tempo.

**Referência.** Gusto ("Run payroll" como processo por período), SAP Fiori (resultado de lote parcial). Convenção de produto, sem pesquisa com usuários.

### 11. Protocolo: situação "Aguardando requerente"

**Hoje.** O requerimento tem "Em análise", "Respondido ao aluno", "Encaminhado" e "Concluído". Quando o setor pede um documento ao aluno, o prazo continua correndo e o requerimento segue na fila como atrasado, embora a pendência seja do aluno.

**Proposta.**
- Nova situação "Aguardando requerente", no tom `espera` do selo.
- Entra por uma opção do próprio envio da resposta: ao lado de "Enviar resposta", a caixa de marcar "Aguardar retorno do aluno". Um primário só, como hoje.
- Enquanto aguarda: o prazo para, o selo de prazo troca "vence em 1 dia" por "pausado há 2 dias", e o requerimento sai de "Aguardam você" para uma aba nova, "Aguardando aluno".
- A resposta do aluno devolve o requerimento a "Aguardam você", no topo, e o prazo volta a correr de onde parou. A linha do tempo registra a pausa e a retomada.
- Sem resposta em N dias, um lembrete automático; em 2N, o requerimento volta à fila com a marca "sem retorno".
- No painel gerencial, os aguardando não contam como atrasados; aparecem em número próprio no cartão do setor.

**Peças.** Selo, aba e evento de linha do tempo já existem. Novo: a variante "pausado" do `prazo`.

**Regras a confirmar com a Secretaria Acadêmica.** Se a norma interna admite pausar o prazo; quem pode pausar; o valor de N; se o aluno responde pelo Portal ou por e-mail.

**Referência.** Jira Service Management (condição de pausa do SLA), Zendesk (estado Pendente). Convenção de produto.

### Ficou para depois

Do benchmarking, com valor mas fora desta leva: origem de cada menu na ficha do usuário e busca na árvore de Grupo × Menu (Gerencial); conferência no fechamento de caixa e resultado ao lado no cálculo individual (SigFin); salvar e agendar recorte de relatório; nota interna e "enviar e ir para o próximo" (Protocolo); ementas lado a lado e limite do "Aplicar sugestão" (Isenção); autoatendimento do candidato (Secretaria); queda de conexão, tempo extra e dupla correção (Vestibular); "Usados recentemente" (Portal); cadastros curtos em diálogo.

## Como provar

Para cada item: censo antes e depois com `censo.mjs` e `censo2.mjs` (cópias em `scratchpad/` da sessão de 13/10), captura das telas tocadas nos dois temas, `pnpm run validate`, `obrigatoriedade`, `regra-anexo` e `faixa`. Itens 1, 2, 3 e 8 pedem ADR e ajuste no contrato do componente no mesmo passo da tela.

## Fora desta spec

- Largura do campo de busca: fica em preenchimento, por decisão de 13/10.
- Formulário em uma coluna (Baymard, Carbon): contraria a ADR-055 e não foi pedido.
- Ações de linha sempre visíveis (Carbon, NN/g): recusado em 25/09.
