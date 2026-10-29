/* O GRÁFICO DAS TELAS DE REFERÊNCIA (Trilho A), com ECharts.
 *
 * Até 23/10/2026 as telas autônomas não tinham gráfico nenhum: onde a tarefa
 * pedia forma (tendência, funil, composição) havia barra de progresso ou
 * tabela, e só o Trilho B desenhava, pelo z-chart do ZardUI sobre ECharts.
 * Pedido do Leonardo: "gráfico vc podia usar uma biblioteca mais rica, que
 * tenha mais gráficos". A biblioteca já estava no projeto. Faltava levá-la às
 * telas e abrir o contrato a mais formas.
 *
 * A marcação é a do contrato chart.json:
 *
 *   <figure class="ucam-grafico" aria-label="medida, recorte e período"
 *           data-grafico='{"tipo":"line","unidade":"requerimentos",
 *                          "categoria":"Mês","categorias":[...],
 *                          "series":[{"nome":"Abertos","dados":[...]}]}'>
 *   </figure>
 *
 * O script monta dentro dela o plot (aria-hidden) e a TABELA com os mesmos
 * números, que é a fonte acessível. As cores saem dos tokens
 * --ucam-color-chart-series-1..6, na ordem fixa da paleta validada (ver
 * a memória da paleta de séries); nenhum hex mora aqui. Ao trocar o tema o
 * gráfico redesenha com os tokens do tema novo.
 *
 * Tipos: line, area, bar (stack, horizontal, proporcao), donut, funnel,
 * sparkline e, desde 29/10/2026, heatmap, scatter e dumbbell. Pedido do
 * Leonardo: "poderia usar mais gráficos (...) que tenha variedade de gráficos
 * pra usarmos". A variedade veio da tabela pergunta › forma do método de
 * dataviz, e não de um catálogo de formas: grade dia × hora é heatmap em tom
 * único; relação entre duas medidas é dispersão; antes e depois por item é
 * dumbbell; a fatia de cada parte é barra 100%. Radar, gauge e treemap ficaram
 * de fora de propósito, porque respondem mal a qualquer uma dessas perguntas.
 * Com "destaque": "<nome da série>", linha e barra pintam só aquela série e o
 * resto vai para o cinza de contexto (a forma de ênfase).
 *
 * Nunca dois eixos de valor: um gráfico, uma unidade. A dispersão tem dois
 * eixos, mas um é x e o outro y, cada medida no seu: não é eixo duplo.
 *
 * O MODELO É SEMPRE O DA TABELA: categorias são as linhas e séries são as
 * colunas. No heatmap a linha é o eixo vertical (dia) e a coluna o
 * horizontal (hora). Na dispersão e no dumbbell cada linha é um item, e as
 * duas séries são as duas medidas (x e y) ou os dois momentos (antes e
 * depois). A tabela equivalente sai igual em todas. */
function grafico() {
  var figuras = document.querySelectorAll('figure.ucam-grafico[data-grafico]');
  if (!figuras.length || !window.echarts) return;

  var css = function (nome) { return getComputedStyle(document.documentElement).getPropertyValue(nome).trim(); };
  var num = function (v) { return typeof v === 'number' ? v.toLocaleString('pt-BR') : v; };
  // A série pode trazer a própria unidade (sufixo, moeda): na dispersão as
  // duas medidas são de grandeza diferente, frequência em % e nota de 0 a 10.
  var fmt = function (cfg, v, s) {
    if (v == null) return '—';
    var moeda = s && s.moeda != null ? s.moeda : cfg.moeda;
    if (moeda) return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return num(v) + ((s && s.sufixo != null ? s.sufixo : cfg.sufixo) || '');
  };
  var instancias = [];

  function tabela(fig, cfg) {
    if (fig.querySelector('.ucam-grafico__tabela')) return;
    var d = document.createElement('details');
    d.className = 'ucam-grafico__tabela';
    var linhas = cfg.categorias.map(function (c, i) {
      return '<tr><th scope="row">' + c + '</th>' + cfg.series.map(function (s) {
        return '<td class="td--num">' + fmt(cfg, s.dados[i], s) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    d.innerHTML = '<summary>Ver os mesmos dados em tabela</summary>' +
      '<div class="ucam-table-wrap"><table class="ucam-table ucam-table--compact"><caption class="ucam-sr-only">' +
      (fig.getAttribute('aria-label') || '') + '</caption><thead><tr><th scope="col">' + (cfg.categoria || '') + '</th>' +
      cfg.series.map(function (s) { var u = s.unidade || cfg.unidade; return '<th scope="col" class="th--num">' + s.nome + (u ? ' (' + u + ')' : '') + '</th>'; }).join('') +
      '</tr></thead><tbody>' + linhas + '</tbody></table></div>';
    fig.appendChild(d);
  }

  function opcao(cfg, fig) {
    var cores = [1, 2, 3, 4, 5, 6].map(function (i) { return css('--ucam-color-chart-series-' + i); });
    var tinta = css('--ucam-color-text-secondary');
    var fio = css('--ucam-color-border-subtle');
    var fundo = css('--ucam-color-surface-raised') || css('--ucam-color-surface-default');
    var texto = css('--ucam-color-text-primary');
    // O cinza de CONTEXTO: a série que não é o assunto (destaque) e o ponto
    // de partida do dumbbell. Tinta de borda forte, não de texto: é marca.
    var cinza = css('--ucam-color-border-strong');
    var fonte = getComputedStyle(fig).fontFamily;
    var rotulo = { color: tinta, fontFamily: fonte, fontSize: 12 };
    var legendaBase = { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: rotulo };
    /* A COR DO SISTEMA NO FOCO (ADR-082, 29/10/2026). A série que é o
     * assunto — a principal de uma comparação (tom: "sistema") ou a do
     * destaque — leva a tinta do sistema, não o slot 1: o azul da paleta num
     * app vinho ou verde era a pergunta "pq ta azul aqui?". A referência (tom:
     * "referencia") e o contexto do destaque vão em cinza. Fora de um app,
     * sem tinta declarada, o foco volta ao slot 1. A tinta mora no
     * .ucam-shell, por isso é lida da figura. */
    var foco = getComputedStyle(fig).getPropertyValue('--ucam-sistema-tinta').trim() || cores[0];
    var corDe = function (s, i) {
      if (s.tom === 'sistema') return foco;
      if (s.tom === 'referencia') return cinza;
      if (!cfg.destaque) return s.slot ? cores[s.slot - 1] : undefined;
      return s.nome === cfg.destaque ? (s.slot ? cores[s.slot - 1] : foco) : cinza;
    };
    var base = {
      color: cores,
      animation: !matchMedia('(prefers-reduced-motion: reduce)').matches,
      textStyle: { fontFamily: fonte, color: tinta, fontSize: 12 },
      tooltip: {
        backgroundColor: fundo, borderColor: fio, borderWidth: 1, padding: [8, 12],
        textStyle: { color: texto, fontFamily: fonte, fontSize: 13 },
        valueFormatter: function (v) { return fmt(cfg, v); },
      },
    };
    var tipo = cfg.tipo;
    var legenda = cfg.series.length > 1 && tipo !== 'sparkline';

    /* HEATMAP: magnitude numa grade, em UM tom. A escala sai da cor da série 1
     * por opacidade sobre a superfície, e não de um arco-íris: mais é mais
     * forte nos dois temas, e nenhum hex novo entra. Vão de 2px entre as
     * células, na cor da superfície. Célula sem dado fica vazia, não zero. */
    if (tipo === 'heatmap') {
      var colunas = cfg.series.map(function (s) { return s.nome; });
      var celulas = [];
      var teto = 0;
      cfg.categorias.forEach(function (c, i) {
        cfg.series.forEach(function (s, j) {
          var v = s.dados[i];
          if (v == null) return;
          if (v > teto) teto = v;
          celulas.push([j, i, v]);
        });
      });
      base.tooltip.trigger = 'item';
      base.tooltip.formatter = function (p) {
        return cfg.categorias[p.value[1]] + ' · ' + colunas[p.value[0]] + '<br><b>' + fmt(cfg, p.value[2]) + '</b>';
      };
      base.grid = { left: 8, right: 8, top: 8, bottom: 44, containLabel: true };
      base.xAxis = { type: 'category', data: colunas, axisLine: { show: false }, axisTick: { show: false }, splitArea: { show: false },
        axisLabel: Object.assign({ hideOverlap: true }, rotulo) };
      base.yAxis = { type: 'category', data: cfg.categorias, inverse: true, axisLine: { show: false }, axisTick: { show: false },
        splitArea: { show: false }, axisLabel: rotulo };
      base.visualMap = { min: 0, max: teto || 1, calculable: false, orient: 'horizontal', left: 'center', bottom: 0,
        itemWidth: 10, itemHeight: 160, text: [num(teto), '0'], textGap: 8, textStyle: rotulo,
        inRange: { color: [cores[0]], colorAlpha: [0.1, 1] } };
      base.series = [{ type: 'heatmap', data: celulas, label: { show: false },
        itemStyle: { borderColor: fundo, borderWidth: 2, borderRadius: 4 },
        emphasis: { itemStyle: { borderColor: texto, borderWidth: 1 } } }];
      return base;
    }

    /* DISPERSÃO: a relação entre duas medidas, um ponto por linha da tabela.
     * Série 1 é o eixo x, série 2 o y, cada uma com a própria unidade. Os
     * eixos não começam em zero (posição, não comprimento). Anel de 2px na
     * cor da superfície para os pontos que se sobrepõem. */
    if (tipo === 'scatter') {
      var sx = cfg.series[0], sy = cfg.series[1];
      var eixo = function (s) {
        return { type: 'value', scale: true, name: s.nome + (s.unidade ? ' (' + s.unidade + ')' : ''), nameLocation: 'middle',
          nameTextStyle: rotulo, splitLine: { lineStyle: { color: fio } }, axisLine: { show: false }, axisTick: { show: false },
          axisLabel: Object.assign({ formatter: function (v) { return fmt(cfg, v, s); } }, rotulo) };
      };
      base.grid = { left: 28, right: 16, top: 16, bottom: 28, containLabel: true };
      base.xAxis = Object.assign(eixo(sx), { nameGap: 28 });
      base.yAxis = Object.assign(eixo(sy), { nameGap: 36, nameRotate: 90 });
      base.tooltip.trigger = 'item';
      base.tooltip.formatter = function (p) {
        return '<b>' + p.name + '</b><br>' + sx.nome + ': ' + fmt(cfg, p.value[0], sx) + '<br>' + sy.nome + ': ' + fmt(cfg, p.value[1], sy);
      };
      base.series = [{ type: 'scatter', symbolSize: 12,
        data: cfg.categorias.map(function (c, i) { return { name: c, value: [sx.dados[i], sy.dados[i]] }; })
          .filter(function (d) { return d.value[0] != null && d.value[1] != null; }),
        itemStyle: { color: cores[0], borderColor: fundo, borderWidth: 2, opacity: 0.9 },
        // Até oito pontos, cada um leva o nome: sem ele, saber qual curso é
        // qual dependia de passar o mouse. Acima disso o nome vira ruído.
        label: { show: cfg.categorias.length <= 8, position: 'right', distance: 6, formatter: '{b}', color: tinta, fontFamily: fonte, fontSize: 12 },
        labelLayout: { hideOverlap: true },
        emphasis: { scale: 1.3 } }];
      return base;
    }

    /* DUMBBELL: antes › depois por item. Um tom em dois degraus: o ponto de
     * partida em cinza de contexto, o de chegada na cor da série 1, ligados
     * por um fio. Deitado, porque o nome do item é longo. */
    if (tipo === 'dumbbell') {
      var antes = cfg.series[0], depois = cfg.series[1];
      var ponto = function (s, cor) {
        return { type: 'scatter', name: s.nome, symbolSize: 12, z: 3,
          data: cfg.categorias.map(function (c, i) { return [s.dados[i], c]; }),
          itemStyle: { color: cor, borderColor: fundo, borderWidth: 2, opacity: 1 } };
      };
      base.grid = { left: 8, right: 24, top: 8, bottom: 40, containLabel: true };
      base.xAxis = { type: 'value', scale: true, splitLine: { lineStyle: { color: fio } }, axisLabel: Object.assign({
        formatter: function (v) { return fmt(cfg, v); } }, rotulo) };
      base.yAxis = { type: 'category', data: cfg.categorias, inverse: true, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: rotulo };
      base.tooltip.trigger = 'axis';
      base.tooltip.axisPointer = { type: 'shadow', shadowStyle: { color: fio, opacity: 0.4 } };
      base.legend = legendaBase;
      var fios = ponto(antes, cinza);
      fios.markLine = { silent: true, symbol: 'none', animation: false, label: { show: false }, lineStyle: { color: cinza, width: 2, type: 'solid' },
        data: cfg.categorias.map(function (c, i) {
          return antes.dados[i] == null || depois.dados[i] == null ? null
            : [{ coord: [antes.dados[i], c] }, { coord: [depois.dados[i], c] }];
        }).filter(Boolean) };
      base.series = [fios, ponto(depois, cores[0])];
      return base;
    }

    if (tipo === 'donut' || tipo === 'funnel') {
      var s = cfg.series[0];
      var dados = cfg.categorias.map(function (c, i) { return { name: c, value: s.dados[i] }; });
      base.tooltip.trigger = 'item';
      base.legend = { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: tinta, fontFamily: fonte, fontSize: 12 } };
      base.series = [tipo === 'donut'
        ? { type: 'pie', radius: ['58%', '80%'], center: ['50%', '45%'], data: dados, label: { show: false },
            itemStyle: { borderColor: fundo, borderWidth: 2, borderRadius: 4 }, emphasis: { scale: false } }
        : { type: 'funnel', left: '10%', right: '10%', top: 8, bottom: 32, sort: 'none', gap: 2, minSize: '18%',
            data: dados, label: { show: true, position: 'inside', fontFamily: fonte, color: css('--ucam-color-text-on-action') || '#fff',
              formatter: function (p) { return p.name + '  ' + num(p.value); } },
            itemStyle: { borderColor: fundo, borderWidth: 0, borderRadius: 4 } }];
      return base;
    }

    var horizontal = tipo === 'bar' && cfg.horizontal;
    var eixoCat = { type: 'category', data: cfg.categorias, boundaryGap: tipo === 'bar',
      axisLine: { lineStyle: { color: fio } }, axisTick: { show: false }, axisLabel: { color: tinta, fontFamily: fonte, fontSize: 12, hideOverlap: true },
      // Deitada, a primeira categoria fica no alto, na ordem da tabela. Sem isto
      // o ECharts empilha de baixo para cima e a leitura começa pelo fim.
      inverse: tipo === 'bar' && !!cfg.horizontal };
    var eixoVal = { type: 'value', splitLine: { lineStyle: { color: fio } }, axisLabel: { color: tinta, fontFamily: fonte, fontSize: 12,
      formatter: function (v) { return cfg.moeda ? 'R$ ' + num(v >= 1000 ? Math.round(v / 1000) + ' mil' : v) : num(v); } } };

    if (tipo === 'sparkline') {
      base.grid = { left: 0, right: 0, top: 4, bottom: 4 };
      base.xAxis = Object.assign(eixoCat, { show: false });
      base.yAxis = Object.assign(eixoVal, { show: false, scale: true });
      base.tooltip.trigger = 'axis';
      base.series = cfg.series.map(function (s) { return { type: 'line', data: s.dados, symbol: 'none', lineStyle: { width: 2 } }; });
      return base;
    }

    // À direita, folga para o último rótulo do eixo de linha, que fica centrado
    // no último ponto (sem boundaryGap) e saía cortado; e, com destaque, para o
    // nome da série escrito na ponta da linha.
    base.grid = { left: 8, right: cfg.destaque && tipo !== 'bar' ? 72 : tipo === 'bar' ? 16 : 24, top: 16, bottom: legenda ? 40 : 8, containLabel: true };
    base.xAxis = horizontal ? eixoVal : eixoCat;
    base.yAxis = horizontal ? eixoCat : eixoVal;
    base.tooltip.trigger = tipo === 'bar' ? 'item' : 'axis';
    if (tipo !== 'bar') base.tooltip.axisPointer = { type: 'line', lineStyle: { color: fio } };
    if (legenda) base.legend = legendaBase;
    var ultima = cfg.series.length - 1;

    /* BARRA 100% (proporcao): a fatia de cada parte em cada categoria, quando
     * os totais variam tanto que a barra empilhada comum esconde a proporção
     * dos pequenos. O eixo vai a 100% e a dica dá a fatia e o número. A
     * tabela continua com os números, não com as porcentagens. */
    var proporcao = tipo === 'bar' && cfg.proporcao;
    var empilha = cfg.empilhado || proporcao;
    var totais = proporcao ? cfg.categorias.map(function (c, i) {
      return cfg.series.reduce(function (t, s) { return t + (s.dados[i] || 0); }, 0);
    }) : null;
    if (proporcao) {
      eixoVal.max = 100;
      eixoVal.axisLabel.formatter = function (v) { return v + '%'; };
      base.tooltip.valueFormatter = undefined;
      base.tooltip.formatter = function (p) {
        var s = cfg.series[p.seriesIndex], v = s.dados[p.dataIndex];
        return p.name + '<br>' + p.marker + s.nome + ': <b>' + num(Math.round(p.value * 10) / 10) + '%</b> (' + fmt(cfg, v, s) + ')';
      };
    }

    base.series = cfg.series.map(function (s, i) {
      var cor = corDe(s, i);
      var contexto = cfg.destaque && s.nome !== cfg.destaque;
      if (tipo === 'bar') {
        var ponta = !empilha || i === ultima;
        var dados = proporcao ? s.dados.map(function (v, k) { return totais[k] ? (v || 0) * 100 / totais[k] : null; }) : s.dados;
        return { type: 'bar', name: s.nome, data: dados, stack: empilha ? 'total' : undefined, barMaxWidth: 28,
          itemStyle: { color: cor, borderRadius: ponta ? (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0, borderColor: fundo, borderWidth: empilha ? 1 : 0 } };
      }
      return { type: 'line', name: s.nome, data: s.dados, smooth: false, symbol: 'circle', symbolSize: 8, showSymbol: false,
        z: contexto ? 2 : 3, itemStyle: cor ? { color: cor } : undefined,
        // O rótulo direto só na série em destaque: é ela o assunto.
        endLabel: cfg.destaque && !contexto ? { show: true, formatter: '{a}', color: texto, fontFamily: fonte, fontSize: 12, fontWeight: 500 } : undefined,
        lineStyle: { width: 2, color: cor }, areaStyle: tipo === 'area' ? { opacity: 0.12, color: cor } : undefined, stack: cfg.empilhado ? 'total' : undefined };
    });
    return base;
  }

  /* FONTE NA TABELA DA TELA (24/10/2026). Com "fonte": {"tabela": id,
   * "colunas": [1, 2]}, os dados de cada série saem das células da tabela
   * equivalente a cada desenho, na ordem das séries. É o que faz o gráfico
   * seguir um filtro que troca os números da tabela (data-cenario no
   * Analytics do Protocolo) sem um segundo conjunto de números para manter. */
  function lerFonte(cfg) {
    var t = cfg.fonte && document.getElementById(cfg.fonte.tabela);
    if (!t) return;
    var linhas = t.querySelectorAll('tbody tr');
    cfg.series.forEach(function (s, i) {
      var col = cfg.fonte.colunas[i];
      s.dados = Array.prototype.map.call(linhas, function (tr) {
        var c = tr.children[col];
        var v = c ? parseFloat(c.textContent.replace(/[^0-9,-]/g, '').replace(',', '.')) : NaN;
        return isNaN(v) ? null : v;
      });
    });
  }

  function desenha() {
    instancias.forEach(function (x) { lerFonte(x.cfg); x.grafico.setOption(opcao(x.cfg, x.fig), true); });
  }

  figuras.forEach(function (fig) {
    var cfg;
    try { cfg = JSON.parse(fig.getAttribute('data-grafico')); } catch (e) { return; }
    var plot = fig.querySelector('.ucam-grafico__plot');
    if (!plot) {
      plot = document.createElement('div');
      plot.className = 'ucam-grafico__plot ucam-grafico__plot--' + (cfg.altura || (cfg.tipo === 'sparkline' ? 'xs' : 'md'));
      plot.setAttribute('aria-hidden', 'true');
      fig.insertBefore(plot, fig.firstChild);
    }
    // tabela: false quando a TELA já traz a tabela equivalente logo abaixo.
    if (cfg.tipo !== 'sparkline' && cfg.tabela !== false) tabela(fig, cfg);
    var g = window.echarts.init(plot, null, { renderer: 'svg' });
    instancias.push({ grafico: g, cfg: cfg, fig: fig });
    if (window.ResizeObserver) new ResizeObserver(function () { g.resize(); }).observe(plot);
  });
  desenha();

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-cenario] button[data-valor]')) setTimeout(desenha, 0);
  });
  new MutationObserver(desenha).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  var escuro = matchMedia('(prefers-color-scheme: dark)');
  if (escuro.addEventListener) escuro.addEventListener('change', desenha);
}

export const graficoScript = `(${grafico.toString()})();`;
