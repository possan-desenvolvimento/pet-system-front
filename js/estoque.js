document.addEventListener('DOMContentLoaded', function () {
    const estoqueTableBody = document.getElementById('estoqueTableBody');
    const btnNovoItemEstoque = document.getElementById('btnNovoItemEstoque');
    const btnVoltarEstoqueLista = document.getElementById('btnVoltarEstoqueLista');
    const formItemEstoque = document.getElementById('formItemEstoque');
    const listaCard = document.querySelector('.section-content > .card');
    const form = document.querySelector('.item-stock-form');
    const itemIdInput = document.getElementById('itemId');

    btnNovoItemEstoque.addEventListener('click', () => {
        formItemEstoque.style.display = 'block';
        listaCard.style.display = 'none';
        form.reset();
        itemIdInput.value = '';
    });

    btnVoltarEstoqueLista.addEventListener('click', () => {
        formItemEstoque.style.display = 'none';
        listaCard.style.display = 'block';
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const item = {
            id: itemIdInput.value ? parseInt(itemIdInput.value) : null,
            nome: document.getElementById('itemName').value,
            descricao: document.getElementById('itemDescription').value,
            tipo: document.getElementById('itemType').value,
            categoria: document.getElementById('itemCategory').value,
            estoqueAtual: parseInt(document.getElementById('itemInitialStock').value),
            estoqueMinimo: parseInt(document.getElementById('itemMinStockAlert').value),
            precoCusto: parseFloat(document.getElementById('itemCostPrice').value),
            precoVenda: parseFloat(document.getElementById('itemSalePrice').value)
        };

        const method = item.id ? 'PUT' : 'POST';
        const url = 'http://localhost:8080/api/estoque' + (item.id ? `/${item.id}` : '');

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then(res => {
            if (!res.ok) throw new Error('Erro ao salvar item');
            return res.json();
        })
        .then(data => {
            alert('Item salvo com sucesso!');
            form.reset();
            formItemEstoque.style.display = 'none';
            listaCard.style.display = 'block';
            carregarEstoque();
        })
        .catch(err => {
            console.error('Erro:', err);
            alert('Erro ao salvar item no estoque.');
        });
    });

    function carregarEstoque() {
        fetch('http://localhost:8080/api/estoque')
            .then(res => res.json())
            .then(data => {
                renderizarItensEstoque(data);
            })
            .catch(err => {
                console.error('Erro ao buscar estoque:', err);
            });
    }

    function renderizarItensEstoque(itens) {
        estoqueTableBody.innerHTML = '';

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
                    <button class="btn-action edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    ${item.tipo === 'produto' ? `
                        <button class="btn-action add-stock-btn"><i class="fas fa-plus-square"></i></button>
                        <button class="btn-action remove-stock-btn"><i class="fas fa-minus-square"></i></button>
                    ` : ''}
                    <button class="btn-action delete-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            estoqueTableBody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                fetch(`http://localhost:8080/api/estoque/${id}`)
                    .then(res => res.json())
                    .then(item => {
                        itemIdInput.value = item.id;
                        document.getElementById('itemName').value = item.nome;
                        document.getElementById('itemDescription').value = item.descricao;
                        document.getElementById('itemType').value = item.tipo;
                        document.getElementById('itemCategory').value = item.categoria;
                        document.getElementById('itemInitialStock').value = item.estoqueAtual || 0;
                        document.getElementById('itemMinStockAlert').value = item.estoqueMinimo || 0;
                        document.getElementById('itemCostPrice').value = item.precoCusto || 0;
                        document.getElementById('itemSalePrice').value = item.precoVenda || 0;
                        formItemEstoque.style.display = 'block';
                        listaCard.style.display = 'none';
                    });
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Tem certeza que deseja excluir este item?')) {
                    fetch(`http://localhost:8080/api/estoque/${id}`, {
                        method: 'DELETE'
                    })
                    .then(() => {
                        alert('Item excluído com sucesso!');
                        carregarEstoque();
                    })
                    .catch(err => {
                        console.error('Erro ao excluir:', err);
                        alert('Erro ao excluir item.');
                    });
                }
            });
        });
    }

    carregarEstoque();
});
