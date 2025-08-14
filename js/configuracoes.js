document.addEventListener('DOMContentLoaded', () => {
  // --- Lógica de Abas e Formulários ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  const userTableCard = document.querySelector('#tab-usuarios .card:first-of-type');
  const userFormCard = document.getElementById('formUsuario');
  const btnNovoUsuario = document.getElementById('btnNovoUsuario');
  const btnVoltarUsuarios = document.getElementById('btnVoltarUsuarios');

  const userTableBody = document.getElementById('userTableBody');

  // URL principal para o CRUD de usuários
  const API_URL = 'http://localhost:8080/api/user-config';
  // NOVO: URL específica para a gestão de permissões
  const PERMISSIONS_API_URL = 'http://localhost:8080/api/permissions';

  let editingUserId = null; // Variável para armazenar o ID do usuário em edição

  // Lógica de mudança de abas
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.style.display = 'none');
      button.classList.add('active');

      const tabId = button.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).style.display = 'block';

      if (tabId === 'usuarios') {
        userTableCard.style.display = 'block';
        userFormCard.style.display = 'none';
        loadUsersTable(); // carrega a lista
      }
      if (tabId === 'seguranca') {
        loadUsersForPermissions(); // popula o select
      }
    });
  });

  // Botão Novo Usuário
  if (btnNovoUsuario) {
    btnNovoUsuario.addEventListener('click', () => {
      userTableCard.style.display = 'none';
      userFormCard.style.display = 'block';
      // Limpa o formulário para um novo cadastro
      document.querySelector('.user-form').reset();
      editingUserId = null; // Garante que não estamos em modo de edição
      userFormCard.querySelector('h2').textContent = 'Cadastro de Usuário';
    });
  }

  // Botão Voltar
  if (btnVoltarUsuarios) {
    btnVoltarUsuarios.addEventListener('click', () => {
      userTableCard.style.display = 'block';
      userFormCard.style.display = 'none';
      editingUserId = null; // Sai do modo de edição
    });
  }

  // --- Cadastro/Edição de usuário no backend ---
  const userForm = document.querySelector('.user-form');
  if (userForm) {
    userForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const userName = document.getElementById('userName').value.trim();
      const userEmail = document.getElementById('userEmail').value.trim();
      const userRole = document.getElementById('userRole').value;
      const userPassword = document.getElementById('userPassword').value;
      const userConfirmPassword = document.getElementById('userConfirmPassword').value;

      if ((!editingUserId || userPassword) && userPassword !== userConfirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      const payload = {
        name: userName,
        email: userEmail,
        role: userRole,
        password: userPassword,
      };

      let method = 'POST';
      let url = API_URL;

      if (editingUserId) {
        method = 'PUT';
        url = `${API_URL}/${editingUserId}`;
      }

      try {
        const resp = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(payload)
        });

        if (!resp.ok) throw new Error(`Erro ao ${editingUserId ? 'editar' : 'cadastrar'} usuário`);

        const data = await resp.json();
        alert(`Usuário "${data.name}" ${editingUserId ? 'atualizado' : 'cadastrado'} com sucesso!`);

        userForm.reset();
        userTableCard.style.display = 'block';
        userFormCard.style.display = 'none';
        editingUserId = null;

        loadUsersTable();
        loadUsersForPermissions();
      } catch (err) {
        console.error('Erro:', err);
        alert(`Erro ao ${editingUserId ? 'editar' : 'cadastrar'} usuário!`);
      }
    });
  }

  // --- Helpers ---
  const toTitle = (str) => {
    if (!str) return '';
    return String(str).toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // --- Carregar tabela de usuários ---
  async function loadUsersTable() {
    if (!userTableBody) return;

    userTableBody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;">Carregando...</td></tr>
    `;

    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao carregar usuários');

      const users = await res.json();

      const list = (users || []).filter(u => u && (u.name || u.email || u.role || u.id));

      if (!list.length) {
        userTableBody.innerHTML = `
          <tr><td colspan="6" style="text-align:center;">Nenhum usuário encontrado.</td></tr>
        `;
        return;
      }

      userTableBody.innerHTML = '';
      list.forEach(user => {
        const tr = document.createElement('tr');
        tr.dataset.userId = user.id;

        const safeName = user.name || '(sem nome)';
        const safeEmail = user.email || '(sem email)';
        const safeRole = toTitle(user.role) || '—';

        tr.innerHTML = `
          <td>${user.id ?? '—'}</td>
          <td>${safeName}</td>
          <td>${safeEmail}</td>
          <td>${safeRole}</td>
          <td>Ativo</td>
          <td>
            <button class="btn-action edit-btn" title="Editar Usuário" data-id="${user.id}"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete-btn" title="Remover Usuário" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>
          </td>
        `;
        userTableBody.appendChild(tr);
      });

      userTableBody.addEventListener('click', handleUserActions);

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      userTableBody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:#c00;">Erro ao carregar usuários.</td></tr>
      `;
    }
  }

  // --- Funções de Ação (Editar e Deletar) ---
  async function handleUserActions(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const userId = button.getAttribute('data-id');

    if (button.classList.contains('edit-btn')) {
      await fetchUserForEdit(userId);
    } else if (button.classList.contains('delete-btn')) {
      await deleteUser(userId);
    }
  }

  async function fetchUserForEdit(id) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao buscar usuário para edição.');

      const user = await res.json();

      document.getElementById('userId').value = user.id;
      document.getElementById('userName').value = user.name;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userRole').value = user.role;

      document.getElementById('userPassword').value = '';
      document.getElementById('userConfirmPassword').value = '';

      userFormCard.querySelector('h2').textContent = 'Editar Usuário';
      editingUserId = user.id;

      userTableCard.style.display = 'none';
      userFormCard.style.display = 'block';

    } catch (err) {
      console.error('Erro ao buscar usuário para edição:', err);
      alert('Erro ao carregar os dados do usuário para edição.');
    }
  }

  async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        cache: 'no-store'
      });

      if (!res.ok) throw new Error('Erro ao deletar usuário.');

      alert('Usuário removido com sucesso!');
      loadUsersTable(); // Recarrega a tabela para refletir a mudança
      loadUsersForPermissions();
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      alert('Erro ao remover usuário.');
    }
  }

  // --- Lógica de permissões (select preenchido do backend) ---
  const selectUser = document.getElementById('selectUser');
  const permissionForm = document.getElementById('permissionForm');
  const savePermissionsBtn = permissionForm ? permissionForm.querySelector('button[type="submit"]') : null;
  const permissionCheckboxes = document.querySelectorAll('.permission-list input[type="checkbox"]');

  async function loadUsersForPermissions() {
    if (!selectUser) return;

    selectUser.innerHTML = '<option value="">Selecione um usuário</option>';

    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao carregar usuários');

      const users = await res.json();

      const valid = (users || [])
        .filter(u => u && (u.name || u.email || u.id))
        .sort((a, b) => {
          const an = (a.name || a.email || `Usuário #${a.id}`).toLowerCase();
          const bn = (b.name || b.email || `Usuário #${b.id}`).toLowerCase();
          return an.localeCompare(bn);
        });

      if (!valid.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nenhum usuário encontrado';
        selectUser.appendChild(opt);
        return;
      }

      valid.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name || user.email || `Usuário #${user.id}`;
        selectUser.appendChild(option);
      });

    } catch (err) {
      console.error('Erro ao carregar usuários para permissões:', err);
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Erro ao carregar usuários';
      selectUser.appendChild(opt);
    }
  }

  async function fetchAndSetPermissions(userId) {
    permissionCheckboxes.forEach(checkbox => checkbox.checked = false);

    if (!userId) {
      if (savePermissionsBtn) {
        savePermissionsBtn.disabled = true;
      }
      return;
    }

    if (savePermissionsBtn) {
      savePermissionsBtn.disabled = false;
    }

    try {
      // NOVO ENDPOINT: /api/permissions/{userId}
      const res = await fetch(`${PERMISSIONS_API_URL}/${userId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao buscar permissões do usuário.');

      const permissions = await res.json();

      permissionCheckboxes.forEach(checkbox => {
        if (permissions.includes(checkbox.name)) {
          checkbox.checked = true;
        }
      });
    } catch (err) {
      console.error('Erro ao buscar permissões:', err);
      alert('Erro ao carregar as permissões do usuário.');
    }
  }


  if (selectUser) {
    selectUser.addEventListener('change', (event) => {
      const userId = event.target.value;
      fetchAndSetPermissions(userId);
    });
  }

  if (permissionForm) {
    permissionForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const userId = selectUser.value;
      if (!userId) {
        alert('Selecione um usuário para salvar as permissões.');
        return;
      }

      const selectedPermissions = [];
      permissionCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedPermissions.push(checkbox.name);
        }
      });

      try {
        // NOVO ENDPOINT: PUT para /api/permissions/{userId}
        const res = await fetch(`${PERMISSIONS_API_URL}/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedPermissions)
        });

        if (!res.ok) throw new Error('Erro ao salvar permissões');

        alert('Permissões salvas com sucesso!');
      } catch (err) {
        console.error('Erro ao salvar permissões:', err);
        alert('Erro ao salvar as permissões.');
      }
    });
  }

  // --- Inicialização ---
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab) {
    const activeTabId = activeTab.getAttribute('data-tab');
    document.getElementById(`tab-${activeTabId}`).style.display = 'block';
    if (activeTabId === 'usuarios') loadUsersTable();
    if (activeTabId === 'seguranca') loadUsersForPermissions();
  } else {
    tabButtons[0]?.classList.add('active');
    const firstTabId = tabButtons[0]?.getAttribute('data-tab');
    if (firstTabId) document.getElementById(`tab-${firstTabId}`).style.display = 'block';
  }
});