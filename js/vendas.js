document.addEventListener('DOMContentLoaded', () => {
    const saleItemsBody = document.getElementById('saleItemsBody');
    const subtotalSpan = document.getElementById('subtotal');
    const totalValueSpan = document.getElementById('totalValue');
    const discountInput = document.getElementById('discount');
    const machineFeeInput = document.getElementById('machineFee'); // Novo input para a taxa
    const receivedAmountInput = document.getElementById('receivedAmount');
    const changeValueSpan = document.getElementById('changeValue');
    const saleForm = document.querySelector('.sale-form');
    const selectedClient = document.getElementById('selectedClient');

    const manualItemName = document.getElementById('manualItemName');
    const manualItemQty = document.getElementById('manualItemQty');
    const manualItemPrice = document.getElementById('manualItemPrice');
    const addItemButton = document.getElementById('addItemButton');

    let saleItems = [];
    let currentSaleId = 1;

    const fetchClients = async () => {
        try {
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

    fetchClients();

    const updateSummary = () => {
        let subtotal = 0;
        saleItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        let total = subtotal;

        // Calcula e aplica o desconto
        const discountValue = discountInput.value;
        if (discountValue.includes('%')) {
            const percentage = parseFloat(discountValue) / 100;
            if (!isNaN(percentage)) {
                total -= subtotal * percentage;
            }
        } else {
            const amount = parseFloat(discountValue);
            if (!isNaN(amount)) {
                total -= amount;
            }
        }

        // Calcula e aplica a taxa da maquininha
        const machineFeeValue = parseFloat(machineFeeInput.value) / 100;
        if (!isNaN(machineFeeValue) && machineFeeValue > 0) {
            total -= total * machineFeeValue;
        }

        subtotalSpan.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        totalValueSpan.textContent = `R$ ${Math.max(0, total).toFixed(2).replace('.', ',')}`;

        const receivedAmount = parseFloat(receivedAmountInput.value) || 0;
        const change = receivedAmount - total;
        changeValueSpan.textContent = `R$ ${Math.max(0, change).toFixed(2).replace('.', ',')}`;
    };

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

    addItemButton.addEventListener('click', addManualItem);

    saleItemsBody.addEventListener('click', (event) => {
        if (event.target.closest('.btn-remove')) {
            const button = event.target.closest('.btn-remove');
            const index = button.dataset.index;
            saleItems.splice(index, 1);
            renderSaleItems();
        }
    });

    discountInput.addEventListener('input', updateSummary);
    machineFeeInput.addEventListener('input', updateSummary);
    receivedAmountInput.addEventListener('input', updateSummary);

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

        const itemsPayload = saleItems.map(item => ({
            produto: item.name,
            quantidade: item.quantity,
            precoUnitario: item.price
        }));

        const newSale = {
            cliente: selectedClientValue,
            data: new Date().toISOString().slice(0, 10),
            itens: itemsPayload,
            total: totalValue,
            formaPagamento: paymentMethod.replace('_', ' ')
        };

        try {
            const url = 'http://localhost:8080/api/vendas';
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSale)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao finalizar a venda: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Venda finalizada:', data);

            const financeiroPayload = {
                tipo: "receita",
                categoria: "Vendas",
                descricao: `Venda para ${selectedClientValue}`,
                valor: totalValue,
                data: new Date().toISOString().slice(0, 10),
                status: "Recebido",
                formaPagamento: paymentMethod.replace('_', ' ')
            };

            const financeiroUrl = 'http://localhost:8080/api/financeiro';
            const financeiroResponse = await fetch(financeiroUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(financeiroPayload)
            });

            if (!financeiroResponse.ok) {
                console.error("Erro ao registrar a receita no financeiro:", await financeiroResponse.text());
                alert("Venda finalizada, mas houve um erro ao registrar a receita no financeiro.");
            } else {
                alert('Venda e receita registradas com sucesso!');

                // Dispara o evento de sincronização para outras abas
                localStorage.setItem('financeiroUpdated', Date.now());

                // Chama a função global para atualizar a tela de finanças
                if (typeof window.carregarTransacoesFinanceiro === 'function') {
                    window.carregarTransacoesFinanceiro();
                }
            }

            saleItems = [];
            renderSaleItems();
            receivedAmountInput.value = '0.00';
            discountInput.value = '';
            manualItemName.value = '';
            manualItemQty.value = '1';
            manualItemPrice.value = '0.00';

        } catch (error) {
            console.error('Erro ao finalizar a venda:', error);
            alert('Erro ao finalizar a venda. Verifique o console para mais detalhes.');
        }
    });
});