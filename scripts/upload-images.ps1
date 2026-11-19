$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$imageRoot = Join-Path $projectRoot "imagens"
$maxImageBytes = 300 * 1000

if (-not (Test-Path -LiteralPath $imageRoot -PathType Container)) {
  throw "Pasta de imagens não encontrada: $imageRoot"
}

Push-Location $projectRoot
try {
  $files = Get-ChildItem -LiteralPath $imageRoot -Recurse -File
  foreach ($file in $files) {
    if ($file.Length -gt $maxImageBytes) {
      throw "Imagem acima de 300 KB: $($file.FullName)"
    }

    $relativePath = $file.FullName.Substring($imageRoot.Length).TrimStart("\")
    $extension = $file.Extension.ToLowerInvariant()
    if ($extension -notin @(".jpg", ".jpeg", ".png")) {
      throw "Formato não permitido: $($file.FullName)"
    }

    if ($relativePath -eq "logo.jpg" -or $relativePath -eq "capa.jpg") {
      $key = "site/$relativePath"
    } elseif ($relativePath.StartsWith("categoria\")) {
      $key = "categories/$([System.IO.Path]::GetFileName($relativePath))"
    } elseif ($relativePath.StartsWith("produtos\")) {
      $key = "products/$([System.IO.Path]::GetFileName($relativePath))"
    } else {
      throw "Imagem fora das pastas esperadas: $($file.FullName)"
    }

    $contentType = if ($extension -eq ".png") {
      "image/png"
    } else {
      "image/jpeg"
    }

    Write-Output "Enviando $key ($($file.Length) bytes)"
    npx.cmd wrangler r2 object put "artesdacy-media/$key" `
      --file $file.FullName `
      --content-type $contentType `
      --remote `
      --force
    if ($LASTEXITCODE -ne 0) {
      throw "Falha ao enviar $key"
    }
  }
} finally {
  Pop-Location
}
