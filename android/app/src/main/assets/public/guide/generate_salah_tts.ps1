Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)

$items = @(
    @("takbeer_en", "Intention and Takbeer"),
    @("fatihah_en", "Al Fatihah. The Opening"),
    @("ikhlas_en", "A short Surah. For example, Al Ikhlas"),
    @("ruku_en", "Bowing. Ruku"),
    @("rising_en", "Rising from Ruku"),
    @("sujud_en", "First Prostration. Sujud"),
    @("juloos_en", "Sitting. Juloos"),
    @("sujud_2_en", "Second Prostration"),
    @("tashahhud_en", "Tashahhud. Sitting"),
    @("salawat_en", "Salawat or Durood. Sending blessings"),
    @("tasleem_en", "Tasleem. End of prayer")
)

foreach ($item in $items) {
    $path = "c:\Users\ubaid\dahr\web\guide\voice\salah\" + $item[0] + ".wav"
    $synth.SetOutputToWaveFile($path)
    $synth.Speak($item[1])
}
$synth.Dispose()
