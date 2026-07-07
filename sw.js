// sw.js (中身はこれだけ)
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // 通知をタップしたら閉じる処理
});