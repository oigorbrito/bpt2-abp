# Plan 0070 — Deploy / rollback topology rehearsal

Status: **ATIVO**

## Objetivo

Reduzir a incerteza arquitetural restante entre topologia de repositório e topologia de deployment, ensaiando rollout e rollback de uma mudança de contrato+consumer em estados old/new.

Este estudo separa explicitamente:

- repository topology: combined vs split;
- integration topology: um change-set vs change-sets separados;
- deployment topology: unidade combinada vs backend/frontend independentes.

`monorepo` não será tratado como sinônimo de deploy atômico.

## Baseline congelado

- repositório canônico: `oigorbrito/bpt2-abp`;
- `main` de origem: `2a6d3b4a0578a722ef5f0d7cef8dfa748d8401a6`;
- contrato real de referência: `modules/catalog/src/BomPraTi.Catalog.Contracts/VehicleRefDto.cs`;
- consumidor experimental: somente em snapshots temporários;
- nenhuma feature experimental será integrada ao produto.

## Cenários pré-declarados

### Compatible

Backend novo adiciona um campo opcional. Frontend novo sabe consumi-lo, mas frontend antigo continua válido contra backend novo.

Estados válidos esperados:

- B0/F0
- B1/F0
- B1/F1
- B0/F1, desde que o frontend novo trate ausência do campo com fallback.

### Breaking

Backend novo remove/renomeia semanticamente um campo exigido pelo frontend antigo. Frontend novo acompanha o novo contrato.

Estados intermediários B1/F0 e B0/F1 são classificados como incompatíveis, salvo se houver uma versão-ponte explicitamente materializada.

## Tratamentos

### Combined deployment unit

Backend e frontend avançam ou revertem juntos.

Métricas estruturais:

- deploy transitions;
- rollback transitions;
- intermediate incompatible states;
- contract handoffs;
- bridge versions required.

### Split deployment units

Backend e frontend podem avançar/reverter separadamente. Para cada cenário, o harness procura uma sequência válida de rollout e rollback e registra todas as transições realmente ensaiadas no state machine.

## Evidência executável

O harness deve:

1. materializar snapshots temporários old/new;
2. aplicar workload compatible e breaking somente nas cópias;
3. executar build backend e install/check frontend para artifacts new onde aplicável;
4. construir manifests versionados B0/B1/F0/F1;
5. executar uma máquina de estados de deploy/rollback;
6. verificar compatibilidade de cada estado contra regras explícitas do cenário;
7. produzir artifact JSON com sequências, estados incompatíveis, checkpoints e classificação da evidência.

Partes que usam builds/checks reais são `OBSERVED_BUILD_CHECK`.

A troca de pointers/manifests em diretórios temporários é `REHEARSED_DEPLOYMENT`.

Nenhuma claim será rotulada `OBSERVED_PRODUCTION_DEPLOYMENT`.

## Regras de decisão pré-declaradas

- qualquer artifact new que não compile/passe check invalida o respectivo cenário;
- compatible: se split exigir mais transições/handoffs que combined, reportar diferença estrutural, sem converter em produtividade humana;
- breaking: se não existir caminho split válido sem estado incompatível, exigir bridge/coordinated rollout para esse workload;
- se uma bridge tornar o caminho válido, registrar custo estrutural adicional da bridge;
- nenhum resultado isolado prova superioridade global de monorepo ou multi-repo;
- não converter número de transições em horas/custo humano;
- não alterar regras de compatibilidade após observar resultado.

## Thresholds

Este estudo é predominantemente estrutural. Não há threshold temporal porque o foco é validade de estados e número mínimo de transições.

Para selecionar arquitetura ao final da série 0062–0070, o 0070 só pode contribuir com:

- existência ou ausência de caminho de rollout/rollback válido;
- necessidade de bridge/coordinated deployment;
- quantidade observável de boundaries/transitions.

## Threats to validity

- deployment é ensaiado por pointers/manifests locais, não infraestrutura de produção;
- workload compatible/breaking é sintético, embora baseado em uma superfície real de contrato;
- compatibilidade semântica é declarada no workload e testada pelo consumer experimental; não é inferida genericamente;
- ausência de latência de registry/network/deployment platform;
- resultados não medem esforço cognitivo nem produtividade humana.

## Progress log

- 2026-09-10: `main` canônico confirmado em `2a6d3b4a0578a722ef5f0d7cef8dfa748d8401a6` após transferência do repositório para `oigorbrito/bpt2-abp`.
- 2026-09-10: protocolo pré-registrado antes dos resultados; draft PR #195 aberto.
- 2026-09-10: Harness identificou apenas ausência das seções obrigatórias `Progress log` e `Decision log`; método, cenários e thresholds não foram alterados.

## Decision log

- 2026-09-10: separar repository, integration e deployment topology para evitar a hipótese inválida `monorepo = deploy atômico`.
- 2026-09-10: usar `VehicleRefDto` como superfície real de contrato, mantendo alterações experimentais somente em snapshots temporários.
- 2026-09-10: compilar a assembly `BomPraTi.Catalog.Contracts` no workload breaking para medir validade do artifact de contrato sem introduzir falha incidental no host completo.
- 2026-09-10: classificar troca de manifests/pointers como `REHEARSED_DEPLOYMENT`, nunca como deployment de produção observado.

## Critérios de aceite

- protocolo registrado antes dos resultados;
- compatible e breaking executados;
- build/check real dos artifacts new;
- rollout e rollback combined/split ensaiados;
- estados incompatíveis registrados;
- bridge requirement registrado para breaking;
- artifact machine-readable;
- interpretação limitada à evidência;
- plano arquivado;
- checks/review verdes no head final.
