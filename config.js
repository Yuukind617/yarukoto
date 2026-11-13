// ============================================================
// 設定ファイル(時刻などを変えたいときは、ここを書きかえます)
// 書きかえて GitHub にアップロードしたあと、iPadでアプリを2回開き直すと反映されます。
// (1回目で新しい版を取りこみ、2回目から使われます)
// ============================================================
const CONFIG = {
  // true:月〜金だけ動く / false:毎日動く
  weekdays_only: true,

  // 朝の時間  start:はじまり  end:おわり  warn:注意を出す時刻(''なら注意なし)
  morning: { start: '06:30', end: '08:10', warn: '07:30' },

  // 夜の時間
  evening: { start: '18:00', end: '20:15', warn: '' },

  // 注意を出す条件
  //   'none_done' : 1つも終わっていないとき
  //   'any_left'  : 1つでも残っているとき
  warn_condition: 'none_done',

  // 朝・夜それぞれで見られる動画の本数(0 で無制限)
  videos_per_session: 1,

  // 出す問題の種類  math:たしざん  map:にほんちず  picture:これはなに?
  quiz_types: ['math', 'map', 'picture'],

  // 地図問題に出す都道府県(空ならぜんぶ)
  //   例: ['tokyo', 'osaka', 'hokkaido', 'okinawa']
  //   IDは japan_map.js の id(ローマ字)です
  map_prefectures: [],

  // こえ(読み上げ)
  //   enabled      : true で読み上げる / false で読み上げない(おとなメニューでも切り替えられます)
  //   rate         : はやさ(1がふつう。0.8 くらいにすると、ゆっくり)
  //   pitch        : 声の高さ(1がふつう)
  //   read_choices : true でこたえ4つも順番に読む / false でもんだい文だけ読む
  voice: { enabled: true, rate: 0.9, pitch: 1.1, read_choices: true },

  // こえで いう(せいかいのあと、こたえを1文字ずつ声に出してもらう)
  //   enabled     : true で使う / false で使わない(おとなメニューでも切り替えられます)
  //   threshold   : これより大きい音を「声」とみなす。反応しにくいときは小さく(0.02 など)、
  //                 まわりの音で勝手に進むときは大きく(0.08 など)。おとなメニューの「マイクのテスト」が目安
  //   timeout_sec : この秒数、声がなければもう一度読み上げる(2回目のあとは次へ進む)
  voice_input: { enabled: true, threshold: 0.04, timeout_sec: 10 },

  // 「これは なに?」に追加する自分の絵
  //   my_pictures フォルダに画像を入れて、ここにファイル名を書きます
  //   ※ GitHub に置いた画像はだれでも見られる状態になります
  //   ファイル名(拡張子なし)がこたえになります
  //   例: ['きりん.png', 'ぞう.jpg']
  my_pictures: [],
};
