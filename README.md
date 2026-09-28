# BPT2 / Bom Pra Ti

**Marketplace automotivo full-stack em .NET 10, PostgreSQL e Next.js, integrado a um produtor separado de conhecimento automotivo (Podium7).**

O BPT2 reconstrói o Bom Pra Ti como um sistema orientado a produto, com catálogo automotivo canônico, jornadas completas de vendedor e comprador, discovery público, leads, automações duráveis e fronteiras explícitas de identidade, autorização e efeitos externos.

> **Status:** `POST_MVP_OPERATIONAL_BASELINE_V1`  
> **Fonte:** privado/proprietário  
> **Arquitetura:** modular monolith + public web desacoplado por HTTP

---

## O que o sistema entrega

### Seller

Fluxo comprovado por HTTP/OIDC real:

```text
self-registration / login
        ↓
seller profile
        ↓
canonical vehicle selection
        ↓
draft / edit / photos
        ↓
publish / pause / archive
        ↓
lead inbox
        ↓
contacted / won / lost
```

Principais invariantes:

- browser Seller usa **Authorization Code + PKCE**;
- ownership é derivado no servidor;
- edição usa **optimistic concurrency**;
- Draft/private nunca aparece ao público;
- leads históricos permanecem consultáveis;
- replays idempotentes convergem; conflitos explícitos são rejeitados.

### Buyer

```text
discovery
   ↓
listing detail
   ↓
favorite / saved search / report
   ↓
WhatsApp
   ↓
persisted lead
```

Inclui:

- busca textual + filtros compostos;
- favoritos;
- buscas salvas;
- sinalização de anúncio;
- histórico de price-drop;
- leads persistidos antes de redirect externo;
- ownership derivado no servidor;
- superfícies públicas que nunca expõem estado privado.

---

## Automação e efeitos externos

Saved Search não é apenas persistência de filtros.

O baseline inclui:

```text
saved search
    ↓
durable detection request
    ↓
PostgreSQL claim
FOR UPDATE SKIP LOCKED
    ↓
matching
    ↓
delivery intent
    ↓
provider adapter
    ↓
webhook / durable outcome
```

Propriedades importantes:

- retry diferido e non-starvation;
- idempotency key estável;
- separação entre `AlertEnabled` e autorização de canal;
- separação entre `Accepted` e `Delivered`;
- recipient resolvido no momento do dispatch;
- replay convergente;
- external delivery continua subordinado à autorização explícita.

---

## BPT2 + Podium7

O BPT2 **não tenta ser também o sistema de aquisição e reconciliação de conhecimento automotivo**.

Essa responsabilidade pertence ao **Podium7**.

```text
Podium7
automotive knowledge producer
        ↓
versioned contracts
+ provenance
+ external identity
        ↓
BPT2 Ingestion
        ↓
BPT2 Catalog
canonical internal identity
        ↓
Marketplace / Vehicle Hub
```

### Fronteira de autoridade

**Podium7 possui:**

- aquisição e integração de fontes;
- reconciliação multi-source;
- provenance;
- identidade externa;
- revisão;
- export/feed.

**BPT2 possui:**

- `VehicleId` e identidade canônica interna;
- regras de publicação;
- catálogo de produto;
- listings;
- Seller/Buyer lifecycle;
- autorização e efeitos externos do marketplace.

A integração já possui caminho exercitado:

```text
Podium7 publisher
    ↓ HTTP
BPT2 ingestion
    ↓
PostgreSQL
```

com autenticação, retry, replay, redirects e falhas de contrato tratadas explicitamente.

---

## Arquitetura

BPT2 é um **modular monolith ABP 10.6** sobre **.NET 10** e **PostgreSQL 17**.

```text
Host / Composition Root
        │
        ├── Catalog
        ├── Marketplace
        ├── Sellers
        ├── Media
        └── Ingestion
```

Regras principais:

- módulos expõem **Contracts** e mantêm implementação/persistência privadas;
- Contracts não dependem de EF/Npgsql;
- Catalog é autoridade canônica de identidade automotiva;
- Marketplace não conhece storage provider diretamente;
- efeitos externos exigem coordenação durável quando necessário;
- infraestrutura nova só entra com evidência de necessidade.

Ver: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Stack

- **Backend:** C# 14, .NET 10, ASP.NET Core, ABP 10.6
- **Data:** PostgreSQL 17, EF Core
- **Public web:** Next.js / Node.js
- **Auth:** OpenIddict / OIDC Authorization Code + PKCE
- **Validation:** architecture/boundary tests, fresh-database gates, HTTP smokes, CI
- **Integration:** versioned HTTP/contracts with Podium7 and external providers

---

## Evidence and quality

A capacidade só é tratada como pronta no escopo que foi efetivamente exercitado.

Exemplos:

- fresh PostgreSQL bootstrap + migrations;
- real API HTTP flows;
- Seller/OIDC boundary;
- Buyer SSR/HTTP path;
- authorization allowed/denied cases;
- optimistic-concurrency stale-write rejection;
- retry/idempotency/recovery for external effects;
- controlled architecture experiments.

Um exemplo relevante foi a avaliação de topologia de repositório. A decisão atual é **KEEP_MONOREPO** para backend + `public-web` porque a série de estudos não demonstrou benefício suficiente para justificar o custo de split.

A avaliação **Podium7 ↔ BPT2** é uma decisão diferente: até o último estudo, havia custo real de coordenação entre dois repositórios, mas ainda **evidência insuficiente** para justificar migração.

---

## Rodar localmente

O procedimento reproduzível completo está em:

- [Local development](docs/LOCAL-DEVELOPMENT.md)
- [Quality / validation matrix](docs/QUALITY.md)

Baseline resumido:

```bash
dotnet tool restore
bash scripts/fresh-migration-gate.sh

export ConnectionStrings__Default="$BPT_DB_CONNECTION"
export ASPNETCORE_ENVIRONMENT=Development
dotnet run --project main/BomPraTi/BomPraTi.csproj
```

Public web:

```bash
cd public-web
npm install --no-audit --no-fund
npm run dev
```

---

## Estado atual

- core Seller journey: **PASS**
- core Buyer journey: **PASS**
- canonical catalog / vehicle identity: **PASS**
- saved-search automation boundary: **PASS**
- reproducible operational runtime boundary: **PASS**
- current repo-internal baseline closure items: **none**
- production/external-provider activation: **separate authority / deployment concern**

O snapshot corrente e os blockers vivem em [docs/agent/CURRENT-WORK.md](docs/agent/CURRENT-WORK.md).

---

## Documentação canônica

| Assunto | Documento |
|---|---|
| Produto / escopo | [docs/PRODUCT.md](docs/PRODUCT.md) |
| Arquitetura | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Desenvolvimento local | [docs/LOCAL-DEVELOPMENT.md](docs/LOCAL-DEVELOPMENT.md) |
| Qualidade / Definition of Done | [docs/QUALITY.md](docs/QUALITY.md) |
| Estado corrente | [docs/agent/CURRENT-WORK.md](docs/agent/CURRENT-WORK.md) |
| Baseline operacional | [docs/baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md](docs/baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md) |
| Knowledge base | [docs/README.md](docs/README.md) |

Para agentes de desenvolvimento, começar por [AGENTS.md](AGENTS.md).
