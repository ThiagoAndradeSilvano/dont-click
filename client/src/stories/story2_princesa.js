// CONTO 2: O CASTELO DA PRINCESA DE PLÁSTICO (Conto bobo e cínico zombando de contos de fadas!)
export function runStory2Princesa({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-2';

  let act = 0;
  let towerFloor = 1;
  let dragonAllergy = 100;

  const ACTS = [
    {
      title: 'ATO 1 — O ESTÁBULO SINDICALIZADO',
      scene: 'Você encontra o lendário Corcel Branco. Ele está de óculos escuros lendo um contrato.',
      log: 'olha que mágico: um cavalo branco esperando o herói. pena que ele acabou de pedir adicional de insalubridade.',
      choices: [
        {
          label: '🐴 Oferecer cenoura orgânica e vale-transporte',
          next: 1,
          remark: 'aceitou a cenoura. aparentemente até cavalo mágico trabalha por comissão agora.',
        },
        {
          label: '⚔️ Tentar montar à força gritando "AVANTE!"',
          stay: true,
          remark: 'o cavalo te deu um coice e abriu processo trabalhista. tenta negociar direito.',
        },
      ],
    },
    {
      title: 'ATO 2 — A PONTE DO TROLL DE RH',
      scene: 'Um Troll bloqueia a ponte levadiça com uma prancheta na mão: "Antes de salvar a princesa, me fale 3 defeitos seus que na verdade são qualidades."',
      log: 'eu não acredito que tem um processo seletivo na porra da ponte levadiça. responde qualquer baboseira corporativa pra ele.',
      choices: [
        {
          label: '💼 "Sou perfeccionista demais e trabalho duro até demais"',
          next: 2,
          remark: 'ele chorou emocionado e liberou a ponte. o mundo tá perdido.',
        },
        {
          label: '🥊 "Meu defeito é perder a paciência com troll idiota"',
          stay: true,
          remark: 'reprovado no fit cultural. fala a mentira padrão de entrevista logo.',
        },
      ],
    },
    {
      title: 'ATO 3 — O DRAGÃO COM RINITE ALÉRGICA',
      scene: 'O temível Dragão Vermelho está espirrando catarro de fogo por causa da poeira do castelo.',
      log: 'o terror dos sete reinos tá tendo crise de rinite. usa o spray nasal mágico nele em vez de bancar o espadachim.',
      isDragonAct: true,
    },
    {
      title: 'ATO 4 — A TRANÇA ERA EXTENSÃO ELÉTRICA',
      scene: 'Você chega na base da torre. A famosa "trança dourada" é um cabo de extensão de 220V e a torre tem um Elevador de Serviço travado no térreo.',
      log: 'subir pela trança ia te eletrocutar. aperta o botão do elevador de serviço até chegar no 4º andar.',
      isTowerAct: true,
    },
    {
      title: 'ATO 5 — A PRINCESA DE PLÁSTICO',
      scene: 'Você abre a porta do quarto todo rosa. A Princesa está no celular: "Demorou hein? O Wi-Fi aqui tá com 1 barra e eu pedi um açaí com granola faz 40 minutos."',
      log: 'tá aí o seu grande romance épico. ela só quer saber se vc trouxe o açaí e quanto é seu score no Serasa.',
      choices: [
        {
          label: '📱 "Toma esse livro e me deixa ir embora desse conto ridículo"',
          finish: true,
          remark: 'finalmente. nunca mais me faça ler nada com glitter na vida.',
        },
      ],
    },
  ];

  app.innerHTML = `
    <div class="story-shell">
      <button type="button" class="story-back-btn" id="s2-back">← Voltar para a Caverna</button>
      <div class="operator-feed story-log-pink">
        <span class="operator-tag">pergaminho</span>
        <span id="operator-msg"></span>
      </div>

      <div id="s2-card" style="background:#fff1f7; border:4px solid #db2777; border-radius:20px; padding:28px; box-shadow:0 10px 0 #be185d; text-align:center;">
      </div>
    </div>
  `;

  document.getElementById('s2-back')?.addEventListener('click', () => returnToCave(caveState));

  function renderAct() {
    const data = ACTS[act];
    const card = document.getElementById('s2-card');
    if (!card) return;

    setOperatorRemark(data.log, { priority: 'urgent' });

    if (data.isDragonAct) {
      card.innerHTML = `
        <h2 style="margin:0 0 12px; color:#9d174d;">✨ ${data.title}</h2>
        <p style="font-size:15px; line-height:1.5;">${data.scene}</p>
        <div style="margin:20px auto; max-width:360px; background:#fce7f3; border:2px solid #f472b6; border-radius:12px; padding:14px;">
          <div style="font-weight:bold; margin-bottom:8px;">🤧 Crise Alérgica do Dragão: ${dragonAllergy}%</div>
          <div style="height:18px; background:#fbcfe8; border-radius:9px; overflow:hidden;">
            <div style="height:100%; width:${dragonAllergy}%; background:#ec4899; transition:width 0.2s;"></div>
          </div>
        </div>
        <button type="button" id="s2-spray-btn" style="padding:14px 24px; background:#ec4899; color:#fff; border:3px solid #831843; border-radius:12px; font-family:inherit; font-weight:bold; font-size:15px; cursor:inherit;">💨 Aplicar Neosoro Mágico (-25%)</button>
      `;
      document.getElementById('s2-spray-btn')?.addEventListener('click', () => {
        playBeep();
        dragonAllergy = Math.max(0, dragonAllergy - 25);
        if (dragonAllergy <= 0) {
          act = 3;
        }
        renderAct();
      });
      return;
    }

    if (data.isTowerAct) {
      card.innerHTML = `
        <h2 style="margin:0 0 12px; color:#9d174d;">🏰 ${data.title}</h2>
        <p style="font-size:15px; line-height:1.5;">${data.scene}</p>
        <div style="font-size:26px; font-weight:bold; margin:20px 0; color:#be185d;">Andar Atual: ${towerFloor} / 4</div>
        <button type="button" id="s2-lift-btn" style="padding:14px 24px; background:#f472b6; color:#500724; border:3px solid #831843; border-radius:12px; font-family:inherit; font-weight:bold; font-size:15px; cursor:inherit;">🔼 Chamar Elevador de Serviço</button>
      `;
      document.getElementById('s2-lift-btn')?.addEventListener('click', () => {
        playBeep();
        towerFloor += 1;
        if (towerFloor >= 4) {
          act = 4;
        }
        renderAct();
      });
      return;
    }

    card.innerHTML = `
      <h2 style="margin:0 0 12px; color:#9d174d;">👑 ${data.title}</h2>
      <p style="font-size:15px; line-height:1.5; max-width:620px; margin:0 auto 22px;">${data.scene}</p>
      <div style="display:flex; flex-direction:column; gap:10px; max-width:480px; margin:0 auto;">
        ${data.choices
          .map(
            (c, i) =>
              `<button type="button" class="s2-choice" data-c="${i}" style="padding:12px 16px; background:#fbcfe8; color:#500724; border:2px solid #db2777; border-radius:10px; font-family:inherit; font-weight:bold; font-size:14px; cursor:inherit;">${c.label}</button>`
          )
          .join('')}
      </div>
    `;

    card.querySelectorAll('.s2-choice').forEach((btn) => {
      btn.addEventListener('click', async () => {
        playBeep();
        const choice = data.choices[Number(btn.getAttribute('data-c'))];
        if (choice.remark) setOperatorRemark(choice.remark, { priority: 'action' });
        if (choice.finish) {
          await finishStory();
          return;
        }
        if (typeof choice.next === 'number') {
          act = choice.next;
          renderAct();
        }
      });
    });
  }

  renderAct();
}
