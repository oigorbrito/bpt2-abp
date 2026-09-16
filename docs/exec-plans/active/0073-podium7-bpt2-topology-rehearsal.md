# Plan 0073 — Podium7 ↔ BPT2 topology rehearsal

Status: **ATIVO / EXECUÇÃO LOCAL PENDENTE**

Issue: #207

## Outcome

Executar o experimento controlado que falta no estudo #205 comparando:

- dois checkouts/repositórios separados;
- snapshot descartável de monorepo polyglot;

com os mesmos estados de código e sem alterar ownership, runtime, banco ou linguagem.

## Heads congelados

- BPT2 PR #204: `cf08bebae8efdf1904f25355c540ca63478b6573`
- Podium7 PR #319: `939f0452a9c6d3558e2951a48fe8291796645c33`

O harness falha por default se os checkouts não estiverem nesses SHAs. `--allow-head-drift` só pode ser usado quando a nova revisão tiver sido registrada explicitamente no #207.

## Harness

`scripts/rehearse-podium7-bpt2-topology.py`

O script:

1. valida os SHAs dos dois checkouts;
2. cria árvores temporárias e descartáveis para os tratamentos `split` e `monorepo`;
3. não altera os checkouts de origem;
4. aplica apenas marcadores efêmeros em arquivos de teste para representar as classes de mudança sem introduzir feature artificial;
5. mede três classes: `podium_only`, `bpt2_only`, `shared_integration`;
6. alterna a ordem dos tratamentos a cada repetição;
7. executa gates reais de Podium e BPT2;
8. no caso compartilhado, com `--e2e`, executa o `scripts/bpt2_http_e2e.py` real do Podium contra host BPT2 real;
9. emite artifact JSON machine-readable;
10. retorna código diferente de zero se faltarem pares válidos ou se o E2E real não tiver sido habilitado.

## Comandos focais

Podium:

```text
python -m unittest tests.test_bpt2_adapter -v
```

BPT2:

```text
dotnet build tests/BomPraTi.PodiumCatalogFeedFixture/BomPraTi.PodiumCatalogFeedFixture.csproj --configuration Release --nologo
```

Shared E2E:

```text
python scripts/bpt2_http_e2e.py
```

O E2E exige `BPT2_BASE_URL` e `BPT2_ACCESS_TOKEN` injetados fora do repositório e um host BPT2/PostgreSQL já iniciado com a mesma configuração em ambos os tratamentos.

## Execução de referência

No ambiente local/Codex, preparar dois checkouts detached nos heads congelados e um host BPT2 real. Em seguida:

```text
python scripts/rehearse-podium7-bpt2-topology.py \
  --bpt2-root <path-bpt2-at-cf08beb> \
  --podium-root <path-podium7-at-939f045> \
  --pairs 3 \
  --e2e \
  --output artifacts/podium7-bpt2-topology-rehearsal.json
```

No Windows/PowerShell, usar a mesma invocação com caminhos nativos; não passar a rota HTTP por Bash/MSYS.

## Métricas congeladas

Por classe e tratamento:

- materialização;
- patch efêmero;
- compute de gates reais;
- execução E2E quando aplicável;
- total compute;
- integration transactions;
- handoffs;
- checkpoints;
- CI surfaces;
- rollback units.

Diferença temporal só é material a partir de `20%` de delta mediano absoluto. Contagens estruturais não são convertidas em developer-hours.

## Path-scoped model

O modelo esperado é:

| Classe | Podium | BPT2 | E2E |
| --- | --- | --- | --- |
| `podium_only` | sim | não | não |
| `bpt2_only` | não | sim | não |
| `shared_integration` | sim | sim | sim |

Esse roteamento mede a propriedade necessária para um monorepo polyglot: mudanças isoladas não devem pagar suites do outro bounded context; mudanças compartilhadas devem executar ambos + E2E.

## Limite do harness atual

O tempo de bootstrap do host/PostgreSQL não é medido internamente pelo script. Portanto, o relatório final deve registrar separadamente o setup do host ou evoluir o harness antes de usar tempo de E2E como custo total de ambiente. Essa limitação não invalida as métricas estruturais nem os gates de build/test, mas impede alegar vantagem temporal completa do E2E a partir deste script sozinho.

## Acceptance

- [ ] 3/3 pares válidos para `podium_only`;
- [ ] 3/3 pares válidos para `bpt2_only`;
- [ ] 3/3 pares válidos para `shared_integration` com `--e2e`;
- [ ] criação/correção/redirect/replay/same VehicleId continuam PASS;
- [ ] artifact JSON retido;
- [ ] host/bootstrap timing registrado ou explicitamente excluído da interpretação temporal;
- [ ] resultado incorporado ao #205;
- [ ] conclusão somente `KEEP_TWO_REPOS`, `MIGRATE_TO_POLYGLOT_MONOREPO` ou `INSUFFICIENT_EVIDENCE`.

## Non-claims

Este plano não autoriza migração, shared database, runtime collapse, deployment unification nem Python → .NET rewrite.
