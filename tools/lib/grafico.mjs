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
 * Tipos: line, area, bar (stack, horizontal), donut, funnel, sparkline.
 * Nunca dois eixos: um gráfico, uma unidade. */
function grafico() {
  var figuras = document.querySelectorAll('figure.ucam-grafico[data-grafico]');
  if (!figuras.length || !window.echarts) return;

  var css = function (nome) { return getComputedStyle(document.documentElement).getPropertyValue(nome).trim(); };
  var num = function (v) { return typeof v === 'number' ? v.toLocaleString('pt-BR') : v; };
  var fmt = function (cfg, v) {
    if (v == null) return '—';
    if (cfg.moeda) return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return num(v) + (cfg.sufixo || '');
  };
  var instancias = [];

  function tabela(fig, cfg) {
    if (fig.querySelector('.ucam-grafico__tabela')) return;
    var d = document.createElement('details');
    d.className = 'ucam-grafico__tabela';
    var linhas = cfg.categorias.map(function (c, i) {
      return '<tr><th scope="row">' + c + '</th>' + cfg.series.map(function (s) {
        return '<td class="td--num">' + fmt(cfg, s.dados[i]) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    d.innerHTML = '<summary>Ver os mesmos dados em tabela</summary>' +
      '<div class="ucam-table-wrap"><table class="ucam-table ucam-table--compact"><caption class="ucam-sr-only">' +
      (fig.getAttribute('aria-label') || '') + '</caption><thead><tr><th scope="col">' + (cfg.categoria || '') + '</th>' +
      cfg.series.map(function (s) { return '<th scope="col" class="th--num">' + s.nome + (cfg.unidade ? ' (' + cfg.unidade + ')' : '') + '</th>'; }).join('') +
      '</tr></thead><tbody>' + linhas + '</tbody></table></div>';
    fig.appendChild(d);
  }

  function opcao(cfg, fig) {
    var cores = [1, 2, 3, 4, 5, 6].map(function (i) { return css('--ucam-color-chart-series-' + i); });
    var tinta = css('--ucam-color-text-secondary');
    var fio = css('--ucam-color-border-subtle');
    var fundo = css('--ucam-color-surface-raised') || css('--ucam-color-surface-default');
    var texto = css('--ucam-color-text-primary');
    var fonte = getComputedStyle(fig).fontFamily;
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
      axisLine: { lineStyle: { color: fio } }, axisTick: { show: false }, axisLabel: { color: tinta, fontFamily: fonte, fontSize: 12, hideOverlap: true } };
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

    base.grid = { left: 8, right: 16, top: 16, bottom: legenda ? 40 : 8, containLabel: true };
    base.xAxis = horizontal ? eixoVal : eixoCat;
    base.yAxis = horizontal ? eixoCat : eixoVal;
    base.tooltip.trigger = tipo === 'bar' ? 'item' : 'axis';
    if (tipo !== 'bar') base.tooltip.axisPointer = { type: 'line', lineStyle: { color: fio } };
    if (legenda) base.legend = { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: tinta, fontFamily: fonte, fontSize: 12 } };
    var ultima = cfg.series.length - 1;
    base.series = cfg.series.map(function (s, i) {
      if (tipo === 'bar') {
        var ponta = !cfg.empilhado || i === ultima;
        return { type: 'bar', name: s.nome, data: s.dados, stack: cfg.empilhado ? 'total' : undefined, barMaxWidth: 28,
          itemStyle: { borderRadius: ponta ? (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0, borderColor: fundo, borderWidth: cfg.empilhado ? 1 : 0 } };
      }
      return { type: 'line', name: s.nome, data: s.dados, smooth: false, symbol: 'circle', symbolSize: 8, showSymbol: false,
        lineStyle: { width: 2 }, areaStyle: tipo === 'area' ? { opacity: 0.12 } : undefined, stack: cfg.empilhado ? 'total' : undefined };
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
