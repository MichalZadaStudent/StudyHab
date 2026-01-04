let accessToken = null;
let calendar = null;

const CLIENT_ID = "241931409175-9o7e9e2bvnivf0dk7ehp7mnule8a2po8.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events"; // הרשאות עריכה מלאות

function initGoogleClient() {
    let tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error) return;
            accessToken = resp.access_token;
            document.getElementById("login").style.display = "none";
            document.getElementById("calendar").style.display = "block";
            initCalendar();
            await loadEvents();
        }
    });

    document.getElementById("loginBtn").addEventListener("click", () => {
        tokenClient.requestAccessToken({ prompt: "consent" });
    });
}

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
        editable: true, // מאפשר גרירה ושינוי גודל
        selectable: true, // מאפשר בחירת תאריך להוספה

        // --- הוספת אירוע בלחיצה על תאריך ---
        select: async function(info) {
            const title = prompt("שם האירוע החדש:");
            if (title) {
                const eventData = {
                    'summary': title,
                    'start': { 'dateTime': info.startStr + "T09:00:00Z" },
                    'end': { 'dateTime': info.startStr + "T10:00:00Z" }
                };
                await createEvent(eventData);
                await loadEvents(); // רענון הלוח
            }
            calendar.unselect();
        },

        // --- מחיקת אירוע בלחיצה עליו ---
        eventClick: async function(info) {
            if (confirm(`האם למחוק את האירוע "${info.event.title}"?`)) {
                await deleteEvent(info.event.id);
                info.event.remove(); // הסרה מהתצוגה
            }
        },

        // --- עדכון אירוע בגרירה ---
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

// --- פונקציות ה-API של גוגל ---

// 1. טעינה (מעודכן לטווח רחב)
async function loadEvents() {
    const timeRangeBack = new Date();
    timeRangeBack.setFullYear(timeRangeBack.getFullYear() - 2); 
    try {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${timeRangeBack.toISOString()}&maxResults=2500`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
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
    } catch (err) { console.error("Error loading:", err); }
}

// 2. יצירת אירוע חדש
async function createEvent(eventData) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
}

// 3. מחיקת אירוע
async function deleteEvent(eventId) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
    });
}

// 4. עדכון אירוע קיים
async function updateEvent(eventId, eventData) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
}

window.onload = () => { if (window.google) initGoogleClient(); };