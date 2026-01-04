const courseForm = document.getElementById("courseForm");
const courseNameInput = document.getElementById("courseName");
const courseList = document.getElementById("courseList");

// פונקציית עזר: מקבלת את האימייל של המשתמש המחובר
function getCurrentUserEmail() {
    return localStorage.getItem('loggedInUserEmail') || sessionStorage.getItem('loggedInUserEmail');
}

// פונקציה לשמירת הקורסים ב-Local Storage עבור המשתמש הנוכחי
function saveCourses(currentCourses) { // מקבלת את מערך הקורסים המעודכן
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) {
        console.warn("אין משתמש מחובר. לא ניתן לשמור קורסים.");
        alert("אנא התחבר/י כדי לשמור קורסים.");
        return;
    }
    // === שינוי חשוב כאן: שמירה למפתח ייחודי למשתמש ===
    localStorage.setItem(`courses_list_${currentUserEmail}`, JSON.stringify(currentCourses));
    window.dispatchEvent(new Event('storage')); // כדי לעדכן את הדאשבורד או טאבים אחרים
}

// פונקציה לרינדור הקורסים עבור המשתמש הנוכחי
function renderCourses() {
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) {
        courseList.innerHTML = "<li>אנא התחבר/י כדי לראות את הקורסים שלך.</li>";
        return;
    }

    // === שינוי חשוב כאן: טעינה מהמפתח הייחודי למשתמש ===
    let courses = JSON.parse(localStorage.getItem(`courses_list_${currentUserEmail}`)) || [];
    
    courseList.innerHTML = "";
    if (courses.length === 0) {
        const li = document.createElement("li");
        li.textContent = "אין קורסים זמינים. הוסף קורס חדש.";
        courseList.appendChild(li);
        return;
    }

    courses.forEach((course, index) => {
        const li = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = course.name;

        const editBtn = document.createElement("button");
        editBtn.textContent = "ערוך";
        editBtn.className = "edit-btn";
        editBtn.onclick = () => editCourse(index); // קורא ל-editCourse עם האינדקס

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "מחק";
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = () => deleteCourse(index); // קורא ל-deleteCourse עם האינדקס

        li.appendChild(nameSpan);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        courseList.appendChild(li);
    });
}

function editCourse(index) {
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) {
        alert("אנא התחבר/י כדי לערוך קורסים.");
        return;
    }
    // === שינוי חשוב כאן: טעינת הקורסים עבור המשתמש הספציפי ===
    let courses = JSON.parse(localStorage.getItem(`courses_list_${currentUserEmail}`)) || [];
    
    const newName = prompt("הכנס שם חדש לקורס:", courses[index].name);
    if (newName && newName.trim()) {
        courses[index].name = newName.trim();
        saveCourses(courses); // שמירת שינויים עם המערך המעודכן
        renderCourses();
    }
}

function deleteCourse(index) {
    const confirmDelete = confirm("האם אתה בטוח שברצונך למחוק את הקורס?");
    if (confirmDelete) {
        const currentUserEmail = getCurrentUserEmail();
        if (!currentUserEmail) {
            alert("אנא התחבר/י כדי למחוק קורסים.");
            return;
        }
        // === שינוי חשוב כאן: טעינת הקורסים עבור המשתמש הספציפי ===
        let courses = JSON.parse(localStorage.getItem(`courses_list_${currentUserEmail}`)) || [];
        
        courses.splice(index, 1);
        saveCourses(courses); // שמירת שינויים עם המערך המעודכן
        renderCourses();
    }
}

courseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = courseNameInput.value.trim();

    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) {
        alert("אנא התחבר/י כדי להוסיף קורסים.");
        return;
    }

    if (name) {
        // === שינוי חשוב כאן: טעינת הקורסים עבור המשתמש הספציפי לפני הוספה ===
        let courses = JSON.parse(localStorage.getItem(`courses_list_${currentUserEmail}`)) || [];
        courses.push({ name: name }); // שמירה כאובייקט עם שם
        courseNameInput.value = "";
        saveCourses(courses); // שמירת שינויים עם המערך המעודכן
        renderCourses();
    }
});

// הפעלה ראשונית של רינדור הקורסים בעת טעינת הדף
document.addEventListener("DOMContentLoaded", renderCourses);

// === הוספת אירוע האזנה ל-storage כדי להתעדכן משינויים מטאבים אחרים ===
window.addEventListener("storage", (event) => {
    const currentUserEmail = getCurrentUserEmail();
    if (currentUserEmail && event.key === `courses_list_${currentUserEmail}`) {
        console.log("Storage event detected for courses_list. Re-rendering courses.");
        renderCourses();
    }
});