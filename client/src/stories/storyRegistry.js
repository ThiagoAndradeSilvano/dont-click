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
    subtitle: 'Livro I // Guichê Sépia',
    themeClass: 'book-theme-sepia',
    summary: 'Você sobreviveu a 5 dias de auditoria, balanças, selos falsos, raios-X e subornos na portaria do submundo.',
    riddle: '"O bilhete do Dia 4 e o Raio-X do Dia 5 apontam para a mesma cidade. Um porta-voz gaguejou \'imediatamente\' numa coletiva em novembro. Pegue o ANO em que a fronteira dessa cidade caiu, subtraia o ANO em que foi erguida, e multiplique pela IDADE exata (em anos completos naquela noite) de quem pronunciou o erro."',
  },
  book_2: {
    id: 'book_2',
    storyId: '2',
    title: 'A Princesa de Plástico',
    subtitle: 'Livro II // Conto de Fadas',
    themeClass: 'book-theme-pink',
    summary: 'Você enfrentou um cavalo sindicalizado, entrevista de RH, dragão com rinite, elevador de serviço e entregou açaí para a princesa.',
    riddle: '"Esqueça a Disney. Na obra original francesa de 1697 achada no Ato 4 (La Belle au bois dormant), some os ANOS que a princesa dormiu com a IDADE exata do autor quando publicou o livro, e multiplique pelo número de fadas BOAS convidadas para o batizado."',
  },
  book_3: {
    id: 'book_3',
    storyId: '3',
    title: 'Corredor 0999 (P.T.)',
    subtitle: 'Livro III // Fita VHS',
    themeClass: 'book-theme-noir',
    summary: 'Você atravessou loops idênticos de um corredor em preto e branco procurando anomalias enquanto um rádio chiava clichês de terror.',
    riddle: '"O número do quarto proibido no hotel de Kubrick — não no livro de King, mas no filme."',
  },
  book_4: {
    id: 'book_4',
    storyId: '4',
    title: 'Naufrágio da Porta Gigante',
    subtitle: 'Livro IV // Gelo & Sonar',
    themeClass: 'book-theme-ice',
    summary: 'Você equilibrou uma porta onde claramente cabiam quatro pessoas no meio do Atlântico Norte congelante.',
    riddle: '"O navio \'inafundável\' que inspirou essa porta idiota partiu de Southampton e afundou em abril de qual ano?"',
  },
  book_5: {
    id: 'book_5',
    storyId: '5',
    title: 'Plantão da Floresta',
    subtitle: 'Livro V // Inquérito Sombrio',
    themeClass: 'book-theme-crimson',
    summary: 'Você interrogou uma avó suspeita, um lenhador enrolado e um lobo cínico até desmontar o álibi falso da cabana.',
    riddle: '"O mesmo autor de \'1984\' escreveu também uma sátira sobre porcos comandando uma fazenda. Em que ano esse livro foi publicado?"',
  },
  book_6: {
    id: 'book_6',
    storyId: '6',
    title: 'Terminal 1984',
    subtitle: 'Livro VI // CRT Fósforo',
    themeClass: 'book-theme-crt',
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

export function openBookReaderModal(bookId, caveState, { apiPost, setOperatorRemark, onSolved }) {
  const meta = BOOKS_META[bookId];
  if (!meta) return;

  document.getElementById('book-reader-modal')?.remove();
  const isSolved = Array.isArray(caveState.booksSolved) && caveState.booksSolved.includes(bookId);

  const modal = document.createElement('div');
  modal.id = 'book-reader-modal';
  modal.className = 'book-modal-backdrop';
  modal.innerHTML = `
    <div class="book-open-spread ${meta.themeClass}">
      <div class="book-page book-page-left">
        <div class="book-badge">${meta.subtitle}</div>
        <h2 class="book-title">${meta.title}</h2>
        <p class="book-summary">${meta.summary}</p>
        <div class="book-status ${isSolved ? 'solved' : 'pending'}">
          ${isSolved ? '✅ ENIGMA RESOLVIDO — PASSAGEM LIBERADA' : '🔒 ÚLTIMA PÁGINA BLOQUEADA'}
        </div>
      </div>
      <div class="book-page book-page-right">
        <div class="book-page-num">Última Página // Enigma</div>
        <blockquote class="book-riddle">${meta.riddle}</blockquote>
        ${
          isSolved
            ? `<div class="book-solved-box">Enigma já decifrado! Guarde este livro na mochila — você vai precisar da resposta dele na Estante Final.</div>`
            : `
              <div class="book-answer-row">
                <input type="text" id="book-riddle-input" class="book-input" placeholder="Digite a resposta..." autocomplete="off" />
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
      if (res?.remark) setOperatorRemark(res.remark, { priority: 'action' });
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
  overlay.innerHTML = `
    <div class="story-portal-sub">${meta?.subtitle || 'Abrindo Livro'}</div>
    <img class="story-portal-book" id="portal-book-img" src="/cave/book_${storyId}_closed.png" alt="" />
    <div class="story-portal-title">${meta?.title || ''}</div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('active'));

  // Troca a imagem do livro fechado -> aberto no meio da transição!
  setTimeout(() => {
    const img = document.getElementById('portal-book-img');
    if (img) img.src = `/cave/book_${storyId}_open.png`;
    if (ctx.playBeep) ctx.playBeep();
  }, 550);

  // Monta o conto por trás do overlay e dissolve suavemente para dentro da história
  setTimeout(() => {
    runner({
      app,
      ...ctx,
      finishStory: async () => {
        const res = await ctx.apiPost('/api/cave/complete-story', { storyId: String(storyId) });
        const updatedCave = res?.caveState || ctx.caveState;
        ctx.returnToCave(updatedCave, { justEarnedBook: `book_${storyId}`, remark: res?.remark });
      },
    });
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 620);
  }, 1350);
}
