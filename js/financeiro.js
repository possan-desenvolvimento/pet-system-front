document.addEventListener('DOMContentLoaded', function () {
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
            status: document.getElementById('financaStatus').value,
            formaPagamento: document.getElementById('financaFormaPagamento').value
        };

        const financaId = document.getElementById('financaId').value;
        const url = financaId
            ? `http://localhost:8080/api/financeiro/${financaId}`
            : 'http://localhost:8080/api/financeiro';

        const method = financaId ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => {
                alert('Transação salva com sucesso!');
                form.reset();
                ocultarFormulario();
                carregarTransacoes();
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
            const statusValido = !filtroStatus.value || t.status === filtroStatus.value;
            const descricaoValida = !filtroDescricao.value || t.descricao.toLowerCase().includes(filtroDescricao.value.toLowerCase());
            return dataValida && tipoValido && statusValido && descricaoValida;
        });
    }

    function atualizarWidgets(transacoesFiltradas) {
        let receitas = 0, despesas = 0;

        transacoesFiltradas.forEach(t => {
            if (t.tipo === 'receita') receitas += t.valor;
            else if (t.tipo === 'despesa') despesas += t.valor;
        });

        receitasWidget.textContent = `R$ ${receitas.toFixed(2)}`;
        despesasWidget.textContent = `R$ ${despesas.toFixed(2)}`;
        saldoWidget.textContent = `R$ ${(receitas - despesas).toFixed(2)}`;
    }

    function carregarTransacoes() {
        fetch('http://localhost:8080/api/financeiro')
            .then(res => res.json())
            .then(data => {
                transacoes = data;
                paginaAtual = 1;
                atualizarTabela();
            })
            .catch(err => console.error('Erro ao carregar transações:', err));
    }

    function atualizarTabela() {
        fetch("http://localhost:8080/api/financeiro")
            .then(response => response.json())
            .then(dados => {
                const dadosValidos = dados.filter(item =>
                    item.tipo && item.categoria && item.descricao && item.valor !== null && item.data
                );

                const filtrados = aplicarFiltros(dadosValidos);
                atualizarWidgets(filtrados);
                atualizarGraficoPizza(filtrados);
                atualizarGraficoBarras(filtrados);
                atualizarSaldo(filtrados);
                carregarPaginacao(filtrados);
                exibirTransacoesNaTabela(filtrados);
            })
            .catch(error => {
                console.error("Erro ao buscar dados:", error);
            });
    }

    function carregarPaginacao(lista) {
        const totalPaginas = Math.ceil(lista.length / itensPorPagina);
        paginacaoSpan.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    function exibirTransacoesNaTabela(lista) {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const pagina = lista.slice(inicio, fim);

        tableBody.innerHTML = '';
        pagina.forEach(transacao => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transacao.data}</td>
                <td>${transacao.tipo}</td>
                <td>${transacao.categoria}</td>
                <td>${transacao.descricao}</td>
                <td>R$ ${transacao.valor.toFixed(2)}</td>
                
                <td>${transacao.formaPagamento || ''}</td>
                <td>
                    <button class="btn btn-sm btn-secondary editar" data-id="${transacao.id}">Editar</button>
                    <button class="btn btn-sm btn-danger excluir" data-id="${transacao.id}">Excluir</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        adicionarEventosAcoes();
    }

    function adicionarEventosAcoes() {
        document.querySelectorAll('.btn-danger.excluir').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Tem certeza que deseja excluir esta transação?')) {
                    fetch(`http://localhost:8080/api/financeiro/${id}`, {
                        method: 'DELETE'
                    }).then(() => {
                        alert('Transação excluída com sucesso!');
                        carregarTransacoes();
                    });
                }
            });
        });

        document.querySelectorAll('.btn-secondary.editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const transacao = transacoes.find(t => t.id == btn.dataset.id);
                if (transacao) {
                    document.getElementById('financaId').value = transacao.id;
                    document.getElementById('financaTipo').value = transacao.tipo;
                    document.getElementById('financaDescricao').value = transacao.descricao;
                    document.getElementById('financaValor').value = transacao.valor;
                    document.getElementById('financaDataVencimento').value = transacao.data;
                    document.getElementById('financaCategoria').value = transacao.categoria;
                    document.getElementById('financaStatus').value = transacao.status;
                    document.getElementById('financaFormaPagamento').value = transacao.formaPagamento;
                    formContainer.style.display = 'block';
                }
            });
        });
    }

    // Placeholder caso ainda não tenha implementado os gráficos
    function atualizarGraficoPizza(dados) {
        console.log('Atualizando gráfico de pizza...', dados);
        // lógica real pode ser implementada aqui
    }

    function atualizarGraficoBarras(dados) {
        console.log('Atualizando gráfico de barras...', dados);
        // lógica real pode ser implementada aqui
    }

    function atualizarSaldo(dados) {
        atualizarWidgets(dados); // Reutilizando função existente
    }

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
        paginaAtual++;
        atualizarTabela();
    });

    carregarTransacoes();
});
