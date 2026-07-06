// ==========================================
// 1. 状態管理の変数
// ==========================================
let currentMode = 'pomodoro'; // 'pomodoro', 'custom', 'stopwatch'
let timerId = null;           // すべてのモードで共通のタイマーID
let studySecondsCount = 0;    // ★すべてのモードで勉強した秒数をここにためる

// ポモドーロ用
const POMO_FOCUS = 25 * 60;
const POMO_BREAK = 5 * 60;
let pomoTimeLeft = POMO_FOCUS;
let isPomoFocus = true;

// カスタム用
let customTimeLeft = 10 * 60; // 初期値10分

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
// 2. タブ切り替え処理
// ==========================================
const tabs = {
    pomodoro: { btn: document.getElementById('tabPomodoro'), area: document.getElementById('pomoArea') },
    custom: { btn: document.getElementById('tabCustom'), area: document.getElementById('customArea') },
    stopwatch: { btn: document.getElementById('tabStopwatch'), area: document.getElementById('swArea') }
};

function switchMode(modeName) {
    // タイマーが動いていたら止める
    stopAllTimers();
    currentMode = modeName;

    // 見た目の切り替え
    Object.keys(tabs).forEach(key => {
        if (key === modeName) {
            tabs[key].btn.classList.add('active');
            tabs[key].area.classList.remove('hidden');
        } else {
            tabs[key].btn.classList.remove('active');
            tabs[key].area.classList.add('hidden');
        }
    });
}

tabs.pomodoro.btn.addEventListener('click', () => switchMode('pomodoro'));
tabs.custom.btn.addEventListener('click', () => switchMode('custom'));
tabs.stopwatch.btn.addEventListener('click', () => switchMode('stopwatch'));

// ==========================================
// 3. 各種タイマーの表示更新関数
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
// 4. メインタイマー制御（心臓部）
// ==========================================
function startTimer(tickFunction) {
    if (timerId !== null) return;
    timerId = setInterval(tickFunction, 1000);
}

function stopAllTimers() {
    clearInterval(timerId);
    timerId = null;
}

// --- ポモドーロの動き ---
document.getElementById('pomoStart').addEventListener('click', () => {
    startTimer(() => {
        if (pomoTimeLeft > 0) {
            pomoTimeLeft--;
            if (isPomoFocus) studySecondsCount++; // 集中時のみ勉強時間をカウント
            pomoDisplay.textContent = formatMinSec(pomoTimeLeft);
        } else {
            stopAllTimers();
            if (isPomoFocus) {
                alert('集中時間終了！データを記録して休憩します。');
                saveStudyTime(studySecondsCount);
                studySecondsCount = 0;
                isPomoFocus = false;
                pomoTimeLeft = POMO_BREAK;
                statusLabel.textContent = "☕ 休憩時間 (5:00)";
                statusLabel.className = "status-label break";
            } else {
                alert('休憩終了！次の集中を始めましょう。');
                isPomoFocus = true;
                pomoTimeLeft = POMO_FOCUS;
                statusLabel.textContent = "🔥 集中時間 (25:00)";
                statusLabel.className = "status-label focus";
            }
            pomoDisplay.textContent = formatMinSec(pomoTimeLeft);
        }
    });
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

// --- カスタムタイマーの動き ---
document.getElementById('setTimeBtn').addEventListener('click', () => {
    stopAllTimers();
    const min = parseInt(document.getElementById('inputMin').value, 10) || 0;
    const sec = parseInt(document.getElementById('inputSec').value, 10) || 0;
    customTimeLeft = (min * 60) + sec;
    customDisplay.textContent = formatMinSec(customTimeLeft);
});

document.getElementById('customStart').addEventListener('click', () => {
    startTimer(() => {
        if (customTimeLeft > 0) {
            customTimeLeft--;
            studySecondsCount++; // カスタムタイマーはすべて勉強時間としてカウント
            customDisplay.textContent = formatMinSec(customTimeLeft);
        } else {
            stopAllTimers();
            alert('設定した時間が経過しました！');
            saveStudyTime(studySecondsCount);
            studySecondsCount = 0;
        }
    });
});
document.getElementById('customStop').addEventListener('click', stopAllTimers);
document.getElementById('customReset').addEventListener('click', () => {
    stopAllTimers();
    studySecondsCount = 0;
    customTimeLeft = 10 * 60; // 10分に戻す
    customDisplay.textContent = formatMinSec(customTimeLeft);
});

// --- ストップウォッチの動き ---
document.getElementById('swStart').addEventListener('click', () => {
    startTimer(() => {
        swSeconds++;
        studySecondsCount++; // ストップウォッチ中も勉強時間としてカウント
        swDisplay.textContent = formatFullTime(swSeconds);
    });
});
document.getElementById('swStop').addEventListener('click', stopAllTimers);
document.getElementById('swReset').addEventListener('click', () => {
    stopAllTimers();
    studySecondsCount = 0;
    swSeconds = 0;
    swDisplay.textContent = formatFullTime(swSeconds);
});

// ==========================================
// 5. 共通の記録・保存・グラフ処理
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
    
    // ストップウォッチモードの時だけ、画面上の表示と内部の計測をリセットする
    if (currentMode === 'stopwatch') {
        swSeconds = 0;
        swDisplay.textContent = formatFullTime(0);
        stopAllTimers();
    }
});

function saveStudyTime(seconds) {
    totalStudyTime += seconds;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`study_${today}`, totalStudyTime);
    totalDisplay.textContent = formatTotalTimeText(totalStudyTime);
    updateChart();
}

// グラフ描画 (前回と同様)
function updateChart() {
    const ctx = document.getElementById('studyChart').getContext('2d');
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        const savedTime = localStorage.getItem(`study_${studySecondsCount, dateStr}`) || 0;
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
}

loadTotalTime();