# Plan 0073 — Podium7 ↔ BPT2 topology rehearsal

Status: **ATIVO / EXECUÇÃO LOCAL CONTROLADA PENDENTE**

Issue: #207

Current rehearsal execution head after schema/validator alignment: `6d09898d70c2e56f8c2f34c28cf3f6690fb18eb9`.

## Outcome

Executar o experimento controlado que falta no estudo #205 comparando dois checkouts/repositórios separados com um snapshot descartável de monorepo polyglot, usando os mesmos estados de código e sem alterar ownership, runtime, banco ou linguagem.

## Heads congelados

- BPT2 PR #204: `cf08bebae8efdf1904f25355c540ca63478b6573`
- Podium7 PR #319: `939f0452a9c6d3558e2951a48fe8291796645c33`

O harness falha por default se os checkouts não estiverem nesses SHAs. `--allow-head-drift` não deve ser usado para contornar checkout incorreto.

## Harness principal

`scripts/rehearse-podium7-bpt2-topology.py`

O harness valida os SHAs, cria árvores temporárias para `split` e `monorepo`, aplica apenas marcadores efêmeros em arquivos de teste, mede `podium_only`, `bpt2_only` e `shared_integration`, alterna ordem por repetição, executa os gates reais e exige o E2E HTTP real quando `--e2e` está habilitado. Ele emite artifact JSON machine-readable e retorna não-zero se faltarem pares válidos ou E2E.

BPT2 exige tanto build quanto execução da fixture focada. Podium executa `tests.test_bpt2_adapter`. A classe compartilhada executa também `scripts/bpt2_http_e2e.py` contra host BPT2/PostgreSQL real.

## Path-scoped isolation

O roteamento dos gates não é selecionado diretamente pelo nome da classe. Cada mudança efêmera registra os caminhos lógicos tocados (`podium7/...` e/ou `bpt2/...`) e o harness deriva mecanicamente o roteamento a partir desses prefixos:

- caminho apenas `podium7/` → Podium gate;
- caminho apenas `bpt2/` → BPT2 gate;
- presença de ambos → Podium + BPT2 + E2E.

O artifact registra `touched_paths`, `derived_routing`, `path_routing_rules` e o roteamento esperado. A execução falha se o roteamento derivado não corresponder ao tratamento pré-registrado. Isso prova o comportamento do classificador experimental; não afirma que um workflow de produção ainda inexistente já possua esses filtros.

## Isolamento do bootstrap de migrations

`scripts/fresh-migration-gate.sh` gera arquivos de migration. Por isso nenhum runner pode executá-lo no checkout BPT2 usado como fonte da medição.

O runner local cria um **worktree detached descartável** no SHA BPT2 congelado exclusivamente para gerar/aplicar migrations. Depois confirma novamente que os checkouts BPT2 e Podium7 medidos continuam limpos. Isso preserva a identidade exata do source state medido.

## Validação fail-closed dos artifacts

`scripts/validate-podium7-bpt2-topology-artifact.py`

O contrato atual do artifact principal é `bpt2.podium7-topology-rehearsal.v2`. O schema `v2` adiciona evidência mecânica de roteamento por paths (`touched_paths`, `derived_routing`, `path_routing_rules`, `expected_routing`) e substitui o `v1` experimental anterior. O validator e o harness devem permanecer na mesma versão.

O validador executa depois que o runner grava o artifact principal e o `.bootstrap.json`. Ele rejeita qualquer conjunto que não satisfaça todos os invariantes abaixo:

- schema principal `bpt2.podium7-topology-rehearsal.v2` e bootstrap `bpt2.podium7-topology-bootstrap.v1`;
- heads exatamente congelados;
- E2E real habilitado;
- exatamente 3 pares por classe, sem duplicatas;
- 3/3 pares válidos em cada classe;
- `split` e `monorepo` aprovados em cada par;
- `touched_paths` presentes;
- `derived_routing` igual ao roteamento esperado para cada classe;
- roteamento executado igual ao derivado dos paths;
- structural counts permanecem explicitamente modelados, não temporizados;
- threshold temporal ainda em `20%`;
- migrations executadas em worktree detached descartável;
- checkouts medidos declarados limpos;
- bootstrap separado do timing pareado.

O runner só imprime `TOPOLOGY_REHEARSAL: PASS` depois de `PODIUM7_BPT2_TOPOLOGY_ARTIFACT: PASS`. Portanto um JSON parcial, sem E2E, com head divergente ou de schema antigo não pode ser usado acidentalmente como evidência de aceite.

## Runner local Windows / Codex

`scripts/run-podium7-bpt2-topology-rehearsal.ps1`

O wrapper:

- valida heads e limpeza dos dois checkouts;
- cria worktree descartável para migrations;
- sobe PostgreSQL 17 em Docker;
- aplica o fresh-migration gate fora do checkout medido;
- compila/inicia o host BPT2;
- obtém token admin em processo;
- prova o E2E antes do benchmark;
- executa 3×3 pares com `--e2e`;
- grava artifact principal e `.bootstrap.json`;
- confirma que os checkouts medidos continuam limpos;
- valida os dois artifacts fail-closed;
- remove host, container e worktree no `finally`.

## Execução de referência

Com dois worktrees detached nos heads congelados, executar a partir do checkout do **head atual** do PR #208:

```powershell
pwsh scripts/run-podium7-bpt2-topology-rehearsal.ps1 `
  -Bpt2Root <path-bpt2-at-cf08beb> `
  -PodiumRoot <path-podium7-at-939f045> `
  -Pairs 3 `
  -Output artifacts/podium7-bpt2-topology-rehearsal.json
```

O runner exige `git`, `docker`, `dotnet`, `python` e `bash`. O Bash é usado somente pelo fresh-migration gate existente; token e requests HTTP do setup ficam em PowerShell.

## Boundary de execução Codex

Antes de medir:

1. refetch dos dois repositórios;
2. criar worktrees/checkouts detached exatamente nos SHAs congelados;
3. confirmar `git status --short` vazio;
4. fazer checkout do head atual do PR #208, nunca reutilizar um SHA antigo do rehearsal;
5. executar o wrapper PowerShell;
6. exigir no stdout `PODIUM7_BPT2_TOPOLOGY_ARTIFACT: PASS` e `TOPOLOGY_REHEARSAL: PASS`;
7. reter `podium7-bpt2-topology-rehearsal.json` e o artifact `.bootstrap.json` correspondente;
8. confirmar no JSON principal `schema = bpt2.podium7-topology-rehearsal.v2`;
9. registrar stdout final, heads e qualquer exclusão/ameaça à validade.

Não usar `--allow-head-drift` apenas para contornar checkout incorreto. Se algum PR tiver mudado de head, parar a medição, registrar a nova revisão no #207 e decidir se a evidência anterior continua comparável.

## Métricas

Observadas/temporizadas por classe e tratamento:

- materialização local do snapshot;
- patch efêmero;
- compute dos gates reais;
- execução E2E quando aplicável;
- total compute.

Bootstrap registrado separadamente:

- PostgreSQL;
- migrations;
- build do host;
- readiness do host;
- tempo total do wrapper.

Pré-registradas/modeladas, não medidas em horas:

- integration transactions;
- handoffs;
- checkpoints;
- CI surfaces;
- rollback units.

Diferença temporal só é material a partir de `20%` de delta mediano absoluto. Contagens estruturais não são developer-hours.

## Path-scoped model

| Classe | Podium | BPT2 | E2E |
| --- | --- | --- | --- |
| `podium_only` | sim | não | não |
| `bpt2_only` | não | sim | não |
| `shared_integration` | sim | sim | sim |

Mudanças isoladas não devem pagar suites do outro bounded context; mudanças compartilhadas devem executar ambos + E2E.

## Limites

- Execução local controlada não mede timing do GitHub-hosted Actions.
- Materialização usa cópia local, não clone remoto/rede.
- Bootstrap é medido uma vez e fica fora das repetições pareadas; não deve ser atribuído diferencialmente a uma topologia.
- O snapshot monorepo é colocalização de source trees; deployment/version compatibility continuam independentes.
- Marcadores efêmeros medem roteamento/seleção de gates, não uma feature de produto.
- O roteamento por caminhos é uma regra candidata controlada do experimento, não configuração de CI de produção já implantada.
- Contagens estruturais são modelo pré-registrado, não esforço observado.

## VPS

A opção de executar este mesmo experimento em VPS foi **deferida**. Ela não faz parte do caminho ativo do Plan 0073 e não altera os critérios de aceite atuais.

## Acceptance

- [ ] 3/3 pares válidos para `podium_only`;
- [ ] 3/3 pares válidos para `bpt2_only`;
- [ ] 3/3 pares válidos para `shared_integration` com `--e2e`;
- [ ] roteamento derivado dos caminhos coincide com o modelo esperado em todos os tratamentos;
- [ ] BPT2 fixture executa e passa em todos os tratamentos aplicáveis;
- [ ] criação/correção/redirect/replay/same VehicleId continuam PASS;
- [ ] checkouts medidos permanecem limpos;
- [ ] artifact JSON principal `v2` retido;
- [ ] bootstrap artifact retido;
- [ ] `PODIUM7_BPT2_TOPOLOGY_ARTIFACT: PASS` registrado;
- [ ] resultado incorporado ao #205;
- [ ] conclusão somente `KEEP_TWO_REPOS`, `MIGRATE_TO_POLYGLOT_MONOREPO` ou `INSUFFICIENT_EVIDENCE`.

## Non-claims

Este plano não autoriza migração, shared database, runtime collapse, deployment unification nem Python → .NET rewrite.
