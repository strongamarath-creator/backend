$currentDir = $PSScriptRoot
Set-Location -Path "$currentDir\admin"
Write-Host "Starting Admin Panel..."
npm install
npm run dev
