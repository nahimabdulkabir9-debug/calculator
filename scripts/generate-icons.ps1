# Generates the PWA icon set (PNG) with System.Drawing.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1

param(
  [string]$OutDir = (Join-Path $PSScriptRoot '..\public\icons')
)

Add-Type -AssemblyName System.Drawing

function New-RoundedPath {
  param(
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius
  )
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = [Math]::Min($Radius * 2, [Math]::Min($Rect.Width, $Rect.Height))
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Icon {
  param(
    [int]$Size,
    [string]$Path,
    [switch]$Square,
    [double]$Scale = 1.0
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $full = [System.Drawing.RectangleF]::new(0, 0, $Size, $Size)
    $unit = ($Size / 512.0) * $Scale
    $offset = ($Size - (512 * $unit)) / 2.0

    $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      $full,
      [System.Drawing.Color]::FromArgb(255, 255, 166, 77),
      [System.Drawing.Color]::FromArgb(255, 244, 104, 18),
      55
    )

    if ($Square) {
      $background = New-Object System.Drawing.Drawing2D.GraphicsPath
      $background.AddRectangle($full)
    } else {
      $background = New-RoundedPath -Rect $full -Radius (110 * $unit)
    }
    $graphics.FillPath($gradient, $background)

    $screenRect = [System.Drawing.RectangleF]::new(
      $offset + (92 * $unit),
      $offset + (86 * $unit),
      328 * $unit,
      136 * $unit
    )
    $screenPath = New-RoundedPath -Rect $screenRect -Radius (28 * $unit)
    $screenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 18, 36))
    $graphics.FillPath($screenBrush, $screenPath)

    $font = [System.Drawing.Font]::new(
      'Segoe UI',
      (92 * $unit),
      [System.Drawing.FontStyle]::Bold,
      [System.Drawing.GraphicsUnit]::Pixel
    )
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString('42', $font, $white, $screenRect, $format)

    $buttonBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 255, 255, 255))
    foreach ($y in @(258, 332, 406)) {
      foreach ($x in @(92, 210, 328)) {
        $buttonRect = [System.Drawing.RectangleF]::new(
          $offset + ($x * $unit),
          $offset + ($y * $unit),
          92 * $unit,
          54 * $unit
        )
        $buttonPath = New-RoundedPath -Rect $buttonRect -Radius (16 * $unit)
        $graphics.FillPath($buttonBrush, $buttonPath)
        $buttonPath.Dispose()
      }
    }

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

New-Icon -Size 192 -Path (Join-Path $OutDir 'icon-192.png')
New-Icon -Size 512 -Path (Join-Path $OutDir 'icon-512.png')
New-Icon -Size 512 -Path (Join-Path $OutDir 'icon-maskable-512.png') -Square -Scale 0.72
New-Icon -Size 180 -Path (Join-Path $OutDir 'apple-touch-icon.png') -Square

Write-Output "Icons written to $OutDir"
Get-ChildItem -LiteralPath $OutDir -Filter *.png | Select-Object Name, Length
