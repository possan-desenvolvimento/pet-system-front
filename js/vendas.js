document.addEventListener('DOMContentLoaded', () => {
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
    // CÓDIGO DAS VENDAS
    // =============================================
    // Referências aos elementos do DOM
    const saleItemsBody = document.getElementById('saleItemsBody');
    const subtotalSpan = document.getElementById('subtotal');
    const totalValueSpan = document.getElementById('totalValue');
    const discountInput = document.getElementById('discount');
    const receivedAmountInput = document.getElementById('receivedAmount');
    const changeValueSpan = document.getElementById('changeValue');
    const saleForm = document.querySelector('.sale-form');
    const selectedClient = document.getElementById('selectedClient');

    // Referências aos novos campos de entrada manual
    const manualItemName = document.getElementById('manualItemName');
    const manualItemQty = document.getElementById('manualItemQty');
    const manualItemPrice = document.getElementById('manualItemPrice');
    const addItemButton = document.getElementById('addItemButton');

    // Referências para o histórico de vendas
    const historyDateFilter = document.getElementById('historyDateFilter');
    const historyClientFilter = document.getElementById('historyClientFilter');
    const historySearchButton = document.querySelector('.sales-history-section .btn-secondary');
    const historyTableBody = document.querySelector('.sales-history-section tbody');

    let saleItems = [];
    let currentSaleId = 1; // ID de exemplo para a venda

    // =============================================
    // FUNÇÕES PARA CARREGAR ITENS DO ESTOQUE
    // =============================================

    // Função para carregar itens do estoque no select
    const carregarItensEstoque = async () => {
        try {
            const response = await fetch('http://localhost:8082/api/estoque');
            if (!response.ok) {
                throw new Error('Erro ao buscar itens do estoque');
            }
            const itens = await response.json();
            
            manualItemName.innerHTML = '<option value="">Selecione um item...</option>';
            
            itens.forEach(item => {
                // Filtrar apenas produtos (não serviços) que tenham estoque
                if (item.tipo === 'produto' && item.estoqueAtual > 0) {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = item.nome; // ✅ APENAS O NOME
                    option.setAttribute('data-preco', item.precoVenda);
                    option.setAttribute('data-estoque', item.estoqueAtual);
                    manualItemName.appendChild(option);
                }
            });

            if (manualItemName.options.length === 1) {
                manualItemName.innerHTML = '<option value="">Nenhum item disponível em estoque</option>';
            }
        } catch (error) {
            console.error('Erro ao carregar itens do estoque:', error);
            manualItemName.innerHTML = '<option value="">Erro ao carregar itens</option>';
        }
    };

    // Atualizar preço automaticamente quando selecionar um item
    manualItemName.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            const preco = selectedOption.getAttribute('data-preco');
            const estoque = parseInt(selectedOption.getAttribute('data-estoque'));
            
            manualItemPrice.value = preco;
            manualItemQty.max = estoque; // Define a quantidade máxima como o estoque disponível
            
            if (parseInt(manualItemQty.value) > estoque) {
                manualItemQty.value = estoque;
            }
        }
    });

    // Função para buscar clientes (opcional) e popular o select
    const fetchClients = async () => {
        try {
            // URL da sua API de clientes
            const url = 'http://localhost:8082/api/clientes';
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Erro ao buscar clientes: ' + response.statusText);
            }
            const clients = await response.json();
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.nome;
                selectedClient.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar a lista de clientes:', error);
        }
    };

    // =============================================
    // FUNÇÕES PARA O HISTÓRICO DE VENDAS
    // =============================================

    // Função para carregar o histórico de vendas
    const carregarHistoricoVendas = async (filtroData = '', filtroCliente = '') => {
        try {
            let url = 'http://localhost:8082/api/vendas';
            
            // Adicionar filtros se existirem
            const params = new URLSearchParams();
            if (filtroData) params.append('data', filtroData);
            if (filtroCliente) params.append('cliente', filtroCliente);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Erro ao buscar histórico de vendas');
            }
            const vendas = await response.json();
            
            renderizarHistoricoVendas(vendas);
        } catch (error) {
            console.error('Erro ao carregar histórico de vendas:', error);
            historyTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Erro ao carregar vendas</td></tr>';
        }
    };

    // Função para renderizar o histórico de vendas na tabela
    const renderizarHistoricoVendas = (vendas) => {
        historyTableBody.innerHTML = '';

        if (!vendas || vendas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6" style="text-align: center;">Nenhuma venda encontrada</td>';
            historyTableBody.appendChild(tr);
            return;
        }

        vendas.forEach(venda => {
            const tr = document.createElement('tr');
            
            // Formatar data para exibição
            const dataFormatada = new Date(venda.data).toLocaleDateString('pt-BR');
            
            // Formatar valor para exibição
            const totalFormatado = `R$ ${venda.total.toFixed(2).replace('.', ',')}`;
            
            // Determinar status (simplificado - você pode ajustar conforme sua lógica)
            const status = venda.status || 'Concluída';
            const statusClass = status === 'Concluída' ? 'status-completed' : 'status-pending';
            
            tr.innerHTML = `
                <td>#${venda.id}</td>
                <td>${dataFormatada}</td>
                <td>${venda.cliente || 'Consumidor Final'}</td>
                <td>${totalFormatado}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn-action view-sale-btn" data-id="${venda.id}" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action delete-sale-btn" data-id="${venda.id}" title="Excluir venda">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });

        // Adicionar event listeners para os botões de ação
        document.querySelectorAll('.view-sale-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const vendaId = this.getAttribute('data-id');
                verDetalhesVenda(vendaId);
            });
        });

        document.querySelectorAll('.delete-sale-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const vendaId = this.getAttribute('data-id');
                excluirVenda(vendaId);
            });
        });
    };

    // Função para ver detalhes da venda
    const verDetalhesVenda = async (vendaId) => {
        try {
            const response = await fetch(`http://localhost:8082/api/vendas/${vendaId}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar detalhes da venda');
            }
            const venda = await response.json();
            
            // Criar modal ou alerta com os detalhes
            let detalhes = `Venda #${venda.id}\n`;
            detalhes += `Data: ${new Date(venda.data).toLocaleDateString('pt-BR')}\n`;
            detalhes += `Cliente: ${venda.cliente || 'Consumidor Final'}\n`;
            detalhes += `Forma de Pagamento: ${venda.formaPagamento}\n`;
            detalhes += `Total: R$ ${venda.total.toFixed(2).replace('.', ',')}\n\n`;
            detalhes += 'Itens:\n';
            
            if (venda.itens && venda.itens.length > 0) {
                venda.itens.forEach(item => {
                    detalhes += `- ${item.produto || item.nome}: ${item.quantidade} x R$ ${item.precoUnitario.toFixed(2)} = R$ ${(item.quantidade * item.precoUnitario).toFixed(2)}\n`;
                });
            }
            
            alert(detalhes);
        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            alert('Erro ao carregar detalhes da venda');
        }
    };

    // Função para excluir venda
    const excluirVenda = async (vendaId) => {
        if (!confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8082/api/vendas/${vendaId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir venda');
            }

            alert('Venda excluída com sucesso!');
            // Recarregar o histórico
            carregarHistoricoVendas(historyDateFilter.value, historyClientFilter.value);
        } catch (error) {
            console.error('Erro ao excluir venda:', error);
            alert('Erro ao excluir venda');
        }
    };

    // Evento para buscar vendas com filtros
    historySearchButton.addEventListener('click', () => {
        carregarHistoricoVendas(historyDateFilter.value, historyClientFilter.value);
    });

    // Evento para buscar ao pressionar Enter no filtro de cliente
    historyClientFilter.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            carregarHistoricoVendas(historyDateFilter.value, historyClientFilter.value);
        }
    });

    // =============================================
    // FUNÇÕES DA VENDA ATUAL
    // =============================================

    // Função para atualizar o resumo da venda (subtotal, total, troco)
    const updateSummary = () => {
        let subtotal = 0;
        saleItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        let total = subtotal;
        let discount = 0;
        const discountValue = discountInput.value;

        if (discountValue.includes('%')) {
            const percentage = parseFloat(discountValue) / 100;
            if (!isNaN(percentage)) {
                discount = subtotal * percentage;
            }
        } else {
            const amount = parseFloat(discountValue);
            if (!isNaN(amount)) {
                discount = amount;
            }
        }

        total -= discount;

        subtotalSpan.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        totalValueSpan.textContent = `R$ ${Math.max(0, total).toFixed(2).replace('.', ',')}`;

        const receivedAmount = parseFloat(receivedAmountInput.value) || 0;
        const change = receivedAmount - total;
        changeValueSpan.textContent = `R$ ${Math.max(0, change).toFixed(2).replace('.', ',')}`;
    };

    // Função para renderizar os itens na tabela
    const renderSaleItems = () => {
        saleItemsBody.innerHTML = '';
        saleItems.forEach((item, index) => {
            const total = item.price * item.quantity;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
                <td>R$ ${total.toFixed(2).replace('.', ',')}</td>
                <td>
                    <button type="button" class="btn-icon btn-remove" data-index="${index}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            saleItemsBody.appendChild(row);
        });
        updateSummary();
    };

    // Função para adicionar um novo item manualmente (AGORA COM ITENS DO ESTOQUE)
    const addManualItem = () => {
        const selectedOption = manualItemName.options[manualItemName.selectedIndex];
        const itemId = manualItemName.value;
        const itemNome = selectedOption.textContent; // ✅ AGORA PEGA DIRETO DO TEXTO
        const quantity = parseInt(manualItemQty.value);
        const price = parseFloat(manualItemPrice.value);
        const estoqueAtual = parseInt(selectedOption.getAttribute('data-estoque'));

        if (!itemId) {
            alert('Por favor, selecione um item.');
            return;
        }

        if (!quantity || quantity <= 0) {
            alert('Por favor, informe uma quantidade válida.');
            return;
        }

        if (quantity > estoqueAtual) {
            alert(`Estoque insuficiente! Disponível: ${estoqueAtual}`);
            return;
        }

        // Verificar se o item já está na venda
        const itemExistente = saleItems.find(item => item.itemEstoqueId === parseInt(itemId));
        if (itemExistente) {
            if (itemExistente.quantity + quantity > estoqueAtual) {
                alert(`Estoque insuficiente para adicionar mais unidades! Disponível: ${estoqueAtual}`);
                return;
            }
            itemExistente.quantity += quantity;
        } else {
            saleItems.push({
                itemEstoqueId: parseInt(itemId),
                name: itemNome,
                quantity: quantity,
                price: price
            });
        }

        renderSaleItems();
        manualItemName.value = '';
        manualItemQty.value = '1';
        manualItemPrice.value = '0.00';
    };

    // Evento para adicionar item quando o botão é clicado
    addItemButton.addEventListener('click', addManualItem);

    // Evento para remover um item da lista
    saleItemsBody.addEventListener('click', (event) => {
        if (event.target.closest('.btn-remove')) {
            const button = event.target.closest('.btn-remove');
            const index = button.dataset.index;
            saleItems.splice(index, 1);
            renderSaleItems();
        }
    });

    // Eventos para atualizar o resumo ao mudar o desconto ou valor recebido
    discountInput.addEventListener('input', updateSummary);
    receivedAmountInput.addEventListener('input', updateSummary);

    // =============================================
    // FUNÇÃO PARA ATUALIZAR ESTOQUE APÓS VENDA
    // =============================================

    const atualizarEstoqueAposVenda = async (itensVenda) => {
        const promises = itensVenda.map(async (item) => {
            try {
                // Buscar item atual do estoque
                const response = await fetch(`http://localhost:8082/api/estoque/${item.itemEstoqueId}`);
                if (!response.ok) throw new Error('Erro ao buscar item do estoque');
                
                const itemEstoque = await response.json();
                
                // Calcular novo estoque
                const novoEstoque = itemEstoque.estoqueAtual - item.quantity;
                
                // Atualizar o item no estoque
                const updateResponse = await fetch(`http://localhost:8082/api/estoque/${item.itemEstoqueId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...itemEstoque,
                        estoqueAtual: novoEstoque
                    })
                });
                
                if (!updateResponse.ok) throw new Error('Erro ao atualizar estoque');
                
                return await updateResponse.json();
            } catch (error) {
                console.error(`Erro ao atualizar estoque do item ${item.name}:`, error);
                throw error;
            }
        });
        
        return Promise.all(promises);
    };

    // NOVA FUNÇÃO: Criar transação financeira automaticamente
    const criarTransacaoFinanceira = async (vendaData) => {
        try {
            const transacaoFinanceira = {
                tipo: 'receita',
                categoria: 'Vendas',
                descricao: `Venda #${vendaData.id || 'NOVA'} - ${vendaData.cliente}`,
                valor: vendaData.total,
                data: new Date().toISOString().slice(0, 10), // Data atual
                status: 'recebido', // Como é uma venda, consideramos como recebido
                formaPagamento: vendaData.formaPagamento.toLowerCase()
            };

            const response = await fetch('http://localhost:8082/api/financeiro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transacaoFinanceira)
            });

            if (!response.ok) {
                throw new Error('Erro ao criar transação financeira');
            }

            console.log('Transação financeira criada com sucesso!');
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar transação financeira:', error);
        }
    };

    // Evento de envio do formulário de venda
    saleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (saleItems.length === 0) {
            alert('Por favor, adicione pelo menos um item à venda.');
            return;
        }

        const totalValue = parseFloat(totalValueSpan.textContent.replace('R$ ', '').replace(',', '.'));
        const paymentMethod = document.getElementById('paymentMethod').value;
        const selectedClientValue = selectedClient.options[selectedClient.selectedIndex].text === 'Consumidor Final' ? 'Consumidor Final' : selectedClient.options[selectedClient.selectedIndex].text;

        if (paymentMethod === '') {
            alert('Por favor, selecione uma forma de pagamento.');
            return;
        }

        // Mapear os itens da venda para o formato esperado pelo back-end
        const itemsPayload = saleItems.map(item => ({
            produto: item.name,
            quantidade: item.quantity,
            precoUnitario: item.price,
            itemEstoqueId: item.itemEstoqueId // Incluir o ID do estoque
        }));

        const newSale = {
            cliente: selectedClientValue,
            data: new Date().toISOString().slice(0, 10), // Formato YYYY-MM-DD
            itens: itemsPayload,
            total: totalValue,
            formaPagamento: paymentMethod.replace('_', ' ')
        };

        try {
            // 1. Salvar a venda
            const url = 'http://localhost:8082/api/vendas';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSale)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao finalizar a venda: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Venda finalizada:', data);
            
            // 2. 🆕 ATUALIZAR ESTOQUE
            await atualizarEstoqueAposVenda(saleItems);
            console.log('Estoque atualizado com sucesso!');
            
            // 3. Criar transação financeira
            await criarTransacaoFinanceira({
                ...newSale,
                id: data.id || currentSaleId
            });
            
            alert('Venda finalizada com sucesso! Estoque atualizado e saldo financeiro registrado.');
            
            // Limpa o formulário para uma nova venda
            saleItems = [];
            renderSaleItems();
            receivedAmountInput.value = '0.00';
            discountInput.value = '';
            manualItemName.value = '';
            manualItemQty.value = '1';
            manualItemPrice.value = '0.00';

            // Recarregar itens do estoque para refletir as mudanças
            await carregarItensEstoque();
            
            // Recarregar histórico de vendas para mostrar a nova venda
            await carregarHistoricoVendas();
            
            // Incrementa o ID da venda (se não estiver usando ID do backend)
            currentSaleId++;
            
        } catch (error) {
            console.error('Erro ao finalizar a venda:', error);
            alert('Erro ao finalizar a venda. Verifique o console para mais detalhes.');
        }
    });

    // Botão cancelar venda
    document.querySelector('.cancel-btn').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja cancelar esta venda?')) {
            saleItems = [];
            renderSaleItems();
            receivedAmountInput.value = '0.00';
            discountInput.value = '';
            manualItemName.value = '';
            manualItemQty.value = '1';
            manualItemPrice.value = '0.00';
            alert('Venda cancelada!');
        }
    });

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

    // =============================================
    // INICIALIZAÇÃO
    // =============================================
    
    // Chamada inicial para carregar os clientes
    fetchClients();
    
    // Chamada inicial para carregar os itens do estoque
    carregarItensEstoque();
    
    // Chamada inicial para carregar o histórico de vendas
    carregarHistoricoVendas();
});