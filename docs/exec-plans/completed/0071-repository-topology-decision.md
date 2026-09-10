# Plan 0071 — Repository topology decision

Status: **CONCLUÍDO**

## Objetivo

Consolidar os Plans 0062–0070 em uma decisão arquitetural explícita sobre manter o repositório combinado atual ou iniciar protótipo de migração para split, sem criar novo benchmark e sem extrapolar além da evidência já medida.

## Contexto congelado

- repositório canônico: `oigorbrito/bpt2-abp`;
- `main` de origem: `2ffaae2bb9b359e08658fa51b11c4d5c02646649`;
- série empírica concluída: Plans 0062–0070;
- nenhum novo experimento fez parte deste plano.

## Resultado

Decisão: **KEEP_MONOREPO** para a topologia de repositório atual do BPT2.

A decisão está registrada em `docs/adr/0012-repository-topology.md` e é explicitamente limitada ao estágio e evidência atuais do BPT2.

Não é uma claim de superioridade universal de monorepos e não impõe deployment atômico de backend/frontend.

## Evidência sintetizada

- Plan 0062: coupling cross-boundary não trivial (13/49 product commits; 26,53%), sem direct source imports frontend/backend;
- Plan 0063: split adiciona boundaries de integração e contract synchronization em workload histórico;
- Plan 0064: split é mecanicamente build-feasible;
- Plan 0065: 12/12 contract-sync candidates mudaram bytes do contrato e stale-lock seria detectado;
- Plan 0066: compute +0,96% e critical path modelado -16,73%, sem threshold material atingido;
- Plan 0067: associação bruta de lead time maior para cross-boundary;
- Plan 0068: sinal de lead time atenuado após ajuste de tamanho/escopo e sem efeito cross-boundary positivo significativo no modelo ajustado;
- Plan 0069: mesma mudança nas duas topologias sem diferença temporal material; split adicionou checkpoints explícitos;
- Plan 0070: compatible split possui rollout/rollback válido sem bridge, porém com mais transitions/handoff; breaking split não possui caminho direto válido sem bridge/coordinated rollout no workload ensaiado.

## Regra aplicada

A série não demonstrou benefício material do split suficiente para justificar mudança de topologia, enquanto mostrou boundaries adicionais observáveis. Dado que a migração introduziria custo e mecanismos permanentes de contract distribution/versioning, manter a topologia atual é a decisão de menor mudança sustentada pela evidência disponível.

Isso não transforma custo de migração em prova de superioridade do monorepo; apenas estabelece que uma mudança arquitetural precisa de benefício demonstrado para ser adotada.

## Triggers de reabertura

A decisão deve ser reavaliada se surgir evidência material de:

- necessidade organizacional/compliance de isolamento por repositório;
- ganho >=20% de critical path em CI real multi-runner/multi-repo representativo;
- requisito real de release cadence independente com contract publication/versioning operacional;
- custo mensurável de manutenção/desenvolvimento causado pela topologia combinada após controlar tamanho/escopo;
- degradação mensurável de tooling/checkout/CI/governance por crescimento do repo;
- requirement de segurança que exija boundary de repositório.

## Progress log

- 2026-09-10: Plan 0070 integrado e série 0062–0070 fechada.
- 2026-09-10: matriz de evidência consolidada em ADR 0012.
- 2026-09-10: `CURRENT-WORK.md` atualizado para o repositório canônico `oigorbrito/bpt2-abp` e para a decisão `KEEP_MONOREPO`.

## Decision log

- 2026-09-10: não abrir novo benchmark antes da síntese, porque os gaps pré-declarados da série foram cobertos.
- 2026-09-10: tratar custo de migração como motivo para exigir benefício demonstrado do split, não como prova de superioridade do monorepo.
- 2026-09-10: selecionar `KEEP_MONOREPO` porque nenhum benefício material do split foi demonstrado sob thresholds da série e boundaries adicionais foram observados.
- 2026-09-10: manter deployment topology como decisão separada da repository topology.

## Critérios de aceite

- [x] matriz 0062–0070 documentada;
- [x] decisão explicitamente limitada à evidência;
- [x] triggers de reconsideração definidos;
- [x] `CURRENT-WORK.md` atualizado para `oigorbrito/bpt2-abp`;
- [x] plano arquivado;
- [ ] checks/review verdes no head final.
