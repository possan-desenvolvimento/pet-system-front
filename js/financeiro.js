/* 
document.addEventListener('DOMContentLoaded', () => {
    const listaTableBody = document.querySelector('table.data-table tbody');
    const formFinanca = document.getElementById('formFinanca');
    const btnNovaContaPagar = document.getElementById('btnNovaContaPagar');
    const btnNovaContaReceber = document.getElementById('btnNovaContaReceber');
    const btnVoltarFinancaLista = document.getElementById('btnVoltarFinancaLista');
    const form = document.querySelector('.finance-form');

    const inputsFiltro = {
        data: document.getElementById('filterFinanceDate'),
        tipo: document.getElementById('filterFinanceType'),
        status: document.getElementById('filterFinanceStatus'),
        descricao: document.getElementById('filterFinanceDescription')
    };

    const btnFiltrar = document.querySelector('.btn-secondary i.fa-filter').parentElement;
    const btnLimpar = document.querySelector('.btn-secondary i.fa-sync-alt').parentElement;

    const inputId = document.getElementById('financaId');
    const inputTipo = document.getElementById('financaTipo');
    const inputDescricao = document.getElementById('financaDescricao');
    const inputValor = document.getElementById('financaValor');
    const inputData = document.getElementById('financaDataVencimento');
    const inputCategoria = document.getElementById('financaCategoria');
    const inputStatus = document.getElementById('financaStatus');

    const API_URL = 'http://localhost:8080/api/financial-transactions';

    function toggleForm(visible = false) {
        formFinanca.style.display = visible ? 'block' : 'none';
    }

    async function carregarTransacoes(filtros = {}) {
        let url = new URL(API_URL + '/search');

        Object.keys(filtros).forEach(key => {
            if (filtros[key]) url.searchParams.append(key, filtros[key]);
        });

        try {
            const res = await fetch(url);
            const data = await res.json();
            preencherTabela(data);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        }
    }

    function preencherTabela(transacoes) {
        listaTableBody.innerHTML = '';
        transacoes.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.transactionDate || ''}</td>
                <td>${t.description}</td>
                <td>${t.type}</td>
                <td>R$ ${parseFloat(t.value).toFixed(2)}</td>
                <td>${t.status}</td>
                <td>
                    <button class="btn-secondary btn-editar" data-id="${t.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-secondary btn-excluir" data-id="${t.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            listaTableBody.appendChild(row);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transacao = {
            type: inputTipo.value,
            description: inputDescricao.value,
            value: parseFloat(inputValor.value),
            transactionDate: inputData.value,
            category: inputCategoria.value,
            status: inputStatus.value
        };

        try {
            let res;
            if (inputId.value) {
                res = await fetch(`${API_URL}/${inputId.value}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transacao)
                });
            } else {
                res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transacao)
                });
            }

            if (res.ok) {
                toggleForm(false);
                limparFormulario();
                carregarTransacoes();
            } else {
                alert('Erro ao salvar transação.');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    });

    btnNovaContaPagar.addEventListener('click', () => {
        limparFormulario();
        inputTipo.value = 'DESPESA';
        toggleForm(true);
    });

    btnNovaContaReceber.addEventListener('click', () => {
        limparFormulario();
        inputTipo.value = 'RECEITA';
        toggleForm(true);
    });

    btnVoltarFinancaLista.addEventListener('click', () => {
        toggleForm(false);
    });

    listaTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-editar')) {
            const id = e.target.closest('button').dataset.id;
            try {
                const res = await fetch(`${API_URL}/${id}`);
                const transacao = await res.json();

                inputId.value = transacao.id;
                inputTipo.value = transacao.type;
                inputDescricao.value = transacao.description;
                inputValor.value = transacao.value;
                inputData.value = transacao.transactionDate;
                inputCategoria.value = transacao.category;
                inputStatus.value = transacao.status;

                toggleForm(true);
            } catch (err) {
                alert('Erro ao carregar transação');
            }
        }

        if (e.target.closest('.btn-excluir')) {
            const id = e.target.closest('button').dataset.id;
            if (confirm('Deseja realmente excluir essa transação?')) {
                try {
                    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    carregarTransacoes();
                } catch (err) {
                    alert('Erro ao excluir transação');
                }
            }
        }
    });

    btnFiltrar.addEventListener('click', () => {
        const filtros = {
            startDate: inputsFiltro.data.value,
            type: inputsFiltro.tipo.value,
            status: inputsFiltro.status.value,
            description: inputsFiltro.descricao.value
        };
        carregarTransacoes(filtros);
    });

    btnLimpar.addEventListener('click', () => {
        inputsFiltro.data.value = '';
        inputsFiltro.tipo.value = '';
        inputsFiltro.status.value = '';
        inputsFiltro.descricao.value = '';
        carregarTransacoes();
    });

    function limparFormulario() {
        inputId.value = '';
        inputTipo.value = '';
        inputDescricao.value = '';
        inputValor.value = '';
        inputData.value = '';
        inputCategoria.value = '';
        inputStatus.value = '';
    }

    carregarTransacoes();
});

*/