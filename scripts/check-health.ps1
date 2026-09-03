param(
  [string]$ApiBaseUrl = "http://127.0.0.1:4320"
)

$ErrorActionPreference = "Stop"
$response = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/health"

if (-not $response.ok) {
  throw "Treasury Atom API reported an unhealthy state."
}

Write-Output "Treasury Atom API is ready at $ApiBaseUrl"

