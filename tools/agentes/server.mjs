#!/usr/bin/env node
// Servidor MCP do Design System da UCAM, em stdio.
//
// JSON-RPC 2.0, uma mensagem por linha (transporte stdio do Model Context
// Protocol). Nada vai para stdout além das respostas — log sai em stderr, senão
// o cliente lê o log como mensagem e derruba a sessão.
//
// Fonte em tools/agentes/; copiado para o pacote por tools/build-agentes.mjs.

import { createInterface } from 'node:readline';
import { dados, executar, FERRAMENTAS, recursos, lerTexto } from './nucleo.mjs';

const VERSOES = ['2025-06-18', '2025-03-26', '2024-11-05'];

const enviar = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const responder = (id, result) => enviar({ jsonrpc: '2.0', id, result });
const falhar = (id, code, message) => enviar({ jsonrpc: '2.0', id, error: { code, message } });

function tratar(msg) {
  const { id, method, params = {} } = msg;
  switch (method) {
    case 'initialize': {
      const pedida = params.protocolVersion;
      return responder(id, {
        protocolVersion: VERSOES.includes(pedida) ? pedida : VERSOES[0],
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'dsucam', title: 'Design System da UCAM', version: dados().versao },
        instructions:
          'Contratos do Design System da UCAM. Antes de escrever interface: ucam_list_templates e ucam_get_pattern para achar a tela parecida; ucam_get_component para a API exata de cada <ucam-*>; ucam_get_tokens para cor e espaço; ucam_get_states para qualquer estado — desabilitado, carregando, somente leitura, selecionado —, porque essas regras valem para TODO componente e não estão em contrato nenhum. Antes de concluir: ucam_check_usage. Prop, componente, token ou nome de estado que as ferramentas não devolvem não existe.',
      });
    }
    case 'ping':
      return responder(id, {});
    case 'tools/list':
      return responder(id, { tools: FERRAMENTAS });
    case 'tools/call': {
      try {
        const resultado = executar(params.name, params.arguments);
        const erro = resultado && typeof resultado === 'object' && 'erro' in resultado;
        return responder(id, { content: [{ type: 'text', text: JSON.stringify(resultado, null, 2) }], isError: Boolean(erro) });
      } catch (e) {
        if (e.code === -32602) return falhar(id, -32602, e.message);
        return responder(id, { content: [{ type: 'text', text: `Falha: ${e.message}` }], isError: true });
      }
    }
    case 'resources/list':
      return responder(id, { resources: recursos().map(({ arquivo, ...r }) => r) });
    case 'resources/read': {
      const r = recursos().find((x) => x.uri === params.uri);
      if (!r) return falhar(id, -32002, `Recurso não encontrado: ${params.uri}`);
      return responder(id, { contents: [{ uri: r.uri, mimeType: r.mimeType, text: lerTexto(r.arquivo) }] });
    }
    default:
      if (id !== undefined) falhar(id, -32601, `Método não suportado: ${method}`);
  }
}

const linhas = createInterface({ input: process.stdin });
linhas.on('line', (linha) => {
  if (!linha.trim()) return;
  let msg;
  try {
    msg = JSON.parse(linha);
  } catch {
    return falhar(null, -32700, 'JSON inválido');
  }
  for (const m of Array.isArray(msg) ? msg : [msg]) {
    try {
      tratar(m);
    } catch (e) {
      process.stderr.write(`[dsucam] ${e.stack}\n`);
      if (m.id !== undefined) falhar(m.id, -32603, e.message);
    }
  }
});
process.stderr.write(`[dsucam] MCP pronto · spec ${dados().versao} · ${dados().componentes.length} contratos\n`);
