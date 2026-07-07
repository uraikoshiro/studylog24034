// 📄 sw.js（中身をこれに丸ごと差し替えてください）

// 1. 📡 Firebaseからのプッシュ電波をキャッチする処理
self.addEventListener('push', function(event) {
    console.log('[Service Worker] プッシュ電波を受信しました！');
    
    if (event.data) {
        try {
            // 送られてきた通知データを解析する
            const data = event.data.json();
            
            // Firebaseから届いた「タイトル」と「本文」を抜き出す
            const title = data.notification?.title || "🚀 StudyLog Pro";
            const options = {
                body: data.notification?.body || "タイマーが終了しました！",
                icon: "https://cdn-icons-png.flaticon.com/512/854/854881.png" // 通知のアイコン
            };

            // パソコンの画面にポンッと通知を表示する！
            event.waitUntil(self.registration.showNotification(title, options));
        } catch (e) {
            console.error('通知データの解析に失敗しました:', e);
        }
    }
});

// 2. 🫵 通知がクリックされた時の処理（元からあったコード）
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
});