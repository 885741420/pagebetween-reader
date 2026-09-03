$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$iconDirectory = Join-Path $projectRoot "edge-reader\icons"
$storeAssetDirectory = Join-Path $projectRoot "edge-reader\store-assets"
[System.IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
[System.IO.Directory]::CreateDirectory($storeAssetDirectory) | Out-Null

foreach ($size in @(16, 32, 48, 128, 300)) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $background = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(167, 71, 49))
  $foreground = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $radius = [Math]::Max(2, [Math]::Round($size * 0.16))
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $radius * 2
  $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
  $path.AddArc($size - $diameter - 1, 0, $diameter, $diameter, 270, 90)
  $path.AddArc($size - $diameter - 1, $size - $diameter - 1, $diameter, $diameter, 0, 90)
  $path.AddArc(0, $size - $diameter - 1, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $graphics.FillPath($background, $path)

  $fontSize = [Math]::Max(8, [Math]::Round($size * 0.58))
  $font = [System.Drawing.Font]::new("Microsoft YaHei UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $iconCharacter = [string][char]0x9875
  $graphics.DrawString($iconCharacter, $font, $foreground, [System.Drawing.RectangleF]::new(0, -1, $size, $size), $format)

  $target = if ($size -eq 300) {
    Join-Path $storeAssetDirectory "logo-300.png"
  } else {
    Join-Path $iconDirectory "icon-$size.png"
  }
  $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $format.Dispose()
  $font.Dispose()
  $path.Dispose()
  $foreground.Dispose()
  $background.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output "Generated extension icons in $iconDirectory"
Write-Output "Generated store logo in $storeAssetDirectory"
