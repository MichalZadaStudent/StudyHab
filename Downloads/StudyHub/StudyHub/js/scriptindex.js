function getCurrentUserEmail() {
    return localStorage.getItem('loggedInUserEmail') || sessionStorage.getItem('loggedInUserEmail');
}

document.addEventListener('DOMContentLoaded', () => {
    const userDisplayName = document.getElementById('userDisplayName');
    const progressBar = document.querySelector(".progress-bar");
    const upcomingList = document.getElementById("upcomingTasks");

    function renderProgressBar(tasks) {
        if (!progressBar) return;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // סינון משימות לחודש הנוכחי
        const monthlyTasks = tasks.filter(task => {
            if (!task.date) return false;
            const taskDate = new Date(task.date);
            return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
        });

        // חישוב משימות שהושלמו - הוספתי בדיקה גמישה יותר לטקסט
        const completed = monthlyTasks.filter(task => {
            const status = String(task.status).trim();
            return status === "הושלם" || status === "completed" || status === "done";
        });

        const percent = monthlyTasks.length > 0 ? Math.round((completed.length / monthlyTasks.length) * 100) : 0;

        // עדכון גרפי
        progressBar.style.width = percent + "%";
        progressBar.textContent = percent + "%";
        
        // צבעים לפי התקדמות
        if (percent >= 80) progressBar.style.backgroundColor = "#28a745";
        else if (percent >= 40) progressBar.style.backgroundColor = "#ffc107";
        else progressBar.style.backgroundColor = "#dc3545";
    }

    function loadDashboardData() {
        const email = getCurrentUserEmail();
        if (!email) {
            window.location.href = 'login.html';
            return;
        }

        // שליפת משימות מהמפתח הנכון
        const tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];

        // עדכון שם המשתמש
        const username = localStorage.getItem('loggedInUsername') || sessionStorage.getItem('loggedInUsername');
        if (userDisplayName) userDisplayName.textContent = username || 'סטודנט/ית';

        renderProgressBar(tasks);
        
        // רינדור משימות קרובות
        if (upcomingList) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);

            const upcoming = tasks.filter(t => {
                if (!t.date) return false;
                const d = new Date(t.date);
                const status = String(t.status).trim();
                return d >= today && d <= nextWeek && status !== "הושלם";
            });

            upcomingList.innerHTML = upcoming.length ? upcoming.map(t => 
                `<li><b>${t.name}</b> - ${t.date}</li>`).join("") : "<li>אין משימות קרובות</li>";
        }
    }

    loadDashboardData();
    window.addEventListener("storage", loadDashboardData);
});