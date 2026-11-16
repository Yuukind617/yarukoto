// ============================================================
// 絵のデータ(すべて SVG という線と図形で描いた絵)
//   ・やることリストの絵(ごはん、はみがき など)
//   ・クイズ用の くだもの と のりもの の絵
//   ・花丸、たいよう、つき
// 絵はすべて 100×100 のマスの中に描いています。
// 絵を直したいときは、このファイルの数字を変えてください。
// ============================================================

// よく使う「ふちどり線」の書き方をまとめたもの
const S = 'stroke="#4a4a4a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

// タイヤを1つ描く(cx, cy:中心の位置  r:大きさ)
function wheel(cx, cy, r = 10) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#333"/>` +
         `<circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="#cfcfcf"/>`;
}

// 絵の中身を <svg> タグで包んで、画面に置ける形にする
function svgWrap(inner) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ------------------------------------------------------------
// やることリストの絵
// ------------------------------------------------------------
const TASK_PICTURES = {
  // ごはん:おちゃわんに山もりのごはん
  gohan: `
    <path d="M38 18 Q34 12 38 6 M50 16 Q46 10 50 4 M62 18 Q58 12 62 6" fill="none" stroke="#bbb" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 52 Q50 8 80 52 Z" fill="#fff" ${S}/>
    <path d="M14 50 H86 Q84 80 62 86 H38 Q16 80 14 50Z" fill="#ef5350" ${S}/>
    <rect x="38" y="85" width="24" height="7" rx="2" fill="#c62828" ${S}/>
    <path d="M24 60 Q50 70 76 60" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,

  // はみがき:歯とはぶらし
  hamigaki: `
    <path d="M22 34 Q22 18 36 21 Q44 25 52 21 Q66 18 66 34 Q68 52 60 76 Q56 84 53 70 Q50 56 44 56 Q38 56 36 70 Q33 84 28 76 Q20 52 22 34Z" fill="#fff" ${S}/>
    <path d="M32 44 Q44 54 56 44" fill="none" ${S}/>
    <circle cx="36" cy="36" r="2.5" fill="#4a4a4a"/><circle cx="52" cy="36" r="2.5" fill="#4a4a4a"/>
    <g transform="rotate(35 78 50)">
      <rect x="74" y="26" width="8" height="66" rx="4" fill="#42a5f5" ${S}/>
      <rect x="64" y="26" width="11" height="20" rx="2" fill="#fff" ${S}/>
      <path d="M64 31 H74 M64 36 H74 M64 41 H74" stroke="#90caf9" stroke-width="2"/>
    </g>
    <path d="M80 14 L82 20 L88 22 L82 24 L80 30 L78 24 L72 22 L78 20Z" fill="#ffd54f"/>`,

  // おきがえ:Tシャツ
  okigae: `
    <path d="M35 18 L18 26 L6 46 L22 56 L29 46 V88 H71 V46 L78 56 L94 46 L82 26 L65 18 Q50 32 35 18Z" fill="#42a5f5" ${S}/>
    <path d="M35 18 Q50 32 65 18" fill="none" stroke="#fff" stroke-width="3"/>
    <path d="M50 46 L54 57 L66 57 L56 64 L60 76 L50 68 L40 76 L44 64 L34 57 L46 57Z" fill="#ffd54f" ${S}/>`,

  // トイレ:べんき
  toilet: `
    <rect x="16" y="12" width="24" height="42" rx="5" fill="#fff" ${S}/>
    <rect x="22" y="20" width="12" height="5" rx="2.5" fill="#b0bec5"/>
    <path d="M30 56 H84 Q84 76 62 80 L65 93 H35 L38 78 Q30 72 30 56Z" fill="#fff" ${S}/>
    <rect x="26" y="50" width="62" height="9" rx="4.5" fill="#81d4fa" ${S}/>`,

  // おふろ:あわのおふろとアヒル
  ofuro: `
    <circle cx="26" cy="30" r="7" fill="#e1f5fe" ${S}/><circle cx="40" cy="20" r="5" fill="#e1f5fe" ${S}/>
    <circle cx="38" cy="36" r="5" fill="#e1f5fe" ${S}/>
    <ellipse cx="66" cy="38" rx="13" ry="10" fill="#ffd54f" ${S}/>
    <circle cx="76" cy="26" r="8" fill="#ffd54f" ${S}/>
    <path d="M83 25 L92 28 L83 31Z" fill="#fb8c00" ${S}/>
    <circle cx="78" cy="24" r="1.8" fill="#333"/>
    <path d="M8 46 H92 V62 Q92 84 70 84 H30 Q8 84 8 62Z" fill="#fff" ${S}/>
    <path d="M5 46 H95" stroke="#4a4a4a" stroke-width="5" stroke-linecap="round"/>
    <path d="M14 56 Q24 50 34 56 T54 56 T74 56 T86 56" fill="none" stroke="#4fc3f7" stroke-width="4" stroke-linecap="round"/>
    <path d="M26 84 V92 M74 84 V92" stroke="#4a4a4a" stroke-width="5" stroke-linecap="round"/>`,
};

// ------------------------------------------------------------
// クイズ用:くだものの絵   name:こたえの名前  svg:絵
// ------------------------------------------------------------
const FRUITS = [
  { name: 'りんご', svg: `
    <path d="M50 30 Q30 16 18 38 Q10 64 32 86 Q42 93 50 87 Q58 93 68 86 Q90 64 82 38 Q70 16 50 30Z" fill="#e53935" ${S}/>
    <path d="M50 30 Q50 18 56 10" fill="none" stroke="#6d4c41" stroke-width="4" stroke-linecap="round"/>
    <path d="M56 18 Q70 6 80 18 Q68 28 56 18Z" fill="#43a047" ${S}/>
    <path d="M28 44 Q30 36 38 34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>` },

  { name: 'バナナ', svg: `
    <path d="M16 24 Q14 66 52 82 Q76 90 90 74 Q62 70 44 50 Q34 38 30 20 Q22 16 16 24Z" fill="#fdd835" ${S}/>
    <path d="M24 26 Q26 60 60 78" fill="none" stroke="#f9a825" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M16 24 L18 14 L28 12 L30 20Z" fill="#8d6e63" ${S}/>
    <circle cx="88" cy="75" r="3" fill="#6d4c41"/>` },

  { name: 'みかん', svg: `
    <ellipse cx="50" cy="56" rx="38" ry="34" fill="#fb8c00" ${S}/>
    <path d="M40 24 Q50 14 60 24 Q50 32 40 24Z" fill="#43a047" ${S}/>
    <circle cx="34" cy="52" r="1.5" fill="#e65100"/><circle cx="46" cy="66" r="1.5" fill="#e65100"/>
    <circle cx="62" cy="50" r="1.5" fill="#e65100"/><circle cx="66" cy="70" r="1.5" fill="#e65100"/>
    <circle cx="50" cy="44" r="1.5" fill="#e65100"/><circle cx="30" cy="70" r="1.5" fill="#e65100"/>` },

  { name: 'いちご', svg: `
    <path d="M50 26 Q20 20 18 46 Q22 72 50 94 Q78 72 82 46 Q80 20 50 26Z" fill="#e53935" ${S}/>
    <path d="M28 28 L40 22 L50 8 L60 22 L72 28 L60 32 L50 42 L40 32Z" fill="#43a047" ${S}/>
    <g fill="#ffe082">
      <ellipse cx="34" cy="48" rx="2" ry="3"/><ellipse cx="50" cy="52" rx="2" ry="3"/><ellipse cx="66" cy="48" rx="2" ry="3"/>
      <ellipse cx="42" cy="64" rx="2" ry="3"/><ellipse cx="58" cy="64" rx="2" ry="3"/><ellipse cx="50" cy="78" rx="2" ry="3"/>
    </g>` },

  { name: 'ぶどう', svg: `
    <path d="M50 28 V10" stroke="#6d4c41" stroke-width="4" stroke-linecap="round"/>
    <path d="M50 16 Q64 4 78 14 Q66 26 50 16Z" fill="#43a047" ${S}/>
    <g fill="#7e57c2" ${S}>
      <circle cx="26" cy="38" r="10"/><circle cx="42" cy="38" r="10"/><circle cx="58" cy="38" r="10"/><circle cx="74" cy="38" r="10"/>
      <circle cx="34" cy="53" r="10"/><circle cx="50" cy="53" r="10"/><circle cx="66" cy="53" r="10"/>
      <circle cx="42" cy="68" r="10"/><circle cx="58" cy="68" r="10"/>
      <circle cx="50" cy="83" r="10"/>
    </g>` },

  { name: 'すいか', svg: `
    <path d="M6 34 A44 44 0 0 0 94 34Z" fill="#2e7d32" ${S}/>
    <path d="M13 36 A37 37 0 0 0 87 36Z" fill="#f1f8e9"/>
    <path d="M17 37 A33 33 0 0 0 83 37Z" fill="#ef5350"/>
    <g fill="#333">
      <ellipse cx="34" cy="46" rx="2" ry="3.2"/><ellipse cx="50" cy="48" rx="2" ry="3.2"/><ellipse cx="66" cy="46" rx="2" ry="3.2"/>
      <ellipse cx="42" cy="58" rx="2" ry="3.2"/><ellipse cx="58" cy="58" rx="2" ry="3.2"/>
    </g>` },

  { name: 'もも', svg: `
    <path d="M50 90 Q12 72 16 44 Q20 20 50 30 Q80 20 84 44 Q88 72 50 90Z" fill="#f8a5b8" ${S}/>
    <path d="M50 30 Q40 52 50 74" fill="none" stroke="#ec7a96" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 30 Q58 10 78 14 Q70 32 50 30Z" fill="#43a047" ${S}/>
    <path d="M50 30 Q42 12 26 18 Q32 32 50 30Z" fill="#66bb6a" ${S}/>` },

  { name: 'さくらんぼ', svg: `
    <path d="M32 58 Q36 30 54 14 Q64 38 68 60" fill="none" stroke="#6d4c41" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M54 14 Q70 2 86 12 Q72 26 54 14Z" fill="#43a047" ${S}/>
    <circle cx="30" cy="72" r="17" fill="#d32f2f" ${S}/>
    <circle cx="70" cy="74" r="17" fill="#d32f2f" ${S}/>
    <path d="M20 68 Q22 62 28 60 M60 70 Q62 64 68 62" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>` },

  { name: 'メロン', svg: `
    <path d="M50 26 V12 M38 12 H62" fill="none" stroke="#8d6e63" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="60" r="35" fill="#9ccc65" ${S}/>
    <g fill="none" stroke="#f1f8e9" stroke-width="2.2" stroke-linecap="round">
      <path d="M22 44 Q50 56 78 44 M17 62 Q50 74 83 62 M26 82 Q50 90 74 82"/>
      <path d="M36 29 Q26 60 38 92 M50 26 Q46 60 50 94 M64 29 Q74 60 62 92"/>
    </g>` },

  { name: 'パイナップル', svg: `
    <path d="M50 38 L32 22 L42 24 L36 6 L50 20 L64 6 L58 24 L68 22Z" fill="#43a047" ${S}/>
    <ellipse cx="50" cy="64" rx="26" ry="31" fill="#fbc02d" ${S}/>
    <g fill="none" stroke="#e65100" stroke-width="1.8" stroke-linecap="round" opacity=".8">
      <path d="M30 46 L62 92 M42 36 L74 78 M27 62 L46 93 M56 35 L76 62"/>
      <path d="M70 46 L38 92 M58 36 L26 78 M73 62 L54 93 M44 35 L24 62"/>
    </g>` },
];

// ------------------------------------------------------------
// クイズ用:のりものの絵
// ------------------------------------------------------------
// ふつうの車の形(くるま と パトカー で同じ形を使う)
const CAR_BODY = 'M6 62 Q6 50 20 48 L30 32 Q33 27 40 27 H62 Q68 27 72 32 L82 48 Q94 50 94 62 V70 H6Z';
const CAR_WINDOWS = `<path d="M34 33 H48 V47 H26Z" fill="#e3f2fd" ${S}/><path d="M53 33 H66 L76 47 H53Z" fill="#e3f2fd" ${S}/>`;

const VEHICLES = [
  { name: 'くるま', svg: `
    <path d="${CAR_BODY}" fill="#42a5f5" ${S}/>${CAR_WINDOWS}
    <rect x="86" y="54" width="7" height="5" rx="2" fill="#ffeb3b"/>
    ${wheel(28, 72)}${wheel(74, 72)}` },

  { name: 'バス', svg: `
    <rect x="5" y="22" width="90" height="50" rx="8" fill="#ffb300" ${S}/>
    <g fill="#e3f2fd" ${S}>
      <rect x="11" y="30" width="14" height="15" rx="2"/><rect x="29" y="30" width="14" height="15" rx="2"/>
      <rect x="47" y="30" width="14" height="15" rx="2"/><rect x="65" y="30" width="10" height="15" rx="2"/>
      <rect x="79" y="30" width="11" height="34" rx="2"/>
    </g>
    <path d="M6 54 H78" stroke="#fff" stroke-width="4"/>
    ${wheel(26, 74)}${wheel(66, 74)}` },

  { name: 'トラック', svg: `
    <rect x="5" y="22" width="56" height="48" rx="3" fill="#90caf9" ${S}/>
    <path d="M14 30 V62 M26 30 V62 M38 30 V62 M50 30 V62" stroke="#64b5f6" stroke-width="2.5"/>
    <path d="M63 36 H80 L94 52 V70 H63Z" fill="#43a047" ${S}/>
    <path d="M68 41 H79 L88 52 H68Z" fill="#e3f2fd" ${S}/>
    ${wheel(20, 74)}${wheel(44, 74)}${wheel(80, 74)}` },

  { name: 'しょうぼうしゃ', svg: `
    <path d="M5 46 H60 V32 H78 Q92 36 94 52 V70 H5Z" fill="#e53935" ${S}/>
    <rect x="64" y="38" width="16" height="13" rx="2" fill="#e3f2fd" ${S}/>
    <rect x="66" y="25" width="9" height="7" rx="2" fill="#ffeb3b" ${S}/>
    <g fill="none" stroke="#757575" stroke-width="3" stroke-linecap="round">
      <path d="M7 32 H57 M7 42 H57"/>
      <path d="M13 32 V42 M22 32 V42 M31 32 V42 M40 32 V42 M49 32 V42"/>
    </g>
    <path d="M6 58 H93" stroke="#fff" stroke-width="4"/>
    ${wheel(24, 74)}${wheel(76, 74)}` },

  { name: 'きゅうきゅうしゃ', svg: `
    <path d="M5 28 H66 L88 46 Q94 48 94 55 V70 H5Z" fill="#fff" ${S}/>
    <path d="M58 34 H65 L80 47 H58Z" fill="#bbdefb" ${S}/>
    <rect x="28" y="20" width="14" height="8" rx="3" fill="#e53935" ${S}/>
    <path d="M6 55 H93" stroke="#e53935" stroke-width="5"/>
    <g stroke="#1e88e5" stroke-width="4.5" stroke-linecap="round">
      <path d="M30 33 V49 M23 37 L37 45 M23 45 L37 37"/>
    </g>
    ${wheel(24, 74)}${wheel(76, 74)}` },

  { name: 'パトカー', svg: `
    <path d="${CAR_BODY}" fill="#fff"/>
    <path d="M6 62 Q6 54 12 51 H88 Q94 54 94 62 V70 H6Z" fill="#333"/>
    <path d="${CAR_BODY}" fill="none" ${S}/>${CAR_WINDOWS}
    <rect x="43" y="19" width="16" height="8" rx="3.5" fill="#e53935" ${S}/>
    <rect x="86" y="54" width="7" height="5" rx="2" fill="#ffeb3b"/>
    ${wheel(28, 72)}${wheel(74, 72)}` },

  { name: 'でんしゃ', svg: `
    <path d="M40 24 L50 10 L60 24 M41 10 H59" fill="none" ${S}/>
    <rect x="6" y="24" width="88" height="48" rx="10" fill="#66bb6a" ${S}/>
    <g fill="#e3f2fd" ${S}>
      <rect x="13" y="33" width="16" height="15" rx="2"/><rect x="33" y="33" width="16" height="15" rx="2"/>
      <rect x="53" y="33" width="16" height="15" rx="2"/><rect x="74" y="33" width="14" height="15" rx="2"/>
    </g>
    <path d="M7 57 H93" stroke="#ffeb3b" stroke-width="5"/>
    ${wheel(22, 76, 6)}${wheel(38, 76, 6)}${wheel(62, 76, 6)}${wheel(78, 76, 6)}
    <path d="M2 86 H98" stroke="#795548" stroke-width="4" stroke-linecap="round"/>` },

  { name: 'ひこうき', svg: `
    <path d="M12 44 L6 22 H18 L32 44Z" fill="#42a5f5" ${S}/>
    <path d="M6 52 Q6 42 20 42 H72 Q92 42 95 54 Q92 62 72 62 H20 Q6 62 6 52Z" fill="#fff" ${S}/>
    <path d="M44 56 L28 84 H42 L66 56Z" fill="#42a5f5" ${S}/>
    <path d="M80 46 Q89 47 92 53 H80Z" fill="#90caf9" ${S}/>
    <g fill="#90caf9"><circle cx="34" cy="50" r="2.6"/><circle cx="44" cy="50" r="2.6"/><circle cx="54" cy="50" r="2.6"/><circle cx="64" cy="50" r="2.6"/><circle cx="74" cy="50" r="2.6"/></g>` },

  { name: 'ふね', svg: `
    <rect x="45" y="10" width="11" height="16" fill="#ffb300" ${S}/>
    <rect x="38" y="26" width="26" height="14" fill="#fff" ${S}/>
    <rect x="26" y="40" width="50" height="18" fill="#fff" ${S}/>
    <g fill="#90caf9" ${S}><circle cx="36" cy="49" r="4"/><circle cx="51" cy="49" r="4"/><circle cx="66" cy="49" r="4"/></g>
    <path d="M6 58 H94 L82 82 H18Z" fill="#e53935" ${S}/>
    <path d="M2 86 Q10 78 18 86 T34 86 T50 86 T66 86 T82 86 T98 86" fill="none" stroke="#1e88e5" stroke-width="5" stroke-linecap="round"/>` },

  { name: 'じてんしゃ', svg: `
    <g fill="none" stroke="#333" stroke-width="4.5"><circle cx="24" cy="66" r="18"/><circle cx="76" cy="66" r="18"/></g>
    <g fill="none" stroke="#e53935" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 66 L40 38 L50 66 Z"/><path d="M40 38 H66 L50 66"/><path d="M66 38 L76 66"/>
    </g>
    <path d="M66 38 L63 24 M55 24 H67" fill="none" stroke="#333" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M40 38 L38 30 M31 29 H46" fill="none" stroke="#333" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="66" r="4" fill="#333"/>
    <path d="M50 66 L56 74 M52 75 H60" fill="none" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>` },
];

// ------------------------------------------------------------
// 花丸(はなまる)の線を計算して作る
//   まんなかから ぐるぐる → さいごに花びらを1周
// ------------------------------------------------------------
function hanamaruPath() {
  const pts = [];
  const turns = 2.6;                         // ぐるぐるの回数
  // ① うずまき(中心から外へ)
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const ang = t * turns * 2 * Math.PI - Math.PI / 2;
    const r = 2 + 26 * t;
    pts.push([50 + r * Math.cos(ang), 50 + r * Math.sin(ang)]);
  }
  // ② 花びら(外がわを1周。7枚)
  const a0 = turns * 2 * Math.PI - Math.PI / 2;
  for (let i = 1; i <= 160; i++) {
    const x = (i / 160) * 2 * Math.PI;
    const r = 28 + 14 * Math.abs(Math.sin(3.5 * x));
    pts.push([50 + r * Math.cos(a0 + x), 50 + r * Math.sin(a0 + x)]);
  }
  return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
}
const HANAMARU_D = hanamaruPath();

// 花丸の絵。pathLength="1" は「線を書いていくアニメーション」のための指定
const HANAMARU_SVG = `<svg class="hanamaru" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="${HANAMARU_D}" pathLength="1" fill="none" stroke="#e53935" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// たいよう(朝のしるし)
const SUN_SVG = svgWrap(`
  <g stroke="#fb8c00" stroke-width="6" stroke-linecap="round">
    <path d="M50 6 V18 M50 82 V94 M6 50 H18 M82 50 H94 M19 19 L27 27 M73 73 L81 81 M19 81 L27 73 M73 27 L81 19"/>
  </g>
  <circle cx="50" cy="50" r="24" fill="#ffca28" stroke="#fb8c00" stroke-width="3"/>`);

// つき(夜のしるし)
const MOON_SVG = svgWrap(`
  <path d="M62 10 A42 42 0 1 0 90 62 A32 32 0 0 1 62 10Z" fill="#ffe082" stroke="#f9a825" stroke-width="3" stroke-linejoin="round"/>`);

// りんごの小さな絵(たしざんで数をかぞえるのに使う)
const COUNT_APPLE = FRUITS[0].svg;

// ------------------------------------------------------------
// 朝ごはんタイマー用の絵:くまが ごはんを たべているところ
//   id="bf-rice" の白いごはんの山を、のこり時間に合わせて app.js が低くしていく
//   (おちゃわんのふち y=100 を基準に、たて方向にちぢめる)
//   class="bf-item" のおかず(たまごやき3つ・ウインナー3本)は、時間がたつと
//   data-order の大きいものから1つずつ消えていく
// ------------------------------------------------------------
const BREAKFAST_SVG = `<svg viewBox="0 0 270 150" xmlns="http://www.w3.org/2000/svg">
  <!-- からだ(テーブルのうしろ) -->
  <ellipse cx="70" cy="132" rx="46" ry="38" fill="#c98d5a" ${S}/>
  <!-- みみ -->
  <circle cx="40" cy="30" r="14" fill="#c98d5a" ${S}/><circle cx="40" cy="30" r="7" fill="#f3c9a0"/>
  <circle cx="100" cy="30" r="14" fill="#c98d5a" ${S}/><circle cx="100" cy="30" r="7" fill="#f3c9a0"/>
  <!-- かお -->
  <circle cx="70" cy="62" r="42" fill="#c98d5a" ${S}/>
  <ellipse cx="70" cy="77" rx="19" ry="15" fill="#f6dcc0"/>
  <ellipse cx="70" cy="69" rx="6" ry="4" fill="#4a4a4a"/>
  <circle cx="54" cy="55" r="4" fill="#4a4a4a"/><circle cx="86" cy="55" r="4" fill="#4a4a4a"/>
  <circle cx="42" cy="74" r="7" fill="#f8a5b8" opacity=".7"/><circle cx="98" cy="74" r="7" fill="#f8a5b8" opacity=".7"/>
  <!-- くち:たべている間は もぐもぐ動く / からっぽになったら にっこり -->
  <ellipse class="bf-mouth" cx="70" cy="84" rx="5" ry="3.5" fill="#c0392b"/>
  <path class="bf-smile" d="M61 82 Q70 91 79 82" fill="none" ${S}/>
  <!-- テーブル -->
  <!-- (画面の形によって絵のまわりに余白ができても、からだがはみ出して見えないよう、広めに描く) -->
  <rect x="-200" y="120" width="670" height="300" fill="#e0b27a"/>
  <path d="M-200 120 H470" stroke="#4a4a4a" stroke-width="2.5"/>
  <!-- おちゃわん(ごはんの山 → うつわ の順に重ねる) -->
  <path id="bf-rice" d="M120 100 Q150 56 180 100 Z" fill="#fff" ${S}/>
  <path d="M113 98 H187 Q185 121 168 126 H132 Q115 121 113 98Z" fill="#ef5350" ${S}/>
  <rect x="138" y="125" width="24" height="6" rx="2" fill="#c62828" ${S}/>
  <path d="M122 106 Q150 114 178 106" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  <!-- おかずのおさら:たまごやき と ウインナー(下の段 → 上の段 の順に重ねる) -->
  <ellipse cx="230" cy="125" rx="36" ry="8" fill="#fff" ${S}/>
  <ellipse cx="230" cy="124" rx="26" ry="4.5" fill="none" stroke="#cfd8dc" stroke-width="1.5"/>
  <g class="bf-item" data-order="0"><rect x="199" y="110" width="17" height="12" rx="3.5" fill="#fdd835" ${S}/><path d="M203 116 Q207.5 111.5 212 116 Q207.5 119.5 206 116" fill="none" stroke="#f9a825" stroke-width="1.8" stroke-linecap="round"/></g>
  <g class="bf-item" data-order="2"><rect x="217" y="110" width="17" height="12" rx="3.5" fill="#fdd835" ${S}/><path d="M221 116 Q225.5 111.5 230 116 Q225.5 119.5 224 116" fill="none" stroke="#f9a825" stroke-width="1.8" stroke-linecap="round"/></g>
  <g class="bf-item" data-order="1" transform="rotate(-14 249 117)"><rect x="236" y="112.5" width="26" height="9" rx="4.5" fill="#d9684a" ${S}/><path d="M244 114 L246 120 M249 114 L251 120 M254 114 L256 120" stroke="#a84a32" stroke-width="1.5" stroke-linecap="round"/></g>
  <g class="bf-item" data-order="4"><rect x="208" y="98" width="17" height="12" rx="3.5" fill="#fdd835" ${S}/><path d="M212 104 Q216.5 99.5 221 104 Q216.5 107.5 215 104" fill="none" stroke="#f9a825" stroke-width="1.8" stroke-linecap="round"/></g>
  <g class="bf-item" data-order="3" transform="rotate(-14 250 108)"><rect x="237" y="103.5" width="26" height="9" rx="4.5" fill="#d9684a" ${S}/><path d="M245 105 L247 111 M250 105 L252 111 M255 105 L257 111" stroke="#a84a32" stroke-width="1.5" stroke-linecap="round"/></g>
  <g class="bf-item" data-order="5" transform="rotate(-14 249 99)"><rect x="236" y="94.5" width="26" height="9" rx="4.5" fill="#d9684a" ${S}/><path d="M244 96 L246 102 M249 96 L251 102 M254 96 L256 102" stroke="#a84a32" stroke-width="1.5" stroke-linecap="round"/></g>
  <!-- て と スプーン(たべている間は上下に動く) -->
  <g class="bf-spoon">
    <path d="M112 108 L96 92" stroke="#9e9e9e" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="93" cy="89" rx="8" ry="6" fill="#e0e0e0" ${S}/>
    <ellipse class="bf-bite" cx="93" cy="87" rx="5" ry="3.5" fill="#fff" stroke="#4a4a4a" stroke-width="1.5"/>
    <circle cx="114" cy="110" r="11" fill="#c98d5a" ${S}/>
  </g>
</svg>`;

// ------------------------------------------------------------
// クイズ用:どうぶつの絵(かおの絵。ペンギンだけ ぜんしん)
// ------------------------------------------------------------
// 目を2つ描く(x1, x2:左右の位置  y:高さ  r:大きさ)
function eyes(x1, x2, y, r = 3.5) {
  return `<circle cx="${x1}" cy="${y}" r="${r}" fill="#333"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#333"/>`;
}
// ライオンのたてがみ(ギザギザの丸)を計算して作る
function manePoints() {
  const pts = [];
  for (let i = 0; i < 32; i++) {
    const r = (i % 2 === 0) ? 46 : 37;                 // 外と内を交互に
    const a = (i / 32) * 2 * Math.PI;
    pts.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (52 + r * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}

const ANIMALS = [
  { name: 'いぬ', svg: `
    <ellipse cx="50" cy="52" rx="32" ry="30" fill="#e0b27a" ${S}/>
    <path d="M24 26 Q6 36 12 64 Q24 68 30 42Z" fill="#8d6e63" ${S}/>
    <path d="M76 26 Q94 36 88 64 Q76 68 70 42Z" fill="#8d6e63" ${S}/>
    <ellipse cx="50" cy="65" rx="16" ry="12" fill="#fff3e0"/>
    ${eyes(38, 62, 46)}
    <ellipse cx="50" cy="59" rx="5.5" ry="4" fill="#333"/>
    <path d="M50 63 V68 M42 69 Q50 76 58 69" fill="none" ${S}/>` },

  { name: 'ねこ', svg: `
    <path d="M20 44 L22 10 L48 28Z" fill="#ffb74d" ${S}/>
    <path d="M80 44 L78 10 L52 28Z" fill="#ffb74d" ${S}/>
    <ellipse cx="50" cy="56" rx="35" ry="30" fill="#ffb74d" ${S}/>
    ${eyes(37, 63, 52)}
    <path d="M46.5 60 H53.5 L50 64.5Z" fill="#f06292"/>
    <path d="M50 64.5 Q45 71 40 67 M50 64.5 Q55 71 60 67" fill="none" ${S}/>
    <path d="M30 62 H10 M30 67 L11 73 M70 62 H90 M70 67 L89 73" stroke="#4a4a4a" stroke-width="1.8" stroke-linecap="round"/>` },

  { name: 'うさぎ', svg: `
    <ellipse cx="36" cy="26" rx="10" ry="23" fill="#fff" ${S}/><ellipse cx="36" cy="28" rx="4.5" ry="15" fill="#f8bbd0"/>
    <ellipse cx="64" cy="26" rx="10" ry="23" fill="#fff" ${S}/><ellipse cx="64" cy="28" rx="4.5" ry="15" fill="#f8bbd0"/>
    <circle cx="50" cy="64" r="30" fill="#fff" ${S}/>
    ${eyes(39, 61, 60)}
    <circle cx="30" cy="70" r="6" fill="#f8bbd0" opacity=".8"/><circle cx="70" cy="70" r="6" fill="#f8bbd0" opacity=".8"/>
    <ellipse cx="50" cy="68" rx="3.5" ry="2.5" fill="#f06292"/>
    <path d="M50 71 Q45 77 41 73 M50 71 Q55 77 59 73" fill="none" ${S}/>` },

  { name: 'ぞう', svg: `
    <ellipse cx="19" cy="44" rx="17" ry="26" fill="#b0bec5" ${S}/><ellipse cx="20" cy="44" rx="9" ry="17" fill="#cfd8dc"/>
    <ellipse cx="81" cy="44" rx="17" ry="26" fill="#b0bec5" ${S}/><ellipse cx="80" cy="44" rx="9" ry="17" fill="#cfd8dc"/>
    <ellipse cx="50" cy="42" rx="28" ry="30" fill="#b0bec5" ${S}/>
    <path d="M41 56 Q38 88 56 92 Q68 92 66 80 Q57 84 58 56Z" fill="#b0bec5"/>
    <path d="M41 60 Q38 88 56 92 Q68 92 66 80 Q57 84 58 60" fill="none" ${S}/>
    <path d="M44 72 H55 M45 80 H55" stroke="#90a4ae" stroke-width="2" stroke-linecap="round"/>
    ${eyes(37, 63, 40)}` },

  { name: 'きりん', svg: `
    <rect x="39" y="62" width="22" height="42" fill="#fdd835" ${S}/>
    <circle cx="46" cy="82" r="4" fill="#a1663a"/><circle cx="55" cy="93" r="4" fill="#a1663a"/>
    <path d="M40 22 V8 M60 22 V8" stroke="#a1663a" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="40" cy="7" r="4.5" fill="#a1663a"/><circle cx="60" cy="7" r="4.5" fill="#a1663a"/>
    <ellipse cx="22" cy="32" rx="11" ry="5.5" fill="#fdd835" ${S} transform="rotate(-25 22 32)"/>
    <ellipse cx="78" cy="32" rx="11" ry="5.5" fill="#fdd835" ${S} transform="rotate(25 78 32)"/>
    <ellipse cx="50" cy="44" rx="22" ry="27" fill="#fdd835" ${S}/>
    <circle cx="37" cy="27" r="4.5" fill="#a1663a"/><circle cx="63" cy="29" r="4" fill="#a1663a"/><circle cx="50" cy="22" r="3" fill="#a1663a"/>
    <ellipse cx="50" cy="62" rx="16" ry="11" fill="#ffecb3" ${S}/>
    <circle cx="44" cy="60" r="1.8" fill="#4a4a4a"/><circle cx="56" cy="60" r="1.8" fill="#4a4a4a"/>
    <path d="M43 66 Q50 71 57 66" fill="none" ${S}/>
    ${eyes(40, 60, 42)}` },

  { name: 'ライオン', svg: `
    <polygon points="${manePoints()}" fill="#e67e22" ${S}/>
    <circle cx="50" cy="52" r="27" fill="#fdd17a" ${S}/>
    ${eyes(40, 60, 47)}
    <path d="M44.5 55 H55.5 L50 61.5Z" fill="#8d5524"/>
    <path d="M50 61.5 Q44 69 38 64 M50 61.5 Q56 69 62 64" fill="none" ${S}/>
    <circle cx="36" cy="60" r="1.2" fill="#8d5524"/><circle cx="64" cy="60" r="1.2" fill="#8d5524"/>` },

  { name: 'パンダ', svg: `
    <circle cx="24" cy="24" r="13" fill="#333"/><circle cx="76" cy="24" r="13" fill="#333"/>
    <circle cx="50" cy="54" r="35" fill="#fff" ${S}/>
    <ellipse cx="36" cy="50" rx="8.5" ry="11" fill="#333" transform="rotate(20 36 50)"/>
    <ellipse cx="64" cy="50" rx="8.5" ry="11" fill="#333" transform="rotate(-20 64 50)"/>
    <circle cx="37" cy="49" r="3" fill="#fff"/><circle cx="63" cy="49" r="3" fill="#fff"/>
    <ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#333"/>
    <path d="M50 67.5 Q45 74 40 70 M50 67.5 Q55 74 60 70" fill="none" ${S}/>` },

  { name: 'ぶた', svg: `
    <path d="M22 36 L20 10 L46 24Z" fill="#f48fb1" ${S}/>
    <path d="M78 36 L80 10 L54 24Z" fill="#f48fb1" ${S}/>
    <circle cx="50" cy="54" r="35" fill="#f8bbd0" ${S}/>
    ${eyes(37, 63, 46)}
    <ellipse cx="50" cy="63" rx="15" ry="11" fill="#f48fb1" ${S}/>
    <ellipse cx="44.5" cy="63" rx="2.6" ry="4" fill="#ad1457"/><ellipse cx="55.5" cy="63" rx="2.6" ry="4" fill="#ad1457"/>
    <path d="M42 79 Q50 84 58 79" fill="none" ${S}/>` },

  { name: 'くま', svg: `
    <circle cx="24" cy="26" r="13" fill="#a1663a" ${S}/><circle cx="24" cy="26" r="6.5" fill="#f3c9a0"/>
    <circle cx="76" cy="26" r="13" fill="#a1663a" ${S}/><circle cx="76" cy="26" r="6.5" fill="#f3c9a0"/>
    <circle cx="50" cy="54" r="35" fill="#a1663a" ${S}/>
    <ellipse cx="50" cy="66" rx="17" ry="13" fill="#f6dcc0"/>
    ${eyes(37, 63, 48)}
    <ellipse cx="50" cy="60" rx="5.5" ry="4" fill="#333"/>
    <path d="M50 64 V68 M43 70 Q50 76 57 70" fill="none" ${S}/>` },

  { name: 'さる', svg: `
    <circle cx="15" cy="50" r="12" fill="#8d6e63" ${S}/><circle cx="15" cy="50" r="6.5" fill="#f3c9a0"/>
    <circle cx="85" cy="50" r="12" fill="#8d6e63" ${S}/><circle cx="85" cy="50" r="6.5" fill="#f3c9a0"/>
    <circle cx="50" cy="50" r="35" fill="#8d6e63" ${S}/>
    <circle cx="39" cy="44" r="14" fill="#f3c9a0"/><circle cx="61" cy="44" r="14" fill="#f3c9a0"/>
    <ellipse cx="50" cy="62" rx="22" ry="17" fill="#f3c9a0"/>
    ${eyes(40, 60, 44)}
    <circle cx="47" cy="57" r="1.5" fill="#4a4a4a"/><circle cx="53" cy="57" r="1.5" fill="#4a4a4a"/>
    <path d="M38 65 Q50 76 62 65" fill="none" ${S}/>` },

  { name: 'ペンギン', svg: `
    <ellipse cx="17" cy="60" rx="7" ry="20" fill="#37474f" ${S} transform="rotate(18 17 60)"/>
    <ellipse cx="83" cy="60" rx="7" ry="20" fill="#37474f" ${S} transform="rotate(-18 83 60)"/>
    <ellipse cx="38" cy="94" rx="10" ry="4.5" fill="#fb8c00" ${S}/><ellipse cx="62" cy="94" rx="10" ry="4.5" fill="#fb8c00" ${S}/>
    <ellipse cx="50" cy="52" rx="30" ry="42" fill="#37474f" ${S}/>
    <path d="M50 22 Q26 24 28 56 Q30 88 50 88 Q70 88 72 56 Q74 24 50 22Z" fill="#fff"/>
    <path d="M50 22 Q40 14 34 30 Q42 26 50 34 Q58 26 66 30 Q60 14 50 22Z" fill="#37474f"/>
    ${eyes(40, 60, 36)}
    <path d="M43.5 42 H56.5 L50 51Z" fill="#fb8c00" ${S}/>` },
];

// ------------------------------------------------------------
// クイズ用:いろ(name:こたえ  color:色)
// ------------------------------------------------------------
const COLORS = [
  { name: 'あか',     color: '#e53935' },
  { name: 'あお',     color: '#1e88e5' },
  { name: 'きいろ',   color: '#fdd835' },
  { name: 'みどり',   color: '#43a047' },
  { name: 'オレンジ', color: '#fb8c00' },
  { name: 'ピンク',   color: '#f48fb1' },
  { name: 'むらさき', color: '#8e24aa' },
  { name: 'ちゃいろ', color: '#795548' },
  { name: 'くろ',     color: '#212121' },
  { name: 'しろ',     color: '#ffffff' },
];
// いろのもんだいで見せる絵:えのぐを ぽたっと たらした形(color の色でぬる)
function colorBlob(color) {
  return svgWrap(`<path d="M50 8 Q72 3 80 22 Q99 30 92 52 Q99 76 76 85 Q60 99 42 90 Q17 95 12 70 Q-1 50 14 34 Q18 9 50 8Z" fill="${color}" ${S}/>
    <path d="M26 36 Q30 24 42 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>`);
}

// ------------------------------------------------------------
// クイズ用:かたち(name:こたえ  draw:色を受け取って絵を作る)
// ------------------------------------------------------------
const SHAPES = [
  { name: 'まる',       draw: c => `<circle cx="50" cy="50" r="40" fill="${c}" ${S}/>` },
  { name: 'さんかく',   draw: c => `<path d="M50 10 L92 86 H8Z" fill="${c}" ${S}/>` },
  { name: 'しかく',     draw: c => `<rect x="13" y="13" width="74" height="74" fill="${c}" ${S}/>` },
  { name: 'ながしかく', draw: c => `<rect x="4" y="28" width="92" height="44" fill="${c}" ${S}/>` },
  { name: 'ほし',       draw: c => `<path d="M50 6 L61 37 L94 38 L68 58 L77 90 L50 71 L23 90 L32 58 L6 38 L39 37Z" fill="${c}" ${S}/>` },
  { name: 'ハート',     draw: c => `<path d="M50 88 Q6 58 10 32 Q14 10 34 14 Q46 17 50 30 Q54 17 66 14 Q86 10 90 32 Q94 58 50 88Z" fill="${c}" ${S}/>` },
];

// ------------------------------------------------------------
// クイズ用:とけい(hour 時ちょうどの絵を作る)
// ------------------------------------------------------------
function clockSvg(hour) {
  let numbers = '', ticks = '';
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * 2 * Math.PI;               // 12時を上にして時計まわり
    const x = 50 + 33 * Math.sin(a), y = 50 - 33 * Math.cos(a);
    numbers += `<text x="${x.toFixed(1)}" y="${(y + 3.6).toFixed(1)}" font-size="10" font-weight="700" text-anchor="middle" fill="#3e3e3e">${n}</text>`;
    ticks += `<line x1="${(50 + 41 * Math.sin(a)).toFixed(1)}" y1="${(50 - 41 * Math.cos(a)).toFixed(1)}" x2="${(50 + 44 * Math.sin(a)).toFixed(1)}" y2="${(50 - 44 * Math.cos(a)).toFixed(1)}" stroke="#90a4ae" stroke-width="1.5"/>`;
  }
  const ha = (hour / 12) * 2 * Math.PI;             // みじかい はり(じ)の向き
  return svgWrap(`
    <circle cx="50" cy="50" r="47" fill="#42a5f5" ${S}/>
    <circle cx="50" cy="50" r="42" fill="#fff"/>
    ${ticks}${numbers}
    <line x1="50" y1="50" x2="50" y2="25" stroke="#1e88e5" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${(50 + 20 * Math.sin(ha)).toFixed(1)}" y2="${(50 - 20 * Math.cos(ha)).toFixed(1)}" stroke="#e53935" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3.5" fill="#333"/>`);
}
