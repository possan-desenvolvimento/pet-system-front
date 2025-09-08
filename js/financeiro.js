// financeiro.js (código completo e corrigido para o novo widget)

// Variáveis e elementos do DOM
const form = document.querySelector('.finance-form');
const btnNovaContaPagar = document.getElementById('btnNovaContaPagar');
const btnNovaContaReceber = document.getElementById('btnNovaContaReceber');
const btnVoltar = document.getElementById('btnVoltarFinancaLista');
const formContainer = document.getElementById('formFinanca');
const tableBody = document.querySelector('.data-table tbody');
const btnFiltrar = document.querySelector('.filter-bar button:nth-of-type(1)');
const btnLimparFiltros = document.querySelector('.filter-bar button:nth-of-type(2)');

const filtroData = document.getElementById('filterFinanceDate');
const filtroTipo = document.getElementById('filterFinanceType');
const filtroStatus = document.getElementById('filterFinanceStatus');
const filtroDescricao = document.getElementById('filterFinanceDescription');

const receitasWidget = document.querySelector('.income-card .widget-value');
const despesasWidget = document.querySelector('.expense-card .widget-value');
const saldoWidget = document.querySelector('.balance-card .widget-value');
const vendasWidget = document.querySelector('.vendas-card .widget-value'); // 🔑 Novo Widget de Vendas

const btnAnterior = document.querySelector('.pagination button:first-child');
const btnProxima = document.querySelector('.pagination button:last-child');
const paginacaoSpan = document.querySelector('.pagination span');
let paginaAtual = 1;
const itensPorPagina = 5;

let transacoes = [];

// Funções Auxiliares: Movidas para o escopo global
function exibirFormulario(tipo) {
    form.reset();
    document.getElementById('financaId').value = '';
    document.getElementById('financaTipo').value = tipo;
    formContainer.style.display = 'block';
}

function ocultarFormulario() {
    formContainer.style.display = 'none';
}

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
    let receitas = 0, despesas = 0, vendasTotal = 0; // 🔑 Nova variável para o total de vendas
    transacoesFiltradas.forEach(t => {
        // Receita é qualquer valor de entrada
        if (t.tipo === 'receita') {
            receitas += t.valor;
            // E se a receita for especificamente de Vendas, soma no total de vendas
            if (t.categoria === 'Vendas') {
                vendasTotal += t.valor;
            }
        } else if (t.tipo === 'despesa') {
            despesas += t.valor;
        }
    });

    receitasWidget.textContent = `R$ ${receitas.toFixed(2).replace('.', ',')}`;
    despesasWidget.textContent = `R$ ${despesas.toFixed(2).replace('.', ',')}`;
    saldoWidget.textContent = `R$ ${(receitas - despesas).toFixed(2).replace('.', ',')}`;
    vendasWidget.textContent = `R$ ${vendasTotal.toFixed(2).replace('.', ',')}`; // 🔑 Atualiza o novo widget
}

function atualizarGraficoPizza(dados) {
    // Lógica para o gráfico de pizza
}

function atualizarGraficoBarras(dados) {
    // Lógica para o gráfico de barras
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
            <td>R$ ${transacao.valor.toFixed(2).replace('.', ',')}</td>
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
                fetch(`http://localhost:8080/api/financeiro/${id}`, { method: 'DELETE' })
                    .then(() => {
                        alert('Transação excluída com sucesso!');
                        carregarTransacoes();
                    })
                    .catch(err => console.error('Erro ao excluir:', err));
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

// 🔑 Função que aplica filtros e atualiza a interface
function atualizarTabelaEWidgets(dados) {
    const filtrados = aplicarFiltros(dados);
    atualizarWidgets(filtrados);
    atualizarGraficoPizza(filtrados);
    atualizarGraficoBarras(filtrados);
    carregarPaginacao(filtrados);
    exibirTransacoesNaTabela(filtrados);
}

// 🔑 Função central para buscar os dados e atualizar a tela
async function carregarTransacoes() {
    try {
        const response = await fetch('http://localhost:8080/api/financeiro');
        if (!response.ok) {
            throw new Error('Erro ao buscar transações: ' + response.statusText);
        }
        const dados = await response.json();
        transacoes = dados; // Salva os dados originais para filtros e paginação
        paginaAtual = 1; // Reseta a paginação para o início
        atualizarTabelaEWidgets(transacoes);

    } catch (err) {
        console.error('Erro ao carregar transações:', err);
    }
}

// 🔑 Torna a função global para ser chamada pelo vendas.js
window.carregarTransacoesFinanceiro = carregarTransacoes;

// O restante do código só roda quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', function () {

    // Eventos de click e submit
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

    btnFiltrar.addEventListener('click', () => {
        paginaAtual = 1;
        atualizarTabelaEWidgets(transacoes);
    });

    btnLimparFiltros.addEventListener('click', () => {
        filtroData.value = '';
        filtroTipo.value = '';
        filtroStatus.value = '';
        filtroDescricao.value = '';
        carregarTransacoes();
    });

    btnAnterior.addEventListener('click', () => {
        const totalPaginas = Math.ceil(aplicarFiltros(transacoes).length / itensPorPagina); // Adicionado filtro para calcular a paginação corretamente
        if (paginaAtual > 1) {
            paginaAtual--;
            atualizarTabelaEWidgets(transacoes);
        }
    });

    btnProxima.addEventListener('click', () => {
        const totalPaginas = Math.ceil(aplicarFiltros(transacoes).length / itensPorPagina); // Adicionado filtro para calcular a paginação corretamente
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            atualizarTabelaEWidgets(transacoes);
        }
    });

    // 🔑 Ouve o evento de armazenamento para sincronizar com outras abas
    window.addEventListener('storage', (event) => {
        if (event.key === 'financeiroUpdated') {
            carregarTransacoes();
        }
    });

    // Inicia o carregamento quando a página é aberta
    carregarTransacoes();
});