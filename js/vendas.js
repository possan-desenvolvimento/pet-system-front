document.addEventListener('DOMContentLoaded', () => {
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

    let saleItems = [];
    let currentSaleId = 1; // ID de exemplo para a venda

    // Função para buscar clientes (opcional) e popular o select
    const fetchClients = async () => {
        try {
            // URL da sua API de clientes
            const url = 'http://localhost:8080/api/clientes';
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
    
    // Chamada inicial para carregar os clientes
    fetchClients();

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

    // Função para adicionar um novo item manualmente
    const addManualItem = () => {
        const name = manualItemName.value.trim();
        const quantity = parseInt(manualItemQty.value);
        const price = parseFloat(manualItemPrice.value);

        if (name && !isNaN(quantity) && quantity > 0 && !isNaN(price) && price >= 0) {
            saleItems.push({
                name: name,
                quantity: quantity,
                price: price
            });
            renderSaleItems();
            manualItemName.value = '';
            manualItemQty.value = '1';
            manualItemPrice.value = '0.00';
        } else {
            alert('Por favor, preencha todos os campos do item corretamente.');
        }
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
            precoUnitario: item.price
        }));

        const newSale = {
            cliente: selectedClientValue,
            data: new Date().toISOString().slice(0, 10), // Formato YYYY-MM-DD
            itens: itemsPayload,
            total: totalValue,
            formaPagamento: paymentMethod.replace('_', ' ')
        };

        try {
            const url = 'http://localhost:8080/api/vendas';
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
            alert('Venda finalizada com sucesso!');
            
            // Limpa o formulário para uma nova venda
            saleItems = [];
            renderSaleItems();
            receivedAmountInput.value = '0.00';
            discountInput.value = '';
            manualItemName.value = '';
            manualItemQty.value = '1';
            manualItemPrice.value = '0.00';

            // Opcional: Recarregar a tabela de histórico de vendas
            // Para isso, você precisaria de uma função para buscar o histórico de vendas do back-end
            // e renderizá-lo na tabela.
            
        } catch (error) {
            console.error('Erro ao finalizar a venda:', error);
            alert('Erro ao finalizar a venda. Verifique o console para mais detalhes.');
        }
    });
});