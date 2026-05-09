# Prateleira

Aplicacao full-stack para cadastro/autenticacao por empresa (tenant), gestao de produtos e chat assistido por IA.

## Setup local (primeira vez)

### Pre-requisitos

- Node.js 20+ (recomendado 22)
- npm 10+
- Docker + Docker Compose

### 1) Criar os arquivos `.env` primeiro

Backend (`backend/.env`):

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/saas_poc
JWT_SECRET=dev-jwt-secret-change-in-prod
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
PUBLIC_API_URL=http://localhost:4000
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:4000
```

> Se `OPENAI_API_KEY` estiver vazio, o chat pode nao funcionar, mas autenticacao e produtos sobem normalmente.

### 2) Subir o projeto (recomendado)

```bash
docker compose up --build

# em outro terminal
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend healthcheck: `http://localhost:4000/health`

---

### 3) Alternativa: rodar backend sem compose

Suba so o MongoDB via Docker:

```bash
docker compose up -d mongo
```

Depois backend local:

```bash
cd backend
npm install
npm run dev
```

E frontend local (outro terminal):
```bash
cd frontend
npm install
npm run dev
```


## Decisoes arquiteturais

### Estrutura geral

- **Monorepo simples (`frontend/` + `backend/`)**: reduz friccao de onboarding e facilita evoluir API e UI em conjunto sem a dificuldade de navegar em multiplos repos.
- **Separacao por camada no backend**: `routes/`, `middleware/`, `models/`, `chat/`, `lib/` deixa responsabilidades previsiveis e diminui acoplamento entre transporte HTTP e regra.
- **SPA React + Router**: fluxo de autenticacao e areas protegidas ficam declarativos, com roteamento centralizado em `App.tsx`.

### Patterns adotados

- **Auth centralizado em `AuthContext`**: token, usuario e sessao ficam em um estado unico consumido pela aplicacao inteira sem prop drilling.
- **Tenant no token/JWT + middleware**: escopo por empresa e aplicado no backend antes das rotas protegidas; evita vazar dados cross-tenant por descuido na UI.
- **Mongoose para modelagem rapida**: com Mongoose a gente ganha schema, validacao e model methods de forma organizada; sem ele, acaba escrevendo mais regra manual e ficando mais facil deixar inconsistencias passarem.
- **SSE no chat**: entrega incremental da resposta ao usuario, melhorando a performance percebida sem precisar infraestrutura de WebSocket.

---

## O que eu faria diferente em producao

### Escala

- Colocaria **cache** (Redis) para sessoes, rate-limits e respostas de leitura quente.
- Tiraria o chat da request direta da API e processaria em background (fila + worker), pra API principal continuar rapida.
- Faria uploads em **CDN** (S3) em vez de filesystem local.

### Seguranca

- Adicionaria o **helmet**
- Limitacao e sanitização de payload
- CORS estrito por ambiente
- Rate limit por IP.
- Validacao de entrada com schema (`yup`) em todas as rotas.

### Monitoramento e operacao

- **Logs estruturados** Utilizaria o Datadog para monitorar os logs da aplicação.
- Pipeline CI com gates de:
  - testes,
  - lint/typecheck,
  - scan de seguranca (SAST + dependencias).

---

## Comandos uteis

Backend:

```bash
npm run dev
npm run test
npm run build
```

Frontend:

```bash
npm run dev
npm run lint
npm run build
```

