document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    const appointmentModal = document.getElementById('appointmentModal');
    const closeButton = document.querySelector('.close-button');
    const btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
    const appointmentForm = document.getElementById('appointmentForm');
    const agendamentoDataInput = document.getElementById('agendamentoData');
    const agendamentoHoraInput = document.getElementById('agendamentoHora');
    const agendamentoServicoInput = document.getElementById('agendamentoServico');
    const selectClienteInput = document.getElementById('selectCliente');
    const selectPetInput = document.getElementById('selectPet');
    const agendamentoObservacoesInput = document.getElementById('agendamentoObservacoes');
    const agendamentoIdInput = document.getElementById('agendamentoId');

    let calendar;

    function openModal(date = null, time = null) {
        appointmentModal.style.display = 'flex';
        appointmentForm.reset();
        agendamentoIdInput.value = ''; // Limpa o ID para um novo agendamento
        if (date) agendamentoDataInput.value = date;
        if (time) agendamentoHoraInput.value = time;
        loadClientsAndPets(); // Carrega clientes e pets sempre que o modal é aberto
    }

    function closeModal() {
        appointmentModal.style.display = 'none';
    }

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === appointmentModal) {
            closeModal();
        }
    });

    btnNovoAgendamento.addEventListener('click', () => openModal());

    if (calendarEl) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt-br',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            selectable: true,
            eventStartEditable: true,
            eventDurationEditable: true,
            dayMaxEvents: true,
            events: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
                    if (!token) {
                        console.error('Token de autenticação não encontrado.');
                        failureCallback('Token de autenticação não encontrado.');
                        return;
                    }

                    const response = await fetch('http://localhost:8080/api/agendamentos', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao carregar agendamentos.');
                    }

                    const agendamentos = await response.json();
                    
                    const events = agendamentos.map(agendamento => ({
                        id: agendamento.id,
                        title: `${agendamento.servico}`, // Título simplificado para o calendário
                        start: `${agendamento.data}T${agendamento.hora}`,
                        extendedProps: {
                            clienteId: agendamento.clienteId,
                            petId: agendamento.petId,
                            servico: agendamento.servico,
                            observacoes: agendamento.observacoes,
                            status: agendamento.status
                        },
                        color: getStatusColor(agendamento.status)
                    }));
                    successCallback(events);

                } catch (error) {
                    console.error('Erro ao carregar agendamentos:', error);
                    alert('Erro ao carregar agendamentos: ' + error.message);
                    failureCallback(error);
                }
            },

            dateClick: (info) => {
                const dateStr = info.dateStr.split('T')[0];
                const timeStr = '09:00';
                openModal(dateStr, timeStr);
            },

            eventClick: (info) => {
                const event = info.event;
                agendamentoIdInput.value = event.id;
                agendamentoServicoInput.value = event.extendedProps.servico;
                agendamentoDataInput.value = event.startStr.split('T')[0];
                agendamentoHoraInput.value = event.startStr.split('T')[1].substring(0, 5);
                agendamentoObservacoesInput.value = event.extendedProps.observacoes || ''; 
                loadClientsAndPets(event.extendedProps.clienteId, event.extendedProps.petId);
                openModal();
            },
            
            eventDrop: async (info) => {
                const event = info.event;
                const updatedAgendamento = {
                    id: event.id,
                    data: event.startStr.split('T')[0],
                    hora: event.startStr.split('T')[1].substring(0, 5)
                };

                try {
                    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
                    if (!token) throw new Error('Token de autenticação não encontrado.');

                    const response = await fetch(`http://localhost:8080/api/agendamentos/${event.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updatedAgendamento)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao atualizar agendamento.');
                    }
                    alert('Agendamento atualizado com sucesso!');
                } catch (error) {
                    console.error('Erro ao atualizar agendamento:', error);
                    alert('Erro ao atualizar agendamento: ' + error.message);
                    info.revert();
                }
            },
            
            eventResize: async (info) => {
                // Lógica de redimensionamento de evento aqui, se aplicável
            }
        });
        calendar.render();
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Pendente': return '#ffc107'; // Amarelo
            case 'Confirmado': return '#28a745'; // Verde
            case 'Concluído': return '#17a2b8'; // Azul claro (info)
            case 'Cancelado': return '#dc3545'; // Vermelho
            default: return '#6c757d'; // Cinza
        }
    }
    
    async function loadClientsAndPets(selectedClientId = null, selectedPetId = null) {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token) {
            console.error('Token de autenticação não encontrado para carregar clientes/pets.');
            return;
        }

        try {
            const clientsResponse = await fetch('http://localhost:8080/api/clientes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!clientsResponse.ok) throw new Error('Erro ao carregar clientes.');
            const clients = await clientsResponse.json();

            selectClienteInput.innerHTML = '<option value="">Selecione um cliente</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.nome;
                if (selectedClientId && client.id === selectedClientId) {
                    option.selected = true;
                }
                selectClienteInput.appendChild(option);
            });
            
            selectClienteInput.onchange = async () => {
                const clientId = selectClienteInput.value;
                selectPetInput.innerHTML = '<option value="">Selecione um pet</option>';
                if (clientId) {
                    const petsResponse = await fetch(`http://localhost:8080/api/clientes/${clientId}/pets`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!petsResponse.ok) throw new Error('Erro ao carregar pets.');
                    const pets = await petsResponse.json();
                    
                    pets.forEach(pet => {
                        const option = document.createElement('option');
                        option.value = pet.id;
                        option.textContent = pet.nome; // Exibe apenas o nome do pet
                        if (selectedPetId && pet.id === selectedPetId) {
                            option.selected = true;
                        }
                        selectPetInput.appendChild(option);
                    });
                }
            };
            
            if (selectedClientId) {
                selectClienteInput.dispatchEvent(new Event('change'));
            }

        } catch (error) {
            console.error('Erro ao carregar clientes e pets:', error);
            alert('Erro ao carregar clientes e pets: ' + error.message);
        }
    }
    
    appointmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 🚨 Correção: Convertendo os IDs para números
        const agendamento = {
            id: agendamentoIdInput.value ? Number(agendamentoIdInput.value) : null,
            clienteId: Number(selectClienteInput.value),
            petId: Number(selectPetInput.value),
            servico: agendamentoServicoInput.value,
            data: agendamentoDataInput.value,
            hora: agendamentoHoraInput.value,
            observacoes: agendamentoObservacoesInput.value,
            status: 'Pendente'
        };

        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token) {
            alert('Você precisa estar logado para salvar agendamentos.');
            return;
        }

        try {
            let response;
            const method = agendamento.id ? 'PUT' : 'POST';
            const url = agendamento.id ? `http://localhost:8080/api/agendamentos/${agendamento.id}` : 'http://localhost:8080/api/agendamentos';

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(agendamento)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar agendamento.');
            }

            alert('Agendamento salvo com sucesso!');
            closeModal();
            calendar.refetchEvents();
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            alert('Erro ao salvar agendamento: ' + error.message);
        }
    });
    
    function updateUserName() {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            const userNameSpan = document.querySelector('.user-name');
            if (userNameSpan) {
                userNameSpan.textContent = `Olá, ${user.username}!`;
            }
        }
    }
    updateUserName();

});