document.addEventListener('DOMContentLoaded', function () {
    const estoqueTableBody = document.getElementById('estoqueTableBody');
    const btnNovoItemEstoque = document.getElementById('btnNovoItemEstoque');
    const btnVoltarEstoqueLista = document.getElementById('btnVoltarEstoqueLista');
    const formItemEstoque = document.getElementById('formItemEstoque');
    const listaCard = document.querySelector('.section-content > .card');

    btnNovoItemEstoque.addEventListener('click', () => {
        formItemEstoque.style.display = 'block';
        listaCard.style.display = 'none';
    });

    btnVoltarEstoqueLista.addEventListener('click', () => {
        formItemEstoque.style.display = 'none';
        listaCard.style.display = 'block';
    });

    // Função para buscar itens do backend
    function carregarEstoque() {
        fetch('http://localhost:8080/api/estoque') // Substitua pela sua rota real
            .then(res => res.json())
            .then(data => {
                renderizarItensEstoque(data);
            })
            .catch(err => {
                console.error('Erro ao buscar estoque:', err);
            });
    }

    // Função para renderizar a tabela
    function renderizarItensEstoque(itens) {
        estoqueTableBody.innerHTML = ''; // Limpa

        if (!itens.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align: center;">Nenhum item cadastrado.</td>`;
            estoqueTableBody.appendChild(tr);
            return;
        }

        itens.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nome}</td>
                <td>${item.tipo}</td>
                <td>${item.categoria}</td>
                <td>${item.tipo === 'servico' ? 'N/A' : `<span class="stock-badge">${item.estoqueAtual}</span>`}</td>
                <td>R$ ${item.precoVenda.toFixed(2).replace('.', ',')}</td>
                <td>
                    <button class="btn-action edit-btn" title="Editar Item"><i class="fas fa-edit"></i></button>
                    ${item.tipo === 'produto' ? `
                        <button class="btn-action add-stock-btn" title="Adicionar Estoque"><i class="fas fa-plus-square"></i></button>
                        <button class="btn-action remove-stock-btn" title="Remover Estoque"><i class="fas fa-minus-square"></i></button>
                    ` : ''}
                    <button class="btn-action delete-btn" title="Excluir Item"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            estoqueTableBody.appendChild(tr);
        });
    }

    // Carrega os dados ao iniciar
    carregarEstoque();
});
