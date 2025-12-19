$currentDir = $PSScriptRoot
Set-Location -Path "$currentDir\client"
Write-Host "Starting Client..."
npm install
npm run dev
