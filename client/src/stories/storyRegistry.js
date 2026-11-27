// Registro central dos 6 Contos, Leitor de Livros (Última Página) e Estante Final dos 6 Livros!
import { runStory1Burocracia } from './story1_burocracia.js';
import { runStory2Princesa } from './story2_princesa.js';
import { runStory3PT } from './story3_pt.js';
import { runStory4Titanic } from './story4_titanic.js';
import { runStory5Floresta } from './story5_floresta.js';
import { runStory61984 } from './story6_1984.js';

export const BOOKS_META = {
  book_1: {
    id: 'book_1',
    storyId: '1',
    title: 'Fronteira da Burocracia',
    subtitle: 'Livro I // Crônicas de Vostok-Cinza',
    themeClass: 'book-theme-sepia',
    prologuePages: [
      {
        heading: 'Capítulo I — A Grande Divisão das Quatro Nações',
        text: 'No inverno de 1953, após a Guerra do Carvão, as quatro potências — República de Vostok, União de Karst, Principado de Alvor e Costa de Salina — ergueram uma muralha de concreto armado cortando o continente.',
      },
      {
        heading: 'Capítulo II — O Posto 04 de Estrada-Morta',
        text: 'Apenas uma passagem permaneceu aberta na fronteira leste: o Posto 04. O antigo inspetor desapareceu na calada da noite deixando um carimbo sujo de tinta seca, uma lanterna quebrada e três gavetas trancadas.',
      },
      {
        heading: 'Capítulo III — Sua Convocação Oficial',
        text: 'Seu nome foi sorteado pelo Ministério da Ordem Territorial para assumir a cabine sob nevasca pelos próximos cinco dias. Lá fora, contrabandistas, desertores, diplomatas clandestinos e fugitivos já formam fila sob os holofotes. Ninguém cruza a grade sem o seu carimbo.',
      },
    ],
    prologue: 'No inverno cinzento da fronteira dividida, você foi convocado às pressas para assumir o Posto 04. Cinco dias de nevasca, falsificadores e segredos de Estado aguardam do outro lado do vidro.',
    summary: 'Você sobreviveu a 5 dias na cabine do Posto 04 enfrentando falsificadores de brasão, contrabandistas, fugitivos procurados e mensageiros clandestinos.',
    recordedClues: [
      '• Pista 1 (Dia 4 — Placa no Raio-X): 01001101 01010101 01010010 01001111',
      '• Pista 2 (Dia 5 — Luz Negra UV): CÉSAR +3 → EHUOLP',
    ],
    riddle: '"Decodifique as duas mensagens interceptadas na página ao lado: elas formam o nome da fronteira que dividiu uma cidade real durante décadas. Numa coletiva de imprensa em novembro, um porta-voz gaguejou \'imediatamente\' por engano e derrubou essa barreira na mesma noite. Pegue o ANO em que ela caiu, subtraia o ANO em que foi erguida, e multiplique pela IDADE exata (em anos completos naquela noite) do porta-voz."',
  },
  book_2: {
    id: 'book_2',
    storyId: '2',
    title: 'A Princesa de Plástico',
    subtitle: 'Livro II // Bastidores de Papelão',
    themeClass: 'book-theme-pink',
    prologuePages: [
      {
        heading: 'Capítulo I — O Reino que Entrou em Greve',
        text: 'Por gerações, os figurantes do Vale Cor-de-Rosa repetiram o mesmo teatrinho: o bardo cantava, o cavalo galopava, o dragão cuspia fogo e a princesa suspirava no alto da torre.',
      },
      {
        heading: 'Capítulo II — A Farsa de Papelão',
        text: 'Até o dia em que os bastidores ruíram. O corcel abriu dissidência sindical, um troll de RH montou pedágio corporativo na ponte levadiça, o dragão desenvolveu rinite crônica ao pó do cenário e a princesa virou influenciadora viciada em açaí.',
      },
      {
        heading: 'Capítulo III — O Negativo Esquecido Atrás do Cenário',
        text: 'Dizem que, escondido na câmara escura atrás das torres de papelão, repousa um negativo fotográfico negro que aponta para a verdadeira e sombria origem do conto — muito antes de Paris e de Hollywood.',
      },
    ],
    prologue: 'Um reino cenográfico em greve geral: atravesse 7 cenários interativos, use os itens do seu alforje e não deixe de investigar a câmara escura nos bastidores.',
    summary: 'Você superou os 7 cenários do Reino de Plástico — do sindicato equino e do RH do Troll até o dragão asmático, os disjuntores 220V e a cobertura da Princesa.',
    recordedClues: [
      '• Folha de 1697 (Bastidores): Sete fadas boas convidadas ao batizado.',
      '• Placa na Coleira do Dragão: SÉRIE #0x2F.',
      '• Evidência Fotográfica: Negativo Subexposto #02 (baixe abaixo para inspecionar fora do navegador).',
    ],
    evidenceDownload: {
      url: '/story2/negativo_torre_02.png',
      filename: 'negativo_torre_02.png',
      label: '⬇ Baixar Evidência: negativo_torre_02.png',
    },
    riddle: '"Nem sempre os olhos enxergam o que dorme na escuridão de uma fotografia — e nem toda imagem guarda apenas pixels. Baixe o Negativo #02 da página ao lado: revele o que está escondido na penumbra e leia o que foi gravado nas entranhas brutas do próprio arquivo."',
  },
  book_3: {
    id: 'book_3',
    storyId: '3',
    title: 'Corredor 0999 (P.T.)',
    subtitle: 'Livro III // Fita VHS',
    themeClass: 'book-theme-noir',
    prologue: 'Uma fita VHS esquecida numa casa abandonada nos anos 90 prendeu seu último morador num corredor infinito. Cada vez que alguém cruza a porta no fim do corredor, a meia-noite recomeça.',
    summary: 'Você atravessou loops idênticos de um corredor em preto e branco procurando anomalias enquanto um rádio chiava clichês de terror.',
    riddle: '"O número do quarto proibido no hotel de Kubrick — não no livro de King, mas no filme."',
  },
  book_4: {
    id: 'book_4',
    storyId: '4',
    title: 'Naufrágio da Porta Gigante',
    subtitle: 'Livro IV // Gelo & Sonar',
    themeClass: 'book-theme-ice',
    prologue: 'Em abril de 1912, no meio do Atlântico Norte congelante, o maior transatlântico do mundo afundou por pura arrogância — e só sobrou uma porta de carvalho gigante boiando entre os icebergs.',
    summary: 'Você equilibrou uma porta onde claramente cabiam quatro pessoas no meio do Atlântico Norte congelante.',
    riddle: '"O navio \'inafundável\' que inspirou essa porta idiota partiu de Southampton e afundou em abril de qual ano?"',
  },
  book_5: {
    id: 'book_5',
    storyId: '5',
    title: 'Plantão da Floresta',
    subtitle: 'Livro V // Inquérito Sombrio',
    themeClass: 'book-theme-crimson',
    prologue: 'Na madrugada chuvosa da floresta, uma cesta sumiu, um álibi foi forjado e todos na cabana estão mentindo. Você é o único inspetor que restou para apontar o culpado antes do amanhecer.',
    summary: 'Você interrogou uma avó suspeita, um lenhador enrolado e um lobo cínico até desmontar o álibi falso da cabana.',
    riddle: '"O mesmo autor de \'1984\' escreveu também uma sátira sobre porcos comandando uma fazenda. Em que ano esse livro foi publicado?"',
  },
  book_6: {
    id: 'book_6',
    storyId: '6',
    title: 'Terminal 1984',
    subtitle: 'Livro VI // CRT Fósforo',
    themeClass: 'book-theme-crt',
    prologue: 'Numa Londres cinzenta governada por teletelas e microfones escondidos, o Ministério da Verdade reescreve os jornais todos os dias para apagar o passado. Você ocupa a cabine 101 da mesa de censura.',
    summary: 'Você censurou manchetes em tempo real, interceptou pacotes secretos e burlou a vigilância do Grande Irmão.',
    riddle: '"Na obra de George Orwell, qual é o número do quarto onde cada prisioneiro enfrenta seu pior terror?"',
  },
};

export const STORY_RUNNERS = {
  '1': runStory1Burocracia,
  '2': runStory2Princesa,
  '3': runStory3PT,
  '4': runStory4Titanic,
  '5': runStory5Floresta,
  '6': runStory61984,
};

export function openBookReaderModal(
  bookId,
  caveState,
  { apiPost, setOperatorRemark, triggerRisadaVoiceReaction, onSolved, onReplay }
) {
  const meta = BOOKS_META[bookId];
  if (!meta) return;

  document.getElementById('book-reader-modal')?.remove();
  const isSolved = Array.isArray(caveState.booksSolved) && caveState.booksSolved.includes(bookId);

  const evidenceBtnHtml = meta.evidenceDownload
    ? `
      <div style="margin-top:8px;">
        <a
          href="${meta.evidenceDownload.url}"
          download="${meta.evidenceDownload.filename}"
          style="display:inline-block; background:#18181b; color:#fde047; border:1.5px solid #fbbf24; border-radius:5px; padding:6px 11px; font-family:monospace; font-size:11.5px; font-weight:bold; text-decoration:none;"
        >${meta.evidenceDownload.label}</a>
      </div>
    `
    : '';

  const cluesHtml = Array.isArray(meta.recordedClues) && meta.recordedClues.length > 0
    ? `
      <div style="background:rgba(0,0,0,0.08); border:1.5px dashed rgba(0,0,0,0.35); border-radius:6px; padding:10px 12px; font-family:monospace; font-size:12px; line-height:1.55;">
        <div style="font-weight:bold; margin-bottom:4px; text-transform:uppercase; font-size:11px; opacity:0.85;">📌 Pistas Registradas na História:</div>
        ${meta.recordedClues.map((c) => `<div>${c}</div>`).join('')}
        ${evidenceBtnHtml}
      </div>
    `
    : '';

  const modal = document.createElement('div');
  modal.id = 'book-reader-modal';
  modal.className = 'book-modal-backdrop';
  modal.innerHTML = `
    <div class="book-open-spread ${meta.themeClass}">
      <div class="book-page book-page-left">
        <div>
          <div class="book-badge">${meta.subtitle}</div>
          <h2 class="book-title" style="margin-top:6px;">${meta.title}</h2>
          <p class="book-summary">${meta.summary}</p>
        </div>
        ${cluesHtml}
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="book-status ${isSolved ? 'solved' : 'pending'}">
            ${isSolved ? '✅ ENIGMA RESOLVIDO — PRÓXIMO LIVRO LIBERADO' : '🔒 RESOLVA A ÚLTIMA PÁGINA PARA DESTRAVAR O PRÓXIMO LIVRO'}
          </div>
          ${
            onReplay
              ? `<button type="button" id="book-replay-btn" class="book-close-btn" style="margin-top:0; font-size:11.5px;">🔄 Rejogar este Conto (Opcional)</button>`
              : ''
          }
        </div>
      </div>
      <div class="book-page book-page-right">
        <div class="book-page-num">Última Página // Enigma</div>
        <blockquote class="book-riddle">${meta.riddle}</blockquote>
        ${
          isSolved
            ? `<div class="book-solved-box">Enigma já decifrado! Guarde este livro na mochila — você vai precisar da resposta numérica dele lá na Estante Final da caverna.</div>`
            : `
              <div class="book-answer-row">
                <input type="text" id="book-riddle-input" class="book-input" placeholder="Digite o número final..." autocomplete="off" />
                <button type="button" id="book-riddle-submit" class="book-submit-btn">Validar</button>
              </div>
              <div class="book-feedback" id="book-riddle-feedback"></div>
            `
        }
        <button type="button" id="book-modal-close" class="book-close-btn">Guardar Livro na Mochila</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('book-modal-close')?.addEventListener('click', () => modal.remove());
  document.getElementById('book-replay-btn')?.addEventListener('click', () => {
    modal.remove();
    if (onReplay) onReplay();
  });

  const inputEl = document.getElementById('book-riddle-input');
  const submitBtn = document.getElementById('book-riddle-submit');
  const feedbackEl = document.getElementById('book-riddle-feedback');

  const trySolve = async () => {
    const val = (inputEl?.value || '').trim();
    if (!val) return;
    submitBtn.disabled = true;
    const res = await apiPost('/api/cave/solve-book', { bookId, answer: val });
    submitBtn.disabled = false;

    if (res?.ok) {
      if (res.remark) setOperatorRemark(res.remark, { priority: 'action' });
      modal.remove();
      if (onSolved) onSolved(res.caveState);
    } else {
      if (feedbackEl) feedbackEl.textContent = 'Resposta incorreta.';
      if (!(triggerRisadaVoiceReaction && triggerRisadaVoiceReaction())) {
        if (res?.remark) setOperatorRemark(res.remark, { priority: 'action' });
      }
    }
  };

  submitBtn?.addEventListener('click', trySolve);
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') trySolve();
  });
}

export function openFinalShelfModal(caveState, { apiPost, setOperatorRemark, onEscape }) {
  document.getElementById('final-shelf-modal')?.remove();

  const owned = Array.isArray(caveState.booksOwned) ? caveState.booksOwned : [];
  const solved = Array.isArray(caveState.booksSolved) ? caveState.booksSolved : [];
  const allReady = solved.length >= 6;

  let chosenOrder = [];

  const modal = document.createElement('div');
  modal.id = 'final-shelf-modal';
  modal.className = 'book-modal-backdrop';

  const renderInner = () => {
    modal.innerHTML = `
      <div class="shelf-modal-box">
        <div class="shelf-header">ESTANTE FINAL DA CAVERNA</div>
        <p class="shelf-inscription">
          "Coloque os seis livros em <strong>ordem CRESCENTE</strong> da resposta que cada um guardava — do menor número ao maior."
        </p>

        <div class="shelf-slots">
          ${[0, 1, 2, 3, 4, 5]
            .map((idx) => {
              const bId = chosenOrder[idx];
              const m = bId ? BOOKS_META[bId] : null;
              return `
                <div class="shelf-slot ${m ? 'filled' : ''}" data-slot-idx="${idx}">
                  <div class="slot-num">${idx + 1}º</div>
                  <div class="slot-name">${m ? m.title : 'Vazio'}</div>
                </div>
              `;
            })
            .join('')}
        </div>

        <div class="shelf-available">
          ${['book_1', 'book_2', 'book_3', 'book_4', 'book_5', 'book_6']
            .map((bId) => {
              const m = BOOKS_META[bId];
              const hasIt = owned.includes(bId);
              const isSolved = solved.includes(bId);
              const used = chosenOrder.includes(bId);
              return `
                <button type="button" class="shelf-book-btn ${used ? 'used' : ''}" data-book-pick="${bId}" ${
                  !hasIt || !isSolved || used ? 'disabled' : ''
                }>
                  ${hasIt ? (isSolved ? m.title : `🔒 ${m.title}`) : '??? (Não coletado)'}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="shelf-actions">
          <button type="button" id="shelf-clear-btn" class="shelf-btn-sec">Limpar Ordem</button>
          <button type="button" id="shelf-submit-btn" class="shelf-btn-pri" ${
            !allReady || chosenOrder.length < 6 ? 'disabled' : ''
          }>Encaixar Livros</button>
          <button type="button" id="shelf-close-btn" class="shelf-btn-sec">Voltar</button>
        </div>
        <div class="book-feedback" id="shelf-feedback"></div>
      </div>
    `;

    modal.querySelectorAll('[data-book-pick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = btn.getAttribute('data-book-pick');
        if (bId && chosenOrder.length < 6 && !chosenOrder.includes(bId)) {
          chosenOrder.push(bId);
          renderInner();
        }
      });
    });

    modal.querySelectorAll('.shelf-slot.filled').forEach((slot) => {
      slot.addEventListener('click', () => {
        const idx = Number(slot.getAttribute('data-slot-idx'));
        chosenOrder.splice(idx, 1);
        renderInner();
      });
    });

    modal.querySelector('#shelf-clear-btn')?.addEventListener('click', () => {
      chosenOrder = [];
      renderInner();
    });

    modal.querySelector('#shelf-close-btn')?.addEventListener('click', () => modal.remove());

    modal.querySelector('#shelf-submit-btn')?.addEventListener('click', async () => {
      const res = await apiPost('/api/cave/solve-shelf', { order: chosenOrder });
      if (res?.ok) {
        if (res.remark) setOperatorRemark(res.remark, { priority: 'urgent' });
        modal.remove();
        if (onEscape) onEscape();
      } else {
        const fb = modal.querySelector('#shelf-feedback');
        if (fb) fb.textContent = 'Ordem incorreta. A estante não se moveu.';
        if (res?.remark) setOperatorRemark(res.remark, { priority: 'action' });
      }
    });
  };

  renderInner();
  document.body.appendChild(modal);
}

export function launchStory(storyId, ctx) {
  const runner = STORY_RUNNERS[String(storyId)];
  if (!runner) return;

  const meta = BOOKS_META[`book_${storyId}`];
  ctx.clearTimers();
  const app = document.getElementById('app');
  if (!app) return;

  if (ctx.playBeep) ctx.playBeep();

  document.getElementById('story-portal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'story-portal-overlay';
  overlay.className = 'story-portal-overlay';

  const pages = Array.isArray(meta?.prologuePages) && meta.prologuePages.length > 0
    ? meta.prologuePages
    : [{ heading: 'Prólogo', text: meta?.prologue || '' }];
  let pageIdx = 0;
  let started = false;

  const renderPortalStep = () => {
    const curPage = pages[pageIdx];
    const isLast = pageIdx >= pages.length - 1;
    overlay.innerHTML = `
      <div class="story-portal-sub">${meta?.subtitle || 'Abrindo Livro'}</div>
      <img class="story-portal-book ${pageIdx > 0 ? 'opened' : ''}" id="portal-book-img" src="/cave/book_${storyId}_${pageIdx > 0 ? 'open' : 'closed'}.png" alt="" />
      <div class="story-portal-title">${meta?.title || ''}</div>
      <div class="story-portal-page-card">
        <div class="story-portal-page-hdr">
          <span>${curPage.heading || `Página ${pageIdx + 1}`}</span>
          <span>Pág. ${pageIdx + 1} / ${pages.length}</span>
        </div>
        <p class="story-portal-prologue">${curPage.text}</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center; margin-top:6px;">
        ${pageIdx > 0 ? `<button type="button" class="story-portal-enter-btn" id="portal-prev-btn" style="background:#18181b; border-color:#52525b; color:#d4d4d8;">← Página Anterior</button>` : ''}
        ${
          !isLast
            ? `<button type="button" class="story-portal-enter-btn" id="portal-next-btn">Virar Página (${pageIdx + 1}/${pages.length}) →</button>`
            : `<button type="button" class="story-portal-enter-btn" id="portal-open-btn">📖 Entrar na História</button>`
        }
      </div>
    `;

    overlay.querySelector('#portal-prev-btn')?.addEventListener('click', () => {
      if (ctx.playBeep) ctx.playBeep();
      pageIdx = Math.max(0, pageIdx - 1);
      renderPortalStep();
    });

    overlay.querySelector('#portal-next-btn')?.addEventListener('click', () => {
      if (ctx.playBeep) ctx.playBeep();
      pageIdx = Math.min(pages.length - 1, pageIdx + 1);
      renderPortalStep();
    });

    overlay.querySelector('#portal-open-btn')?.addEventListener('click', openAndEnter);
  };

  const openAndEnter = () => {
    if (started) return;
    started = true;
    overlay.querySelectorAll('button').forEach((b) => { b.style.visibility = 'hidden'; });

    const img = document.getElementById('portal-book-img');
    if (img) {
      img.src = `/cave/book_${storyId}_open.png`;
      img.classList.add('opened');
    }
    if (ctx.playBeep) ctx.playBeep();

    // Fica aberto brilhando e suga o jogador para dentro das páginas!
    setTimeout(() => {
      img?.classList.add('entering');
      runner({
        app,
        ...ctx,
        finishStory: async () => {
          const res = await ctx.apiPost('/api/cave/complete-story', { storyId: String(storyId) });
          const updatedCave = res?.caveState || ctx.caveState;
          ctx.returnToCave(updatedCave, { justEarnedBook: `book_${storyId}`, remark: res?.remark });
        },
      });
      overlay.classList.add('suck-in');
      setTimeout(() => overlay.remove(), 680);
    }, 850);
  };

  renderPortalStep();
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));
}
