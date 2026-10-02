# MDV — Matriz de Decisão e Verificação

Estados: PASSA, NÃO PASSA, DECIDIDO, NÃO DECIDIDO, ADIADO.

| ID | Questão | Estado |
|---|---|---|
| ARCH-001 | ABP 10.6 baseline | DECIDIDO |
| ARCH-002 | Modular Monolith | DECIDIDO |
| ARCH-003 | app-nolayers / evitar classic layered | DECIDIDO |
| MOD-001 | Cross-module via Contracts/events | PASSA / DECIDIDO |
| MOD-002 | Implementation-to-implementation entre módulos | NÃO PASSA / PROIBIDO |
| DATA-001 | PostgreSQL | PASSA / DECIDIDO |
| DATA-002 | DbContext por módulo, sem merged host DbContext no baseline | PASSA / DECIDIDO no Gate 01 |
| DATA-003 | Fresh database -> migrations atuais | PASSA / DECIDIDO |
| DATA-004 | Schema PostgreSQL separado por módulo | NÃO DECIDIDO |
| DATA-005 | FK física cross-module | NÃO DECIDIDO |
| TX-001 | ABP Unit of Work como mecanismo | PASSA / DECIDIDO |
| TX-002 | Atomicidade multi-módulo no mesmo PostgreSQL/UoW | PASSA / DECIDIDO no Gate 01 |
| CON-001 | Optimistic concurrency disponível | DECIDIDO como mecanismo |
| CON-002 | Optimistic concurrency em Listing | PASSA / DECIDIDO no Gate 01 e Plan 0004 |
| AUTH-001 | Seller ownership enforcement | PASSA / DECIDIDO no Gate 01 e Plan 0004 |
| AUTH-002 | Público nunca vê Draft/private | PASSA / DECIDIDO no Gate 01 e Plan 0004 |
| AUTH-003 | Login Seller no browser: Authorization Code + PKCE | PASSA / DECIDIDO no Plan 0004 |
| AUTH-004 | Login Buyer no browser: cliente dedicado + Authorization Code + PKCE | PASSA / DECIDIDO no Plan 0006 |
| UI-001 | Public frontend desacoplado do host ABP | PASSA / DECIDIDO em ADR-0004 |
| UI-002 | Primeiro public web em Next.js 16 Active LTS / App Router | PASSA / DECIDIDO no Plan 0003; boundary HTTP reversível |
| UI-003 | Primeira UI Seller no `public-web` existente sob `/vender` | PASSA / DECIDIDO no Plan 0004; composição reversível atrás de HTTP/OIDC |
| SELLER-001 | Seller Profile + My Listings + Draft/Edit/Vehicle | PASSA no Plan 0004 |
| SELLER-002 | Upload/preview privado/attach/remove/reorder de fotos sem storage provider no cliente | PASSA no Plan 0004 |
| SELLER-003 | Publish/Pause/Archive preservando visibilidade pública correta | PASSA no Plan 0004 |
| SELLER-004 | Seller Lead inbox com ownership server-side e histórico de contatos dos próprios Listings | PASSA / DECIDIDO no Plan 0009 |
| SELLER-005 | Seller owner marca Lead próprio como atendido por `ContactedAtUtc`, com ownership server-side e ação idempotente | PASSA / DECIDIDO no Plan 0010 |
| BUYER-001 | Favorite/Unfavorite/Meus favoritos com ownership server-side e visibilidade pública | PASSA / DECIDIDO no Plan 0006 |
| MODERATION-001 | Buyer autenticado sinaliza Listing público com ownership server-side, idempotência por Buyer+Listing e histórico preservado | PASSA / DECIDIDO no Plan 0011 |
| MODERATION-002 | Operador admin consulta inbox read-only de ListingReports, com bloqueio a não-admin, sem PII Buyer e histórico preservado | PASSA / DECIDIDO no Plan 0012 |
| CONTACT-001 | Primeiro contato Buyer → Seller por WhatsApp público já modelado | PASSA / DECIDIDO no Plan 0003 |
| CONTACT-002 | Contato WhatsApp público persiste Lead somente para Listing atualmente público; contato anônimo mantém `UserId` opcional | PASSA / DECIDIDO no Plan 0007 |
| CONTACT-003 | Sessão Buyer existente pode atribuir o Lead WhatsApp ao `UserId` autenticado sem tornar login obrigatório | PASSA / DECIDIDO no Plan 0008 |
| GATE-001 | Vertical Slice 01: arquitetura + host + fresh migration + comportamento crítico | PASSA / DECIDIDO |
| INFRA-001 | Antes de experimentar/construir nova capacidade de infraestrutura, avaliar soluções maduras aplicáveis | DECIDIDO em ADR-0010 |
| INFRA-002 | Adoção de solução existente ou construção customizada de infraestrutura exige decisão durável documentada | DECIDIDO em ADR-0010 |
| LOCK-001 | Distributed locking | ADIADO até caso real |
| JOB-001 | Background jobs | ADIADO até caso real |
| SEARCH-001 | PostgreSQL vs engine externo | NÃO DECIDIDO; benchmark futuro |

## Evidência do Gate 01

Execução em GitHub Actions com ABP 10.6, .NET 10 e PostgreSQL 18.6:

- arquitetura: checker positivo e ataques negativos passaram;
- host: template oficial ABP 10.6 gerado, cinco módulos wired e build Release passou;
- fresh migration: banco vazio recebeu migrations do host e dos módulos;
- `G01_PUBLIC_DRAFT: PASS`;
- `G01_OWNERSHIP: PASS`;
- `G01_CONCURRENCY: PASS`;
- `G01_MULTI_MODULE_ROLLBACK: PASS`.

Classe da evidência comportamental: **B — observado/reproduzido no CI do BPT2**.

A decisão TX-002 vale para múltiplos DbContexts participantes do mesmo ABP Unit of Work sobre o mesmo PostgreSQL. Não implica atomicidade com APIs externas, object storage, outro banco ou outro processo.

## Evidência do primeiro consumidor público

- ADR-0004 fixa a separação entre public web e host ABP.
- `Sellers.Contracts` expõe `SellerPublicContactDto` com `DisplayName` + `WhatsAppNumber`; a projeção pública de Listing preserva esse contrato.
- `SellerProfile` normaliza WhatsApp para 8–15 dígitos incluindo country code, e o lifecycle HTTP comprovou a propagação do valor canônico até a resposta pública.
- O Public Web Gate comprovou lint, typecheck e production build do cliente independente.
- O Public Buyer HTTP Gate sobe banco vazio, host ABP e Next.js e comprovou Draft invisível, Publish, listagem, detalhe com Seller/Vehicle, foto pública, metadata e CTA de WhatsApp para o número canônico.
- O primeiro run end-to-end revelou HTTP 204 para detalhe não publicável; o cliente foi corrigido para tratar 204/404 como ausência pública e o run subsequente passou.

Classe da evidência comportamental do fluxo Buyer: **B — observado/reproduzido no CI do BPT2**.

UI-002 é uma decisão de implementação do cliente público, isolada pela fronteira HTTP. Não altera os boundaries dos módulos do backend nem classifica outros frameworks SSR como tecnicamente incapazes.

## Evidência da fronteira Seller/OIDC

- O host semeia `BomPraTi_SellerWeb` como cliente público dedicado de Authorization Code e exige Proof Key for Code Exchange.
- `public-web` expõe `/vender` e `/vender/callback` usando um cliente OIDC browser; senha não é coletada pelo frontend BPT2.
- O Seller Auth HTTP Gate executou em banco PostgreSQL vazio e comprovou discovery, PKCE obrigatório e redirect ao Account login.
- O Seller Shell HTTP Gate executou Account login real, troca do authorization code por access token, Profile, My Listings e logout.
- O primeiro Seller Auth run detectou um contributor `[UnitOfWork]` selado incompatível com proxy do ABP/Autofac; a correção mínima tornou classe/método interceptáveis e o run subsequente passou.

Classe da evidência do boundary Seller: **B — observado/reproduzido no CI do BPT2**.

## Evidência do Seller Self-Service completo

- O Seller Draft Edit HTTP Gate comprovou Vehicle canônico, criação Draft, owned read, ocultação para segundo Seller, update com rotação de `ConcurrencyStamp`, stale 409 e reread do estado canônico.
- O Seller Photos Publish HTTP Gate executa PostgreSQL fresco, host ABP real, login `BomPraTi_SellerWeb` por Authorization Code + PKCE e Next.js de produção.
- Media upload, attach, reorder e remove passaram; o gate valida que o retorno de Media não expõe storage key/provider e que a ordem remanescente é normalizada pelo backend.
- A galeria Seller carrega bytes da foto por leitura autenticada e ownership-safe; `SELLER_PUBLISH_PRIVATE_PHOTO: PASS` comparou a foto Draft do owner byte a byte com o upload, enquanto o segundo Seller recebeu 404 para a mesma leitura privada.
- A rota HTTP observada no Swagger para essa leitura é `GET /api/app/seller-listing-query/mine-photo?listingId=...&photoId=...`; o cliente foi alinhado ao contrato gerado, sem criar rota artificial no backend.
- Segundo Seller recebeu 403 ao tentar Publish e attach no Listing do owner.
- Draft permaneceu ausente da API pública e do Next; Publish tornou o anúncio e a foto visíveis; Pause ocultou; republish restaurou; Archive ocultou novamente.
- A foto pública foi comparada byte a byte com o upload original.
- Publish/Pause/Archive permanecem commands do backend; o frontend não codifica matriz própria de transições.

Classe da evidência do fluxo Seller: **B — observado/reproduzido no CI do BPT2**.

## Evidência de Buyer Favorites

- O host semeia `BomPraTi_BuyerWeb` como cliente OpenIddict público separado de Seller, com Authorization Code + PKCE e callbacks sob `/favoritos`.
- O Favorite AppService exige autenticação e deriva `UserId` de `ICurrentUser`; nenhum endpoint aceita owner informado pelo browser.
- Add reutiliza `IPublicListingQuery.GetAsync`, portanto Draft/private não pode ser favoritado.
- `GetMineAsync` resolve as relações persistidas pela mesma projeção pública; Pause oculta o item sem apagar a relação e republish o faz reaparecer.
- O Buyer Favorites HTTP Gate executou login Account real, troca PKCE, bloqueio anônimo, Draft 404, add duplicado idempotente, mine, Pause/republish, remove e Next.js de produção.
- O primeiro run mostrou empiricamente as convenções ABP: `POST/DELETE /api/app/favorite?listingId=...`; `GetIsFavoriteAsync` produz GET em `/api/app/favorite/is-favorite/{listingId}`. Cliente e gate foram alinhados ao Swagger, sem controller customizado.

Classe da evidência do fluxo Favorites: **B — observado/reproduzido no CI do BPT2**.

## Evidência de WhatsApp Lead Capture

- Marketplace reutiliza o aggregate/tabela `Lead` já existente; nenhuma migration nova foi criada.
- `ILeadAppService.CreateAsync` é anônimo, deriva `UserId` de `ICurrentUser` quando houver sessão e usa `IPublicListingQuery` como autoridade de visibilidade. Draft, Pause e Archive não geram novo Lead.
- O canal deste slice é `WhatsApp`; o servidor persiste `ListingId`, `UserId?`, `Channel` e `CreatedAtUtc` antes de o cliente público abrir a conversa.
- A rota convencional observada no Swagger é `POST /api/app/lead?listingId=...`; nenhum controller customizado foi adicionado.
- O public web envia somente `listingId` para sua rota server-side; o destino `wa.me` continua derivado do contato canônico retornado por Sellers, não de número informado pelo browser.
- O Public Buyer HTTP Gate em PostgreSQL fresco, host ABP real e Next.js de produção comprovou `PUBLIC_LEAD_ROUTE`, `PUBLIC_LEAD_DRAFT_BLOCKED`, `PUBLIC_LEAD_PERSISTED`, `PUBLIC_WEB_WHATSAPP_LEAD`, `PUBLIC_LEAD_PAUSED_BLOCKED`, `PUBLIC_LEAD_ARCHIVED_BLOCKED` e `PUBLIC BUYER HTTP FLOW` como PASS.
- Um run intermediário falhou por uma expressão de teste que tratava CRLF do header `Location` incorretamente; o próprio log mostrava `303` e o `wa.me` canônico. A asserção foi corrigida sem alteração de produto e o run seguinte passou.

Classe da evidência do Lead capture: **B — observado/reproduzido no CI do BPT2**.

## Evidência de atribuição do Lead ao Buyer autenticado

- O backend do Plan 0007 já usa `ICurrentUser.Id`; o Plan 0008 não alterou domínio, persistência nem rota backend.
- O CTA preserva o `<form>` anônimo/sem-JS e o redirect 303, mas com JavaScript reutiliza a sessão `BomPraTi_BuyerWeb` existente via `getCurrentBuyerUser()` sem iniciar login.
- Quando há `access_token`, o browser envia o Bearer somente ao route handler same-origin; o handler o encaminha apenas ao POST de Lead. O token não integra o payload e nunca compõe o URL externo.
- O destino `wa.me` continua calculado server-side a partir do contato canônico do Listing público.
- No head `d684db735f448381c340356d090880988e561eb2`, os 9 workflows disparados passaram, incluindo Public Web, Buyer Favorites e Public Buyer.
- O Public Buyer Gate manteve o fluxo real PostgreSQL + ABP + Next do Plan 0007 integralmente verde e, em step adicional, `AUTHENTICATED_LEAD_FORWARDING: PASS` comprovou com upstream controlado que o route handler encaminha o Bearer ao Lead API e devolve somente o URL canônico ao cliente.
- O Buyer Favorites Gate, separadamente no mesmo head, manteve verde a prova real de Authorization Code + PKCE e access token do `BomPraTi_BuyerWeb`.

A composição acima prova os boundaries executados, mas não é apresentada como um único E2E no qual um token obtido por PKCE foi encaminhado ao Lead API real. Essa distinção permanece explícita para não elevar a força da evidência.

Classe: **B para os comportamentos executados individualmente; C apenas para a composição entre as provas separadas**.

## Evidência de Seller Lead Inbox

- `ISellerLeadQuery` é um application service autenticado e a rota convencional observada no Swagger é `GET /api/app/seller-lead-query/mine`; nenhum controller customizado foi criado.
- A query deriva o Seller exclusivamente de `ICurrentUser.Id` e faz JOIN entre `Lead` e `Listing` já filtrado por `Listing.SellerId`; não existe parâmetro de owner controlável pelo browser.
- A projeção retorna somente `Lead.Id`, `ListingId`, título do Listing, `BuyerUserId?`, canal e `CreatedAtUtc`; o slice não resolve perfil/PII Buyer.
- O Seller Photos Publish HTTP Gate em PostgreSQL fresco e host ABP real comprovou `SELLER_LEADS_ROUTE`, `SELLER_LEADS_ANONYMOUS_BLOCKED`, `SELLER_LEADS_OWNER_VISIBLE`, `SELLER_LEADS_OWNERSHIP`, `SELLER_LEADS_HISTORY_PRESERVED` e `SELLER LEADS HTTP` como PASS.
- O mesmo run preservou integralmente verde o fluxo anterior de Seller photos/publication e o build de produção do Next.js. No head funcional `2a0dc550086bb2716a4f28dbdcc8b31f88d363f5`, todos os 16 workflows aplicáveis passaram.
- Runs intermediários revelaram três fronteiras sem ampliar escopo: a interface precisava herdar `IApplicationService` para conventional controllers; uma fixture Bash tinha declaração local incompatível com `set -u`; e EF Core não traduzia `OrderBy` aplicado após construir `SellerLeadDto`. A forma final ordena colunas do `Lead` antes da projeção e passou em runtime.
- Pause não apaga nem oculta o Lead já ocorrido da inbox do Seller; a inbox é histórico de contato, distinta da regra que só permite criar novo Lead enquanto o Listing está público.

Classe da evidência da Seller Lead Inbox: **B — observado/reproduzido no CI do BPT2**.

## Evidência de Seller Lead Follow-up

- `Lead` ganhou somente `ContactedAtUtc?`; não foi criado enum, pipeline comercial, notas, CRM ou infraestrutura.
- `ISellerLeadCommandService.MarkContactedAsync` é autenticado e a rota convencional observada no Swagger é `POST /api/app/seller-lead-command/mark-contacted/{leadId}`.
- O command deriva o Seller de `ICurrentUser.Id` e filtra o Lead por JOIN com Listings próprios antes de qualquer alteração; outro Seller recebe 404 e não existe `SellerId` controlável pelo cliente.
- O método de domínio é monotônico: se `ContactedAtUtc` já existe, chamadas posteriores não mudam o primeiro instante.
- No head funcional `c3c811cbb0f1811e3348990fa80a27c11a351558`, os 16 workflows aplicáveis passaram.
- O Seller Photos Publish HTTP Gate em PostgreSQL fresco comprovou `SELLER_LEADS_FOLLOW_UP_ROUTE`, `SELLER_LEADS_NEW_STATUS`, `SELLER_LEADS_FOLLOW_UP_ANONYMOUS_BLOCKED`, `SELLER_LEADS_FOLLOW_UP_OWNERSHIP`, `SELLER_LEADS_FOLLOW_UP_PERSISTED`, `SELLER_LEADS_FOLLOW_UP_IDEMPOTENT`, `SELLER_LEADS_HISTORY_PRESERVED` e `SELLER LEADS HTTP` como PASS.
- O Fresh Migration Gate passou com o novo scalar nullable e o Public Web/Seller Shell Gate passou com a ação Novo/Atendido no `/vender`.

Classe da evidência do Seller Lead Follow-up: **B — observado/reproduzido no CI do BPT2**.

## Evidência de Buyer Listing Report

- `ListingReport` pertence ao Marketplace e persiste somente `UserId`, `ListingId` e `CreatedAtUtc`; não há taxonomia, texto livre, scoring, fila administrativa ou efeito automático.
- `IListingReportAppService` exige autenticação e deriva o Buyer exclusivamente de `ICurrentUser.Id`; nenhum endpoint aceita owner informado pelo browser.
- A criação reutiliza `IPublicListingQuery.GetAsync`, portanto Draft/private, Pause e Archive não aceitam novo sinal.
- Há índice único por `UserId + ListingId`; o application service torna repetição do mesmo Buyer idempotente e `GetIsReportedAsync` é isolado por Buyer.
- A rota convencional observada no Swagger é `POST /api/app/listing-report/report/{listingId}` e a consulta é `GET /api/app/listing-report/is-reported/{listingId}`; cliente e smoke foram alinhados ao contrato gerado sem controller customizado.
- O Buyer Favorites HTTP Gate em PostgreSQL fresco comprovou `BUYER_REPORT_ROUTES`, `BUYER_REPORT_ANONYMOUS_BLOCKED`, `BUYER_REPORT_DRAFT_BLOCKED`, `BUYER_REPORT_IDEMPOTENT`, `BUYER_REPORT_PERSISTED`, `BUYER_REPORT_USER_ISOLATION`, `BUYER_REPORT_HISTORY_PRESERVED` e `BUYER LISTING REPORT HTTP` como PASS.
- O mesmo run manteve integralmente verde o fluxo Buyer Favorites, Authorization Code + PKCE e o build de produção do Next.js.
- No head funcional `e18c951f35e600fa1e0a86c944390ce112250acc`, todos os 16 workflows aplicáveis passaram.
- Dois runs intermediários foram informativos sem ampliar escopo: o Harness exigia o formato canônico do execution plan; depois o primeiro smoke funcional revelou que o ABP gerou o parâmetro `listingId` como segmento de rota. Ambos foram corrigidos sem mudar a regra de domínio.
- O sinal já ocorrido permanece persistido e consultável pelo mesmo Buyer depois de Pause; esse histórico é distinto da regra de criação, que exige Listing atualmente público.

Classe da evidência de Buyer Listing Report: **B — observado/reproduzido no CI do BPT2**.

## Evidência da Moderation Report Inbox

- `IModerationListingReportQuery` herda `IApplicationService`; a rota convencional observada no Swagger é `GET /api/app/moderation-listing-report-query`.
- `ModerationListingReportQuery` exige `[Authorize(Roles = "admin")]`; anônimo recebe 401 e usuário autenticado sem role admin recebe 403.
- A projeção retorna somente `ReportId`, `ListingId`, título/status do Listing e `CreatedAtUtc`; não expõe `UserId` nem resolve perfil/PII Buyer.
- A query ordena por sinal mais recente e faz JOIN com Listing sem filtrar por visibilidade pública; após Pause, o report continua na fila e reflete `ListingStatus = Paused`.
- No head funcional `b8ec5cbb7366d6232201a6461ec35067d8bcb247`, os 14 workflows aplicáveis ficaram verdes.
- O Buyer Favorites HTTP Gate em PostgreSQL fresco comprovou `MODERATION_REPORT_ROUTES`, `MODERATION_REPORT_ANONYMOUS_BLOCKED`, `MODERATION_REPORT_NON_ADMIN_BLOCKED`, `MODERATION_REPORT_ADMIN_VISIBLE`, `MODERATION_REPORT_BUYER_PII_HIDDEN`, `MODERATION_REPORT_HISTORY_PRESERVED` e `MODERATION REPORT INBOX HTTP` como PASS.
- Um run intermediário do Harness falhou apenas porque `repository-facts.md` ainda dizia zero planos ativos após a abertura do Plan 0012; o fato gerado foi sincronizado sem alteração de produto.
- A conversão de `ListingStatus` para texto foi mantida fora da projeção SQL para não depender de tradução do provider; o head funcional provou o comportamento final.

Classe da evidência da Moderation Report Inbox: **B — observado/reproduzido no CI do BPT2**.

## Princípio de seleção de infraestrutura

ADR-0010 define uma regra transversal para qualquer nova capacidade de infraestrutura:

`necessidade comprovada -> avaliação de soluções maduras -> experimento mínimo se ainda necessário -> decisão adopt/build documentada`.

A avaliação deve considerar opções nativas da plataforma/framework, OSS/self-hosted e gerenciadas/comerciais quando aplicáveis. Isso não cria preferência automática por SaaS nem proíbe construção própria; impede que custom build seja o experimento padrão sem antes verificar soluções maduras e seus trade-offs.

A decisão final de adoção ou construção deve registrar necessidade, alternativas, rationale, boundary/ownership, consequências operacionais e estratégia de reversibilidade/saída. Decisões atualmente adiadas, como distributed locking, background jobs e engine externa de busca, continuam adiadas; ADR-0010 governa o processo quando alguma delas for aberta.

## Regra de decisão

Para regra de domínio/aplicação: documentação/código/standard -> capacidade comprovada -> teste mínimo se a decisão específica do BPT não estiver resolvida -> PASS/FAIL -> decisão registrada.

Para nova infraestrutura: necessidade/constraints comprovados -> avaliação de soluções maduras -> experimento/benchmark mínimo somente se necessário -> decisão adopt/build documentada.

Inferência, popularidade de mercado ou preferência não vira requisito arquitetural sem evidência.
