AOS.init({ duration: 1000, once: true });

// רינדור משימות
function renderTasks() {
    const email = localStorage.getItem("loggedInUserEmail") || sessionStorage.getItem("loggedInUserEmail") || "guest";
    const tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];
    const container = document.getElementById("tasksContainer");
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
                <button type="button" class="status-btn" onclick="changeStatus(${index})">🔄 שנה סטטוס</button>
                <button type="button" class="delete-btn" onclick="deleteTask(${index})" style="background:rgba(255,0,0,0.3)">🗑️ מחק</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// שינוי סטטוס (עם עדכון צבע מידי)
function changeStatus(index) {
    const email = localStorage.getItem("loggedInUserEmail") || sessionStorage.getItem("loggedInUserEmail") || "guest";
    let tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];
    if (!tasks[index]) return;

    const states = ["פתוח", "בתהליך", "הושלם"];
    let currIndex = states.indexOf(tasks[index].status);
    if (currIndex === -1) currIndex = 0;

    tasks[index].status = states[(currIndex + 1) % states.length];
    localStorage.setItem(`tasks_${email}`, JSON.stringify(tasks));

    // עדכון אחוז משימות שהושלמו
    const completed = tasks.filter(t => t.status === "הושלם").length;
    const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    localStorage.setItem(`progress_${email}`, percent);

    // רינדור מחדש
    renderTasks();
}

// מחיקת משימה
function deleteTask(index) {
    if (!confirm("למחוק?")) return;
    const email = localStorage.getItem("loggedInUserEmail") || sessionStorage.getItem("loggedInUserEmail") || "guest";
    let tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];
    tasks.splice(index, 1);
    localStorage.setItem(`tasks_${email}`, JSON.stringify(tasks));
    renderTasks();
}

// הוספת משימה חדשה
document.addEventListener("DOMContentLoaded", () => {
    renderTasks();

    const form = document.getElementById("addTaskForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = localStorage.getItem("loggedInUserEmail") || sessionStorage.getItem("loggedInUserEmail") || "guest";
            let tasks = JSON.parse(localStorage.getItem(`tasks_${email}`)) || [];

            tasks.push({
                name: document.getElementById("taskName").value,
                course: document.getElementById("taskCourse").value,
                type: document.getElementById("taskType").value,
                status: document.getElementById("taskStatus") ? document.getElementById("taskStatus").value : "פתוח",
                date: document.getElementById("taskDate").value
            });

            localStorage.setItem(`tasks_${email}`, JSON.stringify(tasks));
            e.target.reset();
            renderTasks();
        });
    }
});
