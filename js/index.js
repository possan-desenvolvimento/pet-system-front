document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.login-form');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            console.log("Entrou no método para fazer login.");

            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const responseText = await response.text(); // <- mudou de .json() para .text()

            if (response.ok) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = `Login bem-sucedido: ${responseText}`;

                setTimeout(() => {
                    window.location.href = '../pages/dashboard.html';
                }, 1500);
            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = responseText || 'Usuário ou senha inválidos.';
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'Erro de conexão com o servidor.';
        }
    });
});
