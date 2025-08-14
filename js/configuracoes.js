document.addEventListener('DOMContentLoaded', () => {
  // --- Lógica de Abas e Formulários ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  const userTableCard = document.querySelector('#tab-usuarios .card:first-of-type');
  const userFormCard  = document.getElementById('formUsuario');
  const btnNovoUsuario = document.getElementById('btnNovoUsuario');
  const btnVoltarUsuarios = document.getElementById('btnVoltarUsuarios');

  // ⚠️ tbody correto
  const userTableBody = document.getElementById('userTableBody');

  const API_URL = 'http://localhost:8080/api/user-config';

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.style.display = 'none');
      button.classList.add('active');

      const tabId = button.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).style.display = 'block';

      if (tabId === 'usuarios') {
        userTableCard.style.display = 'block';
        userFormCard.style.display  = 'none';
        loadUsersTable();           // carrega a lista
      }
      if (tabId === 'seguranca') {
        loadUsersForPermissions();  // popula o select
      }
    });
  });

  if (btnNovoUsuario) {
    btnNovoUsuario.addEventListener('click', () => {
      userTableCard.style.display = 'none';
      userFormCard.style.display  = 'block';
    });
  }

  if (btnVoltarUsuarios) {
    btnVoltarUsuarios.addEventListener('click', () => {
      userTableCard.style.display = 'block';
      userFormCard.style.display  = 'none';
    });
  }

  // --- Cadastro de usuário no backend ---
  const userForm = document.querySelector('.user-form');
  if (userForm) {
    userForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const userName = document.getElementById('userName').value.trim();
      const userEmail = document.getElementById('userEmail').value.trim();
      const userRole  = document.getElementById('userRole').value;
      const userPassword = document.getElementById('userPassword').value;
      const userConfirmPassword = document.getElementById('userConfirmPassword').value;

      if (userPassword !== userConfirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      try {
        const resp = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            name: userName,
            email: userEmail,
            role: userRole,
            password: userPassword
          })
        });

        if (!resp.ok) throw new Error('Erro ao cadastrar usuário');

        const data = await resp.json();
        alert(`Usuário "${data.name || data.email || data.id}" cadastrado com sucesso!`);

        userForm.reset();
        userTableCard.style.display = 'block';
        userFormCard.style.display  = 'none';

        // Recarrega tabela e select de permissões
        loadUsersTable();
        loadUsersForPermissions();
      } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao cadastrar usuário!');
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

      // filtra registros totalmente vazios
      const list = (users || []).filter(u => u && (u.name || u.email || u.role || u.id));

      if (!list.length) {
        userTableBody.innerHTML = `
          <tr><td colspan="6" style="text-align:center;">Nenhum usuário encontrado.</td></tr>
        `;
        return;
      }

      userTableBody.innerHTML = ''; // limpa
      list.forEach(user => {
        const tr = document.createElement('tr');

        const safeName = user.name || '(sem nome)';
        const safeEmail = user.email || '(sem email)';
        const safeRole  = toTitle(user.role) || '—';

        tr.innerHTML = `
          <td>${user.id ?? '—'}</td>
          <td>${safeName}</td>
          <td>${safeEmail}</td>
          <td>${safeRole}</td>
          <td>Ativo</td>
          <td>
            <button class="btn-action edit-btn" title="Editar Usuário"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete-btn" title="Remover Usuário"><i class="fas fa-trash-alt"></i></button>
          </td>
        `;
        userTableBody.appendChild(tr);
      });
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      userTableBody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:#c00;">Erro ao carregar usuários.</td></tr>
      `;
    }
  }

  // --- Lógica de permissões (select preenchido do backend) ---
  const selectUser = document.getElementById('selectUser');
  const permissionForm = document.getElementById('permissionForm');
  const savePermissionsBtn = permissionForm ? permissionForm.querySelector('button[type="submit"]') : null;

  async function loadUsersForPermissions() {
    if (!selectUser) return;

    // placeholder
    selectUser.innerHTML = '<option value="">Selecione um usuário</option>';

    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao carregar usuários');

      const users = await res.json();

      // filtra vazios e ordena por nome (fallback email/id)
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

  if (selectUser) {
    selectUser.addEventListener('change', (event) => {
      const userId = event.target.value;

      // limpa checkboxes
      const permissionCheckboxes = document.querySelectorAll('.permission-list input[type="checkbox"]');
      permissionCheckboxes.forEach(checkbox => checkbox.checked = false);

      if (savePermissionsBtn) {
        savePermissionsBtn.disabled = !userId;
      }
    });
  }

  if (permissionForm) {
    permissionForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const userId = selectUser.value;
      if (!userId) {
        alert('Selecione um usuário para salvar as permissões.');
        return;
      }

      const selectedPermissions = [];
      document
        .querySelectorAll('.permission-list input[type="checkbox"]:checked')
        .forEach(checkbox => selectedPermissions.push(checkbox.name));

      console.log(`Salvando permissões para o usuário ID ${userId}:`, selectedPermissions);
      alert('Permissões salvas com sucesso! (Simulação)');
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
