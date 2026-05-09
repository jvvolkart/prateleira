# Prateleira

Aplicação full-stack para cadastro/autenticação por empresa (tenant), gestão de produtos e chat assistido por IA.

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

> Se `OPENAI_API_KEY` estiver vazio, o chat pode não funcionar, mas autenticação e produtos sobem normalmente.

### 2) Subir o projeto

```bash
# Backend + MongoDB
docker compose up --build

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

Para popular dados de exemplo após subir o backend:
(`seed` printa usuários e senhas no console)

```bash
# em outro terminal
cd backend
npm run seed
```


- Frontend: `http://localhost:5173`
- Backend healthcheck: `http://localhost:4000/health`

---

### 3) Alternativa: rodar backend sem compose

Suba só o MongoDB via Docker:

```bash
docker compose up -d mongo
```

Depois backend local:

```bash
cd backend
npm install
npm run dev
```

Depois, para popular dados de exemplo:
(`seed` printa usuários e senhas no console)

```bash
# em outro terminal
cd backend
npm run seed
```

E frontend local (outro terminal):
```bash
cd frontend
npm install
npm run dev
```


## Decisões arquiteturais

### Estrutura geral

- **Monorepo simples (`frontend/` + `backend/`)**: reduz fricção de onboarding e facilita evoluir API e UI em conjunto sem a dificuldade de navegar em múltiplos repositórios.
- **Separação por camada no backend**: `routes/`, `middleware/`, `models/`, `chat/`, `lib/` deixa responsabilidades previsíveis e diminui acoplamento entre transporte HTTP e regra.
- **SPA React + Router**: fluxo de autenticação e áreas protegidas ficam declarativos, com roteamento centralizado em `App.tsx`.

### Patterns adotados

- **Auth centralizado em `AuthContext`**: token, usuário e sessão ficam em um estado único consumido pela aplicação inteira sem prop drilling.
- **Tenant no token/JWT + middleware**: escopo por empresa e aplicado no backend antes das rotas protegidas; evita vazar dados cross-tenant por descuido na UI.
- **Mongoose para modelagem rápida**: com Mongoose a gente ganha schema, validação e model methods de forma organizada; sem ele, acaba escrevendo mais regra manual e ficando mais fácil deixar inconsistências passarem.
- **SSE no chat**: entrega incremental da resposta ao usuário, melhorando a performance percebida sem precisar infraestrutura de WebSocket.

---

## O que eu faria diferente em produção

### Escala

- Colocaria **cache** (Redis) para sessões, rate-limits e respostas de endpoints acessados frequentemente.
- Tiraria o chat da request direta da API e processaria em background (fila + worker), pra API principal continuar rápida.
- Faria uploads em **CDN** (S3) em vez de filesystem local.

### Segurança

- Adicionaria o **helmet**
- Limitação e sanitização de payload
- CORS estrito por ambiente
- Rate limit por IP.
- Validação de entrada com schema (`yup`) em todas as rotas.

### Monitoramento e operação

- **Logs estruturados:** Utilizaria o Datadog para monitorar os logs e infra da aplicação.
- Pipeline CI com gates de:
  - Testes,
  - Lint/typecheck,
  - Scan de segurança (SAST + dependências).

---

## Comandos úteis

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

