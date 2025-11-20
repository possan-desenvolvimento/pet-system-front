document.addEventListener("DOMContentLoaded", function () {
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
    // CÓDIGO DOS AGENDAMENTOS
    // =============================================
    const API_URL = "http://localhost:8082/api/agendamentos";
    const CLIENTES_URL = "http://localhost:8082/api/clientes";

    const formAgendamento = document.getElementById("formAgendamento");
    const btnNovoAgendamento = document.getElementById("btnNovoAgendamento");
    const btnVoltarFormulario = document.getElementById("btnVoltarFormulario");
    const form = document.getElementById("appointmentForm");
    const formTitle = document.getElementById("formTitle");

    const inputCliente = document.getElementById("inputCliente");
    const inputPet = document.getElementById("inputPet");
    const listaClientes = document.getElementById("listaClientes");

    let editando = false;
    let agendamentoAtualId = null;

    // Inicializa o calendário
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "pt-br",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error("Erro ao buscar agendamentos");
                const data = await res.json();

                const eventos = data.map(a => ({
                    id: a.id,
                    title: `${a.servico} - ${a.nomePet || a.pet || 'Pet'}`,
                    start: `${a.data}T${a.hora}`,
                    extendedProps: {
                        cliente: a.telefoneCliente || a.cliente,
                        pet: a.nomePet || a.pet,
                        observacoes: a.observacoes,
                        status: a.status
                    }
                }));

                successCallback(eventos);
            } catch (err) {
                console.error(err);
                failureCallback(err);
            }
        },
        eventClick: function (info) {
            const observacoes = info.event.extendedProps.observacoes || "Nenhuma";
            const cliente = info.event.extendedProps.cliente || "Não informado";
            const pet = info.event.extendedProps.pet || "Não informado";
            
            alert(`Serviço: ${info.event.title}\nCliente: ${cliente}\nPet: ${pet}\nData: ${info.event.start.toLocaleString()}\nObservações: ${observacoes}`);
        }
    });
    calendar.render();

    // Abre formulário
    btnNovoAgendamento.addEventListener("click", () => {
        form.reset();
        editando = false;
        agendamentoAtualId = null;
        formTitle.textContent = "Novo Agendamento";
        document.querySelector('.card:first-child').style.display = 'none';
        formAgendamento.style.display = 'block';
        carregarClientes();
    });

    // Volta ao calendário
    btnVoltarFormulario.addEventListener("click", () => {
        form.reset();
        editando = false;
        agendamentoAtualId = null;
        document.querySelector('.card:first-child').style.display = 'block';
        formAgendamento.style.display = 'none';
    });

    // Carrega clientes
    async function carregarClientes() {
        try {
            const res = await fetch(CLIENTES_URL);
            if (!res.ok) throw new Error("Erro ao buscar clientes");
            const clientes = await res.json();
            
            listaClientes.innerHTML = '';
            clientes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.nome;
                option.setAttribute('data-id', c.id);
                option.setAttribute('data-telefone', c.telefone || '');
                listaClientes.appendChild(option);
            });
        } catch (err) {
            console.error("Erro ao carregar clientes", err);
        }
    }

    // Envia agendamento
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const clienteOption = Array.from(listaClientes.options).find(opt => opt.value === inputCliente.value);
        
        if (!clienteOption) {
            alert("Por favor, selecione um cliente válido da lista.");
            return;
        }

        const petNome = inputPet.value.trim();
        if (!petNome) {
            alert("Por favor, digite o nome do pet.");
            return;
        }

        // TESTE 1: Enviar em snake_case (como está no banco)
        const agendamentoDataSnake = {
            nome_pet: petNome,
            telefone_cliente: clienteOption.getAttribute('data-telefone') || inputCliente.value,
            servico: document.getElementById("agendamentoServico").value,
            data: document.getElementById("agendamentoData").value,
            hora: document.getElementById("agendamentoHora").value,
            observacoes: document.getElementById("agendamentoObservacoes").value,
            status: "agendado"
        };

        // TESTE 2: Enviar em camelCase (como o Spring espera)
        const agendamentoDataCamel = {
            nomePet: petNome,
            telefoneCliente: clienteOption.getAttribute('data-telefone') || inputCliente.value,
            servico: document.getElementById("agendamentoServico").value,
            data: document.getElementById("agendamentoData").value,
            hora: document.getElementById("agendamentoHora").value,
            observacoes: document.getElementById("agendamentoObservacoes").value,
            status: "agendado"
        };

        console.log("Enviando (snake_case):", agendamentoDataSnake);
        console.log("Enviando (camelCase):", agendamentoDataCamel);

        const method = editando ? 'PUT' : 'POST';
        const url = editando ? `${API_URL}/${agendamentoAtualId}` : API_URL;

        // Primeiro tenta com camelCase (mais comum no Spring)
        let agendamentoData = agendamentoDataCamel;
        let tentativa = "camelCase";

        try {
            let res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(agendamentoData)
            });

            // Se camelCase não funcionar, tenta snake_case
            if (!res.ok) {
                console.log(`${tentativa} falhou, tentando snake_case...`);
                agendamentoData = agendamentoDataSnake;
                tentativa = "snake_case";
                
                res = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(agendamentoData)
                });
            }

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Erro detalhado:", errorText);
                throw new Error(`Erro ao salvar agendamento (${tentativa}): ${res.status} - ${errorText}`);
            }

            const data = await res.json();
            console.log(`Agendamento salvo com ${tentativa}:`, data);

            alert(`Agendamento ${editando ? 'atualizado' : 'salvo'} com sucesso!`);
            document.querySelector('.card:first-child').style.display = 'block';
            formAgendamento.style.display = 'none';
            form.reset();
            calendar.refetchEvents();
            editando = false;
            agendamentoAtualId = null;
        } catch (err) {
            console.error("Erro completo:", err);
            alert(`Erro ao salvar agendamento: ${err.message}`);
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

    // Carrega clientes ao iniciar
    carregarClientes();
});