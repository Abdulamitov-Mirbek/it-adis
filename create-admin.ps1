<#
.SYNOPSIS
  Creates an admin login for a new manager.

.EXAMPLE
  .\create-admin.ps1 manager@itadis.edu "Aigerim Eralieva"
  .\create-admin.ps1 manager@itadis.edu "Aigerim Eralieva" --generate
  .\create-admin.ps1 manager@itadis.edu "Aigerim Eralieva" --update

.NOTES
  The Windows counterpart of create-admin.sh. The real work is in
  backend/src/scripts/create-admin.ts; this only picks a runner.

  --docker is deliberately absent here: the compose stack and its
  .env.production live on the Linux host, so run create-admin.sh there.
#>
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# backend/.env is read relative to the working directory, so this must run from
# backend/ regardless of where the wrapper was invoked from.
Push-Location (Join-Path $root "backend")
try {
    $built = Join-Path (Get-Location) "dist\scripts\create-admin.js"
    if (Test-Path $built) {
        & node $built @args
    }
    else {
        Write-Host "dist/ not built - falling back to ts-node." -ForegroundColor DarkGray
        & npx ts-node src/scripts/create-admin.ts @args
    }
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
