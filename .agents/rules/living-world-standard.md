# Padrão Obrigatório de Jogo Vivo, Psicologia do Jogador & Qualidade (`living-world-standard`)

> **LEI INEGOCIÁVEL DO PROJETO (`naoclique.net`):**
> Nunca construa uma página, capítulo, conto ou minigame "estático" onde só o caminho feliz funciona. O coração deste jogo é **antecipar cada instinto humano, erro, teimosia, preguiça ou tentativa de burlar o sistema**, fazendo o site parecer vivo e onisciente do início ao fim!

Sempre que criar ou editar **QUALQUER** tela, capítulo, livro ou minigame, cumpra **TODOS os 13 itens deste checklist antes de commitar**.

> **Mudo vs. Vivo:** antes do despertar (Página 4) o jogador NÃO sabe que existe alguém do outro lado. Nessas telas (botão, forminhas, erros, clicker mudo) as reações são **mudas e sutis** (título da aba piscando `...`, conquista besta do clicker, nada de `log`, nada de mão vermelha). Depois do despertar, as reações viram falas do `log` + voz. O motor central é `setupPsychologicalTraps()` em `client/src/main.js` (`getLivingStageKey()` = com ele, `getMuteStageKey()` = mudo): toda tela nova DEVE ser encaixada numa dessas duas chaves.

---

## 1. Reação a Cliques no Vazio / Spam de Cliques ("Caçador de Pixel")
- Jogadores de ARG clicam em paredes, fundos vazios, títulos, molduras e textos não-clicáveis tentando achar botão secreto, ou metralham cliques por impaciência.
- Toda fase onde o `log` está presente DEVE alimentar o detector global de cliques perdidos/spam (ou ter reações próprias contextualizadas ao cenário) com voz (`react_teimoso.mp3` / `react_risada.mp3` ou clipe dedicado), mudança de mão vermelha (`flashCursorMood('stop' | 'middle')`) e deboche orgânico.
- O detector (`isBlankClickTarget`) considera "vazio" o fundo, `#app`, tile vazio da caverna ou elemento grande não clicável. **Hotspot novo que não seja `button`/`a`/`[data-*]` conhecido precisa entrar em `INTERACTIVE_SELECTOR`**, senão o `log` xinga o jogador por clicar numa coisa certa.
- As falas ficam no servidor (`BEHAVIOR_POOLS` em `/api/behavior`), por zona (`clicker`, `subsolo`, `cave`, `story`), e **escalam com a repetição** (contador por jogador). Zona nova = pool novo.

## 2. Reação de Inatividade Contextual + Global (`resetIdleChillTimer`)
- Nenhuma tela pode ficar morta se o jogador largar o mouse:
  1. Garanta que `isLogPresentOnScreen()` cubra o novo estágio/modo para disparar os áudios reais de inatividade (`IDLE_VOICE_POOL`) com eco automático se estiver em ambiente subterrâneo/fechado.
  2. Em momentos de tensão (incêndio, contagem regressiva, escolha de diálogo, interrogatório), adicione cobranças específicas do contexto (e ação forçada pelo próprio `log` se o jogador congelar demais!).

## 3. Aba do Navegador (`document.title`) & Favicon Vivos em TODOS os Capítulos
- A aba do navegador NUNCA é estática! Ela deve reagir em **qualquer capítulo** a:
  - **Trocar de aba (`visibilitychange`):** provocar de acordo com o capítulo atual (ex: pesquisando resposta de livro no Google, fugindo no meio do terror, abrindo calculadora).
  - **Ficar inativo / clicar feito maluco / errar repetidamente:** piscar ou mutar temporariamente o `document.title` (ex: `"para de clicar na parede"`, `"eu vi vc indo no google"`, `"..."`) e depois restaurar o título base da fase.

## 4. Armadilhas de Instinto Hacker / ARG (`Ctrl+A`, Botão Direito, `F12`, Copiar/Colar, URL)
- Preveja o jogador dando `Ctrl+A`, `Ctrl+C`, botão direito (`contextmenu`), teclas de atalho (`F12`, `Ctrl+U`) e chutes óbvios (`1234`, `0000`, `senha`, `admin`, `6969`) em **todas** as telas pós-despertar — não apenas no Clicker inicial!

## 5. Separação Rigorosa Mundo do Jogo vs. `log` + Áudio & Eco
- Contos, livros e minigames pós-caverna têm **universo e regras próprias** (não quebram a quarta parede por conta própria falando "sou um código corrompido"). Quem quebra a banca de fora é o `log` na barra superior!
- Sempre espere o narrador/interfone local terminar (~`550–700ms`) antes do `log` reagir, respeite prioridades (`urgent`, `action`, `ambient`), e mantenha o eco acústico (`ensureCaveEchoChain`) onde couber.

## 6. Padrão de Enigmas *Don't Believe His Lies* (Anti-Chute & Anti-Print)
- **Zero senha no front-end:** Toda resposta de enigma é validada exclusivamente no `server/src/index.js`.
- Enigmas principais devem exigir **pensamento lateral real e múltiplas camadas** (arquivos baixáveis com esteganografia de brilho/contraste + bytes no Bloco de Notas, áudio invertido/espectrograma, física em tempo real, Morse/cifras cruzadas com pesquisa histórica real onde um simples print no GPT não entrega pronto).
- Chutes errados repetidos devem ter respostas progressivas do `log` (do deboche leve até irritação ou dica ácida indireta, sem nunca dar a resposta de bandeja).

## 7. Zero Rolagem Indesejada & Zero Dependência Externa Suja
- Telas de jogo devem caber limpas na viewport (`100dvh` / escala responsiva) sem barra de rolagem acidental em notebooks/telas menores.
- **PROIBIDO** embutir CDNs externos frágeis, `<base href>` de terceiros, analytics ou binários WASM opacos. Tudo roda 100% local e auditado no repositório.

## 8. Cursor Conta a História (Mouse Normal Até o Jogo "Começar")
- Até o despertar o mouse é o **normal do sistema** (nada de `--cur-user-blue` no botão, forminhas, erros nem no clicker mudo).
- A **mão azul** nasce no *hover* do `Recarregar` depois que ele fala pela 1ª vez e fica de vez (`body.blue-hand-on` → `.awakened-cursors`). Mãos vermelhas (`op-*.png`) só onde existe `.awakened-cursors`.
- Cursor temático novo (conto, mundo) só dentro do próprio modo (`story-mode-N`), nunca vazando pra outra tela.

## 9. Todo `Recarregar` Passa Pela Barra de Loading Ruim
- Qualquer botão de recarregar/tentar de novo (erro falso, despertar, futuros) chama `reloadWithSuperliminal()` ou `showSuperliminalLoading()`. Na tela aparece **só uma barra** feia (blocos estilo Windows antigo), sem texto, sem formas, sem percentual. Cada carregamento tem um defeito diferente (`LB_ORDER`: normal ruim → quebra e se conserta → desiste e volta → fora de ordem → transborda → treme → congela; depois sorteia entre as com defeito), mas **sempre termina** e o fluxo segue. Variação nova entra em `LB_ORDER`, nunca em texto ou enfeite.
- Dicas novas vão em `SL_TIPS_MUTE` (neutras, sem `log`, sem spoiler) ou `SL_TIPS_AWAKE`. Nunca escreva a voz do `log` numa dica.

## 10. Rotas Secretas no Caminho da URL (`naoclique.net/<algo>`)
- O front só lê `location.pathname` e pede `/api/route`; **título, linhas e falas ficam no servidor** (`buildSecretRoute`).
- Toda rota é **condicionada ao progresso** (`routeProgress`): antes do despertar é sempre 404 mudo; conteúdo de capítulo futuro nunca aparece antes da hora.
- Rota que ajuda enigma dá **meia pista** (pesquisa externa obrigatória), nunca a resposta. Caminho desconhecido também reage (pool escalando).
- Produção estática precisa de *fallback* SPA (servir `index.html` em qualquer caminho) senão a rota vira 404 do host.

## 11. Zero Spoiler no Bundle de Produção
- Atalhos, rótulos e nomes de estado do painel DEV ficam **dentro** de código guardado por `import.meta.env.DEV` (o Vite remove no build). Depois de mexer, rode `npm run build --workspace=client` e confira com `grep` que nenhuma senha/rota/resposta aparece em `client/dist/assets/*.js`.

## 12. Áudio: Só Clipe Que Existe
- Antes de usar `voiceUrl`, confira o arquivo em `client/public/voices/`. Sem clipe ainda? Use texto e anote no `AGENTS.md` o texto + tom pra gravar no ElevenLabs depois.

## 13. Registro Obrigatório no Painel `⚙️ DEV` Hierárquico & no `AGENTS.md`
- **TODA** nova página, sub-estado, conto, livro, rota secreta ou minigame criado DEVE ganhar imediatamente seu atalho direto na árvore `DEV_TREE` (capítulos em acordeão) de `mountDevTestPanel()` (`client/src/main.js`) + ação limpa (`cleanBase()`) em `/api/_dev/action` (`server/src/index.js`), permitindo pular em 1 clique para testar o começo, meio, enigma ou final daquela parte!
- O botão do painel fica no **topo-centro** e não pode cobrir controles do jogo (Buscar, loja, botão de cookies no rodapé). Teste em 1280×720 e 360×640.
- Atualize sempre o `AGENTS.md` (mantendo `< 24 KB`) e finalize com `git push origin main`.
