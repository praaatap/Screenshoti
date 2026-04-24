Add-Type -AssemblyName System.Drawing

function Create-BrandedImage {
    param(
        [string]$Path,
        [int]$Size,
        [bool]$IsRound = $false
    )

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Teal Gradient Background
    $color1 = [System.Drawing.ColorTranslator]::FromHtml("#0B7A75")
    $color2 = [System.Drawing.ColorTranslator]::FromHtml("#0A5F5B")
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)),
        $color1, $color2, 45.0
    )
    
    if ($IsRound) {
        $pathObj = New-Object System.Drawing.Drawing2D.GraphicsPath
        $pathObj.AddEllipse(0, 0, $Size, $Size)
        $graphics.SetClip($pathObj)
    }
    
    $graphics.FillRectangle($brush, 0, 0, $Size, $Size)

    # White Rounded Inner Card
    $cardSize = $Size * 0.7
    $cardOffset = ($Size - $cardSize) / 2
    $cardRect = New-Object System.Drawing.RectangleF($cardOffset, $cardOffset, $cardSize, $cardSize)
    $cornerRadius = $cardSize * 0.2
    
    $cardPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cardPath.AddArc($cardRect.X, $cardRect.Y, $cornerRadius, $cornerRadius, 180, 90)
    $cardPath.AddArc($cardRect.Right - $cornerRadius, $cardRect.Y, $cornerRadius, $cornerRadius, 270, 90)
    $cardPath.AddArc($cardRect.Right - $cornerRadius, $cardRect.Bottom - $cornerRadius, $cornerRadius, $cornerRadius, 0, 90)
    $cardPath.AddArc($cardRect.X, $cardRect.Bottom - $cornerRadius, $cornerRadius, $cornerRadius, 90, 90)
    $cardPath.CloseFigure()
    
    $graphics.FillPath([System.Drawing.Brushes]::White, $cardPath)

    # Dark Camera Glyph (Simplified)
    $glyphColor = [System.Drawing.ColorTranslator]::FromHtml("#0A5F5B")
    $glyphBrush = New-Object System.Drawing.SolidBrush($glyphColor)
    $camWidth = $cardSize * 0.5
    $camHeight = $cardSize * 0.35
    $camX = $cardOffset + ($cardSize - $camWidth) / 2
    $camY = $cardOffset + ($cardSize - $camHeight) / 2
    
    # Body
    $graphics.FillRectangle($glyphBrush, $camX, $camY + ($camHeight * 0.2), $camWidth, $camHeight * 0.8)
    # Lens
    $lensSize = $camHeight * 0.5
    $graphics.FillEllipse([System.Drawing.Brushes]::White, $camX + ($camWidth - $lensSize)/2, $camY + ($camHeight * 0.3), $lensSize, $lensSize)
    $graphics.FillEllipse($glyphBrush, $camX + ($camWidth - $lensSize*0.6)/2, $camY + ($camHeight * 0.4), $lensSize*0.6, $lensSize*0.6)
    # Flash/Button
    $graphics.FillRectangle($glyphBrush, $camX + ($camWidth * 0.2), $camY, $camWidth * 0.2, $camHeight * 0.2)

    # OCR Line Motif
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, $glyphColor), ($Size * 0.01))
    $lineY = $camY + $camHeight + ($cardSize * 0.05)
    $graphics.DrawLine($pen, $camX, $lineY, $camX + $camWidth, $lineY)

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $glyphBrush.Dispose()
    $pen.Dispose()
}

# iOS AppIcon
$iosSizes = @(20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024)
foreach ($s in $iosSizes) {
    Create-BrandedImage "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-$s.png" $s
}

# iOS LaunchLogo
Create-BrandedImage "ios/Runner/Assets.xcassets/LaunchLogo.imageset/launch_logo.png" 512

# Android Mipmaps
$androidConfig = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

foreach ($key in $androidConfig.Keys) {
    $size = $androidConfig[$key]
    Create-BrandedImage "android/app/src/main/res/mipmap-$key/ic_launcher.png" $size
    Create-BrandedImage "android/app/src/main/res/mipmap-$key/ic_launcher_round.png" $size $true
}

# Android Splash Logo
Create-BrandedImage "android/app/src/main/res/drawable-nodpi/splash_logo.png" 512

Write-Host "Assets generated successfully."
