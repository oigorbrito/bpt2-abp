using System.Data.Common;
using System.Diagnostics;
using System.Reflection;
using System.Text;
using System.Text.Json;

const int SyntheticNegativeCount = 50_000;
double[] Cutoffs = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80];

var connectionString = Environment.GetEnvironmentVariable("BPT_DB_CONNECTION")
    ?? throw new InvalidOperationException("BPT_DB_CONNECTION is required.");
var baselinePath = Environment.GetEnvironmentVariable("BPT_DISCOVERY_BENCHMARK_OUTPUT")
    ?? throw new InvalidOperationException("BPT_DISCOVERY_BENCHMARK_OUTPUT is required.");
if (!File.Exists(baselinePath))
{
    throw new InvalidOperationException("Discovery baseline artifact does not exist.");
}

var fixturePath = Path.Combine(AppContext.BaseDirectory, "benchmarks", "discovery_br_v1.json");
var fixture = JsonSerializer.Deserialize<DiscoveryFixture>(
    await File.ReadAllTextAsync(fixturePath),
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
    ?? throw new InvalidOperationException("Discovery fixture could not be deserialized.");

AssertBaselineRegressionBoundary(baselinePath);

var typoQueries = fixture.Queries
    .Where(x => string.Equals(x.Family, "typo", StringComparison.Ordinal))
    .OrderBy(x => x.Id, StringComparer.Ordinal)
    .ToArray();
if (typoQueries.Length == 0)
{
    throw new InvalidOperationException("Frozen discovery fixture contains no typo queries.");
}

var npgsqlAssembly = Assembly.Load("Npgsql");
var connectionType = npgsqlAssembly.GetType("Npgsql.NpgsqlConnection")
    ?? throw new InvalidOperationException("NpgsqlConnection type was not found.");
var connection = Activator.CreateInstance(connectionType, connectionString) as DbConnection
    ?? throw new InvalidOperationException("NpgsqlConnection could not be created.");

await using (connection)
{
    await connection.OpenAsync();
    await ExecuteNonQueryAsync(connection, "CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    await ExecuteNonQueryAsync(connection, """
        DROP TABLE IF EXISTS typo_scale_candidates;
        CREATE TABLE typo_scale_candidates (
            candidate_key text PRIMARY KEY,
            brand text NOT NULL,
            model text NOT NULL,
            generation text NOT NULL,
            version text NOT NULL,
            is_frozen_positive boolean NOT NULL
        );
        """);

    foreach (var vehicle in fixture.Vehicles)
    {
        await InsertCandidateAsync(
            connection,
            vehicle.Key,
            Normalize(vehicle.Brand),
            Normalize(vehicle.Model),
            Normalize(vehicle.Generation ?? string.Empty),
            Normalize(vehicle.Version),
            true);
    }

    await ExecuteNonQueryAsync(connection, $"""
        INSERT INTO typo_scale_candidates(candidate_key, brand, model, generation, version, is_frozen_positive)
        SELECT
            'negative-' || lpad(g::text, 6, '0'),
            (ARRAY['hondai','toyoda','fiatte','chevrolat','volkswagem','renaut','nisan','hyunday'])[(g % 8) + 1] || ' ' || (g % 997)::text,
            (ARRAY['corona','crosser','stradda','ônixx','corsair','t-crossa','trackerx','citycar'])[(g % 8) + 1] || ' ' || (g % 4999)::text,
            'generation ' || (g % 211)::text,
            (ARRAY['premierx','highland','comfort','rancher','hybrido','turbox','windy','xrxs'])[(g % 8) + 1] || ' ' || (g % 10007)::text,
            false
        FROM generate_series(1, {SyntheticNegativeCount}) AS g;
        """);

    await ExecuteNonQueryAsync(connection, """
        CREATE INDEX typo_scale_brand_trgm ON typo_scale_candidates USING gin (brand gin_trgm_ops);
        CREATE INDEX typo_scale_model_trgm ON typo_scale_candidates USING gin (model gin_trgm_ops);
        CREATE INDEX typo_scale_generation_trgm ON typo_scale_candidates USING gin (generation gin_trgm_ops);
        CREATE INDEX typo_scale_version_trgm ON typo_scale_candidates USING gin (version gin_trgm_ops);
        ANALYZE typo_scale_candidates;
        """);

    var queryReports = new List<QueryReport>();
    foreach (var query in typoQueries)
    {
        var normalized = Normalize(query.Term);
        var targets = query.Targets.ToHashSet(StringComparer.Ordinal);
        var rows = await LoadScoresAsync(connection, normalized);
        if (rows.Count != SyntheticNegativeCount + fixture.Vehicles.Length)
        {
            throw new InvalidOperationException($"Unexpected candidate cardinality for {query.Id}: {rows.Count}");
        }

        var control = EvaluateControl(rows, targets);
        var methods = new[]
        {
            EvaluateMethod("similarity", rows, targets, x => x.Similarity, Cutoffs),
            EvaluateMethod("word_similarity", rows, targets, x => x.WordSimilarity, Cutoffs),
            EvaluateMethod("strict_word_similarity", rows, targets, x => x.StrictWordSimilarity, Cutoffs)
        };
        queryReports.Add(new QueryReport(query.Id, query.Term, query.Targets, control, methods));
    }

    await ExecuteNonQueryAsync(connection, "SET pg_trgm.similarity_threshold = 0.40;");
    var planner = new List<PlannerReport>();
    foreach (var query in typoQueries)
    {
        planner.Add(new PlannerReport(
            query.Id,
            "similarity_operator_cutoff_0.40",
            await ExplainAsync(connection, Normalize(query.Term))));
    }

    var aggregates = queryReports
        .SelectMany(q => q.Methods)
        .GroupBy(x => x.Method, StringComparer.Ordinal)
        .OrderBy(x => x.Key, StringComparer.Ordinal)
        .Select(group => new MethodAggregate(
            group.Key,
            group.Average(x => x.Mrr),
            group.Average(x => x.RecallAtTargetCount),
            group.Sum(x => x.NonTargetAheadOfFirstTarget),
            Cutoffs.Select(cutoff => new CutoffAggregate(
                cutoff,
                group.Sum(x => x.Cutoffs.Single(c => Math.Abs(c.Cutoff - cutoff) < 0.000001).EligibleTargetCount),
                group.Sum(x => x.Cutoffs.Single(c => Math.Abs(c.Cutoff - cutoff) < 0.000001).EligibleNonTargetCount)))
            .ToArray()))
        .ToArray();

    var report = new BenchmarkReport(
        "bpt2.discovery-large-cardinality-typo.v1",
        Environment.GetEnvironmentVariable("GITHUB_SHA") ?? "local",
        SyntheticNegativeCount,
        fixture.Vehicles.Length,
        SyntheticNegativeCount + fixture.Vehicles.Length,
        Cutoffs,
        queryReports,
        aggregates,
        planner,
        new[]
        {
            "Benchmark-only evidence. This run does not authorize a production fuzzy-search implementation or cutoff.",
            "The 50,000 negative candidates are deterministic and frozen by source code before scorer execution.",
            "Cutoffs 0.30 through 0.80 are an evaluation grid only; PostgreSQL extension defaults are not product policy.",
            "The existing frozen discovery baseline must retain exact and presentation MRR/Recall=1 and FP=0 before this fixture runs.",
            "Any production promotion requires a separate minimal PR after reviewing retained evidence."
        });

    var outputPath = Environment.GetEnvironmentVariable("BPT_LARGE_CARDINALITY_TYPO_OUTPUT")
        ?? Path.Combine("artifacts", "discovery-large-cardinality-typo.json");
    Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath))!);
    await File.WriteAllTextAsync(
        outputPath,
        JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }) + Environment.NewLine,
        Encoding.UTF8);

    Console.WriteLine($"LARGE_CARDINALITY_TYPO_CANDIDATES: {report.TotalCandidateCount}");
    var controlTargetHits = queryReports.Sum(x => x.ProductionSubstringControl.EligibleTargetCount);
    var controlTargetTotal = queryReports.Sum(x => x.ProductionSubstringControl.TargetCount);
    var controlFalsePositives = queryReports.Sum(x => x.ProductionSubstringControl.EligibleNonTargetCount);
    Console.WriteLine(
        $"LARGE_CARDINALITY_TYPO_SUBSTRING_CONTROL: eligible_targets={controlTargetHits}/{controlTargetTotal} " +
        $"eligible_non_targets={controlFalsePositives}");
    foreach (var plan in planner)
    {
        var usesTrigramIndex =
            plan.Explain.Contains("typo_scale_brand_trgm", StringComparison.Ordinal) ||
            plan.Explain.Contains("typo_scale_model_trgm", StringComparison.Ordinal) ||
            plan.Explain.Contains("typo_scale_generation_trgm", StringComparison.Ordinal) ||
            plan.Explain.Contains("typo_scale_version_trgm", StringComparison.Ordinal);
        Console.WriteLine(
            $"LARGE_CARDINALITY_TYPO_PLANNER_{plan.QueryId.ToUpperInvariant().Replace('-', '_')}: " +
            $"uses_trigram_index={usesTrigramIndex}");
    }
    foreach (var aggregate in aggregates)
    {
        Console.WriteLine(
            $"LARGE_CARDINALITY_TYPO_{aggregate.Method.ToUpperInvariant()}: " +
            $"mrr={aggregate.AverageMrr:F4} recall={aggregate.AverageRecallAtTargetCount:F4} " +
            $"non_target_ahead={aggregate.TotalNonTargetAheadOfFirstTarget}");
        foreach (var cutoff in aggregate.Cutoffs)
        {
            Console.WriteLine(
                $"  cutoff={cutoff.Cutoff:F2} eligible_targets={cutoff.EligibleTargetCount} " +
                $"eligible_non_targets={cutoff.EligibleNonTargetCount}");
        }
    }
    Console.WriteLine($"LARGE_CARDINALITY_TYPO_ARTIFACT: {outputPath}");
}

static void AssertBaselineRegressionBoundary(string path)
{
    using var document = JsonDocument.Parse(File.ReadAllText(path));
    var results = GetProperty(document.RootElement, "QueryResults", "queryResults");

    foreach (var result in results.EnumerateArray())
    {
        var family = GetProperty(result, "Family", "family").GetString();
        if (family is not ("exact" or "presentation"))
        {
            continue;
        }
        foreach (var side in new[] { ("CatalogMetrics", "catalogMetrics"), ("PublicMetrics", "publicMetrics") })
        {
            var metrics = GetProperty(result, side.Item1, side.Item2);
            var mrr = GetProperty(metrics, "Mrr", "mrr").GetDouble();
            var recall = GetProperty(metrics, "Recall", "recall").GetDouble();
            var fp = GetProperty(metrics, "FalsePositiveCount", "falsePositiveCount").GetInt32();
            if (Math.Abs(mrr - 1d) > 0.0000001 || Math.Abs(recall - 1d) > 0.0000001 || fp != 0)
            {
                var id = GetProperty(result, "Id", "id").GetString();
                throw new InvalidOperationException($"Regression boundary failed for {id} / {side.Item1}.");
            }
        }
    }
}

static JsonElement GetProperty(JsonElement element, string pascalName, string camelName)
{
    if (element.TryGetProperty(pascalName, out var value) || element.TryGetProperty(camelName, out value))
    {
        return value;
    }
    throw new InvalidOperationException($"Required JSON property {pascalName} is missing.");
}

static string Normalize(string value) => value.Trim().ToLowerInvariant().Replace('-', ' ');

static async Task InsertCandidateAsync(
    DbConnection connection,
    string key,
    string brand,
    string model,
    string generation,
    string version,
    bool positive)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        INSERT INTO typo_scale_candidates(candidate_key, brand, model, generation, version, is_frozen_positive)
        VALUES (@key, @brand, @model, @generation, @version, @positive);
        """;
    Add(command, "key", key);
    Add(command, "brand", brand);
    Add(command, "model", model);
    Add(command, "generation", generation);
    Add(command, "version", version);
    Add(command, "positive", positive);
    await command.ExecuteNonQueryAsync();
}

static async Task<List<ScoreRow>> LoadScoresAsync(DbConnection connection, string query)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        SELECT
            candidate_key,
            GREATEST(similarity(@query, brand), similarity(@query, model), similarity(@query, generation), similarity(@query, version)),
            GREATEST(word_similarity(@query, brand), word_similarity(@query, model), word_similarity(@query, generation), word_similarity(@query, version)),
            GREATEST(strict_word_similarity(@query, brand), strict_word_similarity(@query, model), strict_word_similarity(@query, generation), strict_word_similarity(@query, version)),
            (position(@query in brand) > 0 OR position(@query in model) > 0 OR position(@query in generation) > 0 OR position(@query in version) > 0)
        FROM typo_scale_candidates
        ORDER BY candidate_key;
        """;
    Add(command, "query", query);
    var rows = new List<ScoreRow>();
    await using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        rows.Add(new ScoreRow(
            reader.GetString(0),
            Convert.ToDouble(reader.GetValue(1)),
            Convert.ToDouble(reader.GetValue(2)),
            Convert.ToDouble(reader.GetValue(3)),
            reader.GetBoolean(4)));
    }
    return rows;
}

static ControlEvaluation EvaluateControl(IReadOnlyList<ScoreRow> rows, HashSet<string> targets)
{
    var eligibleTargets = rows.Count(x => x.SubstringMatch && targets.Contains(x.Key));
    var eligibleNonTargets = rows.Count(x => x.SubstringMatch && !targets.Contains(x.Key));
    return new ControlEvaluation(eligibleTargets, targets.Count, eligibleNonTargets);
}

static MethodEvaluation EvaluateMethod(
    string method,
    IReadOnlyList<ScoreRow> rows,
    HashSet<string> targets,
    Func<ScoreRow, double> score,
    IReadOnlyList<double> cutoffs)
{
    var ranked = rows.OrderByDescending(score).ThenBy(x => x.Key, StringComparer.Ordinal).ToArray();
    var firstRelevant = Array.FindIndex(ranked, x => targets.Contains(x.Key));
    var mrr = firstRelevant < 0 ? 0d : 1d / (firstRelevant + 1);
    var k = targets.Count;
    var recall = k == 0 ? 1d : (double)ranked.Take(k).Count(x => targets.Contains(x.Key)) / k;
    var cutoffResults = cutoffs.Select(cutoff => new CutoffEvaluation(
        cutoff,
        rows.Count(x => targets.Contains(x.Key) && score(x) >= cutoff),
        rows.Count(x => !targets.Contains(x.Key) && score(x) >= cutoff)))
        .ToArray();
    return new MethodEvaluation(method, mrr, recall, firstRelevant < 0 ? rows.Count : firstRelevant, cutoffResults);
}

static async Task<string> ExplainAsync(DbConnection connection, string query)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT candidate_key
        FROM typo_scale_candidates
        WHERE brand % @query OR model % @query OR generation % @query OR version % @query;
        """;
    Add(command, "query", query);
    var stopwatch = Stopwatch.StartNew();
    var value = await command.ExecuteScalarAsync();
    stopwatch.Stop();
    return $"elapsed_ms={stopwatch.Elapsed.TotalMilliseconds:F3}; plan={value}";
}

static async Task ExecuteNonQueryAsync(DbConnection connection, string sql)
{
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    await command.ExecuteNonQueryAsync();
}

static void Add(DbCommand command, string name, object value)
{
    var parameter = command.CreateParameter();
    parameter.ParameterName = name;
    parameter.Value = value;
    command.Parameters.Add(parameter);
}

record DiscoveryFixture(VehicleFixture[] Vehicles, QueryFixture[] Queries);
record VehicleFixture(string Key, string Brand, string Model, string? Generation, string Version);
record QueryFixture(string Id, string Family, string Term, string[] Targets);
record ScoreRow(string Key, double Similarity, double WordSimilarity, double StrictWordSimilarity, bool SubstringMatch);
record ControlEvaluation(int EligibleTargetCount, int TargetCount, int EligibleNonTargetCount);
record CutoffEvaluation(double Cutoff, int EligibleTargetCount, int EligibleNonTargetCount);
record MethodEvaluation(string Method, double Mrr, double RecallAtTargetCount, int NonTargetAheadOfFirstTarget, CutoffEvaluation[] Cutoffs);
record QueryReport(string Id, string Term, string[] Targets, ControlEvaluation ProductionSubstringControl, MethodEvaluation[] Methods);
record PlannerReport(string QueryId, string Predicate, string Explain);
record CutoffAggregate(double Cutoff, int EligibleTargetCount, int EligibleNonTargetCount);
record MethodAggregate(string Method, double AverageMrr, double AverageRecallAtTargetCount, int TotalNonTargetAheadOfFirstTarget, CutoffAggregate[] Cutoffs);
record BenchmarkReport(
    string Schema,
    string CodeSha,
    int SyntheticNegativeCount,
    int FrozenPositiveCount,
    int TotalCandidateCount,
    double[] EvaluationCutoffs,
    IReadOnlyList<QueryReport> QueryResults,
    IReadOnlyList<MethodAggregate> MethodAggregates,
    IReadOnlyList<PlannerReport> PlannerEvidence,
    string[] Notes);
