# 🚫 Don't Click (`naoclique.net`)

> *"Isso não é um jogo. Não clique."*

Meta-jogo / ARG web em português com progressão psicológica, falso clicker, mutação visual e enigmas.

---

## 💻 Como clonar e rodar em qualquer outra máquina

Pré-requisito único: **Node.js 18+** (recomendado Node 20 ou 22) e **Git**.

```bash
# 1. Clonar o repositório
git clone https://github.com/ThiagoAndradeSilvano/dont-click.git
cd dont-click

# 2. Instalar todas as dependências (raiz + client + server automaticamente)
npm install

# 3. Rodar Front-end + Back-end juntos em modo dev
npm run dev
```

Depois é só abrir no navegador:
- **Jogo (Client):** http://localhost:3690/
- **API / Debug (Server):** http://localhost:3088/api/_debug

*(O banco local `server/data/players.json` é criado sozinho automaticamente na primeira vez que rodar — não precisa configurar nada!)*

---

## 🔄 Fluxo para trabalhar entre duas máquinas (Git)

- **Antes de começar a mexer na máquina:**
  ```bash
  git pull origin main
  ```
- **Para salvar e enviar suas alterações:**
  ```bash
  git add .
  git commit -m "feat: descricao da alteracao"
  git push origin main
  ```

---

## 📁 Estrutura do Monorepo

- `client/` — Front-end Vite + Vanilla JS/CSS/Canvas + assets locais (`public/cursors`, `public/cave`).
- `server/` — Back-end Node.js + Express (validação de enigmas no servidor, sessão, persistência).
- `shared/` — Reservado para contratos/utilitários compartilhados.
