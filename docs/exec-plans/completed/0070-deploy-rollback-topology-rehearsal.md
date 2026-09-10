# Plan 0070 — Deploy / rollback topology rehearsal

Status: **CONCLUÍDO**

## Objetivo

Reduzir a incerteza arquitetural restante entre topologia de repositório e topologia de deployment, ensaiando rollout e rollback de uma mudança de contrato+consumer em estados old/new.

O estudo separou explicitamente repository topology, integration topology e deployment topology. `monorepo` não foi tratado como sinônimo de deploy atômico.

## Baseline congelado

- repositório canônico: `oigorbrito/bpt2-abp`;
- `main` de origem: `2a6d3b4a0578a722ef5f0d7cef8dfa748d8401a6`;
- contrato real de referência: `modules/catalog/src/BomPraTi.Catalog.Contracts/VehicleRefDto.cs`;
- consumidor experimental criado somente em snapshots temporários;
- nenhuma feature experimental integrada ao produto.

## Resultado autoritativo

Run: `34470754686`

Artifact: `10149475855`

Artifact SHA-256: `a8a9d6c52bd0c2ff99cb88f9a1ed488736cfad6cb474769dbe766708d87cd78a`

Head medido: `ee898dcbede2ebb2bb41fc816653cfd440747cbd`

### Classificação da evidência

- builds/checks dos artifacts: `OBSERVED_BUILD_CHECK`;
- transições de deployment por pointers/manifests temporários: `REHEARSED_DEPLOYMENT`;
- deployment de produção: `NOT_MEASURED`.

### Compatible

Build/check:

- backend Contracts build: PASS;
- frontend install: PASS;
- frontend check: PASS.

Matriz B0/B1 × F0/F1: todos os quatro estados são compatíveis.

Combined deployment unit:

- rollout: B0/F0 -> B1/F1;
- rollback: B1/F1 -> B0/F0;
- rollout transitions: **1**;
- rollback transitions: **1**;
- contract handoffs: **0**;
- intermediate incompatible states: **0**.

Split deployment units:

- rollout válido sem bridge: B0/F0 -> B1/F0 -> B1/F1;
- rollback válido sem bridge: B1/F1 -> B0/F1 -> B0/F0;
- rollout transitions: **2**;
- rollback transitions: **2**;
- contract handoffs mínimos: **1**;
- bridge required: **false**.

Ambas as ordens diretas backend-first e frontend-first foram compatíveis neste workload.

### Breaking

Build/check:

- backend Contracts build: PASS;
- frontend F1 install/check: PASS;
- bridge frontend check: PASS.

Estados incompatíveis pré-declarados foram reproduzidos:

- B1/F0: incompatível;
- B0/F1: incompatível.

Combined deployment unit:

- rollout: B0/F0 -> B1/F1;
- rollback: B1/F1 -> B0/F0;
- rollout transitions: **1**;
- rollback transitions: **1**;
- intermediate incompatible states: **0**.

Split deployment units:

- rollout sem bridge: **nenhum caminho válido**;
- rollback sem bridge: **nenhum caminho válido**;
- ambos os candidatos diretos backend-first/frontend-first passam por estado incompatível;
- bridge required: **true**;
- rollout com bridge: B0/F0 -> BB/F0 -> BB/F1 -> B1/F1;
- rollback com bridge: B1/F1 -> BB/F1 -> BB/F0 -> B0/F0;
- rollout transitions com bridge: **3**;
- rollback transitions com bridge: **3**;
- contract handoffs mínimos: **1**.

## Interpretação contra regras pré-declaradas

- mudança compatible: ambas as deployment topologies têm caminho válido; split acrescenta boundaries/transitions explícitas, mas não exige bridge;
- mudança breaking: no workload ensaiado, split não possui caminho válido de rollout/rollback sem versão-ponte ou coordenação equivalente;
- uma deployment unit combinada evita os estados intermediários incompatíveis do workload porque backend+frontend avançam/revertem no mesmo transition;
- isso **não** demonstra que um monorepo real tenha deploy atômico; combined deployment unit foi um tratamento explícito do experimento;
- não há conversão de transições/handoffs em horas, custo ou produtividade humana;
- deployment de produção não foi medido.

## Threats to validity

- deployment foi ensaiado por pointers/manifests locais, não infraestrutura de produção;
- workloads compatible/breaking são sintéticos, embora baseados em superfície real de contrato;
- compatibilidade semântica foi declarada no workload e testada pelo consumer experimental, não inferida genericamente;
- registry/network/deployment platform não foram medidos;
- resultados não medem esforço cognitivo nem produtividade humana.

## Progress log

- 2026-09-10: repositório canônico identificado como `oigorbrito/bpt2-abp`; permissão de branch confirmada.
- 2026-09-10: protocolo pré-registrado antes dos resultados; draft PR #195 aberto.
- 2026-09-10: Harness inicial falhou apenas pela ausência das seções obrigatórias `Progress log` e `Decision log`; método e thresholds permaneceram inalterados.
- 2026-09-10: Harness corrigido e verde.
- 2026-09-10: run `34470754686` concluiu com sucesso e publicou artifact reproduzível.

## Decision log

- 2026-09-10: separar repository, integration e deployment topology para evitar a hipótese inválida `monorepo = deploy atômico`.
- 2026-09-10: usar `VehicleRefDto` como superfície real de contrato, mantendo alterações experimentais somente em snapshots temporários.
- 2026-09-10: compilar a assembly `BomPraTi.Catalog.Contracts` no workload breaking para medir validade do artifact de contrato sem introduzir falha incidental no host completo.
- 2026-09-10: classificar troca de manifests/pointers como `REHEARSED_DEPLOYMENT`, nunca como deployment de produção observado.
- 2026-09-10: registrar que compatible split é operacionalmente viável sem bridge; breaking split exige bridge/coordinated rollout neste workload.

## Critérios de aceite

- [x] protocolo registrado antes dos resultados;
- [x] compatible e breaking executados;
- [x] build/check real dos artifacts new;
- [x] rollout e rollback combined/split ensaiados;
- [x] estados incompatíveis registrados;
- [x] bridge requirement registrado para breaking;
- [x] artifact machine-readable;
- [x] interpretação limitada à evidência;
- [x] plano arquivado;
- [ ] checks/review verdes no head final.
