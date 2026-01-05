// אתחול אנימציות
AOS.init({ duration: 1000, once: true });

const CLIENT_ID = "241931409175-9o7e9e2bvnivf0dk7ehp7mnule8a2po8.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let tokenClient;

// פונקציית עזר לקבלת אימייל המשתמש המחובר
function getUserEmail() {
    return localStorage.getItem("loggedInUserEmail") || sessionStorage.getItem("loggedInUserEmail") || "guest";
}

// ניהול טוקן ייחודי לכל משתמש כדי למנוע ערבוב יומנים
const emailKey = getUserEmail();
const TOKEN_KEY = `google_calendar_token_${emailKey}`;
let accessToken = localStorage.getItem(TOKEN_KEY);

// --- רינדור משימות ---
function renderTasks() {
    const email = getUserEmail();
    const tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];
    const container = document.getElementById("tasksContainer");
    if (!container) return;
    container.innerHTML = "";

    tasks.forEach((task, index) => {
        const card = document.createElement("div");
        card.className = "task-card";
        card.setAttribute("data-aos", "fade-up");

        card.innerHTML = `
            <h3>${task.name}</h3>
            <p>📚 <b>${task.course}</b> | 🏷️ ${task.type}</p>
            <p>📅 ${task.date}</p>
            <div style="margin:15px 0;">
                <span class="status-badge status-${task.status}">${task.status}</span>
            </div>
            <div class="card-actions" style="display:flex; gap:10px;">
                <button type="button" class="status-btn" data-index="${index}">🔄 שנה סטטוס</button>
                <button type="button" class="delete-btn" data-index="${index}" style="background:rgba(255,0,0,0.3)">🗑️ מחק</button>
            </div>
        `;
        container.appendChild(card);
    });

    // חיבור כפתורים דינמיים
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.onclick = () => changeStatus(btn.dataset.index);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteTask(btn.dataset.index);
    });
}

function changeStatus(index) {
    const email = getUserEmail();
    let tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];
    const states = ["פתוח", "בתהליך", "הושלם"];
    let currIndex = states.indexOf(tasks[index].status);
    tasks[index].status = states[(currIndex + 1) % states.length];
    localStorage.setItem(`tasks_${email}`, JSON.stringify(tasks));
    renderTasks();
}

function deleteTask(index) {
    if (!confirm("למחוק?")) return;
    const email = getUserEmail();
    let tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];
    tasks.splice(index, 1);
    localStorage.setItem(`tasks_${email}`, JSON.stringify(tasks));
    renderTasks();
}

// --- לוגיקת גוגל קלנדר ---

function initGoogle() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse.error) return;
            accessToken = tokenResponse.access_token;
            localStorage.setItem(TOKEN_KEY, accessToken);
            executeGoogleSave(); // שמירה מיד לאחר קבלת אישור
        },
    });
}

async function executeGoogleSave() {
    const taskName = document.getElementById("taskName").value;
    const taskDate = document.getElementById("taskDate").value;
    const googleBtn = document.getElementById("googleSyncBtn");

    if (!taskName || !taskDate) {
        // הפיכת הכפתור לאדום זמנית אם חסר מידע
        googleBtn.style.background = "red";
        googleBtn.textContent = "❌ חסר שם/תאריך";
        setTimeout(() => {
            googleBtn.style.background = "#4285F4";
            googleBtn.textContent = "🗓️ שמור גם בגוגל";
        }, 2000);
        return;
    }

    const event = {
        'summary': taskName,
        'description': 'משימה שנוצרה ב-StudyHub',
        'start': { 'date': taskDate }, // משימה ליום שלם
        'end': { 'date': taskDate }
    };

    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (response.ok) {
            googleBtn.style.background = "#28a745";
            googleBtn.textContent = "✅ נשמר ביומן!";
            setTimeout(() => {
                googleBtn.style.background = "#4285F4";
                googleBtn.textContent = "🗓️ שמור גם בגוגל";
            }, 3000);
        } else if (response.status === 401) {
            // טוקן פג תוקף - נבקש חדש בשקט
            accessToken = null;
            localStorage.removeItem(TOKEN_KEY);
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } catch (error) {
        console.error("שגיאה בסנכרון לגוגל:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
    if (window.google) initGoogle();

    // לחיצה על כפתור גוגל
    document.getElementById("googleSyncBtn").addEventListener("click", () => {
        if (!accessToken) {
            // אם אין טוקן למשתמש הזה, נבקש בחירת חשבון
            tokenClient.requestAccessToken({ prompt: 'select_account' });
        } else {
            executeGoogleSave();
        }
    });

    // שמירה במערכת (ללא Alert)
    const form = document.getElementById("addTaskForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = getUserEmail();
            let tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];

            tasks.push({
                name: document.getElementById("taskName").value,
                course: document.getElementById("taskCourse").value,
                type: document.getElementById("taskType").value,
                status: document.getElementById("taskStatus").value,
                date: document.getElementById("taskDate").value
            });

            localStorage.setItem(`tasks_${email}`, JSON.stringify(tasks));
            
            // משוב ויזואלי על הכפתור
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "✔ נשמר במערכת";
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                e.target.reset();
                renderTasks();
            }, 1000);
        });
    }
});