# 🚫 Don't Click

> *"Isso não é um jogo. Não clique."*

Jogo web de enigmas, meta-puzzles e cliques interativos inspirado em *Don't Believe His Lies*, *There Is No Game* e *Clicker Games*.

## 📁 Estrutura do Repositório (Monorepo)

- **`client/`** — Frontend do jogo no navegador (UI enganosa, puzzles visuais, áudio, interações de clique e inspeção).
- **`server/`** — Backend e API (validação segura de respostas dos enigmas para ninguém descobrir olhando o código-fonte do navegador, progresso global/rede, placares ou eventos em tempo real).
- **`shared/`** — Tipos, constantes e utilitários compartilhados entre `client` e `server`.

## 🚀 Como rodar localmente (Em breve)

```bash
# Instalar dependências
npm install

# Rodar ambiente de desenvolvimento (client + server)
npm run dev
```

## 📌 Padrão de Commits

Usamos mensagens claras para facilitar o histórico:
- `feat:` nova mecânica, fase ou enigma (ex: `feat: adiciona botão que foge do mouse na fase 1`)
- `fix:` correção de bug (ex: `fix: corrige validação de senha na rota /api/check`)
- `style:` ajustes visuais, CSS, animações
- `chore:` configurações de projeto, dependências, deploy
- `docs:` documentação
