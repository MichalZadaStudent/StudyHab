// פונקציית עזר: מקבלת את האימייל של המשתמש המחובר
function getCurrentUserEmail() {
    return localStorage.getItem('loggedInUserEmail') || sessionStorage.getItem('loggedInUserEmail');
}

document.addEventListener('DOMContentLoaded', () => {

    // אלמנטים לדאשבורד
    const userDisplayName = document.getElementById('userDisplayName');
    const progressBar = document.querySelector(".progress-bar");
    const upcomingList = document.getElementById("upcomingTasks");
    const courseList = document.getElementById("activeCourses");

    // === רינדור התקדמות חודשית ===
    function renderProgressBar(tasks) {
        const currentMonth = new Date().getMonth(); // חודש נוכחי (0-11)
        const currentYear = new Date().getFullYear();

        const monthlyTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
        });

        const completed = monthlyTasks.filter(task => task.status === "הושלם");
        const percent = monthlyTasks.length > 0 ? Math.round((completed.length / monthlyTasks.length) * 100) : 0;

        if (progressBar) { 
            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";
        }
    }

    // === רינדור משימות קרובות ===
    function renderUpcomingTasks(tasks) {
        if (!upcomingList) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // מאפסים את השעה לחצות הלילה של היום הנוכחי

        const sevenDaysFromNow = new Date(today); // מתחילים מהיום "הנקי"
        sevenDaysFromNow.setDate(today.getDate() + 7); // מוסיפים 7 ימים

        const upcomingTasks = tasks.filter(task => {
            const dueDate = new Date(task.date); // תאריך המשימה
            dueDate.setHours(0, 0, 0, 0); // מאפסים את השעה בתאריך המשימה גם כן

            return dueDate >= today && dueDate <= sevenDaysFromNow && task.status !== "הושלם";
        });

        if (upcomingTasks.length > 0) {
            upcomingList.innerHTML = upcomingTasks.map(task =>
                `<li><strong>${task.name}</strong> - ${task.course} (עד ${task.date})</li>`
            ).join("");
        } else {
            upcomingList.innerHTML = "<li>אין משימות קרובות ב-7 ימים הקרובים 😊</li>";
        }
    }

    // === רינדור קורסים פעילים ===
    // הפונקציה מקבלת כעת את מערך הקורסים כפרמטר
    function renderActiveCourses(courses) { 
        if (!courseList) return;

        if (courses.length > 0) {
            courseList.innerHTML = courses.map(c => `<li>${c.name}</li>`).join("");
        } else {
            courseList.innerHTML = "<li>אין קורסים פעילים. הוסף קורסים בדף הקורסים.</li>";
        }
    }

    // === טוען את כל התוכן בדשבורד ===
    function loadDashboardData() {
        const currentUserEmail = getCurrentUserEmail();
        // בדיקה אם יש משתמש מחובר
        if (!currentUserEmail) {
            // אם אין משתמש מחובר, מנקה את הדאשבורד ומציג הודעות מתאימות
            if (progressBar) progressBar.style.width = "0%";
            if (progressBar) progressBar.textContent = "0%";
            if (upcomingList) upcomingList.innerHTML = "<li>אנא התחבר/י כדי לראות את המשימות שלך.</li>";
            if (courseList) courseList.innerHTML = "<li>אנא התחבר/י כדי לראות את הקורסים שלך.</li>";
            if (userDisplayName) userDisplayName.textContent = 'אורח';
            // : הפניה לדף התחברות אם אין משתמש מחובר
             window.location.href = 'login.html'; 
            return; // עוצר את הפונקציה אם אין משתמש מחובר
        }

        // טוענים משימות וקורסים לפי האימייל של המשתמש
        const tasks = JSON.parse(localStorage.getItem(`tasks_${currentUserEmail}`)) || [];
        const courses = JSON.parse(localStorage.getItem(`courses_list_${currentUserEmail}`)) || []; 

        renderProgressBar(tasks);
        renderUpcomingTasks(tasks);
        renderActiveCourses(courses); // העבר את מערך הקורסים לפונקציה

        // הצגת שם המשתמש
        if (userDisplayName) {
            let username = localStorage.getItem('loggedInUsername');
            if (!username) {
                username = sessionStorage.getItem('loggedInUsername');
            }
            console.log("Loaded username for display:", username); // לוג לבדיקה - האם שם המשתמש נטען?

            if (username) {
                userDisplayName.textContent = username;
            } else {
                userDisplayName.textContent = 'אורח';
            }
        }
        console.log("Tasks loaded for user", currentUserEmail, ":", tasks); 
        console.log("Courses loaded for user", currentUserEmail, ":", courses);
        // === לוג נוסף לבדיקה: האם הקורסים נטענו כראוי? ===
        console.log("Courses loaded for user (from courses_list):", currentUserEmail, ":", courses);
    }

    // === טעינה ראשונית ===
    loadDashboardData();

    // === עדכון מהיר כאשר localStorage או sessionStorage משתנה בטאב אחר ===
    window.addEventListener("storage", (event) => {
        const currentUserEmail = getCurrentUserEmail();
        // === שינוי כאן: ודא שאתה בודק גם את המפתח הנכון של הקורסים ===
        if (currentUserEmail && (event.key === `tasks_${currentUserEmail}` || event.key === `courses_list_${currentUserEmail}` || event.key === "loggedInUsername")) {
            loadDashboardData();
        } else if (!currentUserEmail && (event.key === 'loggedInUserEmail' || event.key === 'loggedInUsername')) {
            // מקרה שמשתמש התחבר מטאב אחר (היה לא מחובר קודם)
            loadDashboardData();
        }
    });
});