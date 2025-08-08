document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:8080/api/agendamentos";
    const CLIENTES_URL = "http://localhost:8080/api/clientes";
    const PETS_URL = "http://localhost:8080/api/pets";

    const modal = document.getElementById("appointmentModal");
    const btnNovoAgendamento = document.getElementById("btnNovoAgendamento");
    const closeBtn = document.querySelector(".close-button");
    const form = document.getElementById("appointmentForm");

    const selectCliente = document.getElementById("selectCliente");
    const selectPet = document.getElementById("selectPet");

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
                    title: `${a.servico} - Pet ${a.petId}`,
                    start: `${a.data}T${a.hora}`,
                    extendedProps: {
                        clienteId: a.clienteId,
                        petId: a.petId,
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
            alert(`Serviço: ${info.event.title}\nObservações: ${info.event.extendedProps.observacoes || "Nenhuma"}`);
        }
    });
    calendar.render();

    // Abre modal
    btnNovoAgendamento.addEventListener("click", () => {
        modal.style.display = "flex";
        carregarClientes();
    });

    // Fecha modal
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        form.reset();
    });

    // Fecha modal ao clicar fora
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            form.reset();
        }
    });

    // Carrega clientes e pets
    async function carregarClientes() {
        try {
            const res = await fetch(CLIENTES_URL);
            const clientes = await res.json();
            selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
            clientes.forEach(c => {
                selectCliente.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
        } catch (err) {
            console.error("Erro ao carregar clientes", err);
        }
    }

    selectCliente.addEventListener("change", async () => {
        try {
            const res = await fetch(`${PETS_URL}/cliente/${selectCliente.value}`);
            const pets = await res.json();
            selectPet.innerHTML = '<option value="">Selecione um pet</option>';
            pets.forEach(p => {
                selectPet.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
            });
        } catch (err) {
            console.error("Erro ao carregar pets", err);
        }
    });

    // Envia novo agendamento
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const novoAgendamento = {
            clienteId: parseInt(selectCliente.value),
            petId: parseInt(selectPet.value),
            servico: document.getElementById("agendamentoServico").value,
            data: document.getElementById("agendamentoData").value,
            hora: document.getElementById("agendamentoHora").value,
            observacoes: document.getElementById("agendamentoObservacoes").value,
            status: "Pendente"
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novoAgendamento)
            });

            if (!res.ok) throw new Error("Erro ao salvar agendamento");

            alert("Agendamento salvo com sucesso!");
            modal.style.display = "none";
            form.reset();
            calendar.refetchEvents();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar agendamento");
        }
    });
});
