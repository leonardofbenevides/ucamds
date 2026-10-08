# Catálogo do UCAMDS para classificar telas (06/10/2026)

## Padrões de tela (spec/patterns/patterns.json)
- listagem-crud: lista de registros com busca, filtros, ações por linha e em lote, paginação; criar/editar em tela ou gaveta.
- formulario-entidade: formulário de um registro, em seções, com validação e ações Salvar/Cancelar.
- confirmacao-destrutiva: diálogo que confirma ação irreversível nomeando o que se perde.
- shell-aplicacao: moldura (faixa, navegação lateral, conta, unidade/campus) e grade de módulos.
- triagem-lista-detalhe: fila à esquerda e item aberto à direita (ou página de detalhe) para decidir item a item.
- painel-indicadores: KPIs, gráficos e listas-resumo.
- listagem-inspetor: lista com painel lateral que inspeciona/edita o item selecionado (ex.: grupo × menu, parâmetros).
- consulta-relatorio: catálogo de relatórios, tela de filtros da consulta e tela de resultado (tabela larga, totais, exportar).

## Telas de referência já existentes (projeto/tela — padrão)
- protocolo: analise-requerimento (caixa de entrada, triagem), requerimento-detalhe (triagem), gerencial (painel), analytics (painel), listagem-setores (triagem), naturezas (listagem-crud), novo-requerimento (formulário), parametros-setores (listagem-inspetor), natureza-form (formulário), integrante-form (formulário)
- portal: grade-modulos (shell), login (autenticação), recuperar-senha, recuperar-senha-codigo, definir-senha (formulário), chegada (sistema abrindo por token), sessao-encerrada
- sigfin: movimento-caixa (listagem-crud), calculo-mensalidade (formulário), inadimplencia (consulta-relatorio: aluno com linha que abre parcelas + linha de totais), recebimentos (consulta-relatorio em matriz: cabeçalho em dois andares + totais por coluna), relatorio-filtros (filtros dos relatórios financeiros), tipos-bolsa, tipo-bolsa-form, convenios, convenio-form, bancos, banco-form, feriados-bancarios, feriado-form (cadastros, listagem-crud + formulário)
- relatorios: catalogo (shell), filtros (consulta-relatorio), resultado (consulta-relatorio)
- gerencial: inicio (painel), usuarios (listagem-crud), usuario-detalhe (triagem), usuario-form (formulário), grupo-menu (listagem-inspetor), auditoria (listagem-crud), unidades (listagem de cadastro, listagem-crud), unidade-form (formulário de cadastro), grupos, grupo-form, aplicacoes, aplicacao-form, mantenedoras, mantenedora-form, cartoes-seguranca, cartao-form, grupo-usuarios (integrantes de um grupo)
- isencao: fila (listagem-crud), analise (triagem), consulta (triagem), sem-documentos (triagem), acompanhamento (candidato), resultado (candidato), matrizes (listagem-crud), cursos (listagem-crud)

## Componentes com contrato (49)
alert, anexo, app-shell, avatar, badge, button, card, chart, checkbox, chip, choice-card, citacao, combobox, command, compositor, data-table, date-field, description-list, dialog, drawer, empty-state, field, file-field, icon-button, icon-tile, icon, input-group, kbd, link, list-item, menu, page-header, pagination, prazo, progress, radio-group, realce, section-bar, segmented, select, skeleton, stat, stepper, switch, tabs, text-field, textarea, timeline, tooltip

## Peças da tabela (data-table) desde 06/10/2026
- totals: linha de totais no tfoot.
- column-group: cabeçalho em dois andares (grupos de colunas).
- row-detail: linha que abre uma subtabela (um nível).

## Como classificar cada tela
- coberta: já existe tela de referência do mesmo sistema e função.
- parcial: existe padrão ou tela de referência de outro sistema que serve de base, com as peças necessárias.
- falta: não há padrão nem peça (diga qual peça ou padrão falta).
- nao-migrar: tela morta, esqueleto ou sem rota.
