# Desenvolvimento local — BPT2

Este é o procedimento canônico para subir o BPT2 localmente a partir de um clone limpo. O objetivo é manter o ambiente de desenvolvimento reproduzível e próximo do que os gates executam no GitHub Actions.

Quando houver conflito entre este guia e comportamento executado pelo repositório, prevalece: código/testes/CI atuais → documentação oficial do fornecedor → este guia. Corrija o guia no mesmo PR em que a verdade executável mudar.

## Baseline verificado

- .NET 10; `global.json` fixa `10.0.401` com `rollForward: latestFeature`.
- ABP CLI `10.6.1` e `dotnet-ef` `10.0.12` vêm do manifest `.config/dotnet-tools.json`.
- PostgreSQL 17 é a versão exercitada pelos gates atuais.
- Node.js `24.21.0` é a versão exercitada pelo Public Web Gate e pelo Public Buyer HTTP Gate; `public-web/package.json` aceita `>=24.21.0`.
- API local canônica para o fluxo por shell: `http://127.0.0.1:5093`.
- Public web em desenvolvimento: `http://localhost:3000`.

O perfil `https://localhost:44350` existente em `main/BomPraTi/Properties/launchSettings.json` continua válido para IDE/template, mas não é o endpoint documentado para o fluxo reproduzível por shell do BPT2.

## Pré-requisitos

Instale somente o necessário para o slice que será executado:

1. Git.
2. SDK .NET 10 compatível com o `global.json`.
3. PostgreSQL 17, local ou em container.
4. Node.js 24.21.0 ou superior dentro da linha 24 LTS suportada pelo projeto, quando for trabalhar no `public-web`.
5. Bash para executar os scripts versionados do repositório. Em Windows, use um ambiente Bash compatível, como WSL ou Git Bash, para esses scripts.

Valide as ferramentas a partir da raiz do repositório:

```bash
dotnet --version
node --version
python3 --version
dotnet tool restore
```

`dotnet tool restore` deve resolver as versões versionadas no manifest do próprio repositório; não instale versões globais diferentes para “corrigir” um problema local sem evidência.

## PostgreSQL local

Os gates usam PostgreSQL 17 com database `BomPraTi`. Para reduzir diferença entre máquina local e CI, o exemplo abaixo usa as mesmas credenciais descartáveis do serviço de CI.

Se você já possui PostgreSQL 17, crie um database local equivalente e apenas ajuste `BPT_DB_CONNECTION`.

Uma opção com container é:

```bash
docker run --name bpt2-postgres \
  -e POSTGRES_DB=BomPraTi \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:17-alpine
```

Depois, na sessão de shell usada para o backend:

```bash
export BPT_DB_CONNECTION='Host=localhost;Port=5432;Database=BomPraTi;Username=postgres;Password=postgres'
```

Essas credenciais são exclusivamente de desenvolvimento local. Não reutilize esse padrão em produção nem versione credenciais reais.

## Primeiro bootstrap de um banco vazio

O baseline modular usa um DbContext por módulo. O gate de fresh database gera migrations efêmeras para os módulos e aplica todos os contexts no mesmo PostgreSQL.

**Execute o bloco abaixo somente contra um database local vazio/descartável.** `scripts/fresh-migration-gate.sh` gera arquivos em `Data/Migrations/Gate` durante a prova; eles não são fonte versionada de migrations e devem ser removidos depois do bootstrap local.

Da raiz do repositório:

```bash
export BPT_DB_CONNECTION='Host=localhost;Port=5432;Database=BomPraTi;Username=postgres;Password=postgres'

dotnet tool restore
bash scripts/fresh-migration-gate.sh

(
  cd main/BomPraTi
  export ConnectionStrings__Default="$BPT_DB_CONNECTION"
  export ASPNETCORE_ENVIRONMENT=Development
  dotnet run --configuration Release --no-build -- --migrate-database
)
```

O segundo comando segue o mecanismo de database migration/data seed do template single-layer do ABP e cria os dados de Identity/OpenIddict usados no ambiente de desenvolvimento, incluindo o cliente browser Seller quando configurado.

Depois de um bootstrap bem-sucedido, remova apenas as migrations efêmeras criadas pelo gate:

```bash
rm -rf \
  modules/catalog/src/BomPraTi.Catalog/Data/Migrations/Gate \
  modules/media/src/BomPraTi.Media/Data/Migrations/Gate \
  modules/sellers/src/BomPraTi.Sellers/Data/Migrations/Gate \
  modules/marketplace/src/BomPraTi.Marketplace/Data/Migrations/Gate \
  modules/ingestion/src/BomPraTi.Ingestion/Data/Migrations/Gate

git status --short
```

O `git status --short` deve voltar ao estado esperado antes de você começar a implementar sua mudança. Não use `git clean -fd` como atalho de onboarding, porque ele pode remover trabalho não relacionado.

Para recriar o baseline do zero posteriormente, descarte/recrie o database local e repita este bootstrap; não trate `fresh-migration-gate.sh` como um migrator incremental de um banco de desenvolvimento já existente.

## Subir a API

Em um terminal, a partir da raiz:

```bash
export BPT_DB_CONNECTION='Host=localhost;Port=5432;Database=BomPraTi;Username=postgres;Password=postgres'
export ConnectionStrings__Default="$BPT_DB_CONNECTION"
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS='http://127.0.0.1:5093'
export App__SelfUrl='http://127.0.0.1:5093'
export App__CorsOrigins='http://localhost:3000,http://127.0.0.1:3000'
export App__RedirectAllowedUrls='http://localhost:3000,http://127.0.0.1:3000'
export AuthServer__Authority='http://127.0.0.1:5093'
export AuthServer__RequireHttpsMetadata=false

dotnet run --project main/BomPraTi/BomPraTi.csproj
```

O uso de HTTP neste fluxo é restrito ao ambiente `Development`; o projeto possui configuração explícita para desabilitar a exigência de transport security do OpenIddict somente nesse cenário.

Verificação mínima:

```bash
curl --fail http://127.0.0.1:5093/swagger/v1/swagger.json >/dev/null
echo 'API local: OK'
```

Após o seed padrão, as credenciais de desenvolvimento usadas pelos smokes são `admin` / `1q2w3E*`. São dados locais do template/fixture, não credenciais de produção.

## Criar o primeiro Vehicle canônico sem fixture

Depois de subir a API contra um banco recém-bootstrapado, entre como `admin`, abra `http://127.0.0.1:5093/admin` e siga para **Catálogo canônico** (`/catalogo`). Informe marca, modelo, versão e ano-modelo; geração e seus anos são opcionais.

A operação administrativa cria ou reutiliza a árvore canônica `Brand → Model → Generation opcional → Version → Vehicle`. Repetir a mesma identidade retorna o mesmo `VehicleId`, que passa a aparecer imediatamente no catálogo público e pode ser usado por um Seller ao criar um Draft.

Esse é o caminho operacional suportado para popular manualmente o catálogo mínimo de um ambiente novo. `tests/BomPraTi.HttpLifecycleFixture` continua sendo uma fixture de teste e não é pré-requisito para esse bootstrap de produto.

Para reproduzir localmente a prova focal usada pelo CI em um database descartável já preparado por `fresh-migration-gate.sh` + seed do host:

```bash
export BPT_DB_CONNECTION='Host=localhost;Port=5432;Database=BomPraTi;Username=postgres;Password=postgres'
bash scripts/admin-canonical-catalog-http-smoke.sh
```

O smoke valida autorização admin, idempotência, leitura pública e criação de Draft Seller usando o `VehicleId` criado pela superfície administrativa, sem executar `BomPraTi.HttpLifecycleFixture`.

## Subir o public web

Em outro terminal:

```bash
cd public-web
npm install --no-audit --no-fund

export BPT_API_BASE_URL='http://127.0.0.1:5093'
export NEXT_PUBLIC_BPT_API_BASE_URL='http://127.0.0.1:5093'
export NEXT_PUBLIC_BPT_AUTHORITY='http://127.0.0.1:5093'
export NEXT_PUBLIC_BPT_SELLER_CLIENT_ID='BomPraTi_SellerWeb'

npm run dev
```

Abra `http://localhost:3000` para o comprador ou `http://localhost:3000/vender` para iniciar a experiência autenticada Seller.

- `BPT_API_BASE_URL` é usado pelo Next.js no servidor.
- `NEXT_PUBLIC_BPT_API_BASE_URL` é o endereço alcançável pelo browser para fotos públicas.
- `NEXT_PUBLIC_BPT_AUTHORITY` aponta o browser para o Auth Server/OpenIddict.
- `NEXT_PUBLIC_BPT_SELLER_CLIENT_ID` identifica o cliente público Seller; o login usa Authorization Code + PKCE e a senha é informada somente ao Auth Server.
- Não aponte o public web local para `44350` ou para uma porta arbitrária se estiver tentando reproduzir o fluxo documentado; altere a porta apenas quando a tarefa exigir e mantenha as variáveis alinhadas ao backend escolhido.

Antes de enviar mudança no frontend, execute o mesmo conjunto lógico do gate:

```bash
cd public-web
npm run check
```

## Prova ponta a ponta equivalente ao gate Buyer

Quando a mudança afetar o fluxo público e você precisar reproduzir localmente a prova mais forte disponível, comece com database vazio, faça o bootstrap acima e gere o Vehicle fixture canônico:

```bash
export BPT_FIXTURE_VEHICLE_ID="$(
  dotnet run \
    --project tests/BomPraTi.HttpLifecycleFixture/BomPraTi.HttpLifecycleFixture.csproj \
    --configuration Release | tail -n 1
)"

test -n "$BPT_FIXTURE_VEHICLE_ID"
```

Com `BPT_DB_CONNECTION` e `BPT_FIXTURE_VEHICLE_ID` definidos, execute:

```bash
bash scripts/public-buyer-http-smoke.sh
```

Esse smoke inicia host ABP e build de produção do Next.js em portas próprias (`5093`/`3093`) e prova Draft privado, Publish, listagem, detalhe, foto, metadata e CTA de WhatsApp. Não mantenha outra instância ocupando essas portas durante a execução.

## Prova da fronteira Seller/OIDC

Para validar somente o boundary de autenticação Seller contra um database local recém-bootstrapado:

```bash
export BPT_DB_CONNECTION='Host=localhost;Port=5432;Database=BomPraTi;Username=postgres;Password=postgres'
bash scripts/seller-auth-http-smoke.sh
```

O smoke verifica discovery OpenID Connect, exige PKCE para `BomPraTi_SellerWeb` e confirma que uma autorização válida com `code_challenge` é encaminhada para a página de login ABP. Ele não substitui o fluxo Seller end-to-end posterior.

## Validação proporcional ao risco

Não rode toda a suíte por ritual. Use `docs/QUALITY.md` para selecionar os checks da mudança.

Para mudança somente no harness/documentação:

```bash
python3 scripts/check-harness.py
```

Para frontend público/Seller:

```bash
cd public-web
npm run check
```

Para mudanças de domínio, persistência, auth, mídia ou boundary, siga a matriz específica de `docs/QUALITY.md` e os gates/scripts correspondentes.

## Diagnóstico rápido

### `dotnet` não usa a versão esperada

Execute `dotnet --version` na raiz, onde o `global.json` é descoberto. Instale um SDK .NET 10 compatível em vez de alterar o pin apenas para acomodar a máquina local.

### PostgreSQL não conecta

Confirme que o servidor está ouvindo em `localhost:5432`, que o database existe e que a string exportada em `BPT_DB_CONNECTION` é a mesma usada em `ConnectionStrings__Default`.

### O frontend não carrega dados/fotos

Confirme primeiro `http://127.0.0.1:5093/swagger/v1/swagger.json`. Depois reinicie o Next.js com `BPT_API_BASE_URL` e `NEXT_PUBLIC_BPT_API_BASE_URL` definidos antes do `npm run dev`.

### O Seller login volta com redirect URI inválida

Recrie/atualize o database local pelo bootstrap canônico para que `BomPraTi_SellerWeb` seja semeado com `http://localhost:3000/vender/callback`. Não altere redirect URI no browser para contornar o registro do Auth Server.

### Apareceram migrations `Gate` no `git status`

Isso é esperado após `fresh-migration-gate.sh`. Remova somente os cinco diretórios `Data/Migrations/Gate` listados neste guia. Eles são artefatos efêmeros do gate, não mudanças de produto.

## Fontes oficiais usadas para este procedimento

As decisões específicas do BPT2 vêm do código e CI versionados. As práticas e ferramentas foram conferidas nas fontes oficiais abaixo:

- OpenAI — Harness engineering: repository knowledge como system of record, progressive disclosure, ambiente bootável e feedback loops: https://openai.com/index/harness-engineering/
- Microsoft — `global.json` e seleção do SDK .NET: https://learn.microsoft.com/dotnet/core/tools/global-json
- PostgreSQL — documentação oficial da série 17: https://www.postgresql.org/docs/17/
- Node.js / OpenJS Foundation — política de releases e LTS: https://nodejs.org/en/about/previous-releases
- ABP — single-layer solution structure, database creation e seed por `dotnet run --migrate-database`: https://abp.io/docs/latest/solution-templates/single-layer-web-application/solution-structure

Essas referências não substituem o comportamento executado pelo repositório. Se uma recomendação externa mudar sem alterar o BPT2, reavalie antes de atualizar este guia mecanicamente.
