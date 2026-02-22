document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('error-message');
    const loginBtn = document.getElementById('loginBtn');
    const spinner = loginBtn.querySelector('.spinner-border');

    // Reset UI
    errorDiv.classList.add('d-none');
    errorDiv.textContent = '';
    loginBtn.disabled = true;
    spinner.classList.remove('d-none');

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
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Store tokens
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);

            // Redirect to dashboard (create this file next)
            window.location.href = 'dashboard.html';
        } else {
            // Error
            throw new Error(data.detail || 'Identifiants incorrects');
        }

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    } finally {
        loginBtn.disabled = false;
        spinner.classList.add('d-none');
    }
});
