# Plan 0072 — Podium catalog feed HTTP V1

Status: **ATIVO**

## Objetivo / outcome

Congelar e provar uma entrada HTTP externa explícita para o já existente Podium Catalog Feed V1, preservando integralmente a lógica de importação do `IPodiumCatalogFeedAppService` e sem criar um segundo contrato de catálogo.

## Contexto congelado

- Plan 0052 já entregou e validou `PodiumCatalogVehicleInput` + `IPodiumCatalogFeedAppService.ImportAsync`.
- O wire contract de entrada permanece Podium Catalog JSON `2.0` (`contractVersion`, `entity`, `redirectsFrom`).
- O app service já é fail-closed para versão, identidade mínima, `variant`, model-year ranges, redirects e colisões.
- O app service atual exige role `admin`.
- O host registra o módulo Ingestion em ABP conventional controllers, mas a rota externa do feed não era uma autoridade explícita/documentada.
- Podium7 prepara o produtor correspondente em `oigorbrito/podium7#319`.

## Escopo

- rota HTTP estável e explícita no host;
- delegação direta ao app service existente;
- manter autorização server-side;
- smoke HTTP com Swagger, 401 anônimo, 403 não-admin, import válido e replay;
- executar o smoke no gate dedicado existente do Podium feed;
- documentar a fronteira externa necessária para o produtor Podium7.

## Não escopo

- mudar `PodiumCatalogVehicleInput` ou `PodiumCatalogImportResultDto`;
- duplicar regras de reconciliação no controller;
- shared database;
- enrichment quantitativo/Comparator;
- credencial real ou segredo;
- produção;
- escolher definitivamente o modelo de machine authentication além de preservar o boundary atual.

## Critérios de aceite

1. `POST /api/integrations/podium/catalog/v1/vehicles` aparece no Swagger.
2. Request anônimo recebe `401`.
3. Usuário autenticado sem `admin` recebe `403`.
4. Admin envia Catalog JSON `2.0` válido e recebe `PodiumCatalogImportResultDto` válido.
5. Replay do mesmo canonical ID preserva `VehicleId` e retorna `replayed = true`.
6. O gate existente `BPT2 Podium Catalog Feed Gate` executa fixture em processo e smoke HTTP com PostgreSQL real.
7. O controller não contém lógica de catálogo/reconciliação além de delegação.

## Checkpoints

- C1: endpoint explícito e smoke adicionados.
- C2: gate focado atualizado e CI executado.
- C3: self-review de auth, contract duplication e failure semantics.
- C4: PR pronta somente com checks aplicáveis verdes.

## Decisões abertas

- **Machine authentication:** manter `admin` permite compatibilidade imediata, mas um client/scope/policy dedicado pode reduzir privilégio. Isso permanece hipótese/decisão futura até existir requisito operacional e teste correspondente; nenhum segredo ou client real será criado neste plano.

## Progress log

- 2026-09-16 — evidência do Plan 0052 e do host ABP revisada.
- 2026-09-16 — rota explícita `api/integrations/podium/catalog/v1/vehicles` implementada como delegação ao app service.
- 2026-09-16 — smoke HTTP adicionado com casos Swagger/401/403/import/replay.
- 2026-09-16 — gate dedicado atualizado para executar o smoke HTTP.

## Decision log

- A lógica existente do `IPodiumCatalogFeedAppService` permanece autoridade de importação; o HTTP controller é somente adapter de transporte.
- O contrato externo do primeiro slice continua Catalog JSON `2.0`; enrichment permanece aditivo e posterior.
- A rota explícita evita tornar convenção ABP implícita parte acidental do contrato entre repositórios.
