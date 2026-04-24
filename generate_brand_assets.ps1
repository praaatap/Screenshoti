$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = "d:\top projects\Screenshotmanager\screenshoti"
$appIconDir = Join-Path $root "ios\screenshoti\Images.xcassets\AppIcon.appiconset"
$launchDir = Join-Path $root "ios\screenshoti\Images.xcassets\LaunchLogo.imageset"
$androidRes = Join-Path $root "android\app\src\main\res"

New-Item -ItemType Directory -Force -Path $appIconDir | Out-Null
New-Item -ItemType Directory -Force -Path $launchDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $androidRes "drawable-nodpi") | Out-Null

function New-BrandImage {
  param(
    [int]$Size,
    [string]$OutPath,
    [bool]$Round = $false
  )

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
  $c1 = [System.Drawing.Color]::FromArgb(255, 11, 122, 117)
  $c2 = [System.Drawing.Color]::FromArgb(255, 10, 95, 91)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45)
  $g.FillRectangle($brush, $rect)

  $pad = [int]($Size * 0.14)
  $cardWidth = $Size - ($pad * 2)
  $card = New-Object System.Drawing.Rectangle($pad, $pad, $cardWidth, $cardWidth)

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = [int]($Size * 0.14)
  $diam = $radius * 2
  $path.AddArc($card.X, $card.Y, $diam, $diam, 180, 90)
  $path.AddArc($card.Right - $diam, $card.Y, $diam, $diam, 270, 90)
  $path.AddArc($card.Right - $diam, $card.Bottom - $diam, $diam, $diam, 0, 90)
  $path.AddArc($card.X, $card.Bottom - $diam, $diam, $diam, 90, 90)
  $path.CloseFigure()

  $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
  $g.FillPath($cardBrush, $path)

  $lensSize = [int]($Size * 0.23)
  $lensX = [int]($Size * 0.38)
  $lensY = [int]($Size * 0.39)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 25, 45, 52), [single]([Math]::Max(2, $Size * 0.03)))
  $g.DrawEllipse($pen, $lensX, $lensY, $lensSize, $lensSize)

  $ocrBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 25, 45, 52))
  $topBar = New-Object System.Drawing.Rectangle([int]($Size * 0.33), [int]($Size * 0.33), [int]($Size * 0.34), [int]($Size * 0.05))
  $g.FillRectangle($ocrBrush, $topBar)

  for ($i = 0; $i -lt 3; $i++) {
    $y = [int]($Size * (0.64 + ($i * 0.07)))
    $lineRect = New-Object System.Drawing.Rectangle([int]($Size * 0.30), $y, [int]($Size * (0.40 - ($i * 0.06))), [int]($Size * 0.025))
    $g.FillRectangle($ocrBrush, $lineRect)
  }

  if ($Round) {
    $circle = New-Object System.Drawing.Bitmap($Size, $Size)
    $cg = [System.Drawing.Graphics]::FromImage($circle)
    $cg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gp.AddEllipse(0, 0, $Size - 1, $Size - 1)
    $cg.SetClip($gp)
    $cg.DrawImage($bmp, 0, 0)

    $bmp.Dispose()
    $g.Dispose()
    $bmp = $circle
    $g = $cg
    $gp.Dispose()
  }

  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
  $brush.Dispose()
  $cardBrush.Dispose()
  $ocrBrush.Dispose()
  $pen.Dispose()
  $path.Dispose()
}

$iosMap = @(
  @{ size = "20x20"; scale = "2x"; px = 40; filename = "Icon-20@2x.png" },
  @{ size = "20x20"; scale = "3x"; px = 60; filename = "Icon-20@3x.png" },
  @{ size = "29x29"; scale = "2x"; px = 58; filename = "Icon-29@2x.png" },
  @{ size = "29x29"; scale = "3x"; px = 87; filename = "Icon-29@3x.png" },
  @{ size = "40x40"; scale = "2x"; px = 80; filename = "Icon-40@2x.png" },
  @{ size = "40x40"; scale = "3x"; px = 120; filename = "Icon-40@3x.png" },
  @{ size = "60x60"; scale = "2x"; px = 120; filename = "Icon-60@2x.png" },
  @{ size = "60x60"; scale = "3x"; px = 180; filename = "Icon-60@3x.png" },
  @{ size = "1024x1024"; scale = "1x"; px = 1024; filename = "Icon-1024.png" }
)

foreach ($item in $iosMap) {
  New-BrandImage -Size $item.px -OutPath (Join-Path $appIconDir $item.filename)
}

$images = @()
foreach ($item in $iosMap) {
  $idiom = if ($item.size -eq "1024x1024") { "ios-marketing" } else { "iphone" }
  $images += @{ idiom = $idiom; size = $item.size; scale = $item.scale; filename = $item.filename }
}

$contents = @{ images = $images; info = @{ author = "xcode"; version = 1 } }
$contents | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $appIconDir "Contents.json")

New-BrandImage -Size 1024 -OutPath (Join-Path $launchDir "LaunchLogo.png")
$launchContents = @{ images = @(@{ idiom = "universal"; filename = "LaunchLogo.png"; scale = "1x" }); info = @{ author = "xcode"; version = 1 } }
$launchContents | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $launchDir "Contents.json")

New-BrandImage -Size 512 -OutPath (Join-Path $androidRes "drawable-nodpi\splash_logo.png")

$densities = @{ "mipmap-mdpi" = 48; "mipmap-hdpi" = 72; "mipmap-xhdpi" = 96; "mipmap-xxhdpi" = 144; "mipmap-xxxhdpi" = 192 }
foreach ($k in $densities.Keys) {
  New-BrandImage -Size $densities[$k] -OutPath (Join-Path $androidRes "$k\ic_launcher.png")
  New-BrandImage -Size $densities[$k] -OutPath (Join-Path $androidRes "$k\ic_launcher_round.png") -Round $true
}

Write-Output "ASSETS_DONE"
