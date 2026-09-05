/**
 * CollectionSarthi - User & Collector Team Management View
 */

const UsersView = {
  render: async function(container) {
    const plan = Store.getPlan();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Team & Access Control</h1>
              <span id="user-seat-pill" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Seats: ... / ${plan.maxUsers}
              </span>
            </div>
            <p class="text-sm text-slate-500">Manage collection executives, roles, and system users</p>
          </div>
          <button onclick="UsersView.openNewUserModal()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto active:scale-95 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Team Member
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="users-table-container">
          <div class="p-8 skeleton"></div>
        </div>
      </div>
    `;

    await this.loadUsers();
  },

  loadUsers: async function() {
    try {
      const res = await Api.call("getUsers");
      this.users = res.users || [];
      this.renderTable();
    } catch (err) {
      document.getElementById("users-table-container").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load users: ${err.message}</div>
      `;
    }
  },

  renderTable: function() {
    const container = document.getElementById("users-table-container");
    if (!container || !this.users) return;

    const plan = Store.getPlan();
    const pill = document.getElementById("user-seat-pill");
    if (pill) {
      const isOver = this.users.length >= plan.maxUsers;
      pill.className = `px-2.5 py-0.5 rounded-full text-xs font-bold ${
        isOver ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      }`;
      pill.innerText = `Seats: ${this.users.length} / ${plan.maxUsers}`;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">User Name</th>
              <th class="px-5 py-3">Email</th>
              <th class="px-5 py-3">Phone</th>
              <th class="px-5 py-3">System Role</th>
              <th class="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${this.users.map(u => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 font-bold text-slate-900">${Utils.escapeHtml(u.Name)}</td>
                <td class="px-5 py-3.5 text-xs text-slate-600 font-mono">${u.Email}</td>
                <td class="px-5 py-3.5 text-xs text-slate-500">${u.Phone || '-'}</td>
                <td class="px-5 py-3.5 text-xs">
                  <span class="px-2.5 py-1 rounded-full font-semibold ${
                    u.Role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                    u.Role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-slate-100 text-slate-700'
                  }">${u.Role}</span>
                </td>
                <td class="px-5 py-3.5 text-xs">
                  <span class="px-2 py-0.5 rounded-md font-semibold ${u.Status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                    ${u.Status}
                  </span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  openNewUserModal: function() {
    const plan = Store.getPlan();
    const count = (this.users || []).length;
    if (!Store.canAddUser(count)) {
      Modals.openUpgradeModal(
        `Team Seats Limit Reached (${count} / ${plan.maxUsers})`,
        `Your ${plan.name} allows ${plan.maxUsers} user seat. Upgrade to Growth Plan (Sarthi Pro) to invite 2 Collection Executives and delegate calling.`
      );
      return;
    }
    Modals.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 class="text-lg font-semibold">Add New User / Executive</h3>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white">&times;</button>
          </div>
          <form class="p-6 space-y-4" onsubmit="UsersView.submitNewUser(event)">
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name <span class="text-red-500">*</span></label>
              <input type="text" name="Name" required placeholder="Rahul Sharma" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Email <span class="text-red-500">*</span></label>
              <input type="email" name="Email" required placeholder="rahul@example.com" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Phone Number</label>
              <input type="tel" name="Phone" placeholder="9811122233" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Password <span class="text-red-500">*</span></label>
              <input type="password" name="Password" required minlength="6" placeholder="Min 6 characters" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Role <span class="text-red-500">*</span></label>
              <select name="Role" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="COLLECTION_EXECUTIVE" selected>Collection Executive</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div class="pt-2 flex justify-end space-x-3">
              <button type="button" onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Create User</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  submitNewUser: async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await Api.call("createUser", data);
      Toast.success("User created successfully");
      Modals.close();
      this.loadUsers();
    } catch (err) {
      Toast.error(err.message || "Failed to create user");
    }
  }
};
