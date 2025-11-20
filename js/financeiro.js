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
    // CÓDIGO DO FINANCEIRO
    // =============================================
    const form = document.querySelector('.finance-form');
    const btnNovaContaPagar = document.getElementById('btnNovaContaPagar');
    const btnNovaContaReceber = document.getElementById('btnNovaContaReceber');
    const btnVoltar = document.getElementById('btnVoltarFinancaLista');
    const formContainer = document.getElementById('formFinanca');
    const tableBody = document.querySelector('.data-table tbody');
    const btnFiltrar = document.querySelector('.filter-bar button:nth-of-type(1)');
    const btnLimparFiltros = document.querySelector('.filter-bar button:nth-of-type(2)');

    // Filtros
    const filtroData = document.getElementById('filterFinanceDate');
    const filtroTipo = document.getElementById('filterFinanceType');
    const filtroStatus = document.getElementById('filterFinanceStatus');
    const filtroDescricao = document.getElementById('filterFinanceDescription');

    // Widgets
    const receitasWidget = document.querySelector('.income-card .widget-value');
    const despesasWidget = document.querySelector('.expense-card .widget-value');
    const saldoWidget = document.querySelector('.balance-card .widget-value');

    // Paginação
    const btnAnterior = document.querySelector('.pagination button:first-child');
    const btnProxima = document.querySelector('.pagination button:last-child');
    const paginacaoSpan = document.querySelector('.pagination span');
    let paginaAtual = 1;
    const itensPorPagina = 5;

    let transacoes = [];

    // NOVA FUNÇÃO: Notificar o dashboard sobre atualizações
    function notificarDashboard() {
        // Método 1: LocalStorage (funciona entre abas)
        localStorage.setItem('financeiro-atualizado', Date.now().toString());
        
        // Método 2: BroadcastChannel (mais moderno)
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('dashboard_updates');
                channel.postMessage('financeiro-atualizado');
            } catch (error) {
                console.log('BroadcastChannel não suportado');
            }
        }
        
        console.log('Dashboard notificado sobre atualização no financeiro');
    }

    // Função para atualizar widgets em tempo real
    function atualizarWidgetsEmTempoReal() {
        fetch('http://localhost:8082/api/financeiro')
            .then(res => res.json())
            .then(data => {
                const transacoesValidas = data.filter(item =>
                    item.tipo && item.valor !== null
                );
                
                let receitas = 0, despesas = 0;

                transacoesValidas.forEach(t => {
                    if (t.tipo === 'receita') receitas += t.valor;
                    else if (t.tipo === 'despesa') despesas += t.valor;
                });

                receitasWidget.textContent = `R$ ${receitas.toFixed(2).replace('.', ',')}`;
                despesasWidget.textContent = `R$ ${despesas.toFixed(2).replace('.', ',')}`;
                saldoWidget.textContent = `R$ ${(receitas - despesas).toFixed(2).replace('.', ',')}`;
            })
            .catch(err => {
                console.error('Erro ao atualizar widgets:', err);
            });
    }

    function exibirFormulario(tipo) {
        form.reset();
        document.getElementById('financaId').value = '';
        document.getElementById('financaTipo').value = tipo;
        formContainer.style.display = 'block';
    }

    function ocultarFormulario() {
        formContainer.style.display = 'none';
    }

    btnNovaContaPagar.addEventListener('click', () => exibirFormulario('despesa'));
    btnNovaContaReceber.addEventListener('click', () => exibirFormulario('receita'));
    btnVoltar.addEventListener('click', ocultarFormulario);

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const payload = {
            tipo: document.getElementById('financaTipo').value,
            categoria: document.getElementById('financaCategoria').value,
            descricao: document.getElementById('financaDescricao').value,
            valor: parseFloat(document.getElementById('financaValor').value),
            data: document.getElementById('financaDataVencimento').value,
            formaPagamento: document.getElementById('financaFormaPagamento').value
        };

        const financaId = document.getElementById('financaId').value;
        const url = financaId
            ? `http://localhost:8082/api/financeiro/${financaId}`
            : 'http://localhost:8082/api/financeiro';

        const method = financaId ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Erro ao salvar transação');
                }
                return res.json();
            })
            .then(() => {
                alert('Transação salva com sucesso!');
                form.reset();
                ocultarFormulario();
                carregarTransacoes();
                atualizarWidgetsEmTempoReal();
                notificarDashboard(); // ← NOTIFICAR DASHBOARD
            })
            .catch(err => {
                console.error('Erro:', err);
                alert('Erro ao salvar transação');
            });
    });

    function aplicarFiltros(dados) {
        return dados.filter(t => {
            const dataValida = !filtroData.value || t.data === filtroData.value;
            const tipoValido = !filtroTipo.value || t.tipo === filtroTipo.value;
            const descricaoValida = !filtroDescricao.value || t.descricao.toLowerCase().includes(filtroDescricao.value.toLowerCase());
            return dataValida && tipoValido && descricaoValida;
        });
    }

    function atualizarWidgets(transacoesFiltradas) {
        let receitas = 0, despesas = 0;

        transacoesFiltradas.forEach(t => {
            if (t.tipo === 'receita') receitas += t.valor;
            else if (t.tipo === 'despesa') despesas += t.valor;
        });

        receitasWidget.textContent = `R$ ${receitas.toFixed(2).replace('.', ',')}`;
        despesasWidget.textContent = `R$ ${despesas.toFixed(2).replace('.', ',')}`;
        saldoWidget.textContent = `R$ ${(receitas - despesas).toFixed(2).replace('.', ',')}`;
    }

    function carregarTransacoes() {
        fetch('http://localhost:8082/api/financeiro')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Erro ao carregar transações');
                }
                return res.json();
            })
            .then(data => {
                transacoes = data;
                paginaAtual = 1;
                atualizarTabela();
                atualizarWidgetsEmTempoReal();
            })
            .catch(err => {
                console.error('Erro ao carregar transações:', err);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #718096; padding: 40px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px; color: #cbd5e0;"></i>
                            <p>Não foi possível carregar as transações.</p>
                            <p style="font-size: 12px; margin-top: 8px;">Verifique se o servidor está rodando.</p>
                        </td>
                    </tr>
                `;
            });
    }

    function atualizarTabela() {
        fetch("http://localhost:8082/api/financeiro")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar dados');
                }
                return response.json();
            })
            .then(dados => {
                const dadosValidos = dados.filter(item =>
                    item.tipo && item.categoria && item.descricao && item.valor !== null && item.data
                );

                const filtrados = aplicarFiltros(dadosValidos);
                atualizarWidgets(filtrados);
                carregarPaginacao(filtrados);
                exibirTransacoesNaTabela(filtrados);
            })
            .catch(error => {
                console.error("Erro ao buscar dados:", error);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #e53e3e; padding: 20px;">
                            Erro ao carregar dados. Tente novamente.
                        </td>
                    </tr>
                `;
            });
    }

    function carregarPaginacao(lista) {
        const totalPaginas = Math.ceil(lista.length / itensPorPagina);
        paginacaoSpan.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        
        btnAnterior.disabled = paginaAtual === 1;
        btnProxima.disabled = paginaAtual === totalPaginas || totalPaginas === 0;
    }

    function exibirTransacoesNaTabela(lista) {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const pagina = lista.slice(inicio, fim);

        tableBody.innerHTML = '';
        
        if (pagina.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #718096; padding: 40px;">
                        <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; color: #cbd5e0;"></i>
                        <p>Nenhuma transação encontrada.</p>
                        <p style="font-size: 12px; margin-top: 8px;">Tente ajustar os filtros ou cadastrar uma nova transação.</p>
                    </td>
                </tr>
            `;
            return;
        }

        pagina.forEach(transacao => {
            const tr = document.createElement('tr');
            const tipoIcon = transacao.tipo === 'receita' ? 'fa-arrow-up text-green-500' : 'fa-arrow-down text-red-500';
            
            tr.innerHTML = `
                <td>${formatarData(transacao.data)}</td>
                <td>${transacao.descricao}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas ${tipoIcon}"></i>
                        <span style="text-transform: capitalize;">${transacao.tipo}</span>
                    </div>
                </td>
                <td style="font-weight: 600; color: ${transacao.tipo === 'receita' ? '#38a169' : '#e53e3e'}">
                    R$ ${transacao.valor.toFixed(2).replace('.', ',')}
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action edit-btn" data-id="${transacao.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete-btn" data-id="${transacao.id}" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        adicionarEventosAcoes();
    }

    function formatarData(dataString) {
        if (!dataString) return '-';
        const data = new Date(dataString + 'T00:00:00');
        return data.toLocaleDateString('pt-BR');
    }

    function adicionarEventosAcoes() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Tem certeza que deseja excluir esta transação?')) {
                    fetch(`http://localhost:8082/api/financeiro/${id}`, {
                        method: 'DELETE'
                    })
                    .then(res => {
                        // CORREÇÃO: Verifica se a resposta tem conteúdo antes de tentar parsear JSON
                        if (!res.ok) {
                            throw new Error('Erro ao excluir transação');
                        }
                        
                        // Se a resposta estiver vazia, não tenta fazer parse JSON
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            return res.json();
                        } else {
                            return Promise.resolve(); // Resolve sem dados
                        }
                    })
                    .then(() => {
                        alert('Transação excluída com sucesso!');
                        carregarTransacoes();
                        atualizarWidgetsEmTempoReal();
                        notificarDashboard(); // ← NOTIFICAR DASHBOARD
                    })
                    .catch(err => {
                        console.error('Erro ao excluir:', err);
                        alert('Erro ao excluir transação');
                    });
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const transacao = transacoes.find(t => t.id == btn.dataset.id);
                if (transacao) {
                    document.getElementById('financaId').value = transacao.id;
                    document.getElementById('financaTipo').value = transacao.tipo;
                    document.getElementById('financaDescricao').value = transacao.descricao;
                    document.getElementById('financaValor').value = transacao.valor;
                    document.getElementById('financaDataVencimento').value = transacao.data;
                    document.getElementById('financaCategoria').value = transacao.categoria;
                    document.getElementById('financaFormaPagamento').value = transacao.formaPagamento;
                    formContainer.style.display = 'block';
                }
            });
        });
    }

    // Funções para navegação entre páginas
    btnFiltrar.addEventListener('click', () => {
        paginaAtual = 1;
        atualizarTabela();
    });

    btnLimparFiltros.addEventListener('click', () => {
        filtroData.value = '';
        filtroTipo.value = '';
        filtroStatus.value = '';
        filtroDescricao.value = '';
        paginaAtual = 1;
        atualizarTabela();
    });

    btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            atualizarTabela();
        }
    });

    btnProxima.addEventListener('click', () => {
        const totalPaginas = Math.ceil(transacoes.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            atualizarTabela();
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

    // Atualizar widgets automaticamente a cada 30 segundos
    setInterval(atualizarWidgetsEmTempoReal, 30000);

    // Carregar transações ao iniciar
    carregarTransacoes();

    // Adicionar loading state
    const originalInnerHTML = tableBody.innerHTML;
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #00FFFF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 16px; color: #718096;">Carregando transações...</p>
            </td>
        </tr>
    `;

    // Adicionar estilo de animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});