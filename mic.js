// ============================================================
// こえで いう(マイク)
//
// せいかいしたあとに、こたえを1文字ずつ表示して、声に出して言ってもらう機能です。
//   1. 「り」を大きく表示 → 「り」と読み上げる
//   2. 子どもが声を出す → マイクが声の大きさを感じ取って、次の文字へ
//   3. 最後に「りんご」ぜんぶ → 声が出たら「よく いえたね!」で終わり
//
// 【大事】
//   ・マイクの音は、iPadの中で「大きさ」を測るだけです。録音も送信もしません
//   ・言った内容が正しいかどうかは判定しません(声が出たら次へ進みます)
//   ・マイクが使えないときは、「いえた!」ボタンをタッチして進む形になります
// ============================================================

const MIC_SETTING_KEY = 'yarukoto_mic';   // おとなメニューのオン/オフを覚えておく場所

// 「こえで いう」がオンかどうか(おとなメニューの設定を優先、なければ config.js)
function micModeOn() {
  try {
    const saved = localStorage.getItem(MIC_SETTING_KEY);
    if (saved === 'on') return true;
    if (saved === 'off') return false;
  } catch (e) { }
  return !(CONFIG.voice_input && CONFIG.voice_input.enabled === false);
}
function setMicModeOn(on) {
  try { localStorage.setItem(MIC_SETTING_KEY, on ? 'on' : 'off'); } catch (e) { }
}

// 設定の値(config.js に書いていなければ初期値)
function micSetting(name, def) {
  const v = CONFIG.voice_input || {};
  return (v[name] === undefined) ? def : v[name];
}

// ------------------------------------------------------------
// マイクを開く・閉じる・声を待つ
// ------------------------------------------------------------
let micStream = null;     // マイクの音の流れ
let micAnalyser = null;   // 音の大きさを測る係
let micBuffer = null;     // 測った音を入れておく入れ物

// マイクを開く。使えたら true、だめなら false
async function openMic() {
  if (micAnalyser) return true;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    // echoCancellation:iPad自身のスピーカーの声(読み上げ)を、なるべく拾わないようにする
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    });
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const source = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 1024;
    micBuffer = new Float32Array(micAnalyser.fftSize);
    source.connect(micAnalyser);          // スピーカーにはつながない(測るだけ)
    return true;
  } catch (e) {
    closeMic();
    return false;                         // 許可されなかった・マイクがない など
  }
}

// マイクを閉じる(使わないときは閉じておく。iPadの上のマイクのしるしも消える)
function closeMic() {
  if (micStream) micStream.getTracks().forEach(t => t.stop());
  micStream = null;
  micAnalyser = null;
}

// いまの音の大きさ(0〜1くらい)を測る
function micLevel() {
  if (!micAnalyser) return 0;
  micAnalyser.getFloatTimeDomainData(micBuffer);
  let sum = 0;
  for (let i = 0; i < micBuffer.length; i++) sum += micBuffer[i] * micBuffer[i];
  return Math.sqrt(sum / micBuffer.length);   // RMS(音の強さの平均)
}

let repeatTurn = 0;           // 「こえで いう」の回の番号。止めるときに増やす
let skipRequested = false;    // 「すすむ/いえた!」ボタンが押された

// 声が出るまで待つ
//   戻り値: 'voice'(声が出た) / 'skip'(ボタン) / 'timeout'(時間切れ) / 'abort'(止められた)
function listenVoice(turn) {
  const threshold = micSetting('threshold', 0.04);          // これより大きい音を「声」とみなす
  const timeoutMs = micSetting('timeout_sec', 10) * 1000;   // この時間、声がなければ時間切れ
  return new Promise(resolve => {
    const startAt = Date.now();
    let voicedMs = 0;       // 声が出ていた合計の時間
    let started = false;    // 言いはじめたか
    let lastVoiceAt = 0;    // 最後に声が出ていた時刻
    const meter = $('repeat-level');
    const timer = setInterval(() => {
      const end = result => { clearInterval(timer); meter.style.transform = 'scale(1)'; resolve(result); };
      if (turn !== repeatTurn) return end('abort');
      if (skipRequested) return end('skip');
      const now = Date.now();
      const level = micLevel();
      // マイクの絵のまわりの輪を、声の大きさに合わせて大きくする
      meter.style.transform = `scale(${1 + Math.min(level / threshold, 3) * 0.25})`;
      if (level > threshold) {
        voicedMs += 50;
        lastVoiceAt = now;
        if (voicedMs >= 150) started = true;          // 0.15秒以上の声で「言いはじめた」
      }
      // 言いはじめたあと、0.4秒しずかになったら「言いおわった」
      if (started && now - lastVoiceAt > 400) return end('voice');
      // ずっと音がしている(まわりがうるさい)ときも、3秒で進む
      if (started && voicedMs > 3000) return end('voice');
      if (!started && micAnalyser && now - startAt > timeoutMs) return end('timeout');
    }, 50);
  });
}

// ------------------------------------------------------------
// こたえを「声に出す単位」に分ける
//   小さい字(ゃゅょ など)、っ、ー は前の字といっしょにする
//   例: しょうぼうしゃ → しょ / う / ぼ / う / しゃ
//       パイナップル   → パ / イ / ナッ / プ / ル
// ------------------------------------------------------------
function splitUnits(word) {
  const attach = 'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮっッー';
  const units = [];
  for (const ch of word) {
    if (attach.includes(ch) && units.length) units[units.length - 1] += ch;
    else units.push(ch);
  }
  return units;
}

// 数字のこたえの読み方
const NUMBER_READING = { 1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご', 6: 'ろく', 7: 'なな', 8: 'はち', 9: 'きゅう', 10: 'じゅう' };

// 文字のマスを表示する  units:分けた文字  now:いま言う番号(-1でぜんぶ光らせる)
function renderRepeat(units, now) {
  const box = $('repeat-word');
  // 文字数が多くても画面からはみ出さない大きさにする
  const chars = units.join('').length;
  box.style.fontSize = `min(20vh, ${Math.floor(78 / Math.max(chars, 1))}vw)`;
  box.innerHTML = '';
  units.forEach((u, i) => {
    const cell = document.createElement('span');
    let state = 'todo';                       // まだ(うすいマス)
    if (now === -1 || i === now) state = 'now'; // いま言う字(オレンジ)
    else if (i < now) state = 'done';           // 言えた字(みどり)
    cell.className = 'repeat-cell ' + state;
    cell.textContent = (state === 'todo') ? '' : u;
    box.appendChild(cell);
  });
}

// ------------------------------------------------------------
// こえで いう 本体。answer:こたえの文字。終わったら(止められても)終わる
// ------------------------------------------------------------
async function sayAlong(answer) {
  if (!micModeOn()) return;
  const turn = ++repeatTurn;
  const alive = () => turn === repeatTurn;
  const isNumber = /^\d+$/.test(answer);
  const reading = isNumber ? (NUMBER_READING[answer] || answer) : answer;
  // 数字は1文字ずつにせず、まとめて言う
  const units = isNumber ? [answer] : splitUnits(answer);

  const overlay = $('repeat');
  overlay.classList.remove('hidden');
  $('repeat-title').textContent = 'こえに だして いってみよう！';
  renderRepeat(units, isNumber ? -1 : 0);

  // マイクを開く。だめなら「いえた!」ボタンで進む形にする
  const micOk = await openMic();
  if (!alive()) return;
  overlay.classList.toggle('no-mic', !micOk);
  $('repeat-skip').textContent = micOk ? 'すすむ' : 'いえた！';

  // 1つ言ってもらう:読み上げ → 声を待つ(声がなければ1回だけ言いなおす)
  const askOnce = async text => {
    skipRequested = false;                  // 読み上げ中にボタンが押されても、ちゃんと進むよう先に消しておく
    for (let attempt = 0; attempt < 2; attempt++) {
      await say(text);
      if (!alive()) return;
      await sleep(250);                     // 読み上げの声のなごりを拾わないよう、少し待つ
      const r = await listenVoice(turn);
      if (r !== 'timeout') return;          // 声が出た・ボタン・止められた
      text = (attempt === 0) ? 'もういちど。' + text : text;
    }
  };

  await say('こえに だして いってみよう！');
  // 1文字ずつ
  if (!isNumber && units.length > 1) {
    for (let i = 0; i < units.length; i++) {
      if (!alive()) return;
      renderRepeat(units, i);
      await askOnce(units[i]);
      if (!alive()) return;
      tone(784, 0, .12);                    // 「ピッ」言えたよの音
    }
  }
  // 最後にぜんぶ
  if (!alive()) return;
  renderRepeat(units, -1);
  $('repeat-title').textContent = 'ぜんぶ いってみよう！';
  await askOnce(`${reading}、って いってみよう`);
  if (!alive()) return;

  // おしまい
  overlay.classList.add('good');
  $('repeat-title').textContent = 'よく いえたね！';
  sndCorrect();
  await sleep(500);
  await say('よく いえたね！');
  await sleep(700);
  if (alive()) stopSayAlong();
}

// 「こえで いう」を止めて片づける
function stopSayAlong() {
  repeatTurn++;
  closeMic();
  const overlay = $('repeat');
  overlay.classList.add('hidden');
  overlay.classList.remove('good', 'no-mic');
}

// 「すすむ/いえた!」ボタン
$('repeat-skip').addEventListener('click', () => { skipRequested = true; hush(); });

// ------------------------------------------------------------
// おとなメニューの「マイクのテスト」:5秒間、声の大きさを表示する
// ------------------------------------------------------------
async function micTest(showText) {
  const ok = await openMic();
  if (!ok) { showText('マイクが使えません(許可されていないか、マイクがありません)'); return; }
  const threshold = micSetting('threshold', 0.04);
  const until = Date.now() + 5000;
  let max = 0;
  while (Date.now() < until) {
    const level = micLevel();
    max = Math.max(max, level);
    const bars = '■'.repeat(Math.min(20, Math.round(level / threshold * 5)));
    showText(`声の大きさ:${bars}${level > threshold ? '  ← 声として感じ取れています' : ''}`);
    await sleep(100);
  }
  closeMic();
  showText(`テストおわり(いちばん大きい音 ${max.toFixed(3)} / 声とみなす大きさ ${threshold})`);
}
