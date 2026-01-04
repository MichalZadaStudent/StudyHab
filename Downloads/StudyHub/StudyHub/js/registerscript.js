document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const newUsernameInput = document.getElementById('newUsername');
            const newEmailInput = document.getElementById('newEmail');
            const newPasswordInput = document.getElementById('newPassword');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const registerErrorMsg = document.getElementById('registerErrorMsg');

            const newUsername = newUsernameInput.value.trim();
            const newEmail = newEmailInput.value.trim();
            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            if (newPassword !== confirmPassword) {
                registerErrorMsg.textContent = 'הסיסמאות אינן תואמות.';
                return;
            }

            // טעינת משתמשים קיימים או יצירת מערך ריק אם אין
            const users = JSON.parse(localStorage.getItem('users')) || [];

            // בדיקה אם משתמש עם אימייל זה כבר קיים
            const userExists = users.some(user => user.email === newEmail);
            if (userExists) {
                registerErrorMsg.textContent = 'משתמש עם אימייל זה כבר קיים.';
                return;
            }

            // הוספת המשתמש החדש למערך
            users.push({
                username: newUsername,
                email: newEmail,
                password: newPassword 
            });

            // שמירת מערך המשתמשים המעודכן ל-Local Storage
            localStorage.setItem('users', JSON.stringify(users));

            // דגל שמציין הרשמה מוצלחת
            localStorage.setItem('registeredSuccessfully', 'true');

            alert('ההרשמה בוצעה בהצלחה! ✅');
            console.log('שם משתמש:', newUsername);
            console.log('אימייל:', newEmail);

            // ניווט לדף ההתחברות
            window.location.href = 'login.html';
        });
    }
});