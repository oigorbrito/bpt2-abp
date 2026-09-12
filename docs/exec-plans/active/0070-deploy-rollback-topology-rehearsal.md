# Plan 0070 — Deploy / rollback topology rehearsal

Status: **ATIVO**

## Objetivo

Comparar, sob o mesmo contrato de deployment, as transições mínimas de rollout e rollback em topologia combinada e split para mudanças compatível e breaking.

## Protocolo pré-registrado

Estados: `BO`, `BN`, `FO`, `FN` (backend antigo/novo e frontend antigo/novo).

Unidades: combined (`B+F`) e split (`B`, `F`). A topologia do repositório não implica deployment atômico.

Métricas: transições de deployment, estados intermediários compatíveis/incompatíveis, versão-ponte, rollback transitions, ordering, contract handoffs, checkpoints, failure windows e coordenação entre unidades.

Threshold: diferença material somente se uma métrica temporal atingir 20%; contagens estruturais são reportadas sem convertê-las em esforço humano.

Classificação: `REHEARSED` para a máquina de estados executada localmente; `MODELED` para transições operacionais, pois não houve dois processos/containers de produção implantados.

## Cenários

- Compatível: `BO/B?` e `BN/FN` permanecem compatíveis; rollout e rollback podem ocorrer em qualquer ordem válida.
- Breaking: somente `BO/FO` e `BN/FN` são compatíveis; exige versão-ponte ou ordering estrito.

## Ameaças à validade

- modelo não observa orquestrador, rede, processo ou tráfego real;
- workload não mede disponibilidade, latência ou carga;
- contagens estruturais não representam custo humano;
- compatibilidade é uma propriedade declarada do cenário, não inferência semântica do contrato.

## Critérios de aceite

- [ ] protocolo registrado antes do resultado;
- [ ] quatro estados modelados nos dois cenários;
- [ ] transições válidas e inválidas testadas;
- [ ] rollout e rollback executados para combined e split;
- [ ] artifact JSON reproduzível;
- [ ] limitações e classificação `REHEARSED`/`MODELED` registradas.

## Progress log

- 2026-09-09: branch criada sobre `origin/main` em `2a6d3b4a…` após validação de escrita local.
- 2026-09-09: protocolo e script executável adicionados antes da execução.
- 2026-09-09: rehearsal local produziu 8 combinações e artifact JSON.

## Decision log

- 2026-09-09: usar estados explícitos `(backend, frontend)` e não inferir deployment atômico a partir da topologia do repositório.
- 2026-09-09: classificar a máquina de estados como `REHEARSED` e o deployment como `MODELED`, pois não houve processos/containers reais implantados.
- 2026-09-09: não transformar contagens de checkpoints ou coordenação em horas, produtividade ou custo.
