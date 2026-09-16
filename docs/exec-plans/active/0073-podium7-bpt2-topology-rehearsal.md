# Plan 0073 — Podium7 ↔ BPT2 topology rehearsal

Status: **ATIVO / EXECUÇÃO CONTROLADA PENDENTE**

Issue: #207

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

## Isolamento do bootstrap de migrations

`scripts/fresh-migration-gate.sh` gera arquivos de migration. Por isso nenhum runner pode executá-lo no checkout BPT2 usado como fonte da medição.

Os runners agora criam um **worktree detached descartável** no SHA BPT2 congelado exclusivamente para gerar/aplicar migrations. Depois confirmam novamente que os checkouts BPT2 e Podium7 medidos continuam limpos. Isso preserva a identidade exata do source state medido.

## Runner Windows / Codex

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
- remove host, container e worktree no `finally`.

## Runner Linux / VPS

`scripts/run-podium7-bpt2-topology-rehearsal-vps.sh`

Esse runner é a fronteira recomendada para uma VPS Ubuntu. Ele reproduz o mesmo protocolo sem depender de PowerShell e exige:

- `git`;
- `docker` com daemon acessível ao usuário;
- `.NET SDK 10` / `dotnet`;
- `python3`;
- `bash`;
- `curl`;
- dois checkouts limpos exatamente nos SHAs congelados.

Credenciais não são commitadas. Antes da execução, exportar apenas no ambiente da sessão:

```bash
export BPT2_ADMIN_USER='<test-admin-user>'
export BPT2_ADMIN_PASSWORD='<test-admin-password>'
```

Execução:

```bash
bash scripts/run-podium7-bpt2-topology-rehearsal-vps.sh \
  --bpt2-root /srv/bpt2-cf08beb \
  --podium-root /srv/podium7-939f045 \
  --pairs 3 \
  --output artifacts/podium7-bpt2-topology-rehearsal.json
```

Por padrão o host BPT2 usa `5110` e PostgreSQL é publicado em `55432`, reduzindo colisão com uma instância local padrão em `5432`. Ambos podem ser alterados por argumentos/env.

## Perfil VPS recomendado para esta medição

Piso operacional: **4 vCPU, 8 GB RAM e 80 GB SSD/NVMe**. Para reduzir pressão de memória/cache durante repetições e builds, **12–16 GB RAM** é preferível. A capacidade da máquina deve permanecer estável durante todos os pares; não misturar resultados de VPSs com tamanhos diferentes no mesmo conjunto de evidência.

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

- VPS/local execution não mede timing do GitHub-hosted Actions.
- Materialização usa cópia local, não clone remoto/rede.
- Bootstrap é medido uma vez e fica fora das repetições pareadas; não deve ser atribuído diferencialmente a uma topologia.
- O snapshot monorepo é colocalização de source trees; deployment/version compatibility continuam independentes.
- Marcadores efêmeros medem roteamento/seleção de gates, não uma feature de produto.
- Contagens estruturais são modelo pré-registrado, não esforço observado.

## Acceptance

- [ ] 3/3 pares válidos para `podium_only`;
- [ ] 3/3 pares válidos para `bpt2_only`;
- [ ] 3/3 pares válidos para `shared_integration` com `--e2e`;
- [ ] BPT2 fixture executa e passa em todos os tratamentos aplicáveis;
- [ ] criação/correção/redirect/replay/same VehicleId continuam PASS;
- [ ] checkouts medidos permanecem limpos;
- [ ] artifact JSON principal retido;
- [ ] bootstrap artifact retido;
- [ ] resultado incorporado ao #205;
- [ ] conclusão somente `KEEP_TWO_REPOS`, `MIGRATE_TO_POLYGLOT_MONOREPO` ou `INSUFFICIENT_EVIDENCE`.

## Non-claims

Este plano não autoriza migração, shared database, runtime collapse, deployment unification nem Python → .NET rewrite.
