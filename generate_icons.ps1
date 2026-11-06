Add-Type -AssemblyName System.Drawing

function Create-PianoIcon([int]$size, [string]$filename, [bool]$maskable = $false) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $c1 = [System.Drawing.Color]::FromArgb(255, 74, 0, 224)
    $c2 = [System.Drawing.Color]::FromArgb(255, 255, 0, 127)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 45.0
    
    if ($maskable) {
        $g.FillRectangle($brush, $rect)
    } else {
        # Rounded rect for normal icon
        $radius = [int]($size * 0.22)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($brush, $path)
    }

    # Draw piano keyboard base
    $scale = $size / 512.0
    $kbX = [int](60 * $scale)
    $kbY = [int](150 * $scale)
    $kbW = [int](392 * $scale)
    $kbH = [int](230 * $scale)
    $kbBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 30, 48))
    $g.FillRectangle($kbBrush, $kbX, $kbY, $kbW, $kbH)

    # Piano Top header
    $headerH = [int](40 * $scale)
    $hdrBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 64, 129))
    $g.FillRectangle($hdrBrush, $kbX, $kbY, $kbW, $headerH)

    # 7 Rainbow White Keys
    $colors = @(
        [System.Drawing.Color]::FromArgb(255, 255, 71, 87),   # Do - Red
        [System.Drawing.Color]::FromArgb(255, 255, 165, 2),   # Re - Orange
        [System.Drawing.Color]::FromArgb(255, 46, 213, 115),  # Mi - Green
        [System.Drawing.Color]::FromArgb(255, 30, 144, 255),  # Fa - Blue
        [System.Drawing.Color]::FromArgb(255, 155, 89, 182),  # Sol - Purple
        [System.Drawing.Color]::FromArgb(255, 224, 86, 253),  # La - Violet
        [System.Drawing.Color]::FromArgb(255, 255, 107, 129)  # Si - Pink
    )
    $keyW = [int](50 * $scale)
    $keyH = [int](170 * $scale)
    $keyY = $kbY + $headerH + [int](5 * $scale)
    $startX = $kbX + [int](15 * $scale)
    $gap = [int](4 * $scale)

    for ($i = 0; $i -lt 7; $i++) {
        $kx = $startX + ($i * ($keyW + $gap))
        $kBrush = New-Object System.Drawing.SolidBrush $colors[$i]
        $g.FillRectangle($kBrush, $kx, $keyY, $keyW, $keyH)
        
        # White highlight
        $hBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 255, 255, 255))
        $g.FillRectangle($hBrush, $kx + [int](3 * $scale), $keyY + [int](3 * $scale), $keyW - [int](6 * $scale), $keyH - [int](6 * $scale))
    }

    # Black keys (5 keys: Do#, Re#, Fa#, Sol#, La#)
    $bKeyW = [int](30 * $scale)
    $bKeyH = [int](105 * $scale)
    $bIndices = @(0, 1, 3, 4, 5)
    $blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 18, 24))

    foreach ($idx in $bIndices) {
        $bx = $startX + ($idx * ($keyW + $gap)) + $keyW - [int]($bKeyW / 2)
        $g.FillRectangle($blackBrush, $bx, $keyY, $bKeyW, $bKeyH)
    }

    # Music note / stars text
    $fSize = [float](36 * $scale)
    $font = [System.Drawing.Font]::new("Arial", $fSize, [System.Drawing.FontStyle]::Bold)
    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 230, 0))
    $g.DrawString([char]0x266B, $font, $starBrush, [float](80 * $scale), [float](65 * $scale))
    $g.DrawString([char]0x2605, $font, $starBrush, [float](380 * $scale), [float](70 * $scale))
    $font.Dispose()
    $starBrush.Dispose()

    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated $filename ($size x $size)"
}

Create-PianoIcon 192 "icon-192.png" $false
Create-PianoIcon 512 "icon-512.png" $false
Create-PianoIcon 512 "icon-maskable.png" $true
