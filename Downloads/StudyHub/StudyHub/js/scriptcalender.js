console.log("📦 scriptcalender.js נטען");

/* משתנים */
const CLIENT_ID = '241931409175-9o7e9e2bvnivf0dk7ehp7mnule8a2po8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

/* המתנה ל-GIS */
function waitForGoogleObject(callback) {
    const interval = setInterval(() => {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            clearInterval(interval);
            callback();
        }
    }, 100);
}

/* GIS מוכן */
function gisLoaded() {
    console.log("✅ gisLoaded הופעלה");

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });

    gisInited = true;
    maybeEnableSignin();
}

/* טעינת GAPI */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

function initializeGapiClient() {
    gapi.client.init({
        apiKey: 'AIzaSyC1D5jpq5o7Xs7HmQQWzRRImrWrju6WXuU',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    }).then(() => {
        gapiInited = true;
        maybeEnableSignin();
    }, (error) => {
        console.error('❌ שגיאה באתחול GAPI:', error);
    });
}

/* יצירת כפתור כניסה */
function maybeEnableSignin() {
    if (gapiInited && gisInited) {
        const container = document.getElementById('signin-button-container');
        container.innerHTML = ""; // מניעת כפילות

        const button = document.createElement('button');
        button.textContent = 'התחברות ל-Google';
        button.onclick = () => tokenClient.requestAccessToken();

        container.appendChild(button);
    }
}

/* קבלת טוקן */
function handleTokenResponse(response) {
    if (response.error) {
        console.error("❌ שגיאה בקבלת טוקן:", response.error);
        return;
    }
    console.log("✅ קיבלת טוקן!", response);
    loadCalendar();
}

/* טעינת יומן */
function loadCalendar() {
    console.log("📅 טוען אירועים מהיומן...");

    gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
    }).then((response) => {
        displayEvents(response.result.items);
    });
}

/* הצגת אירועים */
function displayEvents(events) {
    const calendarDiv = document.getElementById('calendar').style.display = "block";
    calendarDiv.innerHTML = '';


    if (!events || events.length === 0) {
        calendarDiv.innerHTML = '<p>אין אירועים ביומן.</p>';
        return;
    }

    events.forEach(event => {
        const div = document.createElement('div');
        const date = event.start.dateTime || event.start.date;
        div.innerHTML = `<h3>${event.summary}</h3>
                         <p>${new Date(date).toLocaleString('he-IL')}</p>`;
        calendarDiv.appendChild(div);
    });
}

/* התחלת GIS */
window.onload = () => {
    waitForGoogleObject(gisLoaded);
};
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
