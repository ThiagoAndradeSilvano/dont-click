// CONTO 2: O CASTELO DA PRINCESA DE PLÁSTICO (Versão Completa — 8 Atos, Mini-Inventário Próprio, Batalha de Rinite e Sátira Ácida!)
export function runStory2Princesa({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-2';

  let act = 1;
  let coins = 100;
  const bag = []; // 'cenoura', 'acai', 'neosoro', 'lenco', 'cracha_rh', 'bilhete_1697'
  let horsePatience = 100;
  let rhStep = 0;
  let dragonAllergy = 100;
  let dragonDust = 60;
  let towerFloor = 1;
  let liftCode = '';

  app.innerHTML = `
    <div class="story-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
      <button type="button" class="story-back-btn" id="s2-back">← Voltar para a Caverna</button>

      <div class="story-stage-area" style="display:flex; justify-content:space-between; align-items:center; background:#fdf2f8; border:3px solid #db2777; border-radius:14px; padding:10px 16px; font-size:13px; font-weight:bold; color:#831843;">
        <span id="s2-hud-act">ATO 1 / 8</span>
        <span id="s2-hud-coins">🪙 100 Moedas de Plástico</span>
        <span id="s2-hud-bag">🎒 Mochila: Vazia</span>
      </div>

      <div class="story-stage-area" id="s2-card" style="background:#fff1f7; border:4px solid #db2777; border-radius:20px; padding:26px; box-shadow:0 10px 0 #be185d; text-align:center;">
      </div>

      <div class="story-npc-feed story-log-pink">
        <span class="story-npc-tag">pergaminho</span>
        <span id="story-npc-msg">Era uma vez, num reino muito distante...</span>
      </div>
    </div>
  `;

  document.getElementById('s2-back')?.addEventListener('click', () => returnToCave(caveState));

  const bagLabels = {
    cenoura: '🥕 Cenoura',
    acai: '🥣 Açaí',
    neosoro: '💨 Neosoro',
    lenco: '🧻 Lenço',
    cracha_rh: '🪪 Fit Cultural',
    bilhete_1697: '📜 Nota 1697',
  };

  function updateHUD() {
    document.getElementById('s2-hud-act').textContent = `ATO ${act} / 8`;
    document.getElementById('s2-hud-coins').textContent = `🪙 ${coins} Moedas`;
    document.getElementById('s2-hud-bag').textContent =
      bag.length > 0 ? `🎒 ${bag.map((b) => bagLabels[b] || b).join(' | ')}` : '🎒 Mochila: Vazia';
  }

  function renderAct() {
    updateHUD();
    const card = document.getElementById('s2-card');
    if (!card) return;

    // ATO 1: TAVERNA DO ARAUTO CLICHÊ
    if (act === 1) {
      setOperatorRemark(
        'olha que mágico: uma taverna medieval com cupom de iFood e bardo vendendo régua de plástico como espada lendária.',
        { delayBefore: 150, priority: 'urgent' }
      );
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">🍺 ATO 1 — A TAVERNA DO ARAUTO CLICHÊ</h2>
        <p style="font-size:14px; line-height:1.55; max-width:640px; margin:0 auto 18px;">
          O Arauto do Reino bate na mesa: <em>"Bravíssimo cavaleiro! Para resgatar a Princesa, compre minha Espada Lendária por 500 moedas — ou leve itens úteis de verdade na lojinha ao lado."</em>
        </p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:18px;">
          <button type="button" id="s2-buy-sword" style="padding:10px 14px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; cursor:inherit;">🗡️ Espada Lendária (500 🪙)</button>
          <button type="button" id="s2-buy-carrot" style="padding:10px 14px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; cursor:inherit;" ${bag.includes('cenoura') ? 'disabled' : ''}>🥕 Cenoura Orgânica (20 🪙)</button>
          <button type="button" id="s2-buy-acai" style="padding:10px 14px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; cursor:inherit;" ${bag.includes('acai') ? 'disabled' : ''}>🥣 Açaí c/ Granola (35 🪙)</button>
        </div>
        <button type="button" id="s2-next-1" style="padding:12px 24px; background:#ec4899; color:#fff; border:3px solid #831843; border-radius:12px; font-family:inherit; font-weight:bold; cursor:inherit;">Sair da Taverna ➡️</button>
      `;
      document.getElementById('s2-buy-sword')?.addEventListener('click', () => {
        playBeep();
        setOperatorRemark('vc não tem 500 moedas e isso é literalmente uma régua da Faber-Castell pintada de prata.', { priority: 'action' });
      });
      document.getElementById('s2-buy-carrot')?.addEventListener('click', () => {
        playBeep();
        if (coins >= 20 && !bag.includes('cenoura')) {
          coins -= 20;
          bag.push('cenoura');
          setOperatorRemark('comprou uma cenoura superfaturada. vai ser útil pro cavalo sindicalizado ali fora.', { priority: 'action' });
          renderAct();
        }
      });
      document.getElementById('s2-buy-acai')?.addEventListener('click', () => {
        playBeep();
        if (coins >= 35 && !bag.includes('acai')) {
          coins -= 35;
          bag.push('acai');
          setOperatorRemark('um cavaleiro medieval carregando açaí com granola na mochila. literatura pura.', { priority: 'action' });
          renderAct();
        }
      });
      document.getElementById('s2-next-1')?.addEventListener('click', () => {
        playBeep();
        if (!bag.includes('cenoura') || !bag.includes('acai')) {
          setOperatorRemark('compra a cenoura e o açaí antes de sair, não seja pão-duro com dinheiro de mentira.', { priority: 'action' });
          return;
        }
        act = 2;
        renderAct();
      });
      return;
    }

    // ATO 2: ESTÁBULO SINDICALIZADO
    if (act === 2) {
      setOperatorRemark('o corcel branco tá de óculos escuros e exigindo hora extra. negocia com ele sem perder a linha.', { priority: 'urgent' });
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">🐴 ATO 2 — O ESTÁBULO SINDICALIZADO</h2>
        <p style="font-size:14px; line-height:1.55; max-width:620px; margin:0 auto 16px;">
          O Corcel Branco bate o casco no chão: <em>"Escuta aqui, ô herói. Eu só galopo até o castelo se tiver vale-alimentação orgânico e 15 minutos de pausa a cada légua."</em>
        </p>
        <div style="margin-bottom:14px; font-weight:bold;">Paciência Sindical do Cavalo: ${horsePatience}%</div>
        <div style="display:flex; flex-direction:column; gap:10px; max-width:460px; margin:0 auto;">
          <button type="button" id="s2-h-carrot" style="padding:12px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; font-weight:bold; cursor:inherit;">🥕 Entregar Cenoura Orgânica + Assinar Adicional Noturno</button>
          <button type="button" id="s2-h-force" style="padding:12px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; cursor:inherit;">⚔️ Gritar "AVANTE, PÉ DE PANO!" e tentar pular na sela</button>
        </div>
      `;
      document.getElementById('s2-h-carrot')?.addEventListener('click', () => {
        playBeep();
        setOperatorRemark('o cavalo assinou o termo de compromisso e te deu carona. sindicato equino funcionando melhor que o servidor.', { priority: 'action' });
        act = 3;
        renderAct();
      });
      document.getElementById('s2-h-force')?.addEventListener('click', () => {
        playBeep();
        horsePatience = Math.max(0, horsePatience - 35);
        setOperatorRemark('tomou um coice no peito e uma notificação extrajudicial. entrega a cenoura logo.', { priority: 'urgent' });
        if (horsePatience <= 0) horsePatience = 100;
        renderAct();
      });
      return;
    }

    // ATO 3: PONTE DO TROLL DE RH (3 Perguntas!)
    if (act === 3) {
      const QUESTIONS = [
        {
          q: '"Pergunta 1/3: Onde você se vê daqui a 5 anos salvando princesas?"',
          opts: [
            { t: '"Crescendo junto com a família real e vestindo a camisa do castelo"', ok: true },
            { t: '"Aposentado bem longe dessa torre brega"', ok: false },
          ],
        },
        {
          q: '"Pergunta 2/3: Cite um defeito seu que na verdade é uma qualidade."',
          opts: [
            { t: '"Sou perfeccionista demais e trabalho duro até no fim de semana"', ok: true },
            { t: '"Eu odeio acordar cedo e não suporto gente chata"', ok: false },
          ],
        },
        {
          q: '"Pergunta 3/3: A vaga paga em visibilidade e experiência. Topa?"',
          opts: [
            { t: '"Com certeza! O propósito vale mais que o salário!"', ok: true },
            { t: '"Vai tomar no cu com visibilidade"', ok: false },
          ],
        },
      ];
      const cur = QUESTIONS[rhStep];
      if (rhStep === 0) {
        setOperatorRemark('processo seletivo na ponte levadiça. responde a mentira padrão corporativa pra esse troll liberar logo.', { priority: 'urgent' });
      }
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">💼 ATO 3 — A PONTE DO TROLL DE RH</h2>
        <p style="font-size:15px; line-height:1.5; max-width:600px; margin:0 auto 20px;">${cur.q}</p>
        <div style="display:flex; flex-direction:column; gap:10px; max-width:480px; margin:0 auto;">
          ${cur.opts.map((o, i) => `<button type="button" class="s2-rh-opt" data-ok="${o.ok}" style="padding:12px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; font-weight:bold; cursor:inherit;">${o.t}</button>`).join('')}
        </div>
      `;
      card.querySelectorAll('.s2-rh-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          playBeep();
          if (btn.getAttribute('data-ok') === 'true') {
            rhStep += 1;
            if (rhStep >= QUESTIONS.length) {
              bag.push('cracha_rh');
              setOperatorRemark('aprovado no fit cultural! ganhou até crachá de papel. continua.', { priority: 'action' });
              act = 4;
            }
          } else {
            rhStep = 0;
            setOperatorRemark('reprovado na dinâmica de grupo. volta pra pergunta 1 e mente direito.', { priority: 'urgent' });
          }
          renderAct();
        });
      });
      return;
    }

    // ATO 4: LABIRINTO DE PAPELÃO + PISTA DO ENIGMA 2 (1697 / Perrault)
    if (act === 4) {
      setOperatorRemark('um labirinto inteiro feito de caixa de papelão pintada com giz de cera. vasculha as caixas aí antes de passar.', { priority: 'urgent' });
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">📦 ATO 4 — O LABIRINTO DE PAPELÃO</h2>
        <p style="font-size:14px; line-height:1.5; max-width:640px; margin:0 auto 18px;">
          As "muralhas impenetráveis" balançam com o vento. Há uma caixa de farmácia caída, uma prancheta de roteiro rasgada e a porta dos fundos.
        </p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:18px;">
          <button type="button" id="s2-box-meds" style="padding:12px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; cursor:inherit;">💊 Vasculhar Caixa de Farmácia</button>
          <button type="button" id="s2-box-script" style="padding:12px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; cursor:inherit;">📜 Ler Roteiro Rasgado no Chão</button>
        </div>
        <div id="s2-maze-note" style="background:#fce7f3; border:2px dashed #db2777; padding:12px; margin-bottom:16px; font-size:13px; min-height:44px;">
          ${bag.includes('bilhete_1697') ? '📜 Nota guardada: "La Belle au bois dormant (1697) — Contos da Mamãe Gansa."' : 'Vasculhe o cenário antes de avançar.'}
        </div>
        <button type="button" id="s2-next-4" style="padding:12px 24px; background:#ec4899; color:#fff; border:3px solid #831843; border-radius:12px; font-family:inherit; font-weight:bold; cursor:inherit;">Entrar no Salão do Dragão ➡️</button>
      `;
      document.getElementById('s2-box-meds')?.addEventListener('click', () => {
        playBeep();
        if (!bag.includes('neosoro')) bag.push('neosoro');
        if (!bag.includes('lenco')) bag.push('lenco');
        setOperatorRemark('achou Neosoro e lenço umedecido. vai precisar pro temível dragão ali na frente.', { priority: 'action' });
        renderAct();
      });
      document.getElementById('s2-box-script')?.addEventListener('click', () => {
        playBeep();
        if (!bag.includes('bilhete_1697')) bag.push('bilhete_1697');
        setOperatorRemark('um pedaço de papel falando de uma edição francesa de 1697... anota isso pro livro no final.', { priority: 'action' });
        renderAct();
      });
      document.getElementById('s2-next-4')?.addEventListener('click', () => {
        playBeep();
        if (!bag.includes('neosoro') || !bag.includes('bilhete_1697')) {
          setOperatorRemark('olha a caixa de farmácia e o roteiro rasgado primeiro antes de sair correndo.', { priority: 'action' });
          return;
        }
        act = 5;
        renderAct();
      });
      return;
    }

    // ATO 5: O DRAGÃO COM RINITE ALÉRGICA (Batalha tática absurda!)
    if (act === 5) {
      setOperatorRemark('o terror dos sete reinos tá tendo crise de rinite. limpa a poeira antes de aplicar o Neosoro senão não faz efeito!', { priority: 'urgent' });
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">🐉 ATO 5 — O DRAGÃO ASMÁTICO</h2>
        <p style="font-size:14px;">O dragão solta um espirro de faísca! Poeira no salão: <strong>${dragonDust}%</strong> | Crise Alérgica: <strong>${dragonAllergy}%</strong></p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:18px;">
          <button type="button" id="s2-wipe" style="padding:12px 16px; background:#fbcfe8; border:2px solid #db2777; border-radius:10px; font-family:inherit; font-weight:bold; cursor:inherit;">🧻 Passar Lenço na Poeira (-30% Poeira)</button>
          <button type="button" id="s2-spray" style="padding:12px 16px; background:#ec4899; color:#fff; border:2px solid #831843; border-radius:10px; font-family:inherit; font-weight:bold; cursor:inherit;">💨 Aplicar Neosoro Mágico</button>
          <button type="button" id="s2-hit" style="padding:12px 16px; background:#f472b6; border:2px solid #831843; border-radius:10px; font-family:inherit; cursor:inherit;">📏 Bater com Régua de Plástico</button>
        </div>
      `;
      document.getElementById('s2-wipe')?.addEventListener('click', () => {
        playBeep();
        dragonDust = Math.max(0, dragonDust - 30);
        renderAct();
      });
      document.getElementById('s2-spray')?.addEventListener('click', () => {
        playBeep();
        if (dragonDust > 30) {
          setOperatorRemark('muita poeira ainda no ar! limpa com o lenço primeiro senão o dragão espirra tudo de volta.', { priority: 'action' });
          return;
        }
        dragonAllergy = Math.max(0, dragonAllergy - 50);
        if (dragonAllergy <= 0) {
          setOperatorRemark('o dragão desmaiou de sono e alívio nasal. vitória épica.', { priority: 'action' });
          act = 6;
        }
        renderAct();
      });
      document.getElementById('s2-hit')?.addEventListener('click', () => {
        playBeep();
        dragonAllergy = Math.min(100, dragonAllergy + 20);
        setOperatorRemark('parabéns, irritou o bicho e levantou mais poeira.', { priority: 'urgent' });
        renderAct();
      });
      return;
    }

    // ATO 6: EXTENSÃO ELÉTRICA & ELEVADOR DE SERVIÇO (Código 0404)
    if (act === 6) {
      setOperatorRemark('a trança dourada é uma extensão elétrica de 220V ligada numa airfryer. usa o elevador de serviço ali no canto.', { priority: 'urgent' });
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">🔌 ATO 6 — ELEVADOR DE SERVIÇO DA TORRE</h2>
        <p style="font-size:14px; max-width:600px; margin:0 auto 14px;">
          Um adesivo torto no elevador diz: <em>"Senha de manutenção: Andar da Princesa (4) com o famoso erro da internet (404) -> digite <strong>0404</strong>."</em>
        </p>
        <div style="font-size:20px; font-weight:bold; margin-bottom:12px;">Andar: ${towerFloor}/4 | Senha: ${liftCode || '____'}</div>
        <div style="display:flex; gap:8px; justify-content:center; margin-bottom:14px;">
          <input type="text" id="s2-lift-input" maxlength="4" placeholder="0404" style="padding:10px; border:2px solid #db2777; border-radius:8px; width:120px; text-align:center; font-family:monospace; font-size:16px;" />
          <button type="button" id="s2-lift-go" style="padding:10px 18px; background:#ec4899; color:#fff; border:2px solid #831843; border-radius:8px; font-family:inherit; font-weight:bold; cursor:inherit;">Subir</button>
        </div>
      `;
      document.getElementById('s2-lift-go')?.addEventListener('click', () => {
        playBeep();
        const val = (document.getElementById('s2-lift-input')?.value || '').trim();
        if (val === '0404') {
          towerFloor = 4;
          act = 7;
          renderAct();
        } else {
          setOperatorRemark('código errado. tá escrito literalmente 0404 no adesivo.', { priority: 'action' });
        }
      });
      return;
    }

    // ATO 7: PORTARIA DO DELIVERY
    if (act === 7) {
      setOperatorRemark('última barreira antes da princesa: o porteiro barrando qualquer um que não trouxe o açaí dela.', { priority: 'urgent' });
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">🛵 ATO 7 — PORTARIA DO QUARTO REAL</h2>
        <p style="font-size:14px; max-width:600px; margin:0 auto 18px;">
          O Guarda Real bloqueia a porta rosa: <em>"Sem o Açaí com Granola, sem audiência com Sua Alteza."</em>
        </p>
        <button type="button" id="s2-give-acai" style="padding:14px 24px; background:#ec4899; color:#fff; border:3px solid #831843; border-radius:12px; font-family:inherit; font-weight:bold; cursor:inherit;">🥣 Entregar Açaí com Granola + Mostrar Crachá de RH</button>
      `;
      document.getElementById('s2-give-acai')?.addEventListener('click', () => {
        playBeep();
        act = 8;
        renderAct();
      });
      return;
    }

    // ATO 8: A PRINCESA DE PLÁSTICO
    if (act === 8) {
      setOperatorRemark('tá aí o seu grande romance épico. ela só quer saber do Wi-Fi e se vc tem nome limpo no Serasa.', { priority: 'urgent' });
      card.innerHTML = `
        <h2 style="margin:0 0 10px; color:#9d174d;">👑 ATO 8 — A PRINCESA DE PLÁSTICO</h2>
        <p style="font-size:15px; line-height:1.55; max-width:620px; margin:0 auto 20px;">
          A Princesa nem tira os olhos do celular: <em>"Ah, oi. Demorou hein? Olha, não vou casar contigo porque meu signo não bate com CLT, mas toma esse livro cafona aqui e fecha a porta quando sair."</em>
        </p>
        <button type="button" id="s2-finish" style="padding:14px 26px; background:#db2777; color:#fff; border:3px solid #500724; border-radius:12px; font-family:inherit; font-weight:bold; font-size:15px; cursor:inherit;">📕 Pegar Livro II e Cair Fora</button>
      `;
      document.getElementById('s2-finish')?.addEventListener('click', async () => {
        playBeep();
        setOperatorRemark('finalmente acabou essa tortura cor-de-rosa. abre o livro na mochila e vê a última página.', { priority: 'urgent' });
        await finishStory();
      });
    }
  }

  renderAct();
}
