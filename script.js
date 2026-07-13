// 📄 script.js の一番上（1行目）に貼り付け

// 1. Firebaseの通知機能（Messaging）を取り込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

// 2. あなた専用の基地局の鍵（★ここにあなたのマイアプリの情報を貼り付けます★）
const firebaseConfig = {
    apiKey: "AIzaSyC1PPF9tfLrvVbS2C0b9VAOdCnel-ff9Dg",
    authDomain: "studylog-18096.firebaseapp.com",
    projectId: "studylog-18096",
    storageBucket: "studylog-18096.firebasestorage.app",
    messagingSenderId: "432615831404",
    appId: "1:432615831404:web:ca39c4d32b057519412549",
    measurementId: "G-FJK5HZNV0L"
  };


// 3. Firebaseの起動
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 4. スマホ一台一台の「固有の住所（トークン）」を発行してコンソールに表示する関数
// 🔄 script.js の「requestPushToken」関数をこの塊に丸ごと置き換えてください

function requestPushToken() {
    // ユーザーに通知の許可を求める
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('通知の許可をゲット！住所（トークン）を発行します...');
            
            // 🔽 ここで「裏方（Service Worker）の準備完了」を待ち、その情報を「registration」という名前で受け取ります
            navigator.serviceWorker.ready.then((registration) => {

                // 枠組みの中で初めて「registration」が使えるようになります！
                getToken(messaging, { 
                    serviceWorkerRegistration: registration,
                    vapidKey: 'BNdB3Xq99cqoee4mKwjaoqcKZyH1u6s24UKsr2jseIW0XT5276_T-7u5fqElQx8WWnwlF_03TKmgD5H4I_km67w'
                })
                .then((currentToken) => {
                    if (currentToken) {
                        // 🚀 これがプッシュ通知に絶対必要な「あなたのスマホの住所」です！
                        console.log('【大成功】あなたのスマホの住所（トークン）はこれです：');
                        console.log(currentToken);
                        alert("トークンを発行しました！開発者ツール（コンソール）を見てね！");
                    } else {
                        console.log('トークンが取得できませんでした。');
                    }
                    if (currentToken) {
  // 既存の処理に加えて、画面のテキストエリアにトークンを表示
  document.getElementById('token-textarea').value = currentToken;
}
                }).catch((err) => {
                    console.error('トークン取得エラー：', err);
                });

            }); // navigator.serviceWorker.ready の閉じ
        }
    });
}

// アプリ起動時に、上の関数を動かす（テスト用）
// 以前作った notifyBtn のイベントリスナーの中に組み込んでもOKです！
document.getElementById('enableNotificationBtn').addEventListener('click', requestPushToken);

// === ここから下に、今までの既存のコードが続くようにします ===
// ==========================================
// 1. 状態管理の変数
// ==========================================
let currentMode = 'pomodoro'; 
let timerId = null;           
let studySecondsCount = 0;    

// ポモドーロ用
const POMO_FOCUS = 25 * 60;
const POMO_BREAK = 5 * 60;
let pomoTimeLeft = POMO_FOCUS;
let isPomoFocus = true;

// カスタム用
let customTimeLeft = 10 * 60; 

// ストップウォッチ用
let swSeconds = 0;

// データ保存用
let totalStudyTime = 0; 
let myChart = null;

// HTML要素の取得
const pomoDisplay = document.getElementById('pomoDisplay');
const customDisplay = document.getElementById('customDisplay');
const swDisplay = document.getElementById('swDisplay');
const statusLabel = document.getElementById('statusLabel');
const totalDisplay = document.getElementById('totalDisplay');

// ==========================================
// 2. 【新機能】通知のコントロール処理
// ==========================================
const notifyBtn = document.getElementById('enableNotificationBtn');

// ページを開いたときにすでに許可されているか確認する
function checkNotificationPermission() {
    if (!("Notification" in window)) {
        notifyBtn.textContent = "❌ このブラウザは通知に非対応です";
        return;
    }
    if (Notification.permission === "granted") {
        //notifyBtn.style.display = "none"; // 許可済みならボタンを隠す
    }
}

// ボタンを押したときに許可を求める
notifyBtn.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("通知が許可されました！タイマー終了時にお知らせします。");
            //notifyBtn.style.display = "none";
            // テスト通知を送ってみる
            sendNotification("📢 テスト通知", "通知機能はバッチ有効!!");
        } else {
            alert("通知が拒否されました。設定から変更できます。");
        }
    });
});

// スマホの画面に通知を送る共通の関数
// 🔄 script.js の中にある sendNotification をこれに丸ごと差し替えてください
function sendNotification(title, message) {
    try {
        if (!("Notification" in window)) {
            console.log("このブラウザは通知に対応していません");
            return;
        }

        if (Notification.permission === "granted") {
            // 🔽 通常の通知ではなく、裏方（Service Worker）から通知を強制発火させる
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, {
                        body: message,
                        icon: "https://cdn-icons-png.flaticon.com/512/854/854881.png"
                    });
                });
            } else {
                // 万が一裏方が準備できていない時のための予備
                new Notification(title, { body: message });
            }
        }
    } catch (error) {
        console.error("通知の送信に失敗しました:", error);
    }
}
// 🚀【新機能】パソコンのサーバーへ、未来の通知予約を送る関数
// 📄 script.js の reserveServerNotification をこれに差し替える

function reserveServerNotification(durationSec) {
    // 画面からトークンを取得
    const token = document.getElementById('token-textarea').value; 
    
    // 🚨【チェック1】関数が動いているか確認
    alert('⏰ 通知予約関数が動き出しました！\nトークン: ' + (token ? '⭕入っています' : '❌空っぽです'));

    // 🔴【超重要】ここがあなたの localtunnel の URL になっているか今一度確認！
    // 末尾の「/start-timer」を消さないように注意してください。
    const serverUrl = 'https://busy-steaks-throw.loca.lt/start-timer';

    if (!token) {
        alert('⚠️ トークンが空っぽなので、ここで処理を終了します。');
        return;
    }

    alert('🚀 サーバーへ合図を送ります...\nURL: ' + serverUrl);

    fetch(serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token,
            durationSec: durationSec
        })
    })
    .then(response => {
        // 🚨【チェック2】サーバーから返事が来たか確認
        alert('📩 サーバーから応答がありました！\nステータスコード: ' + response.status);
        return response.json();
    })
    .then(data => {
        // 🚨【チェック3】通信が完全に成功したか確認
        alert('✨ サーバー連携大成功！\n返事: ' + JSON.stringify(data));
    })
    .catch(error => {
        // 🚨【チェック4】エラーが発生した場合の原因を表示
        alert('❌ 通信エラーが発生しました！\n原因: ' + error.message);
    });
}

tabs.pomodoro.btn.addEventListener('click', () => switchMode('pomodoro'));
tabs.custom.btn.addEventListener('click', () => switchMode('custom'));
tabs.stopwatch.btn.addEventListener('click', () => switchMode('stopwatch'));

// ==========================================
// 4. 表示更新・フォーマット関数
// ==========================================
function formatMinSec(seconds) {
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatFullTime(totalSeconds) {
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTotalTimeText(totalSeconds) {
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;
    return `${h}時間 ${m}分 ${s}秒`;
}

// ==========================================
// 5. メインタイマー制御
// ==========================================
function stopAllTimers() {
    clearInterval(timerId);
    timerId = null;
    localStorage.removeItem('timer_start_time');
    localStorage.removeItem('timer_mode');
}

// --- ポモドーロタイマー ---
document.getElementById('pomoStart').addEventListener('click', () => {
    if (timerId !== null) return;
    
    if (!localStorage.getItem('timer_start_time')) {
        localStorage.setItem('timer_start_time', Date.now());
        localStorage.setItem('timer_mode', 'pomodoro');
    }

    const baseTimeLeft = pomoTimeLeft;
    const baseStudyCount = studySecondsCount;
    reserveServerNotification(pomoTimeLeft);

    timerId = setInterval(() => {
        const startTime = parseInt(localStorage.getItem('timer_start_time'), 10);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        pomoTimeLeft = baseTimeLeft - elapsedSeconds;
        
        if (isPomoFocus) {
            studySecondsCount = baseStudyCount + elapsedSeconds;
        }

        if (pomoTimeLeft > 0) {
            pomoDisplay.textContent = formatMinSec(pomoTimeLeft);
        } else {
            stopAllTimers();
            if (isPomoFocus) {
                // 🔽 【新機能】終了時にスマホに通知を送る
                sendNotification("🔥 集中終了！", "25分間よく頑張りました！5分間の休憩に入りましょう。");
                
                alert('集中時間終了！データを記録して休憩します。');
                saveStudyTime(studySecondsCount);
                studySecondsCount = 0;
                isPomoFocus = false;
                pomoTimeLeft = POMO_BREAK;
                statusLabel.textContent = "☕ 休憩時間 (5:00)";
                statusLabel.className = "status-label break";
            } else {
                // 🔽 【新機能】休憩終了時も通知
                sendNotification("☕ 休憩終了！", "休憩が終わりました。次の25分集中をはじめましょう！");
                
                alert('休憩終了！次の集中を始めましょう。');
                isPomoFocus = true;
                pomoTimeLeft = POMO_FOCUS;
                statusLabel.textContent = "🔥 集中時間 (25:00)";
                statusLabel.className = "status-label focus";
            }
            pomoDisplay.textContent = formatMinSec(pomoTimeLeft);
        }
    }, 1000);
});

document.getElementById('pomoStop').addEventListener('click', stopAllTimers);
document.getElementById('pomoReset').addEventListener('click', () => {
    stopAllTimers();
    studySecondsCount = 0;
    isPomoFocus = true;
    pomoTimeLeft = POMO_FOCUS;
    statusLabel.textContent = "🔥 集中時間 (25:00)";
    statusLabel.className = "status-label focus";
    pomoDisplay.textContent = formatMinSec(pomoTimeLeft);
});

// --- カスタムタイマー ---
document.getElementById('setTimeBtn').addEventListener('click', () => {
    stopAllTimers();
    const min = parseInt(document.getElementById('inputMin').value, 10) || 0;
    const sec = parseInt(document.getElementById('inputSec').value, 10) || 0;
    customTimeLeft = (min * 60) + sec;
    customDisplay.textContent = formatMinSec(customTimeLeft);
});

document.getElementById('customStart').addEventListener('click', () => {
    if (timerId !== null) return;

    if (!localStorage.getItem('timer_start_time')) {
        localStorage.setItem('timer_start_time', Date.now());
        localStorage.setItem('timer_mode', 'custom');
    }

    const baseTimeLeft = customTimeLeft;
    const baseStudyCount = studySecondsCount;
    reserveServerNotification(customTimeLeft);

    timerId = setInterval(() => {
        const startTime = parseInt(localStorage.getItem('timer_start_time'), 10);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        customTimeLeft = baseTimeLeft - elapsedSeconds;
        studySecondsCount = baseStudyCount + elapsedSeconds;

        if (customTimeLeft > 0) {
            customDisplay.textContent = formatMinSec(customTimeLeft);
        } else {
            stopAllTimers();
            
            // 🔽 【新機能】カスタムタイマー終了通知
            sendNotification("⏱️ タイマー終了！", "設定した時間が経過しました！");

            alert('設定した時間が経過しました！');
            saveStudyTime(studySecondsCount);
            studySecondsCount = 0;
            customTimeLeft = 0;
            customDisplay.textContent = formatMinSec(0);
        }
    }, 1000);
});
document.getElementById('customStop').addEventListener('click', stopAllTimers);
document.getElementById('customReset').addEventListener('click', () => {
    stopAllTimers();
    studySecondsCount = 0;
    customTimeLeft = 10 * 60; 
    customDisplay.textContent = formatMinSec(customTimeLeft);
});

// --- ストップウォッチ ---
document.getElementById('swStart').addEventListener('click', () => {
    if (timerId !== null) return;

    if (!localStorage.getItem('timer_start_time')) {
        localStorage.setItem('timer_start_time', Date.now());
        localStorage.setItem('timer_mode', 'stopwatch');
    }

    const baseSwSeconds = swSeconds;
    const baseStudyCount = studySecondsCount;

    timerId = setInterval(() => {
        const startTime = parseInt(localStorage.getItem('timer_start_time'), 10);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        swSeconds = baseSwSeconds + elapsedSeconds;
        studySecondsCount = baseStudyCount + elapsedSeconds;

        swDisplay.textContent = formatFullTime(swSeconds);
    }, 1000);
});
document.getElementById('swStop').addEventListener('click', stopAllTimers);
document.getElementById('swReset').addEventListener('click', () => {
    stopAllTimers();
    studySecondsCount = 0;
    swSeconds = 0;
    swDisplay.textContent = formatFullTime(swSeconds);
});

// ==========================================
// 6. アプリが再び開かれたときに同期する処理
// ==========================================
function checkBackgroundTimer() {
    const startTime = localStorage.getItem('timer_start_time');
    const savedMode = localStorage.getItem('timer_mode');

    if (startTime && savedMode) {
        switchMode(savedMode);
        if (savedMode === 'pomodoro') document.getElementById('pomoStart').click();
        if (savedMode === 'custom') document.getElementById('customStart').click();
        if (savedMode === 'stopwatch') document.getElementById('swStart').click();
    }
}

// ==========================================
// 7. 共通の記録・保存・グラフ処理
// ==========================================
const saveLogBtn = document.getElementById('saveLogBtn');
saveLogBtn.addEventListener('click', () => {
    if (studySecondsCount === 0) {
        alert('加算する勉強時間がありません。');
        return;
    }
    saveStudyTime(studySecondsCount);
    alert(`${Math.floor(studySecondsCount / 60)}分${studySecondsCount % 60}秒を記録しました！`);
    
    studySecondsCount = 0; 
    if (currentMode === 'stopwatch') {
        swSeconds = 0;
        swDisplay.textContent = formatFullTime(0);
    }
    stopAllTimers();
});

function saveStudyTime(seconds) {
    totalStudyTime += seconds;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`study_${today}`, totalStudyTime);
    totalDisplay.textContent = formatTotalTimeText(totalStudyTime);
    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('studyChart').getContext('2d');
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        const savedTime = localStorage.getItem(`study_${dateStr}`) || 0;
        const minutes = Math.round((parseInt(savedTime, 10) / 60) * 10) / 10;
        data.push(minutes);
    }
    if (myChart) { myChart.destroy(); }
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '勉強時間（分）',
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function loadTotalTime() {
    const today = new Date().toISOString().split('T')[0];
    const savedTime = localStorage.getItem(`study_${today}`);
    if (savedTime) { totalStudyTime = parseInt(savedTime, 10); } 
    else { totalStudyTime = 0; }
    totalDisplay.textContent = formatTotalTimeText(totalStudyTime);
    updateChart();
    
    checkBackgroundTimer();
    // 🔽 【新機能】起動時に通知の状態をチェック
    checkNotificationPermission();

}
// 🔽 script.js の一番最後に追加してください
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker 登録成功！', reg))
        .catch(err => console.error('Service Worker 登録失敗...', err));
}
function copyToken() {
  const textarea = document.getElementById('token-textarea');
  textarea.select();
  document.execCommand('copy');
  alert('トークンをコピーしました！');
}

loadTotalTime();