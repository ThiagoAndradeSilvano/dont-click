# Conto 2 — Prompts dos 7 cenários (GPT imagem)

Os cenários entram **atrás** dos personagens no palco do Conto 2. O jogo já desenha por cima: as cortinas vermelhas laterais, o chão de tábua da ribalta, a plaquinha no topo-central, os botões dos objetos e o personagem. Por isso cada cenário é **só o fundo pintado**, sem gente e sem texto.

Como o palco é bem panorâmico (~2,5:1), o jogo **corta ~20% do topo e ~10% da base** da imagem. Tudo que importa fica na faixa do meio.

**Dica:** anexe junto o PNG de um dos personagens (ex.: `bardo_normal.png`) e diga "mesmo traço desse personagem" — o GPT copia o estilo muito melhor com referência.

Quando gerar, manda os 7 num zip com estes nomes: `tavern.png`, `stable.png`, `bridge.png`, `backstage.png`, `dragon.png`, `elevator.png`, `penthouse.png`. Eu recorto, converto pra `.webp` leve e coloco em `client/public/story2/scenes/`.

---

## 📌 Prompt base (cole primeiro, uma vez só)

> Vou te pedir 7 cenários de fundo pro mesmo jogo desses personagens (o Bardo, o Cavalo grevista, o Troll de RH, o Dragão asmático e a Princesa influencer). Mesmo estilo deles: cartoon com contorno de tinta preta grosso, pintura quente tipo guache gasto com textura de papel, cores saturadas mas um pouco envelhecidas, sombras chapadas, humor nos detalhes.
>
> O mundo é um **teatro mambembe de papelão e compensado**: tudo é cenário feito à mão e meio vagabundo — papelão pintado e recortado, bordas com fita crepe, pregos, barbante, ripas de madeira escorando as peças por trás, emendas, cantos amassados, tinta escorrida. Parece palco de escola caprichado por alguém sem orçamento nenhum.
>
> Regras pra **todos** os cenários:
> - Paisagem, 1536×1024.
> - Vista frontal, do jeito que a plateia vê o palco (perspectiva quase chapada, pouca profundidade).
> - **Sem** personagens, pessoas ou animais.
> - **Nenhum texto**, letra, número ou logo em lugar nenhum (placas e cartazes só com desenho/ícone, ou em branco).
> - Composição panorâmica: o topo (uns 20%) e a base (uns 10%) vão ser cortados. Tudo que importa fica na faixa do meio. O chão (tábua de palco, terra pintada, carpete…) ocupa a faixa de baixo, mais ou menos dos 72% da altura até o fim, liso e sem objeto grande, porque os personagens ficam em pé ali.
> - A área entre 25% e 60% da largura, na metade de baixo, fica **livre** (é onde o personagem fica). O topo-central fica sem detalhe forte (o jogo põe uma plaquinha ali).
> - **Não** desenhe cortina de palco nas laterais nem moldura (o jogo já desenha as cortinas por cima).
> - Luz de teatro: um foco quente vindo de cima no centro, laterais um pouco mais escuras.

---

## 1. `tavern.png` — Taverna & Açaiteria do Rei

> Cenário 1: uma taverna medieval de papelão que virou açaiteria. Ao fundo, um balcão de compensado com barris que claramente são tubos de papelão pintados; prateleiras com tigelas roxas de açaí, potes de granola e latas de leite em pó sem rótulo; um lustre de roda de carroça com velas de papel celofane amarelo; uma lareira de papelão com chamas de papel laranja penduradas em barbante; varal de bandeirinhas atravessando o fundo. À esquerda (entre 10% e 22% da largura) uma mesinha redonda baixa e vazia. À direita (de 65% a 95%) parede de tijolo pintado com um quadro-negro em branco pendurado torto (o jogo coloca a tabela de preços em cima dele). Paleta: vinho, magenta escuro, madeira quente e o roxo do açaí.

## 2. `stable.png` — Estábulo do Sindicato Equino

> Cenário 2: um estábulo de papelão em greve. Baias de compensado ao fundo, fardos de feno feitos de tiras de papel amarelo, ferraduras penduradas, um relógio de ponto de fábrica pregado na parede de madeira, uma faixa de greve em branco esticada entre duas vigas e cartazes de protesto em ripas com o desenho de uma ferradura e um punho erguido (sem nenhuma palavra). Um tambor de óleo com uma "fogueirinha" de papel celofane, tipo piquete. À direita (de 70% a 95%) uma cerca de madeira baixa com espaço livre na frente (o jogo pendura um alforje ali). Paleta: entardecer roxo, madeira marrom, amarelo do feno.

## 3. `bridge.png` — Ponte Levadiça de RH

> Cenário 3: uma ponte levadiça de castelo de papelão sobre um fosso de ondas de papel azul recortadas em camadas e presas em palitos, como em teatro. Ao fundo o portão do castelo — mas o castelo foi "corporatizado": bebedouro de escritório, vaso com planta de plástico, uma cadeira giratória de escritório e um quadro motivacional (só o desenho de uma montanha com seta subindo, sem texto) colados com fita crepe na muralha medieval. Tochas de papel dos dois lados. O meio da ponte fica livre (o Troll fica ali). Paleta: azul-noite, pedra cinza azulada, luz de tocha laranja.

## 4. `backstage.png` — Bastidores de Papelão & Câmara Escura

> Cenário 4: atrás do cenário do teatro. As costas dos painéis de papelão aparecem com ripas, sacos de areia, cordas e roldanas, uma escada de pintor manchada de tinta e uma arara de figurinos (coroas de papel, capas). O lado direito virou uma câmara escura improvisada: luz vermelha de revelação, bandejas de revelação numa bancada e um varal com fotos e negativos presos por pregadores — os negativos são quase totalmente pretos (no alto à direita, entre 70% e 92% da largura). À esquerda (entre 8% e 22%) uma bancada baixa livre. Paleta: vermelho de laboratório fotográfico, preto e papelão marrom; clima de mistério.

## 5. `dragon.png` — Covil do Dragão Asmático

> Cenário 5: uma caverna feita de papel kraft amassado e pedras de papelão, com um ninho de almofadas e um travesseiro gigante no chão do centro; pilhas de "tesouro" que são tampinhas de garrafa pintadas de dourado; umidificador de ar, caixas de lenço, inalador e frascos de xarope espalhados pelos cantos; o ar cheio de poeira em partículas visíveis atravessando um feixe de luz. No alto à esquerda (de 5% a 25% da largura, de 15% a 45% da altura) uma janelinha de castelo fechada com uma cortina de veludo velha e empoeirada. Paleta: vermelho-escuro, marrom quente, dourado das tampinhas e poeira bege.

## 6. `elevator.png` — Casa de Máquinas 220V

> Cenário 6: o porão técnico do teatro. Engrenagens gigantes de papelão nas paredes, canos pintados, fios elétricos presos com fita isolante, faixas de aviso amarelas e pretas (sem texto), uma lâmpada fluorescente meio solta presa com fita crepe. À direita (de 65% a 90%) a porta de um elevador antigo de grade pantográfica dourada, estilo art déco, com um leitor de crachá vazio do lado. A parte de baixo à esquerda (de 10% a 40%) fica lisa e livre (o jogo coloca o painel de disjuntores ali). Paleta: cinza-chumbo, preto, amarelo de aviso e o brilho dourado do elevador.

## 7. `penthouse.png` — Cobertura da Princesa Influencer

> Cenário 7: uma cobertura chique de papelão no topo da torre. Ao fundo um janelão com céu noturno de papel e silhuetas recortadas de outras torres e castelos com luzinhas; tapete de pelúcia rosa, um pufe de veludo vazio à direita (o livro aparece em cima dele), espelho de camarim com lâmpadas, balões metalizados (sem letras), um tripé de celular, sacolas de compras sem logo e um sofá rosa. À esquerda (entre 10% e 25%) espaço livre (o jogo coloca o ring light ali). Paleta: rosa-chiclete, dourado e roxo noturno, com luz branca suave de ring light.

---

### Se vier com texto ou personagem

Responda no mesmo chat: *"refaz igual, mas sem nenhum texto/letra e sem nenhum personagem"*. Se vier com cortina na lateral: *"tira as cortinas das laterais, o jogo já desenha"*.
