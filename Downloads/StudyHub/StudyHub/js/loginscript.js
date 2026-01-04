document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const togglePassword = document.getElementById('togglePassword');

    // ===== עין לסיסמה =====
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁' : '🙈';
        });
    }

   

    // ===== טעינת שדות אם סימנת "זכור אותי" =====
    const rememberedEmail = localStorage.getItem('loggedInUserEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
        // הסיסמה לא נשמרת מסיבות אבטחה
    }

    // ===== הודעה לאחר הרשמה מוצלחת =====
    if (localStorage.getItem('registeredSuccessfully')) {
        alert('ההרשמה הושלמה בהצלחה! אנא התחבר/י.');
        localStorage.removeItem('registeredSuccessfully');
    }

    // ===== טיפול בהתחברות =====
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const foundUser = users.find(user => user.email === email && user.password === password);

            if (foundUser) {
                if (rememberMe) {
                    localStorage.setItem('loggedInUserEmail', foundUser.email);
                    localStorage.setItem('loggedInUsername', foundUser.username);
                    // לא נשתמש ב-sessionStorage
                } else {
                    sessionStorage.setItem('loggedInUserEmail', foundUser.email);
                    sessionStorage.setItem('loggedInUsername', foundUser.username);
                    localStorage.removeItem('loggedInUserEmail');
                    localStorage.removeItem('loggedInUsername');
                }
                errorMsg.textContent = '';
                alert('התחברת בהצלחה! 👋');
                window.location.href = 'index.html';
            } else {
                errorMsg.textContent = 'כתובת אימייל או סיסמה שגויים.';
            }
        });
    }

    // ===== הפניה לדף "שכחתי סיסמה" =====
    const forgotPasswordLink = document.querySelector('a[href="forgot-password.html"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'forgot-password.html';
        });
    }

    // ===== הפניה לדף הרשמה =====
    const registerLink = document.querySelector('a[href="register.html"]');
    if (registerLink) {
        registerLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'register.html';
        });
    }
});
