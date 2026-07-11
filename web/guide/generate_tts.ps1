Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)

$items = @(
    @("ashadu_en", "I bear witness"),
    @("an_la_en", "that there is no"),
    @("ilaha_en", "deity worthy of worship"),
    @("illallah_en", "except Allah"),
    @("wa_ashadu_en", "and I bear witness"),
    @("anna_en", "that"),
    @("muhammadan_en", "Muhammad"),
    @("rasulullah_en", "is the Messenger of Allah"),
    @("full_shahada_en", "I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.")
)

foreach ($item in $items) {
    $path = "c:\Users\ubaid\dahr\web\guide\voice\" + $item[0] + ".wav"
    $synth.SetOutputToWaveFile($path)
    $synth.Speak($item[1])
}
$synth.Dispose()
