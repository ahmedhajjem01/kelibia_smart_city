document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberPasswordCheck');
    const errorDiv = document.getElementById('error-message');
    const loginBtn = document.getElementById('loginBtn');
    
    // Check for saved credentials
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');

    if (savedEmail && savedPassword) {
        if (emailInput) emailInput.value = savedEmail;
        if (passwordInput) passwordInput.value = savedPassword;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const spinner = loginBtn.querySelector('.spinner-border');

        // Reset UI
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';
        loginBtn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');

        const credentials = {
            email: emailInput.value,
            password: passwordInput.value
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                // Success: Store tokens
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);

                // Handle "Se souvenir de moi"
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', emailInput.value);
                    localStorage.setItem('rememberedPassword', passwordInput.value);
                } else {
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('rememberedPassword');
                }

                // Role-based Redirection
                if (data.is_staff || data.is_superuser) {
                    // Admin users go to the Django Admin interface
                    window.location.href = 'http://127.0.0.1:8000/admin/';
                } else if (data.user_type === 'agent') {
                    // Municipal agents go to their specialized dashboard
                    window.location.href = 'agent_dashboard.html';
                } else {
                    // Regular citizens go to the main dashboard
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Error
                throw new Error(data.detail || 'Identifiants incorrects');
            }

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        } finally {
            loginBtn.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    });
});
