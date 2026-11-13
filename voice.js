// ============================================================
// こえ(読み上げ)
//
// iPad に最初から入っている「音声読み上げ」の機能(Web Speech API)を使います。
// 声は iPad の中で作られるので、インターネットとは通信しません。
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
  if (!('speechSynthesis' in window)) return false;      // 読み上げが使えない環境
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
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// 1つの文を読む。読み終わったら(または止められたら)終わる
function speakOne(text, turn) {
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
  return 'speechSynthesis' in window && speechSynthesis.speaking;
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
