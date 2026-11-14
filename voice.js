// ============================================================
// こえ(読み上げ)
//
// 声は2とおりあります。
//   1. VOICEVOX で作った声(voices フォルダがあるとき)… 人の声に近い
//      voice_tools/make_voices.bat で作り、voices フォルダごと GitHub に置きます
//   2. iPad の「音声読み上げ」(Web Speech API)… VOICEVOX の声がない言葉や、
//      voices フォルダがないときに使う
// どちらも iPad の中で再生するので、インターネットとは通信しません。
//
// 【使い方(app.js から呼ぶ)】
//   say('できたね！')                       … 1つの文を読む
//   say([{ text: 'これは なに？' },
//        { text: 'りんご', el: ボタン }])    … いくつかの文を順番に読む
//                                             el を付けると、読んでいる間そのボタンを光らせる
//   say(...) は「読み終わったら終わる Promise」を返すので、
//   await say(...) と書くと、読み終わるまで待てます。
//   hush()                                  … 読んでいる途中でも止める
//
// 【iPad の決まり】
//   画面を1回もタッチしていないうちは、声を出せません。
//   いちど画面をタッチすれば、そのあとはアプリを閉じるまで声が出ます。
// ============================================================

const VOICE_SETTING_KEY = 'yarukoto_voice';   // おとなメニューのオン/オフを覚えておく場所

// 読み上げがオンかどうか
//   おとなメニューで切り替えていればそちらを優先、なければ config.js の設定
function voiceOn() {
  if (!('speechSynthesis' in window) && !voicePack) return false;   // 声を出す方法がない環境
  try {
    const saved = localStorage.getItem(VOICE_SETTING_KEY);
    if (saved === 'on') return true;
    if (saved === 'off') return false;
  } catch (e) { /* 読めなければ config.js にしたがう */ }
  return !(CONFIG.voice && CONFIG.voice.enabled === false);
}

// おとなメニューから、オン/オフを切り替える
function setVoiceOn(on) {
  try { localStorage.setItem(VOICE_SETTING_KEY, on ? 'on' : 'off'); } catch (e) { }
  if (!on) hush();
}

// 日本語の声をえらぶ(iPad では「Kyoko」などが入っています)
let jaVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang));
  // 端末の中で作る声(localService)を優先する=通信しない声
  jaVoice = voices.find(v => v.localService) || voices[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  // 声の一覧はあとから届くことがあるので、届いたらえらび直す
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

// ------------------------------------------------------------
// VOICEVOX の声(voices/manifest.json と voices_1.wav など)
//   manifest.json の clips に { 言葉: [ファイル番号, 始まり(秒), 長さ(秒)] } が書いてあり、
//   大きな音声ファイルの、その部分だけを再生する
// ------------------------------------------------------------
let voicePack = null;        // 読み込みが終わったら { credit, clips, buffers }
let clipSource = null;       // いま再生している音

// 音を鳴らす係(app.js の audioCtx)を用意する
function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// アプリを開いたときに、裏で声のファイルを読みこんでおく(ないときは何もしない)
async function loadVoicePack() {
  try {
    const res = await fetch('voices/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;                        // voices フォルダがない → iPad の読み上げを使う
    const m = await res.json();
    const ctx = ensureAudioCtx();
    const buffers = [];
    for (const file of m.files) {
      // ?v= を付けると、作りなおしたときに新しい声を読みこむ(sw.js が古いものを片づける)
      const data = await (await fetch(`voices/${file}?v=${m.version}`)).arrayBuffer();
      // Safari の古い書き方(コールバック)にも対応する
      buffers.push(await new Promise((ok, ng) => ctx.decodeAudioData(data, ok, ng)));
    }
    voicePack = { credit: m.credit || 'VOICEVOX', clips: m.clips || {}, buffers };
    showVoiceCredit();
  } catch (e) {
    voicePack = null;                           // 読めなければ iPad の読み上げを使う
  }
}

// クレジット(VOICEVOX:キャラクター名)を画面に出す
function showVoiceCredit() {
  const el = document.getElementById('voice-credit');
  if (el) el.textContent = voicePack ? 'こえ:' + voicePack.credit : '';
}

// VOICEVOX の声を1つ再生する。その言葉の声がなければ false を返す
function playClip(text, turn) {
  const clip = voicePack && voicePack.clips[text];
  if (!clip) return null;
  return new Promise(resolve => {
    if (turn !== speechTurn) return resolve();
    const [fileNo, start, dur] = clip;
    const src = audioCtx.createBufferSource();
    src.buffer = voicePack.buffers[fileNo];
    src.connect(audioCtx.destination);
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(guard);
      if (clipSource === src) clipSource = null;
      resolve();
    };
    src.onended = done;
    // まだ画面をタッチしていなくて音が出せないときも、止まらないようにする安全装置
    const guard = setTimeout(done, (dur + 0.5) * 1000);
    clipSource = src;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    src.start(0, start, dur);
  });
}

// いま読んでいる「回」の番号。新しく読みはじめたら古い回は止める
let speechTurn = 0;
let readingEl = null;          // いま光らせているボタン

// 光らせているボタンを元にもどす
function clearReading() {
  if (readingEl) readingEl.classList.remove('reading');
  readingEl = null;
}

// 読むのを止める
function hush() {
  speechTurn++;
  clearReading();
  if (clipSource) {                         // VOICEVOX の声を止める
    const src = clipSource;
    clipSource = null;
    try { src.stop(); } catch (e) { }
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// 1つの文を読む。読み終わったら(または止められたら)終わる
function speakOne(text, turn) {
  // VOICEVOX の声があれば、そちらを使う
  const clip = playClip(text, turn);
  if (clip) return clip;
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(resolve => {
    if (turn !== speechTurn) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    if (jaVoice) u.voice = jaVoice;
    const v = CONFIG.voice || {};
    u.rate = v.rate || 0.9;        // はやさ(1がふつう。小さいほどゆっくり)
    u.pitch = v.pitch || 1.1;      // 声の高さ(1がふつう)
    u.volume = 1;

    let finished = false;
    const done = () => { if (!finished) { finished = true; clearTimeout(guard); resolve(); } };
    u.onend = done;
    u.onerror = done;
    // iPad では「読み終わり」の合図が来ないことがあるので、
    // 文の長さから計算した時間がたったら、終わったことにする(安全装置)
    const guard = setTimeout(done, 1500 + text.length * 260 / u.rate);
    speechSynthesis.speak(u);
  });
}

// 読む。parts は 文字 か [{text, el}] の一覧
async function say(parts) {
  if (!voiceOn()) return;
  hush();                                   // 前に読んでいたものは止める
  const turn = speechTurn;
  if (typeof parts === 'string') parts = [{ text: parts }];
  // 止めた直後にすぐ読むと、iPad では声が出ないことがあるので少し待つ
  await new Promise(r => setTimeout(r, 80));
  for (const part of parts) {
    if (turn !== speechTurn) return;        // とちゅうで止められた
    clearReading();
    if (part.el) {                          // 読んでいる間、ボタンを光らせる
      readingEl = part.el;
      readingEl.classList.add('reading');
    }
    await speakOne(part.text, turn);
  }
  if (turn === speechTurn) clearReading();
}

// いま読んでいる途中か
function speaking() {
  return !!clipSource || ('speechSynthesis' in window && speechSynthesis.speaking);
}

// iPad で声を出せるようにする:最初のタッチのときに、音のない読み上げを1回する
let voiceUnlocked = false;
document.addEventListener('pointerdown', () => {
  if (voiceUnlocked || !('speechSynthesis' in window)) return;
  voiceUnlocked = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}, true);

// アプリを開いたら、VOICEVOX の声を読みこみはじめる
loadVoicePack();
