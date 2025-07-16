document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário

            const username = usernameInput.value;
            const password = passwordInput.value;

            // Limpa mensagens anteriores
            messageDiv.textContent = '';

            try {
                // Endpoint do seu backend para login
               //  const response = await fetch('http://localhost:8080/api/auth/login', {
               const response = await fetch('http://127.0.0.1:8080/api/auth/login', {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.text(); // Seu backend retorna texto para sucesso/falha
                    messageDiv.style.color = 'green';
                    messageDiv.textContent = data; // Ex: "Login successful! Welcome, ..."

                    // Redireciona para o dashboard após um pequeno atraso
                    setTimeout(() => {
                        window.location.href = '../pages/dashboard.html'; // Ajuste o caminho conforme sua estrutura
                    }, 1500); // Redireciona após 1.5 segundos
                } else {
                    const errorText = await response.text(); // Pega a mensagem de erro do backend
                    messageDiv.style.color = 'red';
                    messageDiv.textContent = errorText || 'Erro desconhecido ao fazer login.';
                }
            } catch (error) {
                console.error('Erro na requisição de login:', error);
                messageDiv.style.color = 'red';
                messageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
            }
        });
    }
}); 

