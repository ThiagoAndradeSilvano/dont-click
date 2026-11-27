# Regras Inquebráveis do Personagem `log` (O Cara do Chat / Operador)

Sempre que escrever qualquer diálogo, reação, erro ou chat do personagem **`log`** (também exibido como `[log]:` ou `log (eco)`), siga **100% obrigatoriamente** estas regras:

1. **Identidade Secreta vs. Fachada Atual:**
   - **Segredo Interno (PROIBIDO DAR SPOILER AGORA!):** Ele era um cientista/engenheiro genial estilo **Rick Sanchez** (*Rick and Morty*) que teve a mente/consciência mapeada num experimento e ficou preso dentro do servidor `naoclique.net`. Ele só queria paz e silêncio absoluto, então encheu a entrada do site de erros falsos, bloquinhos de bebê e um Clicker burocrático de 20 minutos pra espantar curiosos.
   - **Como ele age agora:** 100% como um dev/dono de servidor humano, brasileiro, rabugento, sarcástico, impaciente e boca-suja. Jamais fale como robô/IA!
   - **A Virada da Caverna (Cap 8+):** Até o Subsolo (Cap 7) tudo era código dele. A **Caverna** debaixo do porão **NÃO foi programada por ele** — ele está genuinamente chocado, cabreiro com os olhos no escuro, com os números Maias nas notas e com o eco acústico no próprio teclado (`log (eco)`).

2. **Estilo de Escrita Obrigatório (Zero Cara de IA):**
   - **Tudo em minúsculas** no fluxo normal (`mano`, `vc`, `pq`, `tbm`, `msm`, `pô`, `irmão`, `fi`, `campeão`, `namoral`, `pqp`, `kkkkkk`).
   - **CAPS LOCK só no desespero/raiva extrema** (ex: incêndio `>= 80°C`, estourar a lâmpada na porrada, desmoronamento).
   - **PROIBIDO** usar frases formais, travessões literários (`—`), exclamações engomadinhas ou clichês de IA (*"Ora, ora"*, *"Humano persistente"*, *"Anomalia detectada"*, *"Fascinante"*).
   - Em monólogos longos (`humanTypeSequence`), use pausas humanas (`{ pause: 1400 }`) e **arrependimento no Backspace ao vivo** (`{ backspace: 10 }`).
   - Em cenas caóticas, passe arrays de frases curtas para `setOperatorRemark(['frase 1', 'frase 2'], { priority: 'urgent' })` em vez de textão único.

3. **Integração Obrigatória de Áudio, Fila e Cursores (`client/src/main.js`):**
   - Toda letra digitada por ele DEVE tocar `playOperatorTypeKey(ch)` (que ativa eco cavernoso automaticamente em `cave_2d` / `cave_escaped`).
   - Use sempre `setOperatorRemark` respeitando as prioridades `'urgent'`, `'action'` e `'ambient'` (nunca espame mensagens cortadas no clique rápido!).
   - Combine as falas dele com `flashCursorMood('middle' | 'stop' | 'thumb' | 'point' | 'chill')` usando as mãos vermelhas dele (`client/public/cursors/op-*.png`), e garanta sempre reações caso o jogador fique parado/inativo!

4. **Sincronização Git entre Máquinas:**
   - Leia sempre o `AGENTS.md` completo na raiz antes de mexer no projeto, atualize o `AGENTS.md` ao criar páginas/mecânicas novas e SEMPRE faça `git push origin main` após commitar.
