document.addEventListener('DOMContentLoaded', () => {
    const formCliente = document.getElementById('formCliente');
    const btnNovoCliente = document.getElementById('btnNovoCliente');
    const btnVoltarLista = document.getElementById('btnVoltarLista');
    const form = document.querySelector('.client-form');
    const tabelaBody = document.querySelector('.data-table tbody');
    const clienteIdInput = document.getElementById('clienteId');

    let editando = false;

    btnNovoCliente.addEventListener('click', () => {
        form.reset();
        editando = false;
        clienteIdInput.value = '';
        document.querySelector('.card:first-child').style.display = 'none';
        formCliente.style.display = 'block';
    });

    btnVoltarLista.addEventListener('click', () => {
        form.reset();
        editando = false;
        clienteIdInput.value = '';
        document.querySelector('.card:first-child').style.display = 'block';
        formCliente.style.display = 'none';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const clienteId = clienteIdInput.value;
        const method = editando ? 'PUT' : 'POST';
        const url = editando
            ? `http://localhost:8080/api/clientes/${clienteId}`
            : `http://localhost:8080/api/clientes`;

        const clientData = {
            nome: document.getElementById('clientNome').value,
            email: document.getElementById('clientEmail').value,
            telefone: document.getElementById('clientTelefone').value,
            endereco: document.getElementById('clientEndereco').value,
            pets: [] // você pode adicionar depois
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            if (response.ok) {
                alert(editando ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
                form.reset();
                clienteIdInput.value = '';
                formCliente.style.display = 'none';
                document.querySelector('.card:first-child').style.display = 'block';
                carregarClientes();
                editando = false;
            } else {
                const error = await response.text();
                alert('Erro: ' + error);
            }
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            alert('Erro na requisição.');
        }
    });

    async function carregarClientes() {
        try {
            const response = await fetch('http://localhost:8080/api/clientes');
            if (response.ok) {
                const clientes = await response.json();
                tabelaBody.innerHTML = '';

                clientes.forEach(cliente => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${cliente.nome}</td>
                        <td>${cliente.email}</td>
                        <td>${cliente.telefone}</td>
                        <td>${cliente.pets ? cliente.pets.join(', ') : ''}</td>
                        <td>
                            <button class="btn-editar" data-id="${cliente.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-excluir" data-id="${cliente.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tabelaBody.appendChild(tr);
                });

                // 🎯 Adiciona os eventos aos botões
                document.querySelectorAll('.btn-editar').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        const cliente = await buscarCliente(id);
                        preencherFormulario(cliente);
                    });
                });

                document.querySelectorAll('.btn-excluir').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        const confirmado = confirm('Tem certeza que deseja excluir este cliente?');
                        if (confirmado) {
                            await excluirCliente(id);
                            carregarClientes();
                        }
                    });
                });

            } else {
                alert('Erro ao buscar clientes');
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    async function buscarCliente(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/clientes/${id}`);
            if (response.ok) {
                return await response.json();
            } else {
                alert('Erro ao buscar cliente');
            }
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
        }
    }

    function preencherFormulario(cliente) {
        document.getElementById('clientNome').value = cliente.nome;
        document.getElementById('clientEmail').value = cliente.email;
        document.getElementById('clientTelefone').value = cliente.telefone;
        document.getElementById('clientEndereco').value = cliente.endereco;
        clienteIdInput.value = cliente.id;
        editando = true;

        document.querySelector('.card:first-child').style.display = 'none';
        formCliente.style.display = 'block';
    }

    async function excluirCliente(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/clientes/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Cliente excluído com sucesso!');
            } else {
                alert('Erro ao excluir cliente');
            }
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
        }
    }

    // Inicializa carregamento
    carregarClientes();
});
