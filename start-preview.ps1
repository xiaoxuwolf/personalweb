$root = "D:\360MoveData\Users\Administrator\Documents\个人网站"
$port = 5173
$log = Join-Path $root "preview-error.log"
try {
  Set-Location -LiteralPath $root
  "Starting preview on http://127.0.0.1:$port/ at $(Get-Date)" | Out-File -LiteralPath $log -Encoding utf8
  & "$root\dev-server.ps1" -Port $port -Root $root
} catch {
  $_ | Out-File -LiteralPath $log -Append -Encoding utf8
}
