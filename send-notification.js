// 📄 send-notification.js（最新バージョン対応版）

// 最新版のFirebaseは、必要な機能だけをピンポイントで呼び出します
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./serviceAccountKey.json');

// 1. Firebaseの管理者権限を初期化（最新のスタイル）
initializeApp({
  credential: cert(serviceAccount)
})

// 2. さきほどコピーした、あなたのパソコン（ブラウザ）の住所（FCMトークン）
const registrationToken = 'dA8-6s4_NPZCrpXIWlzd_0:APA91bFVwaATf3ZL9OraswDcJwfMoVven7NVOOyU917kpJewcLL2gV9aACxRM2IRqtARvVOWNX4nOGb8pADl7B2oAkE6fJdfbU6e1qQQ1EnenGr-A1SSqck';

// 3. 送信する通知メッセージの内容
const message = {
  notification: {
    title: '⏰ 【実験成功】時限式プッシュ通知！',
    body: '10秒間の居眠り（スリープ）から覚めました！大成功ですワン！'
  },
  token: registrationToken
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' ⏳ 10秒タイマースタート！');
console.log(' アプリのタブを裏側に隠すか、別の作業をして待ね...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 4. 10秒（10000ミリ秒）後にFirebaseへ発射命令を出します！
setTimeout(() => {
  getMessaging().send(message)
    .then((response) => {
      console.log('🚀 【大成功】サーバーから電波を発射しました！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 送信エラーが発生しました:', error);
      process.exit(1);
    });
}, 10000);