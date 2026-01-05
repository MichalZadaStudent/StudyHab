// 1. פונקציית עזר לקבלת האימייל של המשתמש המחובר ב-StudyHub
function getCurrentUserEmail() {
    return localStorage.getItem('loggedInUserEmail') || sessionStorage.getItem('loggedInUserEmail');
}

// 2. יצירת מפתח ייחודי לכל משתמש עבור הטוקן של גוגל
const userEmail = getCurrentUserEmail();
const TOKEN_KEY = userEmail ? `google_calendar_token_${userEmail}` : null;

let accessToken = TOKEN_KEY ? localStorage.getItem(TOKEN_KEY) : null; 
let calendar = null;
let tokenClient;

const CLIENT_ID = "241931409175-9o7e9e2bvnivf0dk7ehp7mnule8a2po8.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

// 3. אתחול הלקוח של גוגל
function initGoogleClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error) return;
            
            accessToken = resp.access_token;
            // שמירת הטוקן תחת המפתח הייחודי למשתמש
            if (TOKEN_KEY) {
                localStorage.setItem(TOKEN_KEY, accessToken);
            }
            
            showCalendarUI();
        }
    });

    // בדיקה: אם המשתמש מחובר ויש לו טוקן שמור - נציג את היומן מיד
    if (userEmail && accessToken) {
        showCalendarUI();
    } else {
        // אם אין טוקן או משתמש אחר מחובר - נציג את מסך ההתחברות
        document.getElementById("login").style.display = "block";
        document.getElementById("calendar").style.display = "none";
    }
}

// 4. הצגת ממשק היומן
async function showCalendarUI() {
    const loginDiv = document.getElementById("login");
    const calendarDiv = document.getElementById("calendar");
    
    if (loginDiv) loginDiv.style.display = "none";
    if (calendarDiv) calendarDiv.style.display = "block";
    
    if (!calendar) {
        initCalendar();
    }
    await loadEvents();
}

// 5. לחיצה על כפתור התחברות - תמיד מבקש בחירת חשבון למניעת בלבול
function handleAuthClick() {
    tokenClient.requestAccessToken({ prompt: 'select_account' });
}

document.getElementById("loginBtn").addEventListener("click", handleAuthClick);

// 6. אתחול FullCalendar
function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'he',
        direction: 'rtl',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        editable: true,
        selectable: true,

        select: async function(info) {
            const title = prompt("שם האירוע החדש:");
            if (title) {
                const eventData = {
                    'summary': title,
                    'start': { 'dateTime': info.startStr + "T09:00:00Z" },
                    'end': { 'dateTime': info.startStr + "T10:00:00Z" }
                };
                await createEvent(eventData);
                await loadEvents();
            }
            calendar.unselect();
        },

        eventClick: async function(info) {
            if (confirm(`האם למחוק את האירוע "${info.event.title}"?`)) {
                await deleteEvent(info.event.id);
                info.event.remove();
            }
        },

        eventDrop: async function(info) {
            const eventData = {
                'summary': info.event.title,
                'start': { 'dateTime': info.event.start.toISOString() },
                'end': { 'dateTime': (info.event.end || info.event.start).toISOString() }
            };
            await updateEvent(info.event.id, eventData);
        }
    });
    calendar.render();
}

// 7. טעינת אירועים מה-API של גוגל
async function loadEvents() {
    if (!accessToken) return;

    const timeRangeBack = new Date();
    timeRangeBack.setFullYear(timeRangeBack.getFullYear() - 2); 
    try {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${timeRangeBack.toISOString()}&maxResults=2500`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // טיפול בטוקן שפג תוקפו
        if (res.status === 401) {
            accessToken = null;
            if (TOKEN_KEY) localStorage.removeItem(TOKEN_KEY);
            document.getElementById("login").style.display = "block";
            document.getElementById("calendar").style.display = "none";
            return;
        }

        const data = await res.json();
        if (data.items) {
            const events = data.items.map(e => ({
                id: e.id,
                title: e.summary || "ללא כותרת",
                start: e.start?.dateTime || e.start?.date,
                end: e.end?.dateTime || e.end?.date,
                backgroundColor: '#3788d8'
            }));
            calendar.removeAllEvents();
            calendar.addEventSource(events);
        }
    } catch (err) { console.error("Error loading events:", err); }
}

// 8. פונקציות עריכה (Create, Delete, Update)
async function createEvent(eventData) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
}

async function deleteEvent(eventId) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
    });
}

async function updateEvent(eventId, eventData) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
}

// טעינה בטעינת הדף
window.onload = () => { if (window.google) initGoogleClient(); };