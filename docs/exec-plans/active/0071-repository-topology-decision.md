# Plan 0071 — Repository topology decision

Status: **ATIVO**

## Objetivo

Consolidar os Plans 0062–0070 em uma decisão arquitetural explícita sobre manter o repositório combinado atual ou iniciar protótipo de migração para split, sem criar novo benchmark e sem extrapolar além da evidência já medida.

## Contexto congelado

- repositório canônico: `oigorbrito/bpt2-abp`;
- `main` de origem: `2ffaae2bb9b359e08658fa51b11c4d5c02646649`;
- série empírica concluída: Plans 0062–0070;
- nenhum novo experimento faz parte deste plano.

## Escopo

- sintetizar coupling, build isolation, contract transitions, CI cost, lead time, size-adjusted lead time, controlled topology change e deploy/rollback rehearsal;
- distinguir repository topology de deployment topology;
- registrar decisão em ADR;
- definir triggers objetivos para reabrir a decisão;
- atualizar `docs/agent/CURRENT-WORK.md` para o repositório canônico atual e remover estado arquitetural obsoleto.

## Não escopo

- migrar para multi-repo;
- alterar deployment platform;
- afirmar superioridade universal de monorepo ou split;
- inferir produtividade humana a partir de checkpoints ou CI time.

## Regra de decisão

Escolher `KEEP_MONOREPO` quando a série não demonstrar benefício material do split suficiente para justificar mudança de topologia e houver custo/boundaries adicionais observados no split.

Escolher `PROTOTYPE_SPLIT_MIGRATION` somente se a evidência demonstrar benefício material relevante que não seja explicado por confounding conhecido e que compense os boundaries adicionais medidos.

Escolher `INSUFFICIENT_EVIDENCE` se os resultados permanecerem equilibrados sem base suficiente para uma decisão conservadora de arquitetura.

A decisão é sobre o estado atual do BPT2, não uma claim geral sobre monorepos.

## Critérios de aceite

- matriz 0062–0070 documentada;
- decisão explicitamente limitada à evidência;
- triggers de reconsideração definidos;
- `CURRENT-WORK.md` atualizado para `oigorbrito/bpt2-abp`;
- plano arquivado;
- checks/review verdes no head final.

## Progress log

- 2026-09-10: Plan 0070 integrado em `main`; série 0062–0070 disponível para síntese.

## Decision log

- 2026-09-10: não abrir novo benchmark antes da síntese, porque os gaps pré-declarados da série foram cobertos.
- 2026-09-10: tratar custo de migração como motivo para exigir benefício demonstrado do split, não como prova de superioridade do monorepo.
