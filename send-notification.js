// 📄 send-notification.js（待ち受けサーバー版）

const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./serviceAccountKey.json');

// 1. Firebaseの初期化
initializeApp({
  credential: cert(serviceAccount)
});

const app = express();
app.use(cors());          // スマホ（別のURL）からの通信を許可する魔法
app.use(express.json());  // スマホから送られてくるデータ（JSON）を読めるようにする

// 2. スマホからの「タイマー開始」の合図を受け取る窓口（API）を作る
app.post('/start-timer', (req, res) => {
  // スマホから送られてきた「住所（トークン）」と「測りたい秒数」を受け取る
  const { token, durationSec } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` ⏳ タイマー予約を受付ました！`);
  console.log(` 【${durationSec}秒後】に通知を発射します。`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // スマホには「了解！預かったよ！」と先に返事をしておく（これでスマホは通信を終えて眠れる）
  res.status(200).json({ status: 'ok', message: 'Timer registered on server.' });

  // 3. サーバーの裏側で、指定された秒数（ミリ秒に変換）だけじっと待つ
  setTimeout(() => {
    const message = {
      notification: {
        title: '⏰ 【StudyLog Pro】集中タイム終了！',
        body: '時間になりました！素晴らしい集中力でしたね。休憩しましょう。'
      },
      token: token // 送られてきた最新の住所へ送る
    };

    // Firebase経由で通知を発射！
    getMessaging().send(message)
      .then((response) => {
        console.log('🚀 【大成功】約束の時間になったので、スマホへ電波を発射しました！');
      })
      .catch((error) => {
        console.error('❌ 通知送信エラー:', error);
      });
  }, durationSec * 1000); 
});

// 4. ポート3000番で、スマホからのアクセスを監視し続ける
const PORT = 3000;
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(` 🌐 タイマー受付サーバーが起動しました！`);
  console.log(` パソコンは【ポート ${PORT}】でスマホからの合図を待っています...`);
  console.log('==================================================');
  
});
app.use((req, res, next) => {
    // すべてのサイト（GitHub Pagesなど）からのアクセスを許可するよ！という設定
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // ボタンを押したときに発生する「事前確認通信（OPTIONS）」をパスさせる設定
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 📄 send-notification.js の修正イメージ

const app = express();
app.use(express.json()); // JSONを使えるようにする設定

// 📋 【新機能】動いているタイマーをトークンごとに記憶する「名簿（オブジェクト）」
const activeTimers = {};

// ⏳ ① スタートボタン（通知予約）の窓口
app.post('/start-timer', (req, res) => {
    const { token, durationSec } = req.body;

    // 🔥【超重要】もしすでにこのスマホの古いタイマーが動いていたら、一度完全に消す（上書き対策）
    if (activeTimers[token]) {
        clearTimeout(activeTimers[token]);
        delete activeTimers[token];
        console.log(`[上書き] 古いタイマーを破棄しました: ${token.substring(0, 10)}...`);
    }

    console.log(`[予約受付] ${durationSec}秒後に通知を送ります。`);

    // 🚀 setTimeout のタイマーIDを名簿（activeTimers）に保存しておく！
    activeTimers[token] = setTimeout(() => {
        
        // --- ここに実際のFCM通知送信処理（admin.messaging().send...）が入る ---
        console.log("⏰ 時間になりました！プッシュ通知を発射します！");
        // ---------------------------------------------------------------

        // 送り終わったら名簿から消す
        delete activeTimers[token];
    }, durationSec * 1000); // 秒をミリ秒に変換

    res.json({ status: "success", message: "通知の予約が完了しました！" });
});


// 🛑 ② ストップボタン（キャンセル受け付け）の窓口を新設！
app.post('/cancel-timer', (req, res) => {
    const { token } = req.body;

    // 名簿を見て、このスマホのタイマーが動いていたら…
    if (activeTimers[token]) {
        clearTimeout(activeTimers[token]); // ⏰ サーバー側のタイマーを強制ストップ！
        delete activeTimers[token];        // 名簿から消去
        console.log(`[キャンセル成功] タイマーを取り消しました: ${token.substring(0, 10)}...`);
        res.json({ status: "success", message: "サーバー側の予約を取り消しました。" });
    } else {
        console.log("[キャンセル対象なし] 動いているタイマーはありませんでした。");
        res.json({ status: "success", message: "アクティブな予約はありませんでした。" });
    }
});