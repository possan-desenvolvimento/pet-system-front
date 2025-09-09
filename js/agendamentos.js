document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:8080/api/agendamentos";
    const formContainer = document.getElementById("formAgendamento");
    const btnNovoAgendamento = document.getElementById("btnNovoAgendamento");
    const btnVoltarFormulario = document.getElementById("btnVoltarFormulario");
    const form = document.getElementById("appointmentForm");

    // Inicializa o calendário
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "pt-br",
        headerToolbar: {
            left: "prev,next,today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        buttonText: { // Adiciona as traduções para os botões
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        },
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error("Erro ao buscar agendamentos");
                const data = await res.json();

                const eventos = data.map(a => ({
                    id: a.id,
                    title: `${a.servico} - Pet ${a.nomePet}`,
                    start: `${a.data}T${a.hora}`,
                    extendedProps: {
                        telefoneCliente: a.telefoneCliente,
                        nomePet: a.nomePet,
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
            const props = info.event.extendedProps;
            alert(`Serviço: ${info.event.title}\nCliente: ${props.telefoneCliente}\nObservações: ${props.observacoes || "Nenhuma"}`);
        }
    });
    calendar.render();

    btnNovoAgendamento.addEventListener("click", () => {
        formContainer.style.display = "block";
    });

    btnVoltarFormulario.addEventListener("click", () => {
        formContainer.style.display = "none";
        form.reset();
    });

    window.addEventListener("click", (e) => {
        // Não é mais necessário para formulários fixos, mas pode ser útil para outras lógicas
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const novoAgendamento = {
            telefoneCliente: document.getElementById("telefoneCliente").value,
            nomePet: document.getElementById("nomePet").value,
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
            formContainer.style.display = "none";
            form.reset();
            calendar.refetchEvents();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar agendamento");
        }
    });
});