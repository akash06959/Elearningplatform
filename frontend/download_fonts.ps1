$fontsPath = "public/fonts"

# Create fonts directory if it doesn't exist
if (!(Test-Path $fontsPath)) {
    New-Item -ItemType Directory -Path $fontsPath
}

# Font URLs
$fonts = @{
    "Montserrat-Regular" = "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXp-p7K4KLg.woff2"
    "Montserrat-Medium" = "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Hw5aXp-p7K4KLg.woff2"
    "Montserrat-Bold" = "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aXp-p7K4KLg.woff2"
    "CormorantGaramond-Regular" = "https://fonts.gstatic.com/s/cormorantgaramond/v17/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2"
    "CormorantGaramond-Medium" = "https://fonts.gstatic.com/s/cormorantgaramond/v17/co3YmX5slCNuHLi8bLeY9MK7whWMhyjQElt9fvG-BXbsw.woff2"
    "CormorantGaramond-Bold" = "https://fonts.gstatic.com/s/cormorantgaramond/v17/co3YmX5slCNuHLi8bLeY9MK7whWMhyjQEl5fvG-BXbsw.woff2"
}

# Download each font
foreach ($font in $fonts.GetEnumerator()) {
    $outputPath = Join-Path $fontsPath "$($font.Key).woff2"
    Write-Host "Downloading $($font.Key)..."
    Invoke-WebRequest -Uri $font.Value -OutFile $outputPath
}

Write-Host "Font downloads completed!" 