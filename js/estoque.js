document.addEventListener('DOMContentLoaded', function () {
    // =============================================
    // CÓDIGO DO MENU HAMBURGUER
    // =============================================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    // Abrir/fechar menu
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Fechar menu ao clicar no overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Fechar menu ao clicar em um link (em telas pequenas)
    const navLinks = document.querySelectorAll('.nav-item a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Fechar menu ao redimensionar a janela para tamanho maior
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // =============================================
    // CÓDIGO DO ESTOQUE
    // =============================================
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

    form.addEventListener('submit', async function (e) {
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
        const url = 'http://localhost:8082/api/estoque' + (item.id ? `/${item.id}` : '');

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });

            if (!response.ok) throw new Error('Erro ao salvar item');

            const data = await response.json();
            alert('Item salvo com sucesso!');
            form.reset();
            formItemEstoque.style.display = 'none';
            listaCard.style.display = 'block';
            carregarEstoque();
        } catch (err) {
            console.error('Erro:', err);
            alert('Erro ao salvar item no estoque.');
        }
    });

    function carregarEstoque() {
        fetch('http://localhost:8082/api/estoque')
            .then(res => res.json())
            .then(data => {
                renderizarItensEstoque(data);
            })
            .catch(err => {
                console.error('Erro ao buscar estoque:', err);
                estoqueTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #718096; padding: 40px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px; color: #cbd5e0;"></i>
                            <p>Erro ao carregar estoque.</p>
                        </td>
                    </tr>
                `;
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
            const stockBadgeClass = item.tipo === 'produto' && item.estoqueAtual <= item.estoqueMinimo ? 'stock-badge stock-low' : 'stock-badge';
            const stockDisplay = item.tipo === 'servico' ? 'N/A' : `<span class="${stockBadgeClass}">${item.estoqueAtual}</span>`;
            
            tr.innerHTML = `
                <td>${item.nome}</td>
                <td>${item.tipo}</td>
                <td>${item.categoria}</td>
                <td>${stockDisplay}</td>
                <td>R$ ${item.precoVenda.toFixed(2).replace('.', ',')}</td>
                <td>
                    <button class="btn-action edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    ${item.tipo === 'produto' ? `
                        <button class="btn-action add-stock-btn" data-id="${item.id}"><i class="fas fa-plus-square"></i></button>
                        <button class="btn-action remove-stock-btn" data-id="${item.id}"><i class="fas fa-minus-square"></i></button>
                    ` : ''}
                    <button class="btn-action delete-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            estoqueTableBody.appendChild(tr);
        });

        // Event listeners para os botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                fetch(`http://localhost:8082/api/estoque/${id}`)
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
                    })
                    .catch(err => {
                        console.error('Erro ao carregar item:', err);
                    });
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Tem certeza que deseja excluir este item?')) {
                    fetch(`http://localhost:8082/api/estoque/${id}`, {
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

        // Adicionar/remover estoque
        document.querySelectorAll('.add-stock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const quantidade = prompt('Quantidade a adicionar:');
                if (quantidade && !isNaN(quantidade)) {
                    alert(`Adicionando ${quantidade} unidades ao estoque...`);
                }
            });
        });

        document.querySelectorAll('.remove-stock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const quantidade = prompt('Quantidade a remover:');
                if (quantidade && !isNaN(quantidade)) {
                    alert(`Removendo ${quantidade} unidades do estoque...`);
                }
            });
        });
    }

    // =============================================
    // BOTÃO DE LOGOUT NO MENU - SIMPLES
    // =============================================
    const logoutBtn = document.querySelector('.logout-item a');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair do sistema?')) {
                window.location.href = '../index.html';
            }
        });
    }

    // Carregar estoque ao iniciar
    carregarEstoque();
});