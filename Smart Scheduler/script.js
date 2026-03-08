let activities = JSON.parse(localStorage.getItem('anna_smart_v8')) || [];
let alarmAudio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3'); 

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('activeUser');
    const existingPass = localStorage.getItem('userPassword');
    if (!existingPass) {
        document.getElementById('loginTitle').innerText = "Halo Anna Cantik! ✨";
        document.getElementById('loginBtn').innerText = "Set Password & Mulai";
    }
    if (savedUser) { showDashboard(savedUser); }
    updateClock();
});

function handleAuth() {
    const name = document.getElementById('usernameInput').value;
    const pass = document.getElementById('passwordInput').value;
    const existingPass = localStorage.getItem('userPassword');

    if (!name || !pass) return alert("Anna cantik, nama dan password jangan kosong!");

    if (!existingPass) {
        localStorage.setItem('userPassword', pass);
        sessionStorage.setItem('activeUser', name);
        showDashboard(name);
    } else {
        if (pass === existingPass) {
            sessionStorage.setItem('activeUser', name);
            showDashboard(name);
        } else {
            alert("Oops! Password salah.");
        }
    }
}

function showDashboard(name) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('displayUserName').innerText = name;
    updateUI();
}

function handleLogout() { sessionStorage.removeItem('activeUser'); location.reload(); }

function updateClock() {
    const now = new Date();
    document.getElementById('realTimeClock').innerText = now.toLocaleTimeString('id-ID');
    const curDate = now.toISOString().split('T')[0];
    const curTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const curTotalMin = (now.getHours() * 60) + now.getMinutes();

    activities.forEach(act => {
        if (act.date === curDate) {
            if (act.startTimeStr === curTime && !act.alarmFired) {
                fireAlarm(`🚨 MULAI: ${act.name}`);
                act.alarmFired = true;
                saveAndRender();
            }
            if (curTotalMin >= act.endTotalMinutes && !act.isCompleted) {
                fireAlarm(`🛑 SELESAI: ${act.name}`);
                act.isCompleted = true;
                saveAndRender();
            }
        }
    });
    setTimeout(updateClock, 1000);
}

function fireAlarm(msg) {
    if (Notification.permission === "granted") { new Notification("Anfairy Alarm", { body: msg }); }
    alarmAudio.loop = true;
    alarmAudio.play().catch(() => console.log("Klik layar agar suara aktif"));
    document.getElementById('mainApp').classList.add('is-vibrating');
    
    setTimeout(() => {
        if(confirm(`🧚‍♀️ ANFAIRY SYSTEM:\n\n${msg}\n\nKlik OK untuk matikan alarm.`)) {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            document.getElementById('mainApp').classList.remove('is-vibrating');
        }
    }, 500);
}

function processSchedule() {
    const name = document.getElementById('taskName').value;
    const cat = document.getElementById('taskCategory').value;
    const date = document.getElementById('taskDate').value;
    const start = document.getElementById('startTime').value;
    const dur = parseInt(document.getElementById('duration').value);

    if (!name || !date || !start || isNaN(dur)) return alert("Data kurang lengkap!");

    const [h, m] = start.split(':').map(Number);
    const startMin = (h * 60) + m;

    activities.push({
        id: Date.now(), name, category: cat, date, startTimeStr: start,
        startTotalMinutes: startMin, endTotalMinutes: startMin + dur,
        durationMin: dur, alarmFired: false, isCompleted: false
    });
    saveAndRender();
}

function updateUI() {
    const list = document.getElementById('scheduleTimeline');
    activities.sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTotalMinutes - b.startTotalMinutes);
    list.innerHTML = "";

    let completed = 0;
    activities.forEach((item, index) => {
        if (item.isCompleted) completed++;
        const endH = Math.floor(item.endTotalMinutes / 60);
        const endM = item.endTotalMinutes % 60;
        const endTimeStr = `${endH.toString().padStart(2,'0')}:${endM.toString().padStart(2,'0')}`;

        const div = document.createElement('div');
        div.className = `timeline-item cat-${item.category} ${item.isCompleted ? 'is-completed' : ''}`;
        
        div.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--${item.category.toLowerCase()});">${item.category.toUpperCase()} | ${item.date}</div>
            <div style="font-size: 1.3rem; font-weight: 700; margin: 8px 0; ${item.isCompleted ? 'text-decoration: line-through;' : ''}">${item.name}</div>
            <div style="font-weight: 600; opacity: 0.9;">⏰ ${item.startTimeStr} - ${endTimeStr}</div>
            <div style="margin-top: 15px;">
                <button class="btn-small" style="background:#475569; color:white" onclick="openEdit(${index})">Edit</button>
                <button class="btn-small" style="background:var(--accent); color:white" onclick="deleteTask(${index})">Hapus</button>
            </div>
        `;
        list.appendChild(div);
    });

    const percent = activities.length === 0 ? 0 : Math.round((completed / activities.length) * 100);
    document.getElementById('progressFill').style.width = percent + "%";
    document.getElementById('statsText').innerText = `${percent}% Keajaiban Terwujud`;
    document.getElementById('taskCount').innerText = `${activities.length} Aktivitas`;
}

function saveAndRender() { localStorage.setItem('anna_smart_v8', JSON.stringify(activities)); updateUI(); }
function openEdit(i) {
    const it = activities[i];
    document.getElementById('editIndex').value = i;
    document.getElementById('editName').value = it.name;
    document.getElementById('editCategory').value = it.category;
    document.getElementById('editStart').value = it.startTimeStr;
    document.getElementById('editDuration').value = it.durationMin;
    document.getElementById('editModal').style.display = 'flex';
}
function saveEdit() {
    const i = document.getElementById('editIndex').value;
    const a = activities[i];
    a.name = document.getElementById('editName').value;
    a.category = document.getElementById('editCategory').value;
    a.startTimeStr = document.getElementById('editStart').value;
    a.durationMin = parseInt(document.getElementById('editDuration').value);
    const [h, m] = a.startTimeStr.split(':').map(Number);
    a.startTotalMinutes = (h * 60) + m;
    a.endTotalMinutes = a.startTotalMinutes + a.durationMin;
    a.isCompleted = false;
    closeModal();
    saveAndRender();
}
function closeModal() { document.getElementById('editModal').style.display = 'none'; }
function deleteTask(i) { if(confirm("Hapus aktivitas ini?")) { activities.splice(i, 1); saveAndRender(); } }