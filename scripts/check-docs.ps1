$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "README.md",
    "AGENTS.md",
    "catalog-info.yaml",
    "mkdocs.yml",
    "docs/index.md",
    "docs/architecture.md",
    "docs/development.md",
    "docs/runbook.md"
)

$missingFiles = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }
if ($missingFiles.Count -gt 0) {
    throw "Required files are missing: $($missingFiles -join ', ')"
}

$decisionFiles = Get-ChildItem -LiteralPath "docs/decisions" -Filter "*.md" -File -ErrorAction SilentlyContinue
if ($decisionFiles.Count -eq 0) {
    throw "docs/decisions must contain at least one decision file."
}

$agentText = Get-Content -LiteralPath "AGENTS.md" -Raw
$agentSections = [regex]::Matches($agentText, "(?m)^##\s+\S.*$")
if ($agentSections.Count -lt 5) {
    throw "AGENTS.md must contain at least five rule sections."
}

$catalogText = Get-Content -LiteralPath "catalog-info.yaml" -Raw
if ($catalogText -notmatch "backstage\.io/techdocs-ref:\s*dir:\.") {
    throw "catalog-info.yaml has no backstage.io/techdocs-ref: dir:."
}
if ($catalogText -notmatch "github\.com/project-slug:\s*\S+/\S+") {
    throw "catalog-info.yaml has no github.com/project-slug."
}

$mkdocsText = Get-Content -LiteralPath "mkdocs.yml" -Raw
if ($mkdocsText -notmatch "(?m)^docs_dir:\s*docs\s*$") {
    throw "mkdocs.yml must contain docs_dir: docs."
}

Write-Host "Documentation follows the project standard."
