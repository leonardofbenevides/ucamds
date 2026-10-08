# Inventário do consulta-diploma-frontend (Angular 9)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\consulta-diploma-frontend`. As referências `arquivo:linha` são relativas a `src\app\` (ou `src\environments\` quando indicado).

**Cobertura da leitura.** Li por inteiro `app.router.ts`, `app.module.ts`, `app.service.ts`, `app.component.*`, `diploma-generator.ts`, os dois `environment*.ts`, as dependências do `package.json`, todos os arquivos de `diploma/desktop`, os componentes e templates de `diploma/mobile`, `historico/desktop` e `historico/mobile` (pai, header, body; rodapé do diploma). Não li os `.scss`, os `.spec.ts`, os `*.module.ts` de `diploma/mobile` e `historico/*` (só o de `diploma/desktop`), nem os `.ts` de header/footer/body de `historico/mobile` (só os templates). O README é o padrão do Angular CLI, sem conteúdo de negócio. `node_modules` não foi lido: o conteúdo real de `ucam-material` é **não confirmado**. Total em `src/app`: 25 `.ts` sem spec e 17 `.html`, cerca de 57 KB.

---

## 1. Rotas e telas

Sistema público, sem login e sem guard. São duas telas (diploma e histórico), cada uma em duas versões de componente (desktop e mobile). A versão é escolhida na partida: `AppRouterModule` registra as rotas de desktop e, se `window.innerWidth <= 768`, troca a configuração pelas de mobile (`app.router.ts:75-77`, `app.service.ts:24-28`). Ao mudar a orientação do aparelho, a página recarrega (`app.router.ts:79-83`).

### 1.1 Tabela de rotas

| URL | Componente (desktop / mobile) | Template | Guard |
|---|---|---|---|
| `''` | `DesktopComponent` / `MobileComponent` | `diploma/desktop/desktop.component.html` / `diploma/mobile/mobile.component.html` | nenhum |
| `processo/:numeroprocesso/registro/:numeroregistro` | idem | idem | nenhum |
| `historico` | `HistoricoDesktopComponent` / `HistoricoMobileComponent` | `historico/desktop/desktop.component.html` / `historico/mobile/mobile.component.html` | nenhum |
| `historico/:validador` | idem | idem | nenhum |

Não há rota curinga nem página de erro. Não há diálogo ou modal em uso: `MatDialog` é injetado nos quatro componentes mas nunca aberto.

### 1.2 Validação de diploma (`''` e `processo/:numeroprocesso/registro/:numeroregistro`)

- **Propósito:** qualquer pessoa confere a autenticidade de um diploma informando número do processo e número do registro, e vê os dados do diplomado e uma imagem de visualização do diploma.
- **Arquétipo:** consulta pública de um registro (formulário curto no cabeçalho + resultado em ficha na mesma página).
- **Estrutura:** três componentes empilhados: cabeçalho (`app-header-desktop` / `app-header-mobile`), corpo (`app-body-desktop` / `app-body-mobile`), rodapé.
- **Cabeçalho:** logo da UCAM, logo do SERD, título "Plataforma de validação do diploma" (desktop, `diploma/desktop/header/header.component.html:23`) ou "Validação do diploma" (mobile), e o formulário.
- **Campos do formulário (`myForm`):**
  - `numeroprocesso`, rótulo "Número do processo", máscara e placeholder `000.0000.0000`, obrigatório;
  - `numeroregistro`, rótulo "Número do registro", máscara e placeholder `0000.0000`, obrigatório.
- **Ações:** botão de pesquisar (ícone `search` no desktop, texto "PESQUISAR" no mobile) e "LIMPAR".
- **Corpo, estado vazio:** imagem `icon-nadaencontrado1.svg` com texto alternativo "Nenhum documento encontrado". É o estado inicial e também o que volta depois de limpar.
- **Corpo, resultado:** nome do aluno (`nomeAluno`), "UNIDADE" + `nomeUnidade`, e os pares rótulo/valor "Curso" (`curso`), "Conclusão" (`dataConclusao`), "Colação" (`dataColacao`), "Publicação" (`dataPublicacao`); botão "BAIXAR PUBLICAÇÃO DO D.O.U"; à direita, a imagem do diploma desenhada em canvas.
- **Diferenças do mobile:** depois da resposta a página rola até o corpo (`diploma/mobile/mobile.component.ts:72`); a imagem do diploma não é desenhada na tela, e em seu lugar há o botão "BAIXAR VERSÃO PARA VISUALIZAÇÃO", que gera e baixa `diploma.png` (`diploma/mobile/mobile.component.ts:101-107`, `diploma-generator.ts:53-64`).
- **Retorno ao usuário:** snackbar com ação "Fechar".
- **Classificação: parcial.** Não há tela de referência de consulta pública de documento. Servem de base `isencao/consulta` e `isencao/resultado` (tela de candidato, fora da moldura interna) e as peças `text-field` (com máscara), `button`, `description-list`, `empty-state`, `alert`. **Falta:** um padrão de "consulta pública / verificação de autenticidade" (página sem app-shell, com marca institucional, formulário de uma linha e ficha de resultado) e uma peça de pré-visualização de documento (imagem do diploma ou PDF embutido) com ação de baixar.

### 1.3 Validação de histórico (`historico` e `historico/:validador`)

- **Propósito:** conferir a autenticidade de um histórico escolar pelo código de validação impresso no documento.
- **Arquétipo:** o mesmo da tela de diploma.
- **Cabeçalho:** título "Plataforma de validação de histórico" (desktop) ou "Validação de histórico" (mobile).
- **Campo do formulário:** `codigovalidacao`, rótulo "Código de validação", máscara e placeholder `000000000.00000000000.00`, obrigatório.
- **Corpo:** o mesmo template do diploma, inclusive os rótulos "Colação", "Publicação" e o botão "BAIXAR PUBLICAÇÃO DO D.O.U". Nesta tela o botão chama o download do histórico, não da publicação (`historico/desktop/desktop.component.html:2`). No mobile aparece também "BAIXAR VERSÃO PARA VISUALIZAÇÃO", mas o componente pai não escuta esse evento (`historico/mobile/mobile.component.html:2`); se o botão faz algo é **não confirmado**.
- **Classificação: parcial**, pela mesma base e com as mesmas faltas da tela de diploma. Há sinais de tela inacabada (ver regras 12 e 13); se ela está em uso em produção é **não confirmado**.

---

## 2. Moldura e navegação

- **Cabeçalho:** faixa própria com logo UCAM (branco, horizontal), logo SERD, título e o formulário de busca dentro da própria faixa. Não é app-shell.
- **Menu:** não há. Não existe link entre a tela de diploma e a de histórico; cada uma só é alcançada pela URL.
- **Conta, login, troca de unidade:** não há. A unidade aparece só como dado do resultado (`nomeUnidade`). No histórico a unidade é deduzida do próprio código de validação (regra 8).
- **Rodapé:** logo UCAM, "Maiores informações" (desktop) ou "Site oficial" (mobile) com link para `candidomendes.edu.br`, e "UCAM 2019 / Todos os direitos reservados".
- **Responsivo:** duas árvores de componentes separadas, escolhidas uma vez pela largura da janela (768 px); grade do Bootstrap 4 (`col-lg-*`, `col-md-*`).

---

## 3. Peças usadas com contagem

Contagem por grep nos 17 templates.

| Peça | Ocorrências | Observação |
|---|---|---|
| `button[ucam-material]` | 14 | variantes vistas: `outline`, `estilo="box"`, `estilo="outline rounded"`, `estilo="rounded"`, `color="white"`, `[hover]="{'text':'blue','color':'white'}"` |
| `<mat-icon>` | 8 | `search` (2) e `publish` (6) |
| `input` com `mask=` (ngx-mask) | 6 | 3 máscaras distintas |
| `formControlName` | 6 | 3 campos distintos, repetidos em desktop e mobile |
| `<form [formGroup]>` | 4 | um por cabeçalho |
| `MatSnackBar` | 4 componentes | 3 mensagens distintas |
| `MatDialog` | 4 componentes | injetado, nunca aberto |
| `*ngIf` | 2 | condiciona a área do diploma |

**Componentes próprios:** 4 páginas (`DesktopComponent`, `MobileComponent`, `HistoricoDesktopComponent`, `HistoricoMobileComponent`) e 12 partes (header, body e footer em cada uma das quatro árvores). Os de histórico reutilizam os mesmos seletores dos de diploma (`app-header-desktop`, `app-body-desktop` etc.) em módulos separados.

**Bibliotecas (`package.json`):** `@angular/material` 9.2 (ícone, snackbar, dialog), `ucam-material` 0.0.910115 (botão), `ngx-mask` 8.1, `bootstrap` 4.3, `jquery` 3.4, `popper.js`, `canvas-text-wrapper` 0.10 (declarada; não vi uso em `src/app`). Sem editor rico, sem datatables, sem gráficos. O desenho do diploma é feito à mão em canvas 2D (`diploma-generator.ts`).

---

## 4. Regras de negócio lidas no código

1. **A consulta de diploma exige número do processo e número do registro.** `diploma/desktop/desktop.component.ts:21-24` e `:63`. Tipo: validação. Sem os dois, mensagem literal "Entre com os dados para realizar a pesquisa." (`:87-90`).
2. **Formato do número do processo: 11 dígitos em `000.0000.0000`.** `diploma/desktop/header/header.component.html:37`; remontagem em `app.service.ts:56-59`. Tipo: formato.
3. **Formato do número do registro: 8 dígitos em `0000.0000`; valores com 5 caracteres ou menos são enviados sem pontuação.** `diploma/desktop/header/header.component.html:49`; `app.service.ts:61-68`. Tipo: formato.
4. **Link direto preenche e pesquisa sozinho.** Ao abrir `processo/:numeroprocesso/registro/:numeroregistro`, os campos são preenchidos e a consulta é disparada se o formulário for válido. `diploma/desktop/desktop.component.ts:34-48`. Tipo: integração (provável destino de QR code ou link impresso no diploma; **não confirmado**).
5. **Diploma não localizado ou erro de servidor mostram a mesma mensagem.** Qualquer erro da consulta resulta em "O diploma não foi encontrado." `diploma/desktop/desktop.component.ts:81-84`. Tipo: validação.
6. **A imagem de visualização só aparece se o diploma tiver texto da frente e local/data de impressão.** `diploma/desktop/body/body.component.html:72`. Tipo: validação. Campos: `conteudoFrente`, `localDataImpressao`.
7. **A imagem do diploma é montada no navegador.** Fundo `diploma-background.svg`, 880 × 560 px, texto `conteudoFrente` em Times 15 px justificado em linhas de até 660 px a partir de y = 190 com entrelinha de 25 px, e `localDataImpressao` centralizado em (440, 390). `diploma-generator.ts:15-18`, `:35-49`. Tipo: formato. No mobile, sai como arquivo `diploma.png` (`:61`).
8. **A publicação no Diário Oficial é baixada pelo lote do diploma.** O botão "BAIXAR PUBLICAÇÃO DO D.O.U" busca o arquivo pelo `oidLoteDiploma` do resultado e abre em nova janela. `diploma/desktop/desktop.component.ts:110-123`; `app.service.ts:43-45`. Tipo: integração.
9. **O código de validação do histórico tem 22 dígitos em `000000000.00000000000.00`.** `historico/desktop/header/header.component.html:37`; `app.service.ts:51-54`. Tipo: formato.
10. **Os dois últimos dígitos do código de validação dizem em qual servidor o histórico está.** `01` = Campos (`http://portal.ucam-campos.br/Relatorio/webservice`), `02` = Rio (`http://portal-rio1.ucam-campos.br/Relatorio/webservice`), `03` = EAD (`http://relatorio.candidomendes.edu.br/Relatorio/webservice`). `app.service.ts:13-19`. Tipo: integração. Qualquer outro final fica sem servidor (a URL sai como `undefined/...`).
11. **Histórico não localizado: mensagem "O historico não foi encontrado."** (grafia literal, sem acento). `historico/desktop/desktop.component.ts:71-74`. Tipo: validação. A mensagem de campos vazios é a mesma da regra 1 (`:77`), mas a condição testa o valor já mascarado, que nunca é vazio (sai `..`), então na prática a consulta é sempre enviada. Tipo: validação.
12. **O download do histórico pede o identificador do aluno, e o código envia o texto fixo `'oidAluno'`.** `historico/desktop/desktop.component.ts:104`; `app.service.ts:35-37`. Tipo: integração. O identificador real não é lido da resposta da validação; o comportamento em produção é **não confirmado**.
13. **A tela de histórico trata a resposta como se fosse de diploma.** Desenha `conteudoFrente` e `localDataImpressao` sobre o fundo do diploma e mostra "Colação" e "Publicação". `historico/desktop/desktop.component.ts:67-69`; `historico/desktop/body/body.component.html:31-51`. Tipo: formato. Os campos reais devolvidos por `/historico/validar` são **não confirmados**.
14. **Largura até 768 px usa a versão mobile; virar o aparelho recarrega a página.** `app.service.ts:24-28`; `app.router.ts:75-83`. Tipo: limite.

Total: 14 regras.

---

## 5. API consumida

Tudo em `AppComponentService` (`app.service.ts`). Não há interceptor, token nem cabeçalho de autenticação.

Base do diploma: `environment.API_RESOURCE_SERVICE` = `https://api-serd.ucam-campos.br` em desenvolvimento e `/api` em produção (`src/environments/environment.ts:7`, `environment.prod.ts`).

| Método | Caminho | Uso | Resposta |
|---|---|---|---|
| GET | `{API}/diploma/{numeroprocesso}/{numeroregistro}` | consulta do diploma (números já com pontos) | JSON |
| GET | `{API}/lotediploma/imagem/{oidlotediploma}/download` | publicação no D.O.U. | blob |
| GET | `{servidor da unidade}/historico/validar/{validador}` | validação do histórico (código com pontos) | JSON |
| GET | `{servidor da unidade}/historico/{oidAluno}` | arquivo do histórico | blob |

Os três servidores de histórico são `http://` (sem TLS) e ficam fixos no código (`app.service.ts:15-17`).

**Modelo.** Não há interface tipada; a resposta é `any`. Campos lidos da resposta do diploma: `nomeAluno`, `nomeUnidade`, `curso`, `dataConclusao`, `dataColacao`, `dataPublicacao`, `conteudoFrente`, `localDataImpressao`, `oidLoteDiploma`. Tipo e formato das datas: **não confirmado** (são exibidas como vêm, sem pipe).

---

## 6. O que o código não responde

1. A tela de validação de histórico está em uso? O download envia um identificador fixo e o corpo é o do diploma. Quem decide: secretaria acadêmica / setor de registro de diplomas, com a TI.
2. O que a validação de histórico deve mostrar ao público: só "autêntico / não autêntico", os dados do aluno, ou o histórico completo em PDF? Quem decide: secretaria acadêmica e o encarregado de proteção de dados.
3. Quais dados pessoais podem aparecer numa consulta sem login (nome completo, curso, datas)? Há limite de tentativas ou captcha? O código não tem nenhum. Quem decide: encarregado de proteção de dados e TI.
4. O link `processo/.../registro/...` é o destino do QR code impresso no diploma? E o `historico/:validador`, do histórico? Quem decide: setor de registro de diplomas (SERD).
5. Novas unidades além de Campos, Rio e EAD emitem histórico com código de validação? Qual o sufixo de cada uma? Quem decide: secretaria acadêmica com a TI.
6. A "versão para visualização" do diploma tem valor de representação visual oficial (como a do diploma digital) ou é só ilustrativa? Deve trazer marca d'água ou aviso? Quem decide: setor de registro de diplomas.
7. Quando o diploma existe mas não tem publicação no D.O.U. (sem `oidLoteDiploma`), o botão deve sumir? Hoje ele aparece sempre e o erro é silencioso. Quem decide: setor de registro de diplomas.
8. Diploma cancelado, anulado ou substituído por segunda via: a consulta deve dizer a situação? O código não lê nenhum campo de situação. Quem decide: setor de registro de diplomas.
