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
            <p class="text-sm text-slate-500">Manage owner credentials, collection executives, roles, and Google Sheet users</p>
          </div>
          
          <div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button id="btn-purge-demo-top" onclick="UsersView.purgeDemoAccounts()" class="hidden px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl shadow-sm items-center gap-1.5 transition-all">
              <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete Demo Accounts</span>
            </button>

            <button onclick="UsersView.openNewUserModal()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>Add User / Team Member</span>
            </button>
          </div>
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

    const demoEmails = ["admin@collectionsarthi.com", "rahul@collectionsarthi.com"];
    const hasDemo = this.users.some(u => demoEmails.includes(String(u.Email).toLowerCase()));
    const purgeTopBtn = document.getElementById("btn-purge-demo-top");
    if (purgeTopBtn) {
      if (hasDemo) {
        purgeTopBtn.classList.remove("hidden");
        purgeTopBtn.classList.add("flex");
      } else {
        purgeTopBtn.classList.add("hidden");
        purgeTopBtn.classList.remove("flex");
      }
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">User Name</th>
              <th class="px-5 py-3">Email Address</th>
              <th class="px-5 py-3">Phone</th>
              <th class="px-5 py-3">System Role</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${this.users.map(u => {
              const isDemo = demoEmails.includes(String(u.Email).toLowerCase());
              return `
                <tr class="hover:bg-slate-50 transition-colors ${isDemo ? 'bg-amber-50/20' : ''}">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900">${Utils.escapeHtml(u.Name)}</span>
                      ${isDemo ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">DEMO</span>` : ''}
                    </div>
                  </td>
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
                  <td class="px-5 py-3.5 text-xs text-right space-x-2 whitespace-nowrap">
                    <button onclick="UsersView.confirmDeleteUser('${u.UserID}', '${Utils.escapeHtml(u.Name)}', '${u.Email}')" class="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-all inline-flex items-center gap-1" title="Delete permanently from Google Sheet">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  confirmDeleteUser: function(userId, name, email) {
    if (confirm(`Are you sure you want to permanently delete user "${name}" (${email}) from your Google Sheet Users database?`)) {
      this.deleteUser(userId, name);
    }
  },

  deleteUser: async function(userId, name) {
    try {
      await Api.call("deleteUser", { userId });
      Toast.success(`User "${name}" deleted from Google Sheet Users sheet.`);
      await this.loadUsers();
    } catch (err) {
      Toast.error(err.message || "Failed to delete user");
    }
  },

  purgeDemoAccounts: async function() {
    if (confirm("Are you sure you want to delete both default demo accounts (admin@collectionsarthi.com & rahul@collectionsarthi.com) from your Google Sheet?")) {
      try {
        const res = await Api.call("purgeDemoUsers");
        Toast.success(res.purgedCount ? `${res.purgedCount} demo account(s) deleted from Users Sheet.` : "Demo accounts removed.");
        await this.loadUsers();
      } catch (err) {
        Toast.error(err.message || "Failed to purge demo accounts");
      }
    }
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
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 class="text-base font-bold">Add User to Database Sheet</h3>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
          </div>
          <form class="p-6 space-y-4" onsubmit="UsersView.submitNewUser(event)">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name <span class="text-rose-500">*</span></label>
              <input type="text" name="Name" required placeholder="e.g. Ramesh Kumar" class="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address <span class="text-rose-500">*</span></label>
              <input type="email" name="Email" required placeholder="ramesh@company.com" class="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
              <input type="tel" name="Phone" placeholder="9811122233" class="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Password <span class="text-rose-500">*</span></label>
              <input type="password" name="Password" required minlength="6" placeholder="Min 6 characters" class="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">System Role <span class="text-rose-500">*</span></label>
              <select name="Role" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="COLLECTION_EXECUTIVE" selected>Collection Executive (Calling & Follow-ups)</option>
                <option value="ADMIN">Admin (All Operational Access)</option>
                <option value="OWNER">Owner (Full Business & Billing Control)</option>
                <option value="VIEWER">Viewer (Read-Only)</option>
              </select>
            </div>
            <div class="pt-2 flex justify-end space-x-3">
              <button type="button" onclick="Modals.close()" class="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20">Save to Users Sheet</button>
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
      Toast.success("User successfully added to Google Sheet Users tab!");
      Modals.close();
      this.loadUsers();
    } catch (err) {
      Toast.error(err.message || "Failed to create user");
    }
  }
};
