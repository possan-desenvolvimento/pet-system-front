document.addEventListener('DOMContentLoaded', () => {

    // Funções para buscar e processar dados de cada tela
    // -----------------------------------------------------------------------------------------
    
    // Função para buscar dados de clientes
    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/clientes');
            if (!response.ok) throw new Error('Erro ao buscar clientes');
            const clients = await response.json();
            document.querySelector('.widget:nth-child(1) .widget-value').textContent = clients.length;
        } catch (error) {
            console.error('Erro ao carregar o total de clientes:', error);
            // Manter valor estático em caso de erro
        }
    };

    // Função para buscar dados de agendamentos
    const fetchAppointments = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/agendamentos');
            if (!response.ok) throw new Error('Erro ao buscar agendamentos');
            const appointments = await response.json();
            
            const today = new Date().toISOString().slice(0, 10);
            const todayAppointments = appointments.filter(app => app.data === today);
            document.querySelector('.widget:nth-child(2) .widget-value').textContent = todayAppointments.length;

            // Dados para o gráfico de barras
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentAppointments = appointments.filter(app => new Date(app.data) >= sevenDaysAgo);

            const appointmentsByDay = recentAppointments.reduce((acc, app) => {
                const dayOfWeek = new Date(app.data).toLocaleDateString('pt-BR', { weekday: 'short' });
                acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
                return acc;
            }, {});

            const days = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
            const barData = days.map(day => appointmentsByDay[day] || 0);

            renderBarChart(days, barData);

        } catch (error) {
            console.error('Erro ao carregar dados de agendamentos:', error);
        }
    };

    // Função para buscar dados de estoque
    const fetchStock = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/estoque');
            if (!response.ok) throw new Error('Erro ao buscar estoque');
            const stockItems = await response.json();

            // Lógica para o widget de "Estoque Baixo"
            const lowStockItems = stockItems.filter(item => item.estoqueAtual < item.estoqueMinimo);
            document.querySelector('.widget:nth-child(3) .widget-value').textContent = `${lowStockItems.length} itens`;
        } catch (error) {
            console.error('Erro ao carregar o total de estoque baixo:', error);
        }
    };

    // Função para buscar dados de vendas
    const fetchSales = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/vendas');
            if (!response.ok) throw new Error('Erro ao buscar vendas');
            const sales = await response.json();

            // Total de Vendas do Mês para o widget
            const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
            const monthlySales = sales.filter(sale => sale.data.startsWith(currentMonth));
            const totalMonthlySales = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
            document.querySelector('.widget:nth-child(4) .widget-value').textContent = `R$ ${totalMonthlySales.toFixed(2).replace('.', ',')}`;

            // Vendas por Categoria para o Gráfico de Pizza
            const salesByCategory = monthlySales.reduce((acc, sale) => {
                sale.itens.forEach(item => {
                    const category = item.categoria || 'Serviços'; // Supondo que "Serviços" seja o padrão se não tiver categoria
                    acc[category] = (acc[category] || 0) + (item.quantidade * item.precoUnitario);
                });
                return acc;
            }, {});

            const pieLabels = Object.keys(salesByCategory);
            const pieData = Object.values(salesByCategory);
            renderPieChart(pieLabels, pieData);

        } catch (error) {
            console.error('Erro ao carregar dados de vendas:', error);
        }
    };
    // -----------------------------------------------------------------------------------------

    // Funções para renderizar gráficos
    const renderPieChart = (labels, data) => {
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCE']
                }]
            }
        });
    };

    const renderBarChart = (labels, data) => {
        const barCtx = document.getElementById('barChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Agendamentos',
                    data: data,
                    backgroundColor: '#36A2EB'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    };
    
    // Chamadas para carregar todos os dados ao iniciar a página
    fetchClients();
    fetchAppointments();
    fetchStock();
    fetchSales();
});