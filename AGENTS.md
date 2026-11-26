# 🧠 AGENTS.md — Documento Mestre de Contexto e Sincronização entre Agentes

> **ATENÇÃO AGENTE (EM QUALQUER MÁQUINA):**
> Este projeto (`dont-click` / domínio oficial **`naoclique.net`**) é desenvolvido pelo Thiago alternando entre **duas máquinas diferentes** via GitHub (`origin/main`).
> **SEMPRE** leia este arquivo inteiro ao iniciar uma sessão, **SEMPRE** mantenha este `AGENTS.md` atualizado quando criar novos capítulos/mecânicas/decisões de lore, e **SEMPRE** faça commit + `git push origin main` ao concluir entregas para que o agente da outra máquina receba 100% do contexto no `git pull`!

---

## 1. Visão Geral & Filosofia Criativa do Jogo

- **Nome do Projeto:** Don't Click / **Domínio Oficial Registrado (Cloudflare):** `naoclique.net`
- **Idioma do Jogo:** 100% Português Brasileiro (`pt-BR`).
- **Gênero / Referências:** Meta-jogo psicológico, ARG e quebra da quarta parede, misturando:
  - *Don't Believe His Lies* (enigmas obscuros, pistas nas entrelinhas, observação humana);
  - *There Is No Game* (interface viva que briga com o jogador, falsos sistemas, humor ácido);
  - *Clicker Games* (usado de forma **irônica como distração/armadilha**, nunca como o verdadeiro objetivo final).
- **Diretrizes Inegociáveis de Design (Alinhadas com o Criador):**
  1. **Zero cara de IA nos textos:** O personagem NUNCA fala como roteiro engomadinho de IA (evitar pontuação formal perfeita, metáforas robóticas ou textões expositivos). Ele escreve como uma pessoa real digitando num teclado: minúsculas naturais (`mano`, `vc`, `pq`, `pô`, `namoral`, `pqp`), gírias brasileiras orgânicas, pausas reais pensando, errinhos apagados no *Backspace* ao vivo e rajadas curtas quando está nervoso.
  2. **Psicologia Reversa & Sistema Onisciente:** Evitar padrões matemáticos óbvios/previsíveis. Tudo o que o jogador tentar fazer por instinto (`Ctrl+A`, `F12`, botão direito, trocar de aba, ficar parado sem fazer nada, chutar URL `/admin`, abrir outro dispositivo pra contar cliques) deve parecer que já foi previsto pelo sistema.
  3. **Enigmas Anti-IA (Pensamento Humano):** Os puzzles nunca devem ser resolvíveis apenas tirando um print estático e jogando num LLM. Usar movimento em tempo real (ex: código Morse na luz, física de água/vapor/ralo), duplo sentido físico (ex: quebrar a lâmpada para tirar reflexo sem cortar energia), cruzamento de elementos visuais e raciocínio humano.
  4. **Mutação Visual Constante:** O jogo muda completamente de cara e mecânica conforme você fura as camadas:
     - HTML anos 90 cru → Falso Erro Nativo do Navegador → Brinquedo Infantil → Clicker Burocrático/Creche → Incêndio/Derretimento → Janela Windows 98 Porca → Subsolo 2D em Canvas (Física/Vapor/Morse) → Caverna Pixel Art com `WASD` + Tocha + Eco → *(futuras camadas: 2.5D/3D leve, sistemas realistas, notícias/recibos externos, etc.)*.
  5. **Construção Iterativa sem Porcentagem Fixa:** O jogo será longo e construído capítulo por capítulo, testando juntos e refinando timing, humor e dificuldade.

---

## 2. A Lore Oculta & Quem Está por Trás (CONFIDENCIAL — Sem Spoiler Precoce!)

- **A Verdade Oculta (Fio Invisível para o Plot Twist Final):**
  - Quem opera o outro lado era um **cientista/engenheiro brilhante** (personalidade inspirada em **Rick Sanchez**: gênio absurdo, arrogante, sarcástico, cuzão quando irritado, debochado quando relaxado, mas extremamente inteligente).
  - Ele foi cobaia de um experimento para mapear/clonar um cérebro humano dentro de uma arquitetura computacional/IA e **acabou preso dentro desse servidor (`naoclique.net`)**.
  - Ele está amargurado consigo mesmo e só queria passar a "eternidade" em paz e silêncio absoluto. Por isso transformou a entrada do domínio em telas quebradas, entediantes e infantis para fazer qualquer curioso fechar a aba em 1 minuto.
- **REGRA CRÍTICA DE NARRATIVA ATUAL:**
  - **NADA disso deve ser revelado ou dado na cara nos capítulos iniciais/atuais!**
  - Por enquanto, o jogador acredita 100% que ele é apenas um dev/operador humano real, rabugento e cuzão, dono do servidor.
  - Porém, no **Capítulo 8 (A Caverna)**, acontece a primeira rachadura no controle dele: o chão do Subsolo cede e vocês caem numa mina em pixel art que **NEM ELE PROGRAMOU E NEM ELE ENTENDE DE ONDE VEIO** (pista sutil de que há camadas mais antigas/profundas na mente/servidor onde ele está preso!).

---

## 3. Comunicação Visual pelos Cursores & Som de Digitação

- **Cursores Personalizados (`client/public/cursors/`):**
  - Na Página 1 (Botão Inicial) e nas telas de erro do navegador, usa-se o **cursor padrão do sistema** para manter o disfarce.
  - A partir do Clicker, o ponteiro padrão do jogador vira a **Mãozinha Azul (`user-blue.png`)**.
  - Quando o Operador já está acordado/presente, ele "conversa" e reage através do próprio ponteiro do jogador em hovers e ações usando as **Mãos Vermelhas**:
    - `op-point.png` (👆 Apontando)
    - `op-stop.png` (✋ Mão aberta / Pare / Bloqueado)
    - `op-middle.png` (🖕 Dedo do meio — quando você cai num golpe, dá `Ctrl+A`, botão direito, cutuca o sol, erra feio, etc.)
    - `op-thumb.png` (👍 Joinha sarcástico)
    - `op-chill.png` (🤙 Hang Loose — quando você fica ocioso por 9s)
    - `op-hd.png` (✨ Versão 3D lisa reservada para mutações gráficas futuras; também usada base pro `favicon.png`)
- **Áudio Sintetizado (`Web Audio API` — zero dependência externa):**
  - Toda letra digitada pelo Operador na tela emite som mecânico de digitação (`playOperatorTypeKey`).
  - **Efeito de Eco na Caverna:** Quando `currentStage` é `cave_2d` ou `cave_escaped`, o som de digitação dele passa automaticamente por uma cadeia de `DelayNode + BiquadFilter lowpass + Feedback Gain` (`ensureCaveEchoChain`), criando eco cavernoso real!
- **Fila Inteligente de Mensagens (`setOperatorRemark` + `remarkQueue`):**
  - Possui prioridades `'urgent'` (corta na hora em emergências), `'action'` (entra na fila para responder ações do jogador sem engolir falas) e `'ambient'` (ignorada se já estiver falando ou em cooldown, evitando spam ao clicar rápido).

---

## 4. Mapa Completo do Que Já Está Implementado (Páginas 1 a 8)

Toda a lógica sensível e senhas ficam no `server/src/index.js` para impedir trapaça via `F12`.

### Página 1 — Botão Inicial + Detector Psicológico de Contagem (`stage: 'button'`)
- Tela branca crua com o botão anos 90 escrito `Botão`.
- **1ª queda:** Dá falso erro nativo idêntico ao Chrome/Edge/Firefox (`ERR_CONNECTION_RESET`) no **9º clique** (`firstCrashClicks = 9`).
- **Easter Egg / Armadilha de Contagem (`detectDeliberateCounting`):**
  - Preparação para uma pergunta futura de 1 chance só (*"Quantos cliques você deu antes do primeiro erro?"*).
  - Se qualquer pessoa abrir o jogo do zero (mesmo em outro celular/4G) e clicar nos 9 cliques com **cadência rítmica de quem está contando** (`340ms–1850ms` de média e coeficiente de variação `<= 0.23`), a página cai no 9º clique normalmente (entregando a resposta `9`), mas exibe o erro especial `ERR_CONTANDO_NO_DEDINHO_9` zoando que a pessoa abriu outro aparelho só pra contar!
- **2ª queda:** Após recarregar (F5 ou botão Recarregar), cai no **5º clique**.

### Página 2 — Teste de Aptidão Cognitiva: Bloquinhos de Criança (`stage: 'shape_test'`)
- Ao recarregar após o 2º erro, abre uma tábua infantil de madeira (Quadrado, Círculo, Triângulo).
- Ao encaixar os 3 e clicar em *Acessar Painel Principal*, dispara a **3ª queda (`post_shapes_crash`)**.

### Página 3 — O Fake Game de ~20 Minutos (`stage: 'mundane_clicker'`)
- Ao recarregar após os bloquinhos, abre um Clicker 100% **mudo** (sem Operador falando ainda) projetado para durar ~20 minutos reais e fazer o jogador acreditar que esse é o jogo inteiro:
  - **Aba `⚙️ Automação` (6 geradores repetíveis estilo Cookie Clicker, custo +16% por compra):**
    1. *Dedo Indicador Terceirizado* (`0.5/s`)
    2. *Pombo Treinado com Milho* (`2.5/s`)
    3. *Ventilador Amarrado no Mouse* (`11/s`)
    4. *Sobrinho que Mexe com PC* (`42/s`)
    5. *Planilha do Excel com Macro Travada* (`150/s`)
    6. *Lan House Abandonada de 2007* (`520/s`)
  - **Aba `🛠️ Melhorias` (16 upgrades idiotas de app):**
    - Inclui som xoxo, barra que trava em `99%` e zera, **Tema Colorido** (papel de parede infantil no Paint + solzinho torto + Comic Sans), **Conformidade de Cookies** (bloqueia cliques na tela com alerta e buzzer até aceitar, e reaparece a cada 45s!), **Barra de Pesquisa**, **Multiplicador x2 com tarifa**, **Widget de Clima (`23°C` + relógio)**, **Conquistas inúteis**, **Contrato v4.2** (com receita de bolo e botão *Li e Concordo* que foge 1x) e boosts.
  - **Eventos Aleatórios na tela a cada ~38s:** Mosca voando (`🪰`), Pesquisa de Qualidade (opções `10` e `10 Com Certeza`) e Caixa Misteriosa Rara (que dá só `+1 ponto`).

### Página 4 — O Despertar na Tela de Erro (`stage: 'awakening_error'`)
- Quando faltam exatamente os **3 últimos upgrades**, comprar o **13º upgrade (`Backup em Nuvem Oficial` — 175.000 pts)** derruba a página!
- Nessa tela de erro (`ERR_BACKUP_O_CARALHO`), o Operador **fala pela 1ª vez** (com digitação humana, pausas e backspace), esculachando os pombos/ventilador e mandando recarregar pra comprar logo os 3 últimos upgrades e sumir dali.

### Página 5 — Clicker Final + Enigma da Temperatura & Incêndio (`stage: 'awakened_clicker'`)
- Volta ao Clicker agora com o `log` do Operador vivo no topo e cursores vermelhos ativos.
- Ao comprar os 3 últimos (`Rádio Sala de Espera`, `Overclock x3`, `Troféu Botão Dourado 100%`), fechando **16/16**, ele manda o jogador fechar a aba e meter o pé.
- **Como quebrar a fachada (Enigma 1):**
  - Se continuar clicando após 16/16, após bastante insistência ele solta referências bem sutis a ar/clima/calor.
  - O texto `🌦️ Ambiente Interno: 23°C` possui um hitbox invisível (`#temp-hitbox`, sem sublinhado para não entregar de graça). Ao clicar, `23` vira um `<input>` numérico de `0` a `99` (sem números negativos).
  - Colocar **`>= 80°C` (ex: `99`)** quebra o relógio (`88:88:ERR`), trava o termostato, desafina a rádio de elevador, derrete/entorta os painéis com fogo e brasas subindo, e o Operador grita em rajadas curtas mandando digitar **`subsolo`** na Barra de Pesquisa!
  - **Fallback de Inatividade no Fogo:** Se o jogador ficar parado e NÃO digitar `subsolo`, em 13s ele cobra e em 26s **ele mesmo digita `subsolo` sozinho letra por letra** na busca e puxa o jogador à força!

### Página 6 — Loading Porco Windows 98 + Chat Interativo (`stage: 'shitty_loading'`)
- Janela `carregando_subsolo_2d_final_agoravai(copia).exe` com roda torta girando a 4 FPS, barra que volta 4% pra trás e para em `69%`, dicas idiotas e **2 rodadas de diálogo com escolhas** (com cobrança se ficar inativo e pausa de 4.2s no fim para leitura confortável).

### Página 7 — O Subsolo / Porão 2D (`stage: 'subsolo_2d'`)
- Renderizado em `<canvas>` 2D detalhado (tijolos sombreados, manchas de umidade, 3 canos verticais, manômetro, válvula vermelha, torneira alinhada diretamente sobre o ralo gradeado, placa metálica de manutenção e lâmpada industrial balançando no teto).
- **Comportamento do Operador (Ele está LÁ EM CIMA):**
  - O Operador está no andar de cima desesperado com extintor, fumaça preta e peças queimadas do servidor.
  - Ele **NÃO enxerga o que o jogador faz no porão**! As mensagens dele no feed de log são transmissões periódicas dele tossindo com o extintor, resmungando que a fonte e a placa-mãe derreteram, tentando achar conectores e rezando pro jogador ficar quieto lá embaixo.
- **Enigma do Porão (validado em `/api/subsolo/unlock`):**
  1. **Lâmpada em Código Morse (Inquebrável):** Pisca ciclicamente `--...` (`7`), `....-` (`4`), `..---` (`2`) → **`742`**. A lâmpada **NÃO pode ser quebrada** para que o jogador sempre consiga ler o Morse sem cair em armadilhas irreversíveis.
  2. **Placa de Manutenção na Parede:** Em vez de espelho/vapor confuso, há uma placa metálica parafusada na parede com instruções claras:
     `CÓDIGO DE ACESSO:`
     `SENHA = SINAL - 42`
     `(Consulte a lâmpada em código Morse)`
  3. **Cálculo Direto:** O sinal é `742`. A conta simples é: `742 - 42` = **`700`**.
  4. **Torneira e Ralo Alinhados:** Ao abrir a válvula vermelha, as gotas caem **direto dentro do ralo** no piso com respingos d'água.
- **Transição:** Ao digitar `700` no teclado do painel, a estrutura sofre pane (`ERRO ESTRUTURAL!!`), o Operador grita lá de cima surpreso com o estrondo (`"QUE PORRA DE ESTRONDO FOI ESSE AÍ EMBAIXO?! O QUE VC TÁ APRONTANDO?! ESPERA, O PISO TÁ AFUNDANDO—"`), toca o estrondo grave (`playCollapseRumble`) e o chão do porão **despenca em queda livre pra Caverna**!

### Página 8 — A Caverna Profunda (`stage: 'cave_2d'` -> `'cave_escaped'`)
- Adaptação completa em JS + `WASD` de mina subterrânea 4x12 segmentos (`client/public/cave/*` com 38 assets locais).
- O Operador fica genuinamente chocado porque **não programou essa caverna**, e o som de digitação dele ganha **eco acústico**.
- **Mecânicas ativas:** Controle por **`WASD` / Setas** (incluindo elevadores verticais nos segmentos `[1,5]`, `[1,11]`, `[2,2]`, `[2,8]`, `[3,9]`), tecla **`E` ou Clique** para interagir, círculo de luz da tocha (`clip-path`), mochila lateral de inventário, **Picareta** → **Rocha** → **Detonador** (explode feixe do andar 3), **Tábua** → **Abismo**, **3 Notas com numerais Maias** (`7-6-3`, aceita `763` ou `794`) → **Cadeado Dourado**, **Manivela** → **Cachoeira**, e **Dinamite + Estopins** → explode a saída final levando para `cave_escaped` (nosso ponto de partida atual para o Capítulo 9!).

---

## 5. Arquitetura Técnica & Portas

- **Estrutura (NPM Workspaces Monorepo):**
  - `package.json` (raiz): `npm run dev` sobe `server` + `client` juntos via `concurrently`.
  - `client/`: Vite rodando estritamente na porta **`3690`** (`http://localhost:3690`), com proxy de `/api` apontando para `http://localhost:3088`.
    - `client/src/main.js` — Máquina de estados de todas as telas, áudio WebAudio, física Canvas e controles.
    - `client/src/style.css` — Estilos isolados por classe no `<body>` (`native-error-mode`, `clicker-mode`, `shapes-mode`, `shitty-loading-mode`, `subsolo-mode`, `cave-mode`).
  - `server/`: Express rodando na porta **`3088`** (`http://localhost:3088`).
    - `server/src/index.js` — API, identificação em 3 camadas (Cookie `dc_sid` + `localStorage` token + hash IP/fingerprint) e persistência JSON em `server/data/players.json` (ignorado no `.gitignore`).
- **Painel de Testes DEV (`mountDevTestPanel`):**
  - Fica fixo no **topo direito (`⚙️ DEV`)** apenas em ambiente de desenvolvimento (`import.meta.env.DEV` — desaparece automaticamente no build de produção!).
  - Lista numerada de `1` a `8` na ordem exata das páginas do jogo, limpando flags sujas (`cleanBase()`) no servidor ao pular de capítulo. Sempre que criar a **Página 9, 10...**, adicione-a numerada em ordem nesse menu!
- **Deploy Futuro (Já Autenticado):**
  - O domínio `naoclique.net` já está na conta Cloudflare do usuário (`thiaguinhosilvano@gmail.com`). Quando formos publicar em produção, usaremos Cloudflare Workers + Assets + D1/KV.

---

## 6. Regras de Ouro de Trabalho entre os Dois PCs (Git Workflow)

1. **Antes de editar qualquer arquivo numa sessão nova:** verifique `git status` / lembre o usuário de rodar `git pull origin main` caso tenha acabado de trocar de PC.
2. **Segurança Anti-Spoiler:** Mantenha o repositório GitHub **Privado** e nunca exponha senhas de enigmas novos hardcoded no `client` se puder validar no `server`.
3. **Padrão de Commits:** Usar Conventional Commits em português (`feat:`, `fix:`, `style:`, `chore:`, `docs:`).
4. **Atualização Viva deste Documento:** Sempre que um novo capítulo, enigma ou pedaço de lore for decidido/implementado, **atualize a Seção 4 deste `AGENTS.md`** antes de dar `git commit` e `git push origin main`! Assim os dois agentes nos dois PCs funcionarão sempre como um único cérebro contínuo.
