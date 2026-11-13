// ============================================================
// あさ・よるの やることリスト  ―  画面を動かすプログラム
//
// 【全体の流れ】
//   時間外(まっくろ)
//     ↓ 時間になる
//   やることリスト  … 絵をタッチして「できた」にする
//     ↓ ぜんぶできた
//   もんだい(4たく)… たしざん / にほんちず / これはなに?
//     ↓ せいかい
//   カレンダー     … きょうのところに花丸がつく
//     ↓ ボタンをおす
//   どうがをえらぶ → さいせい → カレンダーにもどる
//
// 【iPad版】サーバーは使わず、このiPadの中だけで動きます。
//   ・時間の判定 … iPadの時計を1秒ごとに見る
//   ・花丸の記録 … iPadの中(localStorage)に保存
//   ・動画       … iPadの中(IndexedDB)に保存。おとなメニューから追加する
//   ・設定       … config.js
// ============================================================

// ------------------------------------------------------------
// やることの内容(ここを書きかえると項目を変えられます)
//   id    : pictures.js の TASK_PICTURES にある絵の名前
//   label : 画面に出す文字
// ------------------------------------------------------------
const TASKS = {
  // 朝:4つ
  morning: [
    { id: 'gohan',    label: 'ごはん' },
    { id: 'hamigaki', label: 'はみがき' },
    { id: 'okigae',   label: 'おきがえ' },
    { id: 'toilet',   label: 'トイレ' },
  ],
  // 夜:おふろを足して5つ
  evening: [
    { id: 'gohan',    label: 'ごはん' },
    { id: 'ofuro',    label: 'おふろ' },
    { id: 'hamigaki', label: 'はみがき' },
    { id: 'okigae',   label: 'おきがえ' },
    { id: 'toilet',   label: 'トイレ' },
  ],
};

const VIDEO_COUNT_SECONDS = 20; // この秒数以上見たら「1本見た」と数える(まちがいタッチ対策)

// ------------------------------------------------------------
// いまの状態を覚えておく変数
// ------------------------------------------------------------
const cfg = CONFIG;        // config.js に書いた設定
let sessionKey = null;     // "2026-11-12/morning" のような、いまの回のしるし
let session = null;        // 'morning' か 'evening'
let today = null;          // "2026-11-12"
let record = null;         // この回の記録(できたこと、花丸など)
let currentScreen = 'sleep';
let lastWarn = false;      // 注意の時刻を過ぎたか
let warnDismissed = false; // 大きな注意表示をタッチで消したか
let videoChoices = null;   // この回に見せる3つの動画 [{name, url}]
let testMode = null;       // おとなメニューの動作テスト中は {id, session, warn}
let testCount = 0;         // テストを始めた回数(毎回あたらしい回として始めるため)
let practice = null;       // もんだいだけモード中は {types:出す種類, count:せいかい数, key:始めたときの時間帯}
let greetPending = false;  // 朝/夜のはじまりのあいさつを、まだ言っていない
let breakfastOn = false;   // いま朝ごはんタイマーの表示中か
let breakfastEmptySaid = false;  // 「おしまいだよ」をもう言ったか
let lastAnswer = null;     // 直前のもんだいのこたえ(同じもんだいが続かないようにする)

// よく使う小道具 ---------------------------------------------
const $ = id => document.getElementById(id);                       // 部品を名前で探す
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min; // min〜maxの数
const pick = arr => arr[rand(0, arr.length - 1)];                  // どれか1つえらぶ
const sleep = ms => new Promise(r => setTimeout(r, ms));          // ms ミリ秒まつ
function shuffle(arr) {                                            // ならびをまぜる
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 画面を切り替える(name: sleep / list / quiz / calendar / videos / player)
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
  currentScreen = name;
}

// ============================================================
// おと(スピーカーがあれば鳴る。音のファイルは使わず、その場で作る)
// ============================================================
let audioCtx = null;

// 1つの音を鳴らす  freq:高さ  start:何秒後に  dur:長さ  type:音色  vol:大きさ
function tone(freq, start, dur, type = 'sine', vol = 0.25) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime + start;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);   // だんだん小さく
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch (e) { /* 音が出せない環境でも止まらないようにする */ }
}
const sndDone    = () => { tone(523, 0, .15); tone(659, .12, .15); tone(784, .24, .3); };        // できた!
const sndUndo    = () => { tone(392, 0, .15); };                                                // とりけし
const sndWrong   = () => { tone(220, 0, .2, 'triangle'); tone(196, .18, .3, 'triangle'); };     // ざんねん
const sndCorrect = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .13, .25)); tone(1047, .6, .5); }; // せいかい
const sndStamp   = () => { [784, 880, 988, 1175, 1319, 1568].forEach((f, i) => tone(f, i * .22, .3)); };  // はなまる
const sndTap     = () => { tone(660, 0, .08); };

// 注意の音(くりかえし鳴る)
let alarmTimer = null;
function startAlarm() {
  if (alarmTimer) return;
  let count = 0;
  const ring = () => {
    if (speaking()) return;                 // 声で読んでいる間は鳴らさない
    // 1回目と、そのあと8回に1回は、音のかわりに声で知らせる
    if (voiceOn() && count++ % 8 === 0) {
      say('いそごう！ ' + document.querySelector('.warn-text').textContent);
      return;
    }
    tone(880, 0, .2, 'square', .15); tone(660, .25, .2, 'square', .15);
  };
  ring();
  alarmTimer = setInterval(ring, 1200);
}
function stopAlarm() {
  clearInterval(alarmTimer);
  alarmTimer = null;
}

// ============================================================
// 記録の保存(このiPadの中の localStorage という場所に保存する)
//   形:  { "2026-11-12": { "morning": {...}, "evening": {...} }, ... }
// ============================================================
const RECORD_KEY = 'yarukoto_records';

// 保存してある記録をぜんぶ読む。無い・壊れているときは空を返す
function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(RECORD_KEY));
    return (data && typeof data === 'object') ? data : {};
  } catch (e) {
    return {};
  }
}

// からっぽの記録を作る
function newRecord() {
  return { tasks: {}, quiz: false, hanamaru: false, videos_watched: 0 };
}

// いまの記録を保存する(テスト中は保存しない=本物の花丸をよごさない)
function saveRecord() {
  if (testMode) return;
  const records = loadRecords();
  records[today] = records[today] || {};
  records[today][session] = record;
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(records));
  } catch (e) { /* 保存できなくても画面は止めない */ }
}

// ============================================================
// 時間の判定(iPadの時計を見て、朝/夜/時間外を決める)
// ============================================================
// "06:30" のような文字を、0時からの分数(390)に変える
function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// いまの状態を調べる
//   session : 'morning' / 'evening' / null(時間外)
//   warn    : 注意の時刻を過ぎているか
function currentStatus() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const st = {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    session: null,
    warn: false,
  };

  // テスト中:時計に関係なく、おとなメニューで選んだ時間帯として動く
  if (testMode) {
    st.session = testMode.session;
    st.warn = testMode.warn;
    return st;
  }

  // 平日だけの設定なら、日(0)・土(6)は動かさない
  const weekday = now.getDay();
  if (cfg.weekdays_only && (weekday === 0 || weekday === 6)) return st;

  const minutes = now.getHours() * 60 + now.getMinutes();
  for (const name of ['morning', 'evening']) {
    const start = toMinutes(cfg[name].start), end = toMinutes(cfg[name].end);
    if (start === null || end === null) continue;
    if (start <= minutes && minutes < end) {
      st.session = name;
      const warnAt = toMinutes(cfg[name].warn);
      st.warn = warnAt !== null && minutes >= warnAt;
      break;
    }
  }
  return st;
}

// 1秒ごとに呼ばれる:時計を見て、画面を合わせる
function tick() {
  const st = currentStatus();
  $('clock').textContent = st.time;
  $('sleep-clock').textContent = st.time;

  // もんだいだけモード中:朝/夜の時間が「新しく始まった」ときだけ終わらせて、やることリストにする
  if (practice) {
    const nowKey = st.session ? `${st.date}/${st.session}` : null;
    if (nowKey && nowKey !== practice.key) stopPractice();
    else return;
  }

  // 時間外 → おやすみ画面にする
  if (!st.session) {
    if (sessionKey !== null || currentScreen !== 'sleep') goSleep();
    return;
  }

  // 朝/夜が始まった(または日付が変わった、テストを始めた)→ 新しい回を始める
  const key = testMode ? `test${testMode.id}/${st.session}` : `${st.date}/${st.session}`;
  if (key !== sessionKey) startSession(st, key);

  lastWarn = st.warn;
  checkWarn();
  updateBreakfast();         // 朝ごはんタイマー(始まったときは、あいさつのかわりに案内を言う)

  // 朝/夜のはじまりのあいさつ(注意が出ているときは、注意のほうを優先して言わない)
  if (greetPending) {
    greetPending = false;
    if ($('warn-overlay').classList.contains('hidden')) {
      say(session === 'morning' ? 'おはよう！ あさの やること、はじめよう！'
                                : 'こんばんは！ よるの やること、はじめよう！');
    }
  }
}

// 時間外の画面にする
function goSleep() {
  hush();
  stopPlayer();
  stopAlarm();
  clearVideoChoices();
  $('warn-overlay').classList.add('hidden');
  $('stamp').classList.add('hidden');
  $('quiz-result').classList.add('hidden');
  sessionKey = null;
  document.body.className = '';
  showScreen('sleep');
}

// 朝または夜の回を始める
function startSession(st, key) {
  sessionKey = key;
  session = st.session;
  today = st.date;
  // 記録が残っていれば続きから(アプリを開き直しても大丈夫)。テスト中は毎回まっさら
  const saved = testMode ? null : (loadRecords()[today] || {})[session];
  record = Object.assign(newRecord(), saved || {});
  if (typeof record.tasks !== 'object' || record.tasks === null) record.tasks = {};
  warnDismissed = false;
  breakfastOn = false;
  clearVideoChoices();
  document.body.className = session;     // 朝と夜で色を変える

  if (record.hanamaru) {
    showCalendar(false);                      // もう花丸をもらっている → カレンダーから
  } else {
    showList();                               // まだ → やることリストから
    // あいさつは tick の最後で(注意が出るときは言わない)。朝ごはんタイマーの案内を言ったときは、あいさつはしない
    greetPending = !breakfastOn;
  }
}

// ============================================================
// やることリスト
// ============================================================
function showList() {
  const tasks = TASKS[session];
  $('list-title').textContent = session === 'morning' ? 'あさの やること' : 'よるの やること';
  $('list-icon').innerHTML = session === 'morning' ? SUN_SVG : MOON_SVG;

  // カードを作りなおす
  const box = $('task-cards');
  box.innerHTML = '';
  box.classList.toggle('five', tasks.length >= 5);
  tasks.forEach(t => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.id = t.id;
    card.innerHTML =
      `<div class="pic">${svgWrap(TASK_PICTURES[t.id])}</div>` +
      `<div class="label">${t.label}</div>` +
      `<div class="done-mark">${HANAMARU_SVG}</div>`;
    card.addEventListener('click', () => toggleTask(t.id, card));
    box.appendChild(card);
  });
  // 朝ごはんタイマー用の絵(ごはんのカードの右に出る。タイマー中だけ見える)
  if (session === 'morning') {
    const scene = document.createElement('div');
    scene.id = 'breakfast-scene';
    scene.className = 'breakfast-scene';
    scene.innerHTML = BREAKFAST_SVG;
    box.appendChild(scene);
  }
  updateList();
  showScreen('list');
  updateBreakfast();
}

// カードをタッチしたとき:できた ⇔ まだ を切り替える(まちがえても もどせる)
function toggleTask(id, card) {
  if (record.tasks[id]) {
    delete record.tasks[id];
    card.classList.remove('just-done');
    sndUndo();
    hush();
  } else {
    record.tasks[id] = true;
    card.classList.add('just-done');   // 花丸を書くアニメーション
    sndDone();
  }
  saveRecord();
  updateList();
  checkWarn();
  updateBreakfast();         // ごはんをタッチしたら、その場で元の並びにもどる
  // こえ:ぜんぶできたら次へのさそい、そうでなければ「○○、できたね!」
  if (record.tasks[id]) {
    if (doneCount() === TASKS[session].length) {
      say('ぜんぶ できたね！ すごい！ もんだいに ちょうせんしよう！');
    } else {
      const task = TASKS[session].find(t => t.id === id);
      say(task.label + '、できたね！');
    }
  }
}

// できた数をかぞえる
function doneCount() {
  return TASKS[session].filter(t => record.tasks[t.id]).length;
}

// カードの見た目と、下のボタンを今の状態に合わせる
function updateList() {
  document.querySelectorAll('.task-card').forEach(card => {
    card.classList.toggle('done', !!record.tasks[card.dataset.id]);
  });
  const all = doneCount() === TASKS[session].length;
  $('btn-quiz').classList.toggle('hidden', !all);       // ぜんぶできたらボタンを出す
  $('list-message').classList.toggle('hidden', all);
}

// ============================================================
// 朝ごはんタイマー
//   朝の 6:45〜7:20(config.js の breakfast)で、ごはんがまだのとき:
//     ・ごはんのカードだけにして、右に「くまが ごはんを たべている絵」を出す
//     ・下に、のこり時間の色の帯を出す(6:45 でいっぱい → 7:15 でゼロ)
//     ・絵のごはんも、帯と同じ割合でへっていき、7:15 で空になる
//     ・おかず(たまごやき3つ・ウインナー3本)は、1つずつなくなっていく
//   7:20 になるか、ごはんのカードをタッチすると、元の並びにもどる
// ============================================================
// いまタイマーを出すべきか調べる。出すなら { fraction:のこりの割合(1→0), leftSec:のこり秒 }、出さないなら null
function breakfastInfo() {
  const b = cfg.breakfast;
  if (!b || b.enabled === false) return null;
  if (session !== 'morning' || currentScreen !== 'list' || !record || record.tasks.gohan) return null;

  // おとなメニューの「朝ごはんタイマーをためす」:30分を1分に短縮して動かす
  if (testMode) {
    if (!testMode.breakfast) return null;
    const elapsed = (Date.now() - testMode.breakfast) / 1000;   // テスト開始からの秒数
    if (elapsed >= 70) return null;                             // 60秒で空 → 10秒後に元の並びへ
    const left = Math.max(0, 60 - elapsed);
    return { fraction: left / 60, leftSec: left * 30 };         // 表示用の「のこり」は30倍にもどす
  }

  const start = toMinutes(b.start), empty = toMinutes(b.empty), end = toMinutes(b.end);
  if (start === null || empty === null || end === null || empty <= start) return null;
  const now = new Date();
  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();   // 0時からの秒数
  if (sec < start * 60 || sec >= end * 60) return null;
  const left = Math.max(0, empty * 60 - sec);
  return { fraction: left / ((empty - start) * 60), leftSec: left };
}

// タイマーの表示を今の状態に合わせる(1秒ごと、またはカードをタッチしたときに呼ばれる)
function updateBreakfast() {
  const info = breakfastInfo();
  const on = info !== null;
  $('screen-list').classList.toggle('breakfast', on);
  $('breakfast-timer').classList.toggle('hidden', !on);
  $('list-message').textContent = on ? 'たべおわったら ごはんを タッチしてね' : 'できたら えを タッチしてね';

  if (on) {
    const f = Math.min(1, Math.max(0, info.fraction));
    // 色の帯:長さ=のこりの割合、色=みどり(120)→きいろ(60)→あか(0)
    $('bt-fill').style.width = (f * 100) + '%';
    $('bt-fill').style.backgroundColor = `hsl(${Math.round(120 * f)}, 70%, 45%)`;
    $('bt-label').textContent = f > 0 ? `あと ${Math.ceil(info.leftSec / 60)}ふん` : 'おしまい！';
    // 絵のごはん:おちゃわんのふち(y=100)を基準に、たてにちぢめる
    const rice = document.getElementById('bf-rice');
    if (rice) rice.setAttribute('transform', `translate(0 100) scale(1 ${f.toFixed(3)}) translate(0 -100)`);
    const scene = document.getElementById('breakfast-scene');
    if (scene) {
      scene.classList.toggle('empty', f <= 0);
      // おかず(たまごやき・ウインナー):のこりの割合に合わせて、番号の大きいものから1つずつ消す
      const items = scene.querySelectorAll('.bf-item');
      items.forEach(el => {
        const order = Number(el.dataset.order);
        el.style.display = (f > (order + 0.5) / items.length) ? '' : 'none';
      });
    }

    if (!breakfastOn) {
      // タイマーが始まった:あいさつのかわりに案内を言う
      breakfastEmptySaid = false;
      greetPending = false;
      if (f > 0 && $('warn-overlay').classList.contains('hidden')) {
        say('あさごはんの じかんだよ。たべおわったら、ごはんを タッチしてね');
      }
    }
    if (f <= 0 && !breakfastEmptySaid) {
      // ゼロになった:1回だけ知らせる
      breakfastEmptySaid = true;
      tone(660, 0, .25); tone(523, .3, .4);
      say('ごはんの じかんは、おしまいだよ。たべおわったら、ごはんを タッチしてね');
    }
  } else if (breakfastOn && session === 'morning' && currentScreen === 'list' && record && !record.tasks.gohan) {
    // 時間切れで元の並びにもどった(ごはんはまだ)
    say('ほかの やることも、はじめよう！');
  }
  breakfastOn = on;
}

// 注意(いそごう!)を出すかどうか決める
function checkWarn() {
  let need = false;
  if (currentScreen === 'list' && lastWarn) {
    const done = doneCount();
    const total = TASKS[session].length;
    // none_done:1つもできていないとき / any_left:1つでも残っているとき
    need = (cfg.warn_condition === 'any_left') ? done < total : done === 0;
  }
  $('hurry-banner').classList.toggle('hidden', !need);
  if (need && !warnDismissed) {
    document.querySelector('.warn-text').textContent =
      (cfg.warn_condition === 'any_left' && doneCount() > 0) ? 'まだ のこっているよ' : 'まだ ひとつも おわってないよ';
    $('warn-overlay').classList.remove('hidden');
    startAlarm();
  } else {
    $('warn-overlay').classList.add('hidden');
    stopAlarm();
  }
}

// ============================================================
// もんだい(4たく)
//   どの問題も { question:もんだい文, picture:絵のHTML,
//               choices:[こたえ4つ], answer:せいかい, after:表示後にする処理 } の形で作る
// ============================================================

// たしざん(1〜5 + 1〜5)
function makeMathQuiz() {
  const a = rand(1, 5), b = rand(1, 5), ans = a + b;
  // まちがいのこたえ:せいかいに近い数(±3)から3つ
  const pool = [];
  for (let n = Math.max(1, ans - 3); n <= Math.min(10, ans + 3); n++) if (n !== ans) pool.push(n);
  const choices = shuffle(pool).slice(0, 3).concat(ans).sort((x, y) => x - y);
  // りんごを a こ と b こ ならべて、かぞえられるようにする
  const apples = n => `<div class="math-group">${svgWrap(COUNT_APPLE).repeat(n)}</div>`;
  return {
    question: 'あわせて いくつ？',
    speech: `${a} たす ${b} は、いくつ？`,
    praise: `せいかい！ ${a} たす ${b} は、${ans} だよ！`,
    picture: `<div class="math">
        <div class="math-apples">${apples(a)}<div class="math-plus">＋</div>${apples(b)}</div>
        <div class="math-formula">${a}＋${b}＝<span class="q">？</span></div>
      </div>`,
    choices: choices.map(String),
    answer: String(ans),
  };
}

// にほんちず(ここは どこ?)
function makeMapQuiz() {
  const all = JAPAN_MAP.prefectures;
  // config.json の map_prefectures に書かれた県だけ出す(空ならぜんぶ)
  const wanted = cfg.map_prefectures || [];
  let pool = all.filter(p => wanted.includes(p.id));
  if (pool.length === 0) pool = all;
  const target = pick(pool);
  // まちがいのこたえ:出題リストが4つ以上あればその中から、足りなければ全国から
  const others = (pool.length >= 4 ? pool : all).filter(p => p.id !== target.id);
  const choices = shuffle(shuffle(others).slice(0, 3).concat(target)).map(p => p.name);
  const paths = all.map(p =>
    `<path d="${p.path}"${p.id === target.id ? ' class="target"' : ''}/>`).join('');
  return {
    question: 'ここは どこ？',
    // main:こたえの県のまわりを大きくうつす地図  mini:日本ぜんたいの小さな地図
    picture: `<div class="map-wrap">
        <svg class="map main" viewBox="${JAPAN_MAP.viewBox}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>
        <svg class="map mini" viewBox="${JAPAN_MAP.viewBox}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>
      </div>`,
    choices: choices,
    answer: target.name,
    speech: 'あかい ところは、どこかな？',
    praise: `せいかい！ ここは、${target.name} だよ！`,
    // 画面に出したあと、こたえの県の位置と大きさを調べて地図を合わせる
    after: () => {
      const main = document.querySelector('#quiz-picture svg.main');
      const mini = document.querySelector('#quiz-picture svg.mini');
      const [, , mapW, mapH] = JAPAN_MAP.viewBox.split(' ').map(Number);
      const box = main.querySelector('.target').getBBox();      // こたえの県をかこむ四角
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      const big = Math.max(box.width, box.height);

      // うつす範囲:県の大きさの約2.6倍(小さい県でも、まわりの県が見えるよう最低150)
      const size = Math.min(Math.max(big * 2.6, 150), mapH);
      // 範囲が地図の外にはみ出さないようにずらす
      const clamp = (v, lo, hi) => (hi < lo ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi));
      const x = clamp(cx - size / 2, 0, mapW - size);
      const y = clamp(cy - size / 2, 0, mapH - size);
      main.setAttribute('viewBox', `${x} ${y} ${size} ${size}`);

      // 輪を足す小道具
      const addCircle = (svg, cls, r) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('class', cls);
        c.setAttribute('cx', cx);
        c.setAttribute('cy', cy);
        c.setAttribute('r', r);
        svg.appendChild(c);
      };
      addCircle(main, 'ring', big / 2 + size * 0.05);   // 大きい地図:ひろがる赤い輪
      addCircle(mini, 'spot', Math.max(big / 2, 22));   // 小さい地図:「ここ」の丸
    },
  };
}

// これは なに?(くだもの・のりもの・自分で追加した絵)
function makePictureQuiz() {
  // 3つのグループを作る。まちがいのこたえは同じグループから選ぶ
  const groups = [
    FRUITS.map(f => ({ name: f.name, html: svgWrap(f.svg) })),
    VEHICLES.map(v => ({ name: v.name, html: svgWrap(v.svg) })),
    // 追加した絵:ファイル名(拡張子なし)がこたえになる
    (cfg.my_pictures || []).map(file => ({
      name: file.replace(/\.[^.]+$/, ''),
      html: `<img src="my_pictures/${encodeURIComponent(file)}" alt="">`,
    })),
  ];
  const everything = groups.flat();
  const target = pick(everything);
  const group = groups.find(g => g.includes(target));
  // 同じなまえを除いた、まちがいのこたえの候補
  const names = list => [...new Set(list.map(x => x.name))].filter(n => n !== target.name);
  let others = names(group);
  if (others.length < 3) others = names(everything);   // 追加の絵が少ないときは全体から
  return {
    question: 'これは なに？',
    picture: target.html,
    speech: 'これは、なにかな？',
    praise: `せいかい！ これは、${target.name} だよ！`,
    choices: shuffle(shuffle(others).slice(0, 3).concat(target.name)),
    answer: target.name,
  };
}

// もんだいを1つ作って画面に出す
function showQuiz() {
  const makers = { math: makeMathQuiz, map: makeMapQuiz, picture: makePictureQuiz };
  // config.json の quiz_types に書かれた種類からランダムにえらぶ
  // もんだいだけモードのときは、メニューで選んだ種類を出す
  let types = ((practice ? practice.types : cfg.quiz_types) || []).filter(t => makers[t]);
  if (types.length === 0) types = Object.keys(makers);
  // 直前と同じこたえのもんだいは、なるべく続けて出さない(5回まで作りなおす)
  let quiz = makers[pick(types)]();
  for (let i = 0; i < 5 && quiz.answer === lastAnswer; i++) quiz = makers[pick(types)]();
  lastAnswer = quiz.answer;
  const key = sessionKey;        // 途中で時間切れになったか調べるために覚えておく
  const mode = practice;         // もんだいだけモードが途中で終わったか調べるために覚えておく
  // もんだいだけモードのときだけ、右上にせいかいの数(★)を出す
  $('quiz-count').classList.toggle('hidden', !practice);
  if (practice) $('quiz-count').textContent = '★ ' + practice.count;
  let locked = false;            // せいかいの後は押せなくする

  $('quiz-question').textContent = quiz.question;
  $('quiz-picture').innerHTML = quiz.picture;
  $('quiz-result').classList.add('hidden');

  const box = $('quiz-choices');
  box.innerHTML = '';
  quiz.choices.forEach(text => {
    const btn = document.createElement('button');
    btn.className = 'choice' + (text.length >= 7 ? ' long' : '');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      if (locked || btn.classList.contains('wrong')) return;
      if (text === quiz.answer) {
        // ---- せいかい ----
        locked = true;
        btn.classList.add('correct');
        sndCorrect();
        $('quiz-result').textContent = 'せいかい！';
        $('quiz-result').classList.remove('hidden');
        // こえ:効果音のあとに「せいかい! ○○ だよ!」と言う。
        // 次の画面へは「言い終わる」と「最低の待ち時間」の両方がすんでから進む
        const praised = sleep(700).then(() => say(quiz.praise));
        if (mode) {
          // もんだいだけモード:★を1つふやして、次のもんだいへ(花丸・動画はなし)
          mode.count++;
          $('quiz-count').textContent = '★ ' + mode.count;
          Promise.all([praised, sleep(1500)]).then(() => {
            $('quiz-result').classList.add('hidden');
            if (practice === mode) showQuiz();
          });
          return;
        }
        record.quiz = true;
        record.hanamaru = true;      // もんだいができたら花丸
        saveRecord();
        Promise.all([praised, sleep(2200)]).then(() => {
          $('quiz-result').classList.add('hidden');
          if (sessionKey === key && !practice) showCalendar(true);
        });
      } else {
        // ---- まちがい:そのボタンを灰色にして、もういちど えらべる ----
        btn.classList.add('wrong');
        sndWrong();
        $('quiz-question').textContent = 'もういちど かんがえてみよう';
        say('ちがうよ。もういちど、かんがえてみよう');
      }
    });
    box.appendChild(btn);
  });

  showScreen('quiz');
  if (quiz.after) quiz.after();   // 画面に出してからでないとできない処理(地図の輪)

  // こえ:もんだい文 → こたえを上から順に(読んでいるボタンを光らせる)
  quizSpeech = [{ text: quiz.speech || quiz.question }];
  if (!(cfg.voice && cfg.voice.read_choices === false)) {
    box.querySelectorAll('.choice').forEach(btn => quizSpeech.push({ text: btn.textContent, el: btn }));
  }
  $('btn-say').classList.toggle('hidden', !voiceOn());
  sleep(300).then(() => { if (currentScreen === 'quiz' && !locked) say(quizSpeech); });
}

// 「もういちど きく」ボタン:いまのもんだいを、もう一度読む
let quizSpeech = [];
$('btn-say').addEventListener('click', () => say(quizSpeech));

// ============================================================
// もんだいだけモード(おとなメニューから切り替える)
//   やることリスト・花丸・動画はなしで、もんだいを次々に出す。
//   時間外や土日でも使える。朝/夜の時間が始まったら自動で終わる。
// ============================================================
// types: 出す種類の一覧(例 ['math'])。null なら config.js の quiz_types どおり
function startPractice(types) {
  testMode = null;                      // 動作テスト中だったらやめる(先にやめて、本当の時間帯を見る)
  const st = currentStatus();
  stopPlayer();
  stopAlarm();
  clearVideoChoices();
  $('warn-overlay').classList.add('hidden');
  $('stamp').classList.add('hidden');
  practice = {
    types: types || cfg.quiz_types,
    count: 0,
    // 始めたときの時間帯。これと違う時間帯が始まったら、モードを終わらせる
    key: st.session ? `${st.date}/${st.session}` : null,
  };
  sessionKey = null;                    // モードを終えたとき、画面を最初から始めなおすため
  document.body.className = 'practice'; // もんだいだけモード用の色にする
  showQuiz();
}

// もんだいだけモードを終わる(このあと tick が、今の時間に合った画面にする)
function stopPractice() {
  hush();
  practice = null;
  sessionKey = null;
  $('quiz-result').classList.add('hidden');
  $('quiz-count').classList.add('hidden');
  document.body.className = '';
}

// ============================================================
// カレンダー
// ============================================================
// animate が true のとき、花丸をもらう大きなアニメーションを出す
function showCalendar(animate) {
  const records = loadRecords();

  // テスト中(保存しない)でも今日の花丸が出るよう、手元の記録を重ねる
  records[today] = Object.assign({}, records[today]);
  records[today][session] = record;

  const [y, m, d] = today.split('-').map(Number);
  $('cal-title').textContent = m + 'がつ';

  const firstWeekday = new Date(y, m - 1, 1).getDay();   // 1日が何曜日か(0=日)
  const daysInMonth = new Date(y, m, 0).getDate();       // その月が何日まであるか
  const heads = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];
  const dayClass = w => (w === 0 ? ' sun' : w === 6 ? ' sat' : '');

  // ようびの見出し
  let html = heads.map((h, w) => `<div class="cal-head${dayClass(w)}">${h}</div>`).join('');
  // 1日より前の空きマス
  for (let i = 0; i < firstWeekday; i++) html += '<div class="cal-cell empty"></div>';
  // 日付のマス
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const rec = records[dateStr] || {};
    const w = (firstWeekday + day - 1) % 7;
    // 左:朝(たいよう) 右:夜(つき)。花丸をもらっていたら花丸を出す
    const slot = (name, icon) => {
      const got = rec[name] && rec[name].hanamaru;
      return `<div class="cal-slot${got ? ' got' : ''}"><div class="mark-bg">${icon}</div>${got ? HANAMARU_SVG : ''}</div>`;
    };
    html += `<div class="cal-cell${dayClass(w)}${day === d ? ' today' : ''}">` +
            `<span class="num">${day}</span>${slot('morning', SUN_SVG)}${slot('evening', MOON_SVG)}</div>`;
  }
  $('calendar').innerHTML = html;

  updateCalendarHeader();
  showScreen('calendar');

  if (animate) {
    // 大きな花丸を書くアニメーション → 3.4秒後に消す
    $('stamp-mark').innerHTML = HANAMARU_SVG;
    $('stamp').classList.remove('hidden');
    sndStamp();
    sleep(1500).then(() => say('はなまる！ よくできました！'));
    setTimeout(() => $('stamp').classList.add('hidden'), 3400);
  }
}

// あと何本動画を見られるか(0設定なら無制限)
function videosLeft() {
  if (!cfg.videos_per_session) return Infinity;
  return cfg.videos_per_session - (record.videos_watched || 0);
}

// カレンダーの上のメッセージとボタン
function updateCalendarHeader() {
  const left = videosLeft() > 0;
  $('btn-video').classList.toggle('hidden', !left);
  const bye = session === 'morning' ? 'いってらっしゃい！' : 'おやすみなさい';
  $('cal-message').textContent = left ? 'よくできました！' : 'よくできました！ ' + bye;
}

// ============================================================
// どうが(このiPadの中の IndexedDB という場所に保存する)
//   おとなメニューから取り込んだ動画を、名前とセットでしまっておく
// ============================================================
// 保存場所を開く
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('yarukoto', 1);
    // はじめて開いたときに「videos」という入れ物を作る(名前がカギ)
    req.onupgradeneeded = () => req.result.createObjectStore('videos', { keyPath: 'name' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 入れ物に対して1つの操作をする小道具  mode:'readonly'か'readwrite'  fn:やりたい操作
async function dbRun(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('videos', mode);
    const req = fn(tx.objectStore('videos'));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
const dbNames  = () => dbRun('readonly', s => s.getAllKeys());            // 動画の名前の一覧
const dbGet    = name => dbRun('readonly', s => s.get(name));             // 1本とり出す
const dbPut    = (name, blob) => dbRun('readwrite', s => s.put({ name, blob }));  // しまう
const dbDelete = name => dbRun('readwrite', s => s.delete(name));         // けす

// えらぶ画面に出した動画の「再生用アドレス」を片づける
function clearVideoChoices() {
  (videoChoices || []).forEach(v => URL.revokeObjectURL(v.url));
  videoChoices = null;
}

async function showVideos() {
  const key = sessionKey;
  // この回に見せる3つは、最初に1回だけ決める(もどっても同じ3つ)
  if (!videoChoices) {
    const list = [];
    try {
      const names = shuffle(await dbNames()).slice(0, 3);
      for (const name of names) {
        const item = await dbGet(name);
        // タッチした瞬間にすぐ再生できるよう、ここで再生用アドレスを作っておく
        if (item && item.blob) list.push({ name, url: URL.createObjectURL(item.blob) });
      }
    } catch (e) { /* 読めなければ「ありません」を出す */ }
    if (sessionKey !== key) { list.forEach(v => URL.revokeObjectURL(v.url)); return; }
    videoChoices = list;
  }
  const box = $('video-cards');
  box.innerHTML = '';
  if (videoChoices.length === 0) {
    box.innerHTML = '<div class="no-video">どうがが ありません<br>(ひだりしたを ながおし → おとなメニューで ついか)</div>';
  }
  videoChoices.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card';
    // #t=0.1 は「さいしょのあたりの絵を表紙にする」という意味
    card.innerHTML = `<div class="thumb"><video muted playsinline preload="metadata" src="${v.url}#t=0.1"></video></div><div class="name"></div>`;
    card.querySelector('.name').textContent = v.name.replace(/\.[^.]+$/, '');   // 拡張子をとった名前
    card.addEventListener('click', () => { sndTap(); playVideo(v.url); });
    box.appendChild(card);
  });
  showScreen('videos');
  say('どれを みる？');
}

// えらんだ動画を再生する
function playVideo(url) {
  hush();                               // 動画の音とかさならないよう、読み上げを止める
  $('video-cards').innerHTML = '';      // 表紙用の動画を片づけてメモリを空ける
  const player = $('player');
  player.src = url;
  showScreen('player');
  // iPadが自動再生を止めた場合は、画面をタッチすると始まる
  player.play().catch(() => {});
}

// 再生をとめて片づける
function stopPlayer() {
  const player = $('player');
  player.pause();
  player.removeAttribute('src');
  player.load();
}

// 動画が終わった/「おわる」を押したとき
function finishVideo() {
  if (currentScreen !== 'player') return;
  const player = $('player');
  // 最後まで見たか、20秒以上見たら「1本」と数える
  const watched = player.ended || player.currentTime >= VIDEO_COUNT_SECONDS;
  stopPlayer();
  if (watched) {
    record.videos_watched = (record.videos_watched || 0) + 1;
    saveRecord();
  }
  showCalendar(false);
  // もう見られる動画がなければ、おわりのあいさつ
  if (videosLeft() <= 0) {
    say(session === 'morning' ? 'よくできました！ いってらっしゃい！' : 'よくできました！ おやすみなさい。');
  }
}

// ============================================================
// おとなメニュー(画面の左下を2秒ながおしすると開く)
//   動画の追加・削除、読み上げ、もんだいだけモード、動作テスト、記録の削除ができる
// ============================================================
// メニューを開く前の「おとなの確認」:かけざんの4たく
function openGate() {
  const a = rand(6, 9), b = rand(6, 9), ans = a * b;
  const set = new Set([ans]);
  while (set.size < 4) set.add(ans + rand(-9, 9));     // 近い数のまちがいを3つ
  $('gate-question').textContent = `${a} × ${b} ＝ ？`;
  const box = $('gate-choices');
  box.innerHTML = '';
  shuffle([...set]).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'p-btn';
    btn.textContent = n;
    // せいかいならメニューへ、まちがいなら閉じる
    btn.addEventListener('click', () => { if (n === ans) openParentMenu(); else closeParent(); });
    box.appendChild(btn);
  });
  $('parent-gate').classList.remove('hidden');
  $('parent-menu').classList.add('hidden');
  $('parent').classList.remove('hidden');
}

function openParentMenu() {
  $('parent-gate').classList.add('hidden');
  $('parent-menu').classList.remove('hidden');
  $('p-status').textContent = '';
  $('p-test-state').textContent = testMode ? 'テスト中です' : '';
  $('p-voice-state').textContent = '読み上げ:' + (voiceOn() ? 'オン' : 'オフ');
  $('p-practice-state').textContent = practice ? 'いま、もんだいだけモードです' : '';
  refreshParentVideos();
}

function closeParent() {
  $('parent').classList.add('hidden');
}

// メニューの中の動画一覧を作りなおす
async function refreshParentVideos() {
  const box = $('p-videos');
  let names = [];
  try { names = await dbNames(); } catch (e) { $('p-status').textContent = '動画の保存場所を開けませんでした'; }
  box.innerHTML = names.length ? '' : '<div class="p-note">まだ動画がありません</div>';
  names.forEach(name => {
    const row = document.createElement('div');
    row.className = 'p-row';
    row.innerHTML = '<span class="p-name"></span><button class="p-btn small">名前を変える</button><button class="p-btn small red">削除</button>';
    row.querySelector('.p-name').textContent = name;
    const [renameBtn, deleteBtn] = row.querySelectorAll('button');
    // 名前を変える:画面に出る名前になる
    renameBtn.addEventListener('click', async () => {
      const next = prompt('画面に出す名前(ひらがながおすすめ)', name.replace(/\.[^.]+$/, ''));
      if (!next || next === name) return;
      const item = await dbGet(name);
      await dbPut(next, item.blob);
      await dbDelete(name);
      clearVideoChoices();
      refreshParentVideos();
    });
    // 削除:1回目で確認の表示に変わり、2回目で本当に消す
    deleteBtn.addEventListener('click', async () => {
      if (deleteBtn.dataset.sure) {
        await dbDelete(name);
        clearVideoChoices();
        refreshParentVideos();
      } else {
        deleteBtn.dataset.sure = '1';
        deleteBtn.textContent = 'もう一度押すと削除';
      }
    });
    box.appendChild(row);
  });
}

// 「動画を追加する」でファイルが選ばれたとき
$('p-file').addEventListener('change', async e => {
  const files = [...e.target.files];
  let ok = 0;
  for (const file of files) {
    $('p-status').textContent = `保存中… ${file.name}`;
    try {
      await dbPut(file.name, file);
      ok++;
    } catch (err) {
      $('p-status').textContent = `保存できませんでした:${file.name}(容量が足りない可能性があります)`;
      break;
    }
  }
  if (ok === files.length) $('p-status').textContent = `${ok}本の動画を保存しました`;
  e.target.value = '';          // 同じファイルをもう一度選べるようにする
  clearVideoChoices();
  refreshParentVideos();
});

// メニューの中のボタン(data-act に書いた名前で、することを分ける)
$('parent').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'close') {
    closeParent();
  } else if (act === 'voice-on' || act === 'voice-off') {
    setVoiceOn(act === 'voice-on');
    $('p-voice-state').textContent = '読み上げ:' + (voiceOn() ? 'オン' : 'オフ');
  } else if (act === 'voice-test') {
    if (!('speechSynthesis' in window)) $('p-voice-state').textContent = 'この端末では読み上げが使えません';
    else if (!voiceOn()) $('p-voice-state').textContent = '読み上げがオフになっています';
    else say('こんにちは！ これは こえの テストだよ。');
  } else if (act === 'practice-stop') {
    // もんだいだけモードをやめて、今の時間に合った画面にもどす
    stopPractice();
    closeParent();
    tick();
  } else if (act.startsWith('practice-')) {
    // もんだいだけモードを始める('practice-math' → たしざんだけ、'practice-all' → ぜんぶ)
    const type = act.slice('practice-'.length);
    closeParent();
    startPractice(type === 'all' ? null : [type]);
  } else if (act.startsWith('test-')) {
    // 動作テスト:時間に関係なく朝/夜を始める(花丸は保存されない)
    stopPractice();
    testCount++;
    testMode = {
      id: testCount,
      session: act === 'test-evening' ? 'evening' : 'morning',
      warn: act === 'test-warn',
      breakfast: act === 'test-breakfast' ? Date.now() : null,   // 朝ごはんタイマーのテスト開始時刻
    };
    closeParent();
    tick();
  } else if (act === 'test-stop') {
    testMode = null;
    sessionKey = null;       // 本当の時間帯で始めなおす
    closeParent();
    tick();
  } else if (act === 'reset-today' || act === 'reset-all') {
    // 記録の削除:1回目で確認の表示に変わり、2回目で本当に消す
    if (!btn.dataset.sure) {
      btn.dataset.sure = '1';
      btn.dataset.label = btn.textContent;
      btn.textContent = 'もう一度押すと消えます';
      return;
    }
    const records = act === 'reset-all' ? {} : loadRecords();
    delete records[currentStatus().date];
    localStorage.setItem(RECORD_KEY, JSON.stringify(records));
    btn.textContent = btn.dataset.label;
    delete btn.dataset.sure;
    sessionKey = null;       // 画面を最初から始めなおす
    closeParent();
    tick();
  }
});

// 左下のかくしボタン:2秒ながおしで「おとなの確認」を出す
let spotTimer = null;
const spot = $('parent-spot');
spot.addEventListener('pointerdown', () => { spotTimer = setTimeout(openGate, 2000); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
  spot.addEventListener(ev, () => clearTimeout(spotTimer)));

// ============================================================
// ボタンなどに「押されたらすること」を結びつける
// ============================================================
$('btn-quiz').addEventListener('click', () => { sndTap(); showQuiz(); });
$('btn-video').addEventListener('click', () => { sndTap(); showVideos(); });
$('btn-back').addEventListener('click', () => { sndTap(); $('video-cards').innerHTML = ''; showCalendar(false); });
$('btn-stop').addEventListener('click', finishVideo);
$('player').addEventListener('ended', finishVideo);
// 動画の画面をタッチ → いちじていし/さいかい
$('player').addEventListener('click', () => {
  const p = $('player');
  if (p.paused) p.play().catch(() => {}); else p.pause();
});
// 再生できない動画だったら、えらぶ画面にもどる(iPadで再生できない形式など)
$('player').addEventListener('error', () => { if (currentScreen === 'player') { stopPlayer(); showVideos(); } });
// 注意の大きな表示はタッチで消える(上の赤い帯は残る)
$('warn-overlay').addEventListener('click', () => { warnDismissed = true; checkWarn(); });
// 長押しメニューを出さない
document.addEventListener('contextmenu', e => e.preventDefault());

// iPadは「画面を1回タッチしてから」でないと音を出せないので、最初のタッチで音の準備をする
document.addEventListener('pointerdown', () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* 音が使えなくても続ける */ }
});

// オフラインでも開けるようにする仕組み(sw.js)を登録する
// (https で公開されているときだけ働く。GitHub Pages は https なので使える)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ============================================================
// スタート:すぐ1回時計を見て、あとは1秒ごとに見つづける
// ============================================================
tick();
setInterval(tick, 1000);
