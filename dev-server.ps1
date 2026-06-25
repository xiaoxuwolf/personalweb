param(
  [int]$Port = 5173,
  [string]$Root = (Get-Location).Path
)

$rootPath = [System.IO.Path]::GetFullPath($Root)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".mp4"  = "video/mp4"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".png"  = "image/png"
  ".svg"  = "image/svg+xml"
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$ContentType,
    [byte[]]$Body
  )

  $reason = if ($Status -eq 200) { "OK" } else { "Not Found" }
  $header = "HTTP/1.1 $Status $reason`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $buffer = New-Object byte[] 4096
    $count = $stream.Read($buffer, 0, $buffer.Length)
    $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $count)
    $firstLine = ($request -split "`r?`n")[0]
    $parts = $firstLine -split " "
    $requestPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
    $requestPath = [Uri]::UnescapeDataString(($requestPath -split "\?")[0]).TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $rootPath $requestPath))
    if (!$fullPath.StartsWith($rootPath) -or !(Test-Path -LiteralPath $fullPath -PathType Leaf)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      Send-Response -Stream $stream -Status 404 -ContentType "text/plain; charset=utf-8" -Body $body
    } else {
      $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { "application/octet-stream" }
      $body = [System.IO.File]::ReadAllBytes($fullPath)
      Send-Response -Stream $stream -Status 200 -ContentType $contentType -Body $body
    }
  } finally {
    $client.Close()
  }
}
