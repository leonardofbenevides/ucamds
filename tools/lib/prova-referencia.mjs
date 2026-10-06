// A PROVA DAS TELAS DE REFERÊNCIA DO VESTIBULAR — o que faz a questão andar.
//
// Pedido de 07/10/2026: "deixe os botões funcionando, de voltar pra questão
// anterior, de ir pra frente, revise as funções da tela". Até então a tela de
// questão do catálogo era uma foto: uma questão só, "Anterior" e as bolhas do
// mapa parados, e a contagem cravada na marcação. Quem abria a referência para
// entender o fluxo não conseguia experimentar justamente o que o padrão
// fluxo-guiado descreve.
//
// O QUE ISTO É: fixture. Monta o estado de uma prova de mentira no navegador
// (sessionStorage) e o desenha na marcação que a tela já traz. Não é
// comportamento do design system — é o papel que, no app, cabe ao ProvaStore —
// e por isso vive fora de shell.mjs e fora de dist/css/ucam-comportamento.js
// (ADR-057: fixture não viaja para a aplicação). Sem os atributos data-prova-*
// na página, não faz nada.
//
// O CONTRATO COM A MARCAÇÃO (tudo opcional, a tela usa o que tiver):
//   [data-prova-questao="pt-1"]      um <article> por questão; só a atual aparece
//   [data-prova-ir="anterior|proxima|em-branco|marcada"]
//   [data-prova-revisar]             alternância "Marcar para revisar" (aria-pressed)
//   [data-prova-selo]                selo Respondida / Em branco da questão
//   [data-prova-bolha="pt-1"]        bolha do mapa; cheia, vazia, atual e ponto
//   [data-prova-caderno="pt"]        "2 de 3" do grupo no mapa
//   [data-prova-contagem]            "3 de 5 respondidas", onde aparecer
//   [data-prova-progresso]           barra das respondidas
//   [data-prova-salvo]               "Salvando…" e depois "Salvo"
//   [data-prova-relogio] [data-prova-faltam] [data-prova-tempo]   o tempo, andando
//   [data-prova-texto] [data-prova-caracteres] [data-prova-minimo] a redação
//   [data-prova-redacao-estado]      "Em branco", "Rascunho", "Mínimo atingido"
//   [data-prova-resumo]              o corpo do diálogo de entrega
//   [data-prova-resultado="…"]       números da prova feita, na tela de resultado
//   [data-prova-zera]                recomeça a prova (o link de volta ao início)

function prova() {
  var CHAVE = 'ucam-vestibular-prova-v1';
  var doc = document;
  var q = function (sel, raiz) { return (raiz || doc).querySelector(sel); };
  var qa = function (sel, raiz) { return Array.prototype.slice.call((raiz || doc).querySelectorAll(sel)); };
  if (!q('[data-prova-questao], [data-prova-bolha], [data-prova-texto], [data-prova-resultado], [data-prova-zera]')) return;

  // A prova de mentira: a ordem das questões e o nome de cada caderno. É a
  // mesma dos candidatos de teste do app (tools/mock-backend.mjs).
  var ORDEM = ['pt-1', 'pt-2', 'pt-3', 'mt-1', 'mt-2'];
  var CADERNO = { pt: 'Português', mt: 'Matemática' };
  var GABARITO = { 'pt-1': 'c', 'pt-2': 'b', 'pt-3': 'a', 'mt-1': 'd', 'mt-2': 'b' };
  var TOTAL_MIN = 120;
  var MINIMO = 300;
  var TEXTO_INICIAL = (q('[data-prova-texto]') || {}).value || '';

  function novo() {
    // O estado da foto: três respondidas, uma marcada, 1h22 de prova pela frente.
    return {
      respostas: { 'pt-1': 'c', 'pt-2': 'b', 'mt-1': 'd' },
      revisar: { 'pt-2': true },
      atual: 'pt-2',
      fim: Date.now() + (82 * 60 + 14) * 1000,
      texto: null,
      entregue: null,
    };
  }
  function ler() {
    try {
      var s = JSON.parse(sessionStorage.getItem(CHAVE) || 'null');
      if (s && s.respostas && s.fim && (s.entregue || s.fim > Date.now())) return s;
    } catch (e) {}
    return novo();
  }
  var estado = ler();
  function gravar() { try { sessionStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} }

  var cadernoDe = function (id) { return id.split('-')[0]; };
  var numeroDe = function (id) { return +id.split('-')[1]; };
  var nomeDe = function (id) { return CADERNO[cadernoDe(id)] + ' ' + numeroDe(id); };
  var respondidas = function () { return ORDEM.filter(function (id) { return !!estado.respostas[id]; }); };
  var emBranco = function () { return ORDEM.filter(function (id) { return !estado.respostas[id]; }); };
  var marcadas = function () { return ORDEM.filter(function (id) { return !!estado.revisar[id]; }); };
  var texto = function () { return estado.texto === null ? TEXTO_INICIAL : estado.texto; };
  var caracteres = function () { return texto().replace(/\s/g, '').length; };
  var estadoRedacao = function () {
    var n = caracteres();
    return n === 0 ? 'Em branco' : n >= MINIMO ? 'Mínimo atingido' : 'Rascunho';
  };
  var plural = function (n, um, varios) { return n + ' ' + (n === 1 ? um : varios); };
  var milhar = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };

  function anunciar(frase) {
    var r = q('[data-prova-anuncio]');
    if (!r) return;
    r.textContent = '';
    setTimeout(function () { r.textContent = frase; }, 60);
  }

  var salvoTimer = null;
  function salvou() {
    qa('[data-prova-salvo]').forEach(function (el) {
      el.lastChild.textContent = ' Salvando…';
    });
    clearTimeout(salvoTimer);
    salvoTimer = setTimeout(function () {
      qa('[data-prova-salvo]').forEach(function (el) { el.lastChild.textContent = ' Salvo'; });
    }, 500);
  }

  // ----------------------------------------------------------------- desenho --
  function desenhar(focar) {
    var feitas = respondidas();
    var frase = feitas.length + ' de ' + ORDEM.length + ' respondidas';

    // A questão em vista, e os controles dela.
    var artigos = qa('[data-prova-questao]');
    artigos.forEach(function (a) {
      var id = a.getAttribute('data-prova-questao');
      var atual = id === estado.atual;
      a.hidden = !atual;
      if (!atual) return;
      var escolhida = estado.respostas[id] || null;
      qa('input[type=radio]', a).forEach(function (r) { r.checked = r.value === escolhida; });
      var selo = q('[data-prova-selo]', a);
      if (selo) {
        selo.className = 'ucam-badge ucam-badge--' + (escolhida ? 'success' : 'neutral');
        selo.lastChild.textContent = escolhida ? 'Respondida' : 'Em branco';
      }
      var rev = q('[data-prova-revisar]', a);
      if (rev) rev.setAttribute('aria-pressed', estado.revisar[id] ? 'true' : 'false');
      var i = ORDEM.indexOf(id);
      var ant = q('[data-prova-ir="anterior"]', a);
      if (ant) {
        ant.disabled = i === 0;
        // Botão parado diz por quê (modelo de estados: desabilitado sem razão é beco).
        ant.title = i === 0 ? 'Esta é a primeira questão.' : '';
      }
      if (focar) {
        var titulo = q('[data-prova-titulo]', a);
        if (titulo) titulo.focus({ preventScroll: false });
      }
    });

    // O mapa: cheia e vazia, a atual, o ponto de revisar.
    qa('[data-prova-bolha]').forEach(function (b) {
      var id = b.getAttribute('data-prova-bolha');
      var cheia = !!estado.respostas[id];
      var marcada = !!estado.revisar[id];
      b.classList.toggle('ucam-btn--primary', cheia);
      b.classList.toggle('ucam-btn--secondary', !cheia);
      var naQuestao = artigos.length && id === estado.atual;
      if (naQuestao) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Questão ' + numeroDe(id) + ' de ' + CADERNO[cadernoDe(id)] + ', ' +
        (cheia ? 'respondida' : 'em branco') + (marcada ? ', marcada para revisar' : ''));
      var ponto = q('.ucam-badge__ponto', b);
      if (marcada && !ponto) {
        ponto = doc.createElement('span');
        ponto.className = 'ucam-badge__ponto';
        ponto.setAttribute('aria-hidden', 'true');
        b.appendChild(ponto);
      } else if (!marcada && ponto) ponto.remove();
    });
    qa('[data-prova-caderno]').forEach(function (el) {
      var c = el.getAttribute('data-prova-caderno');
      var doCaderno = ORDEM.filter(function (id) { return cadernoDe(id) === c; });
      el.textContent = doCaderno.filter(function (id) { return !!estado.respostas[id]; }).length + ' de ' + doCaderno.length;
    });
    qa('[data-prova-contagem]').forEach(function (el) { el.textContent = frase; });
    qa('[data-prova-progresso]').forEach(function (barra) {
      var fill = q('.ucam-progress__fill', barra);
      var cheia = feitas.length === ORDEM.length;
      fill.style.setProperty('--ucam-progress-valor', Math.round(100 * feitas.length / ORDEM.length) + '%');
      // Tudo respondido é meta cumprida: o andamento vira sucesso.
      fill.className = 'ucam-progress__fill ucam-progress__fill--' + (cheia ? 'success' : 'marca');
      barra.setAttribute('aria-valuenow', feitas.length);
      barra.setAttribute('aria-valuetext', frase);
    });
    // O atalho do mapa: a próxima em branco; com tudo respondido, a próxima marcada.
    qa('[data-prova-ir="em-branco"], [data-prova-ir="marcada"]').forEach(function (b) {
      var temBranco = emBranco().length > 0;
      var temMarcada = marcadas().length > 0;
      b.hidden = !temBranco && !temMarcada;
      b.setAttribute('data-prova-ir', temBranco ? 'em-branco' : 'marcada');
      b.firstChild.textContent = temBranco ? 'Próxima em branco ' : 'Próxima marcada ';
    });

    // A redação, onde ela aparece.
    var er = estadoRedacao();
    qa('[data-prova-redacao-estado]').forEach(function (el) { el.textContent = er; });
    qa('[data-prova-redacao-bolha]').forEach(function (el) {
      var cheia = er === 'Mínimo atingido';
      el.classList.toggle('ucam-btn--primary', cheia);
      el.classList.toggle('ucam-btn--secondary', !cheia);
      el.setAttribute('aria-label', 'Redação, ' + er.toLowerCase());
    });
    var n = caracteres();
    qa('[data-prova-caracteres]').forEach(function (el) {
      el.textContent = 'Mínimo de ' + MINIMO + ' caracteres, sem contar espaços. ' + milhar(n) + ' de 3.000.';
    });
    qa('[data-prova-minimo]').forEach(function (el) {
      el.textContent = n >= MINIMO ? 'Mínimo atingido.' : 'Faltam ' + plural(MINIMO - n, 'caractere', 'caracteres') + ' para o mínimo.';
    });

    desenharResumo();
    desenharResultado();
  }

  // O diálogo de entrega diz o que fica para trás, com os nomes.
  function desenharResumo() {
    var corpo = q('[data-prova-resumo]');
    if (!corpo) return;
    var brancas = emBranco(), revs = marcadas();
    var html = '<p>Depois de entregar você não poderá alterar as respostas.</p>';
    if (brancas.length) {
      html += '<p><strong>' + plural(brancas.length, 'questão está', 'questões estão') + ' em branco:</strong> ' +
        brancas.map(nomeDe).join(', ') + '.</p>';
    }
    if (revs.length) {
      html += '<p><strong>' + plural(revs.length, 'questão está marcada', 'questões estão marcadas') + ' para revisar:</strong> ' +
        revs.map(nomeDe).join(', ') + '.</p>';
    }
    if (!brancas.length && !revs.length) html += '<p>Todas as ' + ORDEM.length + ' questões estão respondidas.</p>';
    if (caracteres() < MINIMO) {
      html += '<div class="ucam-alert ucam-alert--warning"><svg class="ic" aria-hidden="true"><use href="#i-triangleAlert"/></svg>' +
        '<div class="ucam-alert__corpo">A redação ainda não tem o mínimo de ' + MINIMO + ' caracteres.</div></div>';
    }
    corpo.innerHTML = html;
  }

  // A tela de resultado mostra a prova que foi feita NESTA sessão.
  function desenharResultado() {
    if (!q('[data-prova-resultado]')) return;
    var e = estado.entregue || { quando: Date.now(), usado: TOTAL_MIN * 60000 - Math.max(0, estado.fim - Date.now()) };
    var d = new Date(e.quando);
    var doisD = function (x) { return (x < 10 ? '0' : '') + x; };
    var min = Math.max(1, Math.round(e.usado / 60000));
    var acertos = function (c) {
      return ORDEM.filter(function (id) { return (!c || cadernoDe(id) === c) && estado.respostas[id] === GABARITO[id]; }).length;
    };
    var total = function (c) { return ORDEM.filter(function (id) { return !c || cadernoDe(id) === c; }).length; };
    var valores = {
      dia: doisD(d.getDate()) + '/' + doisD(d.getMonth() + 1) + '/' + d.getFullYear(),
      hora: 'às ' + doisD(d.getHours()) + ':' + doisD(d.getMinutes()),
      tempo: min >= 60 ? Math.floor(min / 60) + ' h ' + (min % 60 ? (min % 60) + ' min' : '') : min + ' min',
      respondidas: respondidas().length + ' de ' + ORDEM.length,
      acertos: acertos() + ' de ' + total(),
      'acertos-pt': acertos('pt') + ' de ' + total('pt'),
      'acertos-mt': acertos('mt') + ' de ' + total('mt'),
      aproveitamento: Math.round(100 * acertos() / total()) + '%',
      caracteres: milhar(caracteres()),
    };
    qa('[data-prova-resultado]').forEach(function (el) {
      var v = valores[el.getAttribute('data-prova-resultado')];
      if (v !== undefined) el.textContent = v.trim();
    });
    qa('[data-prova-barra]').forEach(function (barra) {
      var c = barra.getAttribute('data-prova-barra');
      var p = Math.round(100 * acertos(c) / total(c));
      q('.ucam-progress__fill', barra).style.setProperty('--ucam-progress-valor', p + '%');
      barra.setAttribute('aria-valuenow', acertos(c));
      barra.setAttribute('aria-valuetext', acertos(c) + ' de ' + total(c) + ' acertos');
    });
  }

  // ------------------------------------------------------------------- tempo --
  function tique() {
    var falta = Math.max(0, estado.fim - Date.now());
    var s = Math.floor(falta / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
    var dois = function (x) { return (x < 10 ? '0' : '') + x; };
    var hms = dois(h) + ':' + dois(m) + ':' + dois(seg);
    var palavra = 'Faltam ' + (h ? h + ' h ' : '') + m + ' min';
    qa('[data-prova-relogio]').forEach(function (el) { el.textContent = hms; });
    qa('[data-prova-faltam]').forEach(function (el) { el.textContent = palavra; });
    qa('[data-prova-tempo]').forEach(function (barra) {
      var usado = TOTAL_MIN * 60 - s;
      var fill = q('.ucam-progress__fill', barra);
      fill.style.setProperty('--ucam-progress-valor', Math.min(100, Math.round(100 * usado / (TOTAL_MIN * 60))) + '%');
      // O último terço avisa, os últimos dez minutos alertam — com a palavra junto.
      var tom = s <= 600 ? 'danger' : s <= TOTAL_MIN * 20 ? 'warning' : 'marca';
      fill.className = 'ucam-progress__fill ucam-progress__fill--' + tom;
      barra.setAttribute('aria-valuenow', Math.round(usado / 60));
      barra.setAttribute('aria-valuetext', palavra);
    });
  }

  // ------------------------------------------------------------------- ações --
  function irPara(id) {
    if (!id) return;
    estado.atual = id;
    gravar();
    desenhar(true);
    anunciar(CADERNO[cadernoDe(id)] + ', questão ' + numeroDe(id) + '.');
  }
  function depoisDe(lista) {
    // A primeira da lista DEPOIS da atual; sem nenhuma adiante, volta ao começo.
    var i = ORDEM.indexOf(estado.atual);
    return lista.filter(function (id) { return ORDEM.indexOf(id) > i; })[0] || lista[0] || null;
  }

  doc.addEventListener('change', function (ev) {
    var r = ev.target;
    if (!r.matches || !r.matches('[data-prova-questao] input[type=radio]')) return;
    var id = r.closest('[data-prova-questao]').getAttribute('data-prova-questao');
    estado.respostas[id] = r.value;
    gravar();
    salvou();
    desenhar(false);
    anunciar('Alternativa ' + r.value.toUpperCase() + ' marcada. ' + respondidas().length + ' de ' + ORDEM.length + ' respondidas.');
  });

  doc.addEventListener('input', function (ev) {
    if (!ev.target.matches || !ev.target.matches('[data-prova-texto]')) return;
    estado.texto = ev.target.value;
    gravar();
    salvou();
    desenhar(false);
  });

  doc.addEventListener('click', function (ev) {
    var alvo = ev.target.closest && ev.target.closest('[data-prova-ir], [data-prova-revisar], [data-prova-bolha], [data-prova-zera]');
    if (!alvo) return;
    var naQuestao = !!q('[data-prova-questao]');

    if (alvo.hasAttribute('data-prova-zera')) {
      // Quem entra pela primeira tela começa uma prova NOVA: nada respondido,
      // redação em branco, o tempo inteiro. Quem abre a questão direto vê a
      // prova da foto, já em andamento.
      estado = { respostas: {}, revisar: {}, atual: ORDEM[0], fim: Date.now() + TOTAL_MIN * 60000, texto: '', entregue: null };
      gravar();
      return; // o link segue o seu caminho
    }
    if (alvo.hasAttribute('data-prova-revisar')) {
      var id = estado.atual;
      if (estado.revisar[id]) delete estado.revisar[id]; else estado.revisar[id] = true;
      gravar();
      desenhar(false);
      anunciar(estado.revisar[id] ? 'Questão marcada para revisar.' : 'Marca de revisão retirada.');
      return;
    }
    if (alvo.hasAttribute('data-prova-bolha')) {
      estado.atual = alvo.getAttribute('data-prova-bolha');
      gravar();
      // Na tela da questão a bolha troca a questão; nas outras ela é link para lá.
      if (naQuestao) { ev.preventDefault(); desenhar(true); }
      return;
    }
    var para = alvo.getAttribute('data-prova-ir');
    var i = ORDEM.indexOf(estado.atual);
    if (para === 'anterior') {
      ev.preventDefault();
      if (i > 0) irPara(ORDEM[i - 1]);
    } else if (para === 'proxima') {
      // Na última questão o controle é o link para a redação, e segue.
      if (i < ORDEM.length - 1) { ev.preventDefault(); irPara(ORDEM[i + 1]); }
    } else if (para === 'em-branco' || para === 'marcada') {
      var destino = depoisDe(para === 'em-branco' ? emBranco() : marcadas());
      if (!destino) return;
      estado.atual = destino;
      gravar();
      if (naQuestao) { ev.preventDefault(); desenhar(true); }
    }
  });

  // Entregar: a hora e o tempo usado ficam para a tela de resultado.
  qa('dialog[data-prova-entrega]').forEach(function (d) {
    d.addEventListener('close', function () {
      if (d.returnValue !== 'ok') return;
      estado.entregue = { quando: Date.now(), usado: TOTAL_MIN * 60000 - Math.max(0, estado.fim - Date.now()) };
      gravar();
    });
  });

  // Setas do teclado andam entre as questões, fora de campo de texto e de radio.
  doc.addEventListener('keydown', function (ev) {
    if (!q('[data-prova-questao]') || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var t = ev.target;
    if (t.matches && t.matches('input, textarea, select, [contenteditable]')) return;
    if (doc.querySelector('dialog[open]')) return;
    var i = ORDEM.indexOf(estado.atual);
    if (ev.key === 'ArrowLeft' && i > 0) { ev.preventDefault(); irPara(ORDEM[i - 1]); }
    if (ev.key === 'ArrowRight' && i < ORDEM.length - 1) { ev.preventDefault(); irPara(ORDEM[i + 1]); }
  });

  var campo = q('[data-prova-texto]');
  if (campo && estado.texto !== null) campo.value = estado.texto;
  desenhar(false);
  if (q('[data-prova-relogio], [data-prova-tempo], [data-prova-faltam]') && !estado.entregue) {
    tique();
    setInterval(tique, 1000);
  }
}

export const provaScript = `(${prova.toString()})();`;
