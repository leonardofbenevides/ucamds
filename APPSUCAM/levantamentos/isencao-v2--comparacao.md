# isencao-v2 (real) × telas `isencao/*` do UCAMDS

Lido em 06/10/2026 no commit de 05/10. Angular 20 em `frontend-v2/`, Spring em `backend-v2/`.
`FE` = `frontend-v2/src/app/features/isencao`; `BE` = `backend-v2/src/main/java/br/ucam/campos/backendv2`.

O sistema real foi reescrito sobre o desenho do DS: usa as classes `.ucam-*`, os mesmos rótulos e a
mesma moldura. As divergências que restam são campos que o DS não desenha, ações que o backend não
tem e regras que o DS propôs e ninguém impõe.

## Telas reais

| Rota | O que faz | Colunas e campos | Ações | No DS |
|---|---|---|---|---|
| `''` | Vai para `/admin/isencao` se há sessão; senão página institucional | logo, título, parágrafo | — | não existe |
| `isencao/:oidFormaIngressoPessoa` | Acompanhamento do candidato, sem login (a URL é a credencial) | Tabela: Disciplina, Período, Carga horária, Situação. Painel "Sua solicitação": Inscrição, Curso, Período letivo, Instituição de origem, Solicitada em, Concluída em, Carga horária isenta. Documentos enviados. Atividade | Enviar documento, baixar anexo, filtro de período | `acompanhamento` + `resultado` (uma página, muda por estado) |
| ↳ diálogo "Enviar documento" | Envio de um arquivo | Descrição e Arquivo, obrigatórios | Cancelar, Enviar | diálogo do acompanhamento |
| `admin/login/:token/:usuario` | Volta do login único: grava a sessão e redireciona | — | "Ir para análise" | não existe |
| `admin/dev-session` | Define sessão local (só em desenvolvimento) | Unidade (oid), Identificador da pessoa, Usuário | Cancelar, Salvar e abrir análise | não existe |
| `admin/isencao` | Fila sem IA | Candidato (avatar, nome, período letivo), Curso, Solicitada em, Situação. Filtros: Pesquisar candidato, Curso, Unidade (só EAD) | Atualizar, Exportar CSV, ordenar, Limpar filtros, abrir linha | `fila` |
| ↳ detalhe (mesma rota, sem URL própria) | Análise da solicitação | Tabela: Disciplina, Sugestão, Decisão. Select "Matriz curricular". Painel: Solicitação, Documentos, Observação, Atividade | Salvar rascunho, Enviar pedido ao candidato, Finalizar análise, filtro de período | `analise` |
| ↳ detalhe sem documentos | Mesmo detalhe, decisões desabilitadas, alerta no topo | idem | "Marcar aguardando candidato" | `sem-documentos` |
| ↳ detalhe concluído | Mesmo detalhe, só leitura | + Matriz curricular no painel; origem, IES e carga das isentas | baixar documentos | `consulta` |
| `admin/isencao/matrizes` | Matrizes dos cursos com solicitações | Matriz, Disciplinas, Carga na isenção (—), Vigente desde (—), Em análise, Situação | Exportar, "Ver disciplinas" (expande na linha), link para a fila | `matrizes` |
| `admin/isencao/cursos` | Cursos com solicitações | Curso (com contagens), Coordenação (—), Matriz vigente, Em análise | Exportar, Pesquisar, link para a fila | `cursos` |
| `admin/isencao-ia` (+ `/matrizes`, `/cursos`) | Mesmo shell com a IA ligada | + coluna Sugestão na fila e faixa de IA na análise | + Aplicar N sugestões, Ver detalhes | parcial |
| ↳ diálogo "Sugestão da análise automatizada" | Detalhe de uma sugestão | Recomendação, Compatibilidade, Disciplina de origem, Justificativa | Fechar | não existe |
| `admin/vestibular` | Cadastro de provas | ver abaixo | ver abaixo | não existe |

## Divergências

**Situações.** Os nomes são os do DS. O backend só tem três estados (`PENDENTE_ANALISE`,
`ANALISADO_COM_PENDENCIA`, `CONCLUIDO`); "Aguardando envio" é derivado de zero documentos.

**Fila.** Segue o DS em abas, segmented e colunas. Não tem menu de coluna, nem Imprimir, nem prazo
sob "Aguardando candidato". A busca é só por nome. "Tentar de novo" no selo Falhou está desabilitado
(o backend tem `POST /analise-ia`, o front não chama). Há um botão "Atualizar" que o DS não tem.

**Decisão por disciplina.** O segmented de três posições é o do DS. O real exige campos que o DS
não desenha:

| Decisão | Campos | Obrigatório ao finalizar |
|---|---|---|
| Isentar | Disciplina de origem, IES, Carga horária (sublinha) | os três |
| Pedir documento | "Documento pedido ao candidato (motivo da pendência)", até 300 | sim |
| Não isentar | nenhum | — |

O motivo do "Não isenta" continua sem campo, que é a regra aberta que o DS já registrou. O seletor
"Matriz curricular" dentro da análise não existe no DS.

**Fechamento.**
- Disciplina sem decisão **não barra** o Finalizar, ao contrário do DS: o backend a ignora e, concluída a solicitação, ela aparece como recusada (`BE/service/isencao/IsencaoService.java:376-387`). Contradiz "falta de decisão nunca vira não isenta".
- Não há diálogo de confirmação com os números.
- Finalizar com alguma disciplina em "Pedir documento" vira `ANALISADO_COM_PENDENCIA`; aqui bate com o DS.
- "Enviar pedido ao candidato" é botão sempre visível e não exige observação.
- Salvar rascunho mostra o toast e **fecha o detalhe**; o DS mantém a tela e mostra a hora.
- Não existem: Enviar observação como ação própria, Reabrir análise, Baixar ou Imprimir parecer, Desfazer da aplicação de sugestões.

**Prazos.** Os 15 dias do DS não existem em lugar nenhum do código.

**Sem documentos.** O DS diz "Notificar candidato", com 2º aviso e data. O real diz "Marcar
aguardando candidato" e avisa que não envia e-mail nem SMS.

**Candidato.** Segue o DS nos rótulos e não vê a IA. Pode enviar documento sem pedido, em qualquer
estado não concluído. Aceita PDF, PNG ou JPG (o DS diz só PDF). Não há "Baixar parecer". Mostra o
painel Atividade, que o DS não tem desse lado.

**Matrizes e cursos.** Matrizes expande na linha em vez de gaveta; carga e vigência saem com
travessão porque a API não entrega. Cursos não tem gaveta, coordenação nem liga/desliga da análise
automatizada: no real, IA ligada é a rota mais uma propriedade global do backend, não configuração
por curso.

## O que o DS não tem

### Análise assistida por IA (`admin/isencao-ia`)
Não é tela separada: é o mesmo shell com quatro acréscimos.

1. **Fila.** Coluna "Sugestão": Disponível, Em processamento (com spinner), Falhou, travessão.
2. **Alertas no topo da análise.** Info "Análise automatizada em processamento…" (consulta a cada 5 s); aviso de falha "Prossiga com a avaliação manual"; aviso "A sugestão disponível refere-se a outra matriz curricular" com botão "Abrir matriz da análise".
3. **Faixa sobre a tabela.** Ícone sparkles, "Sugestão automatizada", "Feita em dd/MM/yyyy HH:mm · N isentar · N revisar · N não isentar", legenda "Decisão final é sempre humana", botão "Aplicar N sugestões". Vazios: "Sem análise automatizada" e "Sugestão automatizada: —".
4. **Coluna Sugestão por linha.** Selo neutro ("Sugere isentar", "Revisar", "Sugere não isentar"); "Ementa NN%"; "Carga 60h de 80h"; justificativa truncada em duas linhas; "Ver detalhes" abre o diálogo; sparkles na opção sugerida do segmented ("Revisar" não marca nenhuma); "Pela sugestão" sob a decisão aplicada.

O avaliador aceita em lote só as sugestões de isentar ainda pendentes, em disciplinas sem decisão.
Não há botão de recusar: discordar é marcar outra opção. Sugestão decidida é imutável.

Geração (`docs/sdd/06-integracao-claude.md`): o envio de documentos dispara a análise; o modelo
extrai as disciplinas dos PDFs e compara com a matriz (par, percentual, recomendação, justificativa
de 2 a 4 frases); políticas determinísticas ajustam
(`BE/service/isencao/llm/SugestaoIsencaoQualidadePolicy.java:81-131`): compatibilidade ≥ 70 isentar,
50 a 69 revisar, abaixo de 50 não isentar; estágio ou TCC não isenta; cursada há mais de 10 anos não
isenta; carga de origem abaixo de 50% da de destino não isenta, abaixo de 75% revisar; ementa
inválida revisar. O DS registra 75% como corte para isentar; o real usa 70 (75 é o da carga).

### Cadastro de provas (`admin/vestibular`)
Visual legado, sem `.ucam-*` e sem shell.
- **Filtro.** Selects em cascata: Unidade do processo → Processo seletivo (ano/semestre) → Forma de ingresso → Captação. Botão "Listar provas".
- **Nova prova / Editar prova.** Rádio Abrangência (Todas as unidades ou Unidade específica), select Tipo (só "Redação"), Salvar, Cancelar edição.
- **Provas desta oferta.** Tabela Tipo, Unidade, ações; cada linha tem Visualizar, Editar e Gerenciar questões, que expandem na própria linha.
- **Visualizar.** Unidade, Questões, Pontuação total, Situação, Início e Fim; cada questão recolhível com Texto de referência, Enunciado e Alternativas. O gabarito não aparece.
- **Gerenciar questões.** Lista à esquerda ("Ordem N · X pt") com "Nova questão"; à direita Pontuação (0 a 10, passo 0,5), Ordem, Texto de referência, Enunciado (obrigatório) e alternativas em leitura. Salvar, Excluir (lógico, com `confirm()` nativo), Limpar formulário.

A prova do candidato e a correção não foram portadas (`docs/sdd/18-vestibular-prova-correcao-decisao.md`).

## Como usa o UCAMDS

- Usa `.ucam-*` por um **CSS compilado copiado** (`frontend-v2/public/ucam-ds.css`, 401 KB), carregado em tempo de execução com `data-theme="dark"` forçado; ícones em `assets/ucam-icons.svg`. Não há `@ucam/*` no `package.json`.
- Marcação do DS escrita à mão: `CoordShellComponent`, `FilaAnaliseComponent`, `MatrizesViewComponent`, `CursosViewComponent`, `ucam-ds-loader.ts`, `ToastService`.
- Duas identidades convivem: a do DS (faixa `#22588D`, Geist) e a legada (vinho `#8F0324`, Source Sans 3), que vale na raiz, no login, na sessão de desenvolvimento, no vestibular e nos toasts.
- `quill` e `katex` estão no `package.json` e não são importados; os campos HTML do vestibular são `<textarea>`.

## Regras determinantes

1. Três estados no backend, quatro rótulos derivados no front (`FE/admin-ux/coord-data.ts:53-64`).
2. Só as formas de ingresso `TRANSFERENCIA` e `REINGRESSO` podem pedir (`IsencaoService.java:55,71`).
3. Enviar documento devolve a solicitação a `PENDENTE_ANALISE` e dispara a IA (`IsencaoService.java:115-122`).
4. Arquivo: o front aceita PDF, PNG ou JPG até 10 MB; o backend não valida tipo nem tamanho no envio (valem 30 MB por arquivo e 10 anexos por solicitação). A IA só lê PDF até 20 MB.
5. Finalizar: isentar exige origem, IES e carga; pedir documento exige motivo. A validação é só no front.
6. Sem decisão vira "Não isenta" ao concluir (`IsencaoService.java:376-387`).
7. Rascunho: `evaluate?partial=true` grava sem mudar a situação.
8. Não há e-mail nem SMS: "notificar" só muda a situação e grava a observação.
9. Limites: observação 150 (só no front), motivo 300, dados de atividade 500.
10. Matriz vigente é a ativa de maior ano; o avaliador pode trocar, e as sugestões só valem na matriz analisada.
11. A IA sugere e não decide; aceitar não conclui; falha da IA não bloqueia o envio.
12. Não há controle por perfil: o guard só olha a sessão no navegador, a fila é por unidade, o autor gravado é sempre "sistema", e a rota do candidato não tem autenticação.

Não confirmado: se o `ucam-ds.css` copiado corresponde à versão atual do DS; qual é o modelo padrão
(documentos e classe dizem um, `application.properties` diz outro); o comportamento real do login
único que chama `admin/login/:token/:usuario`.
