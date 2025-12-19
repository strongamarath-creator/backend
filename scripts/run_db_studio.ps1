$currentDir = $PSScriptRoot
Set-Location -Path "$currentDir\backend"
Write-Host "Starting Prisma Studio (Database Manager)..."
npx prisma studio
