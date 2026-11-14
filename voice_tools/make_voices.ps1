# ============================================================
# やることリスト用の「声」を VOICEVOX で作るスクリプト
#
# 【やること】
#   1. VOICEVOX に、キャラクターの一覧を聞いて表示する
#   2. えらんだキャラクターの声で、phrases.json の言葉をぜんぶ作る
#   3. 1つの大きな音声ファイル(voices/voices_1.wav)にまとめて、
#      どこに何の言葉があるかを voices/manifest.json に書く
#
# 【通信について】
#   このパソコンの中で動いている VOICEVOX(127.0.0.1)とだけ通信します。
#   インターネットとは通信しません。
#
# 【使い方】
#   1. VOICEVOX を起動しておく
#   2. make_voices.bat をダブルクリック
# ============================================================
param(
  [string]$Engine = '',                         # VOICEVOX の場所(空なら自動でさがす)
  [double]$Speed = 1.0,                         # はやさ(1がふつう。0.9 にすると少しゆっくり)
  [double]$Intonation = 1.2                     # 抑揚(1がふつう。大きいほど元気な話し方)
)

$ErrorActionPreference = 'Stop'
# 思わぬエラーで止まったときは、内容を日本語で表示する
trap {
  Write-Host ''
  Write-Host "エラーで止まりました: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  (場所: $($_.InvocationInfo.ScriptLineNumber) 行目)"
  exit 1
}
$utf8 = New-Object System.Text.UTF8Encoding($false)   # BOMなしのUTF-8

# フォルダの場所
$toolDir = $PSScriptRoot                                   # このスクリプトがある voice_tools フォルダ
$outDir  = Join-Path (Split-Path $toolDir -Parent) 'voices' # 作った声を入れる voices フォルダ

# ------------------------------------------------------------
# VOICEVOX にたのむための小道具
# ------------------------------------------------------------
# VOICEVOX に1回たのんで、返事をバイト列で受け取る
#   ・Proxy を使わない(会社や学校のプロキシ設定があっても、パソコンの中の VOICEVOX に直接つなぐ)
#   ・Windows に最初から入っている PowerShell 5.1 でも、新しい PowerShell 7 でも同じように動く
function Invoke-Voicevox([string]$method, [string]$url, [byte[]]$body, [int]$timeoutSec = 120) {
  $req = [System.Net.HttpWebRequest]::Create($url)
  $req.Method = $method
  $req.Proxy = $null
  $req.Timeout = $timeoutSec * 1000
  $req.ReadWriteTimeout = $timeoutSec * 1000
  if ($body) {
    $req.ContentType = 'application/json'
    $req.ContentLength = $body.Length
    $stream = $req.GetRequestStream()
    $stream.Write($body, 0, $body.Length)
    $stream.Close()
  } elseif ($method -eq 'POST') {
    $req.ContentLength = 0
  }
  $res = $req.GetResponse()
  $ms = New-Object System.IO.MemoryStream
  $res.GetResponseStream().CopyTo($ms)
  $res.Close()
  return ,$ms.ToArray()          # 先頭の「,」はバイト列をばらさずに返すための書き方
}
# 返事を UTF-8 の文字として読む(日本語が文字化けしないように)
function Get-Text([byte[]]$bytes) {
  return $utf8.GetString($bytes)
}

# WAV ファイルの中から、音のデータ部分(data)と、1秒あたりの数(サンプリングレート)を取り出す
function Read-Wav([byte[]]$bytes) {
  $rate = [BitConverter]::ToInt32($bytes, 24)       # fmt の中のサンプリングレート
  $pos = 12
  while ($pos -lt $bytes.Length - 8) {
    $id = [Text.Encoding]::ASCII.GetString($bytes, $pos, 4)
    $size = [BitConverter]::ToInt32($bytes, $pos + 4)
    if ($id -eq 'data') {
      $data = New-Object byte[] $size
      [Array]::Copy($bytes, $pos + 8, $data, 0, $size)
      return @{ Rate = $rate; Data = $data }
    }
    $pos += 8 + $size + ($size % 2)
  }
  throw 'WAVの形式が想定と違います'
}

# 音のデータを WAV ファイルとして書き出す(16bit・モノラル)
function Write-Wav([string]$file, [System.IO.MemoryStream]$pcm, [int]$rate) {
  $dataLen = [int]$pcm.Length
  $fs = [System.IO.File]::Create($file)
  $w = New-Object System.IO.BinaryWriter($fs)
  $w.Write([Text.Encoding]::ASCII.GetBytes('RIFF')); $w.Write([int](36 + $dataLen))
  $w.Write([Text.Encoding]::ASCII.GetBytes('WAVEfmt ')); $w.Write([int]16)
  $w.Write([int16]1); $w.Write([int16]1)                 # PCM・モノラル
  $w.Write([int]$rate); $w.Write([int]($rate * 2))       # 1秒あたりのバイト数
  $w.Write([int16]2); $w.Write([int16]16)                # 16bit
  $w.Write([Text.Encoding]::ASCII.GetBytes('data')); $w.Write([int]$dataLen)
  $pcm.WriteTo($fs)
  $w.Close()
}

# ------------------------------------------------------------
# 1. VOICEVOX が動いているか確認し、キャラクターをえらぶ
# ------------------------------------------------------------
Write-Host ''
Write-Host '=== やることリストの声づくり ===' -ForegroundColor Green
Write-Host 'VOICEVOX をさがしています…'

# VOICEVOX は、ふつう 50021 番で待っている。ほかのソフトと重なると別の番号になることがあるので、いくつか試す
$candidates = @()
if ($Engine) { $candidates += $Engine.TrimEnd('/') }
$candidates += 'http://127.0.0.1:50021', 'http://localhost:50021', 'http://127.0.0.1:50022', 'http://127.0.0.1:50023', 'http://127.0.0.1:50121'
$lastError = ''
$found = $null
foreach ($c in $candidates) {
  try {
    $ver = Get-Text (Invoke-Voicevox 'GET' "$c/version" $null 5)
    $found = $c
    Write-Host ("  見つかりました: {0}  (VOICEVOX エンジン {1})" -f $c, $ver.Trim('"'))
    break
  } catch {
    if (-not $lastError) { $lastError = $_.Exception.Message }   # いちばん大事な 50021 番のエラーを残す
  }
}
if (-not $found) {
  Write-Host ''
  Write-Host 'VOICEVOX につながりませんでした。' -ForegroundColor Red
  Write-Host '  ・VOICEVOX のアプリを起動して、キャラクターの画面が出るまで待ってから、もう一度実行してください'
  Write-Host '  ・ブラウザで http://127.0.0.1:50021/docs を開いて、ページが出るか確認してください'
  Write-Host "  (くわしい内容: $lastError)"
  exit 1
}
$Engine = $found

try {
  $speakers = (Get-Text (Invoke-Voicevox 'GET' "$Engine/speakers" $null)) | ConvertFrom-Json
} catch {
  Write-Host "声の一覧を受け取れませんでした。(くわしい内容: $($_.Exception.Message))" -ForegroundColor Red
  exit 1
}

# 「番号: キャラクター(スタイル)」の一覧を作る
$styles = @()
foreach ($sp in $speakers) {
  foreach ($st in $sp.styles) {
    if ($st.type -and $st.type -ne 'talk') { continue }   # 歌うスタイルなどは使わない
    $styles += [pscustomobject]@{ Id = [int]$st.id; Name = $sp.name; Style = $st.name }
  }
}
if ($styles.Count -eq 0) {
  # 古い VOICEVOX には type がないことがあるので、そのときは全部を出す
  foreach ($sp in $speakers) { foreach ($st in $sp.styles) { $styles += [pscustomobject]@{ Id = [int]$st.id; Name = $sp.name; Style = $st.name } } }
}
if ($styles.Count -eq 0) { Write-Host '使える声が見つかりませんでした。VOICEVOX を最新版にしてください。' -ForegroundColor Red; exit 1 }
Write-Host ''
Write-Host ("つかえる声({0}種類)  番号  キャラクター  (スタイル):" -f $styles.Count)
foreach ($s in $styles) { Write-Host ('  {0,3}  {1}  ({2})' -f $s.Id, $s.Name, $s.Style) }
Write-Host ''
$answer = Read-Host '使う声の番号を入力して Enter(何も入れずに Enter で 3 = ずんだもん ノーマル)'
if (-not $answer) { $answer = '3' }
$chosen = $styles | Where-Object { $_.Id -eq [int]$answer } | Select-Object -First 1
if (-not $chosen) { Write-Host "番号 $answer の声が見つかりませんでした。" -ForegroundColor Red; exit 1 }
Write-Host ("「{0}({1})」の声で作ります。" -f $chosen.Name, $chosen.Style) -ForegroundColor Yellow

# ------------------------------------------------------------
# 2. 言葉の一覧を読み、1つずつ声にする
# ------------------------------------------------------------
$phrases = [System.IO.File]::ReadAllText((Join-Path $toolDir 'phrases.json'), $utf8) | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
# 前に作ったファイルを消す(キャラクターを変えて作りなおしたとき用)
Get-ChildItem -Path $outDir -Filter 'voices_*.wav' -ErrorAction SilentlyContinue | Remove-Item -Force

$maxBytes = 20MB                       # 1ファイルの上限(GitHub の画面からアップロードできる大きさに収める)
$files = @()                           # 作った音声ファイルの名前
$clips = [ordered]@{}                  # 言葉 → [ファイル番号, 始まり(秒), 長さ(秒)]
$pcm = New-Object System.IO.MemoryStream
$rate = 0
$count = 0

# いまためている音を1つのファイルに書き出す
function Flush-Part {
  if ($script:pcm.Length -eq 0) { return }
  $name = 'voices_{0}.wav' -f ($script:files.Count + 1)
  Write-Wav (Join-Path $outDir $name) $script:pcm $script:rate
  $script:files += $name
  $script:pcm = New-Object System.IO.MemoryStream
}

foreach ($p in $phrases) {
  $count++
  Write-Host ("[{0}/{1}] {2}" -f $count, $phrases.Count, $p.key)
  $q = [uri]::EscapeDataString($p.read)
  # (1) 読み方と抑揚を作ってもらう
  $query = (Get-Text (Invoke-Voicevox 'POST' "$Engine/audio_query?text=$q&speaker=$($chosen.Id)" $null)) | ConvertFrom-Json
  $query.speedScale = $Speed
  $query.intonationScale = $Intonation
  $query.prePhonemeLength = 0.05       # 前後の無音を短くする
  $query.postPhonemeLength = 0.1
  $query.outputSamplingRate = 24000
  $query.outputStereo = $false
  $json = $query | ConvertTo-Json -Depth 20 -Compress
  # (2) 声にしてもらう
  $wav = Invoke-Voicevox 'POST' "$Engine/synthesis?speaker=$($chosen.Id)" $utf8.GetBytes($json)
  $info = Read-Wav $wav
  $rate = $info.Rate
  # 上限をこえそうなら、ここまでを1ファイルにする
  if ($pcm.Length + $info.Data.Length -gt $maxBytes) { Flush-Part }
  # (3) まとめのファイルに足して、位置を記録する
  $start = $pcm.Length / 2 / $rate
  $pcm.Write($info.Data, 0, $info.Data.Length)
  $clips[$p.key] = @($files.Count, [math]::Round($start, 4), [math]::Round($info.Data.Length / 2 / $rate, 4))
  $gap = New-Object byte[] ([int]($rate * 0.05) * 2)   # 言葉と言葉のあいだに 0.05秒の無音
  $pcm.Write($gap, 0, $gap.Length)
}
Flush-Part

# ------------------------------------------------------------
# 3. どこに何があるかを manifest.json に書く
# ------------------------------------------------------------
$manifest = [ordered]@{
  version = (Get-Date -Format 'yyyyMMddHHmmss')
  speaker = $chosen.Id
  credit  = 'VOICEVOX:' + $chosen.Name     # アプリに表示するクレジット
  files   = $files
  clips   = $clips
}
[System.IO.File]::WriteAllText((Join-Path $outDir 'manifest.json'), ($manifest | ConvertTo-Json -Depth 5), $utf8)

Write-Host ''
Write-Host 'できました！' -ForegroundColor Green
Write-Host "  フォルダ: $outDir"
foreach ($f in $files) {
  $mb = (Get-Item (Join-Path $outDir $f)).Length / 1MB
  Write-Host ('  {0}  ({1:N1} MB)' -f $f, $mb)
}
Write-Host '  manifest.json'
Write-Host ''
Write-Host 'voices フォルダを GitHub にアップロードしてください。'
