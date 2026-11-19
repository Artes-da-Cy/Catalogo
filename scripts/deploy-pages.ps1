$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$staticFiles = @(
  "index.html",
  "admin.html",
  "carrinho.html",
  "categoria.html",
  "produto.html"
)
$staticDirectories = @("css", "js")
$deployDirectory = Join-Path `
  ([System.IO.Path]::GetTempPath()) `
  ("artesdacy-pages-" + [Guid]::NewGuid().ToString("N"))

foreach ($path in ($staticFiles + $staticDirectories)) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $path))) {
    throw "Arquivo ou pasta necessário para o site não encontrado: $path"
  }
}

New-Item -ItemType Directory -Path $deployDirectory | Out-Null

try {
  foreach ($file in $staticFiles) {
    Copy-Item `
      -LiteralPath (Join-Path $projectRoot $file) `
      -Destination $deployDirectory
  }

  foreach ($directory in $staticDirectories) {
    Copy-Item `
      -LiteralPath (Join-Path $projectRoot $directory) `
      -Destination $deployDirectory `
      -Recurse
  }

  Write-Host "Arquivos estáticos preparados para o deploy:"
  Get-ChildItem -LiteralPath $deployDirectory -File -Recurse |
    ForEach-Object {
      Write-Host (" - " + $_.FullName.Substring($deployDirectory.Length + 1))
    }

  Push-Location $projectRoot
  try {
    & npx.cmd wrangler pages deploy $deployDirectory `
      --project-name artesdacy `
      --branch production

    if ($LASTEXITCODE -ne 0) {
      throw "O deploy do Wrangler falhou com o código $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  if (Test-Path -LiteralPath $deployDirectory) {
    Remove-Item -LiteralPath $deployDirectory -Recurse -Force
  }
}
