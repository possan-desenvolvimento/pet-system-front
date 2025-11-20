document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // CÓDIGO DO MENU HAMBURGUER
    // =============================================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar) {
        // Abrir/fechar menu
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active');
            }
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        });
        
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
                    if (overlay) {
                        overlay.classList.remove('active');
                    }
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Fechar menu ao redimensionar a janela para tamanho maior
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                if (overlay) {
                    overlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            }
        });
    }

    // =============================================
    // CÓDIGO DO DASHBOARD
    // =============================================

    // Funções para buscar e processar dados de cada tela
    // -----------------------------------------------------------------------------------------
    
    // Função para buscar dados de clientes
    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:8082/api/clientes');
            if (!response.ok) throw new Error('Erro ao buscar clientes');
            const clients = await response.json();
            const widget = document.querySelector('.widget:nth-child(1) .widget-value');
            if (widget) {
                widget.textContent = clients.length;
            }
        } catch (error) {
            console.error('Erro ao carregar o total de clientes:', error);
        }
    };

    // Função para buscar dados de agendamentos
    const fetchAppointments = async () => {
        try {
            const response = await fetch('http://localhost:8082/api/agendamentos');
            if (!response.ok) throw new Error('Erro ao buscar agendamentos');
            const appointments = await response.json();
            
            const today = new Date().toISOString().slice(0, 10);
            const todayAppointments = appointments.filter(app => app.data === today);
            const widget = document.querySelector('.widget:nth-child(2) .widget-value');
            if (widget) {
                widget.textContent = todayAppointments.length;
            }

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
            const response = await fetch('http://localhost:8082/api/estoque');
            if (!response.ok) throw new Error('Erro ao buscar estoque');
            const stockItems = await response.json();

            // Lógica para o widget de "Estoque Baixo"
            const lowStockItems = stockItems.filter(item => item.estoqueAtual < item.estoqueMinimo);
            const widget = document.querySelector('.widget:nth-child(3) .widget-value');
            if (widget) {
                widget.textContent = `${lowStockItems.length} itens`;
            }
        } catch (error) {
            console.error('Erro ao carregar o total de estoque baixo:', error);
        }
    };

    // NOVA FUNÇÃO: Buscar receitas do financeiro para calcular vendas totais
    const fetchFinanceiroReceitas = async () => {
        try {
            const response = await fetch('http://localhost:8082/api/financeiro');
            if (!response.ok) throw new Error('Erro ao buscar dados financeiros');
            const financeiro = await response.json();
            
            // Filtrar apenas receitas
            const receitas = financeiro.filter(item => item.tipo === 'receita');
            return receitas;
        } catch (error) {
            console.error('Erro ao carregar dados do financeiro:', error);
            return [];
        }
    };

    // FUNÇÃO ATUALIZADA: Buscar dados de vendas E receitas do financeiro
    const fetchSales = async () => {
        try {
            // Buscar vendas e receitas do financeiro em paralelo
            const [vendasResponse, receitasFinanceiro] = await Promise.all([
                fetch('http://localhost:8082/api/vendas'),
                fetchFinanceiroReceitas()
            ]);

            if (!vendasResponse.ok) throw new Error('Erro ao buscar vendas');
            const vendas = await vendasResponse.json();

            // CALCULAR TOTAL DE VENDAS DO MÊS (Vendas + Receitas do Financeiro)
            const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
            
            // Vendas do mês
            const monthlySales = vendas.filter(venda => venda.data.startsWith(currentMonth));
            const totalVendas = monthlySales.reduce((sum, venda) => sum + venda.total, 0);
            
            // Receitas do financeiro do mês
            const monthlyReceitas = receitasFinanceiro.filter(receita => receita.data.startsWith(currentMonth));
            const totalReceitasFinanceiro = monthlyReceitas.reduce((sum, receita) => sum + receita.valor, 0);

            // TOTAL GERAL = Vendas + Receitas do Financeiro
            const totalGeral = totalVendas + totalReceitasFinanceiro;

            // Atualizar widget de vendas
            const widget = document.querySelector('.widget:nth-child(4) .widget-value');
            if (widget) {
                widget.textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
            }

            // Vendas por Categoria para o Gráfico de Pizza (incluindo receitas do financeiro)
            const salesByCategory = monthlySales.reduce((acc, venda) => {
                venda.itens.forEach(item => {
                    const category = item.categoria || 'Serviços';
                    acc[category] = (acc[category] || 0) + (item.quantidade * item.precoUnitario);
                });
                return acc;
            }, {});

            // Adicionar receitas do financeiro ao gráfico
            monthlyReceitas.forEach(receita => {
                const category = receita.categoria || 'Outras Receitas';
                salesByCategory[category] = (salesByCategory[category] || 0) + receita.valor;
            });

            const pieLabels = Object.keys(salesByCategory);
            const pieData = Object.values(salesByCategory);
            renderPieChart(pieLabels, pieData);

        } catch (error) {
            console.error('Erro ao carregar dados de vendas:', error);
        }
    };

    // Funções para renderizar gráficos
    const renderPieChart = (labels, data) => {
        try {
            const pieCanvas = document.getElementById('pieChart');
            if (!pieCanvas) return;
            
            const pieCtx = pieCanvas.getContext('2d');
            
            // Destruir gráfico existente se houver
            if (pieCanvas.chart) {
                pieCanvas.chart.destroy();
            }
            
            pieCanvas.chart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCE', '#FF9F40', '#FF6384']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao renderizar gráfico de pizza:', error);
        }
    };

    const renderBarChart = (labels, data) => {
        try {
            const barCanvas = document.getElementById('barChart');
            if (!barCanvas) return;
            
            const barCtx = barCanvas.getContext('2d');
            
            // Destruir gráfico existente se houver
            if (barCanvas.chart) {
                barCanvas.chart.destroy();
            }
            
            barCanvas.chart = new Chart(barCtx, {
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
        } catch (error) {
            console.error('Erro ao renderizar gráfico de barras:', error);
        }
    };

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
    // SISTEMA DE ATUALIZAÇÃO EM TEMPO REAL
    // =============================================
    
    // Função para atualizar apenas os dados de vendas (mais rápida)
    const atualizarDadosVendas = () => {
        fetchSales();
    };

    // Função para atualizar todos os dados do dashboard
    const atualizarDashboard = () => {
        try {
            fetchClients();
            fetchAppointments();
            fetchStock();
            fetchSales();
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        }
    };

    // Sistema de notificação entre abas (quando financeiro é atualizado)
    const setupRealtimeUpdates = () => {
        // Ouvir mensagens de outras abas
        window.addEventListener('storage', (event) => {
            if (event.key === 'financeiro-atualizado' && event.newValue) {
                console.log('Dashboard: Recebida notificação de atualização do financeiro');
                atualizarDadosVendas();
            }
        });

        // Também usar BroadcastChannel para comunicação mais eficiente
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('dashboard_updates');
            channel.addEventListener('message', (event) => {
                if (event.data === 'financeiro-atualizado') {
                    console.log('Dashboard: Recebida notificação via BroadcastChannel');
                    atualizarDadosVendas();
                }
            });
        }
    };

    // =============================================
    // INICIALIZAÇÃO DO DASHBOARD
    // =============================================
    
    // Chamadas para carregar todos os dados ao iniciar a página
    atualizarDashboard();
    setupRealtimeUpdates();

    // Atualizar dados a cada 2 minutos
    const dashboardInterval = setInterval(() => {
        atualizarDashboard();
    }, 120000);

    // Limpar intervalo quando a página for fechada
    window.addEventListener('beforeunload', () => {
        clearInterval(dashboardInterval);
    });
});