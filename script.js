// ========== AGENCYOS - MAIN APPLICATION LOGIC ==========
// Versi Stable - Siap Deploy ke Vercel + GitHub

// ========== GLOBAL VARIABLES ==========
let currentUser = null;
let currentTab = 'dashboard';
let state = {
    users: [],
    projects: [],
    tasks: [],
    assignments: [],
    ecommerce: [],
    operationalExpenses: [],
    cashflow: []
};

// Data default untuk pertama kali jalan
const defaultData = {
    users: [
        { id: "U001", name: "Andi", role: "eksekutor", createdAt: new Date().toISOString() },
        { id: "U002", name: "Bos", role: "maker", createdAt: new Date().toISOString() }
    ],
    projects: [
        { id: "P001", name: "Website PT ABC", client: "PT ABC", clientValue: 10000000, status: "active", createdAt: new Date().toISOString() }
    ],
    tasks: [
        { id: "T001", projectId: "P001", name: "🔍 Cari Domain", estMinutes: 15, fee: 50000, status: "available" },
        { id: "T002", projectId: "P001", name: "🌐 Setting Hosting", estMinutes: 20, fee: 75000, status: "available" },
        { id: "T003", projectId: "P001", name: "🎨 Install WordPress", estMinutes: 30, fee: 100000, status: "available" }
    ],
    assignments: [],
    ecommerce: [
        { id: "E001", product: "Theme WordPress", qty: 2, price: 500000, total: 1000000, hpp: 600000, date: new Date().toISOString() }
    ],
    operationalExpenses: [
        { id: "OP001", date: new Date().toISOString(), category: "Hosting", description: "Beli domain .com", amount: 250000 }
    ],
    cashflow: []
};

// ========== HELPER FUNCTIONS ==========
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

function formatDate(dateStr) {
    let d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMonthKey(dateStr) {
    let d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ========== LOCALSTORAGE MANAGER ==========
function loadAllData() {
    const savedData = localStorage.getItem('agencyos_data');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            state = { ...state, ...parsed };
        } catch(e) { console.error(e); }
    } else {
        state = defaultData;
        saveAllData();
    }
}

function saveAllData() {
    localStorage.setItem('agencyos_data', JSON.stringify(state));
}

// ========== LOGIN SYSTEM ==========
function doLogin() {
    const role = document.getElementById('loginRole').value;
    const name = document.getElementById('loginName').value.trim();
    
    if (!name) {
        showToast('Masukkan nama Anda!', 'error');
        return;
    }
    
    // Cek atau buat user baru
    let user = state.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) {
        user = {
            id: "U" + (state.users.length + 1).toString().padStart(3, '0'),
            name: name,
            role: role,
            createdAt: new Date().toISOString()
        };
        state.users.push(user);
        saveAllData();
    }
    
    currentUser = user;
    
    // Simpan ke session
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Redirect ke dashboard
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').classList.remove('hidden');
    
    initDashboard();
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').classList.add('hidden');
}

function initDashboard() {
    // Tampilkan nama user
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('roleBadge').innerHTML = currentUser.role === 'maker' ? '👑 Owner' : '🔧 Eksekutor';
    
    // Tampilkan menu sesuai role
    if (currentUser.role === 'maker') {
        document.getElementById('navMenuMaker').classList.remove('hidden');
        document.getElementById('navMenuEksekutor').classList.add('hidden');
    } else {
        document.getElementById('navMenuMaker').classList.add('hidden');
        document.getElementById('navMenuEksekutor').classList.remove('hidden');
    }
    
    switchTab('dashboard');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
}

function switchTab(tab) {
    currentTab = tab;
    const titles = {
        dashboard: '📊 Dashboard Eksekutor',
        tasks: '📋 Task Board',
        myReports: '💰 Laporan Pendapatan Saya',
        makerDashboard: '👑 Dashboard Owner',
        manageProjects: '📁 Kelola Project',
        manageTasks: '✅ Kelola Task',
        financialReport: '📈 Laporan Keuangan',
        operasional: '💸 Biaya Operasional'
    };
    document.getElementById('pageTitle').innerText = titles[tab] || 'Dashboard';
    renderCurrentTab();
    
    // Tutup sidebar di mobile
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
    }
}

// ========== RENDER CONTROLLER ==========
function renderCurrentTab() {
    const container = document.getElementById('contentContainer');
    
    if (currentUser.role === 'maker') {
        if (currentTab === 'makerDashboard') renderMakerDashboard(container);
        else if (currentTab === 'manageProjects') renderManageProjects(container);
        else if (currentTab === 'manageTasks') renderManageTasks(container);
        else if (currentTab === 'financialReport') renderFinancialReport(container);
        else if (currentTab === 'operasional') renderOperasional(container);
        else renderMakerDashboard(container);
    } else {
        if (currentTab === 'dashboard') renderEksekutorDashboard(container);
        else if (currentTab === 'tasks') renderTaskBoard(container);
        else if (currentTab === 'myReports') renderMyReports(container);
        else renderEksekutorDashboard(container);
    }
}

// ========== EKSEKUTOR DASHBOARD ==========
function renderEksekutorDashboard(container) {
    const myAssignments = state.assignments.filter(a => a.executorId === currentUser.id);
    const completedTasks = myAssignments.filter(a => a.completed);
    const totalEarning = completedTasks.reduce((sum, a) => sum + a.fee, 0);
    const totalMinutes = completedTasks.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                <p class="text-sm opacity-90">Total Pendapatan</p>
                <p class="text-3xl font-bold mt-2">${formatRupiah(totalEarning)}</p>
            </div>
            <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
                <p class="text-sm opacity-90">Task Selesai</p>
                <p class="text-3xl font-bold mt-2">${completedTasks.length} task</p>
            </div>
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
                <p class="text-sm opacity-90">Total Waktu Bekerja</p>
                <p class="text-3xl font-bold mt-2">${totalMinutes} menit</p>
            </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-6">
            <h3 class="font-bold text-gray-800 mb-4">📊 Grafik Pendapatan per Bulan</h3>
            <canvas id="myEarningChart" height="150"></canvas>
        </div>
    `;
    
    // Render chart
    const myCompleted = state.assignments.filter(a => a.executorId === currentUser.id && a.completed);
    const monthlyData = {};
    myCompleted.forEach(a => {
        const month = getMonthKey(a.completedDate);
        monthlyData[month] = (monthlyData[month] || 0) + a.fee;
    });
    const months = Object.keys(monthlyData).sort();
    const earnings = months.map(m => monthlyData[m]);
    
    const ctx = document.getElementById('myEarningChart')?.getContext('2d');
    if (ctx) {
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: months, datasets: [{ label: 'Pendapatan', data: earnings, backgroundColor: '#4f46e5' }] },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
}

function renderTaskBoard(container) {
    const availableTasks = state.tasks.filter(t => t.status === 'available');
    const myActiveTasks = state.assignments.filter(a => a.executorId === currentUser.id && !a.completed);
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white rounded-2xl shadow-sm">
                <div class="border-b p-5">
                    <h3 class="font-bold text-gray-800"><i class="fa-solid fa-clock text-indigo-500 mr-2"></i> Task Tersedia</h3>
                </div>
                <div id="availableTasksList" class="p-4 divide-y divide-gray-100">
                    ${availableTasks.length === 0 ? '<div class="text-center py-8 text-gray-400">Belum ada task tersedia</div>' : 
                        availableTasks.map(task => `
                            <div class="flex justify-between items-center py-3">
                                <div>
                                    <p class="font-semibold text-gray-800">${task.name}</p>
                                    <div class="flex gap-3 mt-1 text-xs text-gray-500">
                                        <span><i class="fa-regular fa-clock"></i> ${task.estMinutes} menit</span>
                                        <span class="text-green-600 font-semibold">${formatRupiah(task.fee)}</span>
                                    </div>
                                </div>
                                <button onclick="takeTask('${task.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                                    <i class="fa-solid fa-hand-peace mr-1"></i> Ambil
                                </button>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-sm">
                <div class="border-b p-5">
                    <h3 class="font-bold text-gray-800"><i class="fa-solid fa-play-circle text-green-500 mr-2"></i> Task Dalam Pengerjaan</h3>
                </div>
                <div id="myActiveTasksList" class="p-4 divide-y divide-gray-100">
                    ${myActiveTasks.length === 0 ? '<div class="text-center py-8 text-gray-400">Belum ada task yang diambil</div>' :
                        myActiveTasks.map(assign => {
                            const task = state.tasks.find(t => t.id === assign.taskId);
                            return `
                                <div class="flex justify-between items-center py-3">
                                    <div>
                                        <p class="font-semibold text-gray-800">${task?.name}</p>
                                        <p class="text-xs text-gray-500">Estimasi: ${task?.estMinutes} menit • Fee: ${formatRupiah(task?.fee)}</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <input type="number" id="timeSpent_${assign.id}" placeholder="Menit" class="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm">
                                        <button onclick="completeTask('${assign.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm">
                                            <i class="fa-solid fa-check"></i> Selesai
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

function takeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'available') {
        showToast('Task tidak tersedia!', 'error');
        return;
    }
    
    task.status = 'assigned';
    const newAssign = {
        id: "A" + Date.now(),
        taskId: taskId,
        executorId: currentUser.id,
        executorName: currentUser.name,
        fee: task.fee,
        assignedAt: new Date().toISOString(),
        completed: false,
        timeSpent: null
    };
    state.assignments.push(newAssign);
    saveAllData();
    renderTaskBoard(document.getElementById('contentContainer'));
    showToast(`✅ Task "${task.name}" berhasil diambil!`);
}

function completeTask(assignId) {
    const assign = state.assignments.find(a => a.id === assignId);
    if (!assign || assign.completed) return;
    
    const timeSpent = parseInt(document.getElementById(`timeSpent_${assignId}`)?.value);
    if (!timeSpent || timeSpent <= 0) {
        showToast('Masukkan waktu yang dihabiskan!', 'error');
        return;
    }
    
    const task = state.tasks.find(t => t.id === assign.taskId);
    if (task) {
        task.status = 'available';
    }
    
    assign.completed = true;
    assign.timeSpent = timeSpent;
    assign.completedDate = new Date().toISOString();
    saveAllData();
    
    // Catat ke cashflow
    state.cashflow.push({
        id: "CF" + Date.now(),
        date: new Date().toISOString(),
        source: "fee_eksekutor",
        type: "expense",
        nominal: assign.fee,
        description: `Fee untuk ${currentUser.name} - ${task?.name}`
    });
    saveAllData();
    
    renderTaskBoard(document.getElementById('contentContainer'));
    showToast(`✅ Task selesai! Dapat ${formatRupiah(assign.fee)} dalam ${timeSpent} menit`);
}

function renderMyReports(container) {
    const myCompleted = state.assignments.filter(a => a.executorId === currentUser.id && a.completed);
    const totalEarning = myCompleted.reduce((sum, a) => sum + a.fee, 0);
    const totalTime = myCompleted.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-indigo-50 p-4 rounded-xl text-center">
                    <p class="text-sm text-gray-500">Total Pendapatan</p>
                    <p class="text-2xl font-bold text-indigo-600">${formatRupiah(totalEarning)}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-xl text-center">
                    <p class="text-sm text-gray-500">Task Selesai</p>
                    <p class="text-2xl font-bold text-green-600">${myCompleted.length} task</p>
                </div>
                <div class="bg-orange-50 p-4 rounded-xl text-center">
                    <p class="text-sm text-gray-500">Total Waktu</p>
                    <p class="text-2xl font-bold text-orange-600">${totalTime} menit</p>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr><th class="p-3 text-left">Tanggal Selesai</th><th class="p-3 text-left">Task</th><th class="p-3 text-left">Waktu</th><th class="p-3 text-left">Fee</th></tr>
                    </thead>
                    <tbody>
                        ${myCompleted.map(a => {
                            const task = state.tasks.find(t => t.id === a.taskId);
                            return `
                                <tr class="border-t">
                                    <td class="p-3">${formatDate(a.completedDate)}</td>
                                    <td class="p-3">${task?.name || '-'}</td>
                                    <td class="p-3">${a.timeSpent} menit</td>
                                    <td class="p-3 font-semibold text-green-600">${formatRupiah(a.fee)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== MAKER DASHBOARD ==========
function renderMakerDashboard(container) {
    const totalProjects = state.projects.length;
    const totalTasks = state.tasks.length;
    const totalAssignments = state.assignments.filter(a => a.completed).length;
    const totalFeeOut = state.assignments.filter(a => a.completed).reduce((sum, a) => sum + a.fee, 0);
    const totalOperasional = state.operationalExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalEcommerce = state.ecommerce.reduce((sum, e) => sum + e.total, 0);
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-5 rounded-2xl shadow-sm"><p class="text-gray-500 text-sm">Total Project</p><p class="text-2xl font-bold">${totalProjects}</p></div>
            <div class="bg-white p-5 rounded-2xl shadow-sm"><p class="text-gray-500 text-sm">Total Task</p><p class="text-2xl font-bold">${totalTasks}</p></div>
            <div class="bg-white p-5 rounded-2xl shadow-sm"><p class="text-gray-500 text-sm">Task Selesai</p><p class="text-2xl font-bold">${totalAssignments}</p></div>
            <div class="bg-white p-5 rounded-2xl shadow-sm"><p class="text-gray-500 text-sm">Fee Keluar</p><p class="text-2xl font-bold text-red-600">${formatRupiah(totalFeeOut)}</p></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl shadow-sm p-6">
                <h3 class="font-bold mb-4">📊 Pendapatan vs Pengeluaran</h3>
                <canvas id="incomeExpenseChart" height="200"></canvas>
            </div>
            <div class="bg-white rounded-2xl shadow-sm p-6">
                <h3 class="font-bold mb-4">👥 Top Eksekutor</h3>
                <div id="topExecutorsList"></div>
            </div>
        </div>
    `;
    
    // Chart data
    const totalIncome = totalEcommerce;
    const totalExpense = totalFeeOut + totalOperasional;
    const ctx = document.getElementById('incomeExpenseChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Pemasukan', 'Pengeluaran'], datasets: [{ label: 'Nominal', data: [totalIncome, totalExpense], backgroundColor: ['#10b981', '#ef4444'] }] }
        });
    }
    
    // Top executors
    const executorStats = {};
    state.assignments.filter(a => a.completed).forEach(a => {
        if (!executorStats[a.executorName]) executorStats[a.executorName] = { tasks: 0, fee: 0 };
        executorStats[a.executorName].tasks++;
        executorStats[a.executorName].fee += a.fee;
    });
    const topList = Object.entries(executorStats).sort((a,b) => b[1].fee - a[1].fee).slice(0,5);
    document.getElementById('topExecutorsList').innerHTML = topList.map(([name, data]) => `
        <div class="flex justify-between items-center py-2 border-b">
            <span>${name}</span><span>${data.tasks} task • ${formatRupiah(data.fee)}</span>
        </div>
    `).join('') || '<p class="text-gray-400">Belum ada data</p>';
}

function renderManageProjects(container) {
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 class="font-bold mb-4">➕ Tambah Project Baru</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" id="newProjectName" placeholder="Nama Project" class="border rounded-xl px-4 py-2">
                <input type="text" id="newProjectClient" placeholder="Nama Client" class="border rounded-xl px-4 py-2">
                <input type="number" id="newProjectValue" placeholder="Nilai Project (Rp)" class="border rounded-xl px-4 py-2">
                <button onclick="addProject()" class="bg-indigo-600 text-white rounded-xl py-2">Simpan Project</button>
            </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="border-b p-5"><h3 class="font-bold">📁 Daftar Project</h3></div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50"><tr><th class="p-3">Nama Project</th><th class="p-3">Client</th><th class="p-3">Nilai</th><th class="p-3">Status</th><th class="p-3">Aksi</th></tr></thead>
                    <tbody>${state.projects.map(p => `
                        <tr class="border-t"><td class="p-3">${p.name}</td><td class="p-3">${p.client || '-'}</td><td class="p-3">${formatRupiah(p.clientValue)}</td><td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}">${p.status}</span></td><td class="p-3"><button onclick="deleteProject('${p.id}')" class="text-red-500"><i class="fa-regular fa-trash-can"></i></button></td></tr>
                    `).join('')}</tbody>
                </table>
            </div>
        </div>
    `;
}

function addProject() {
    const name = document.getElementById('newProjectName')?.value.trim();
    const client = document.getElementById('newProjectClient')?.value.trim();
    const value = parseInt(document.getElementById('newProjectValue')?.value);
    if (!name) { showToast('Nama project wajib diisi!', 'error'); return; }
    state.projects.push({
        id: "P" + (state.projects.length + 1).toString().padStart(3, '0'),
        name: name,
        client: client || '-',
        clientValue: value || 0,
        status: 'active',
        createdAt: new Date().toISOString()
    });
    saveAllData();
    renderManageProjects(document.getElementById('contentContainer'));
    showToast('Project berhasil ditambahkan!');
}

function deleteProject(id) {
    if (confirm('Hapus project ini?')) {
        state.projects = state.projects.filter(p => p.id !== id);
        saveAllData();
        renderManageProjects(document.getElementById('contentContainer'));
        showToast('Project dihapus');
    }
}

function renderManageTasks(container) {
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 class="font-bold mb-4">➕ Tambah Task Baru</h3>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select id="taskProjectId" class="border rounded-xl px-3 py-2 text-sm">
                    <option value="">Pilih Project</option>
                    ${state.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
                <input type="text" id="newTaskName" placeholder="Nama Task" class="border rounded-xl px-3 py-2 text-sm">
                <input type="number" id="newTaskMinutes" placeholder="Estimasi Menit" class="border rounded-xl px-3 py-2 text-sm">
                <input type="number" id="newTaskFee" placeholder="Fee (Rp)" class="border rounded-xl px-3 py-2 text-sm">
                <button onclick="addTask()" class="bg-indigo-600 text-white rounded-xl py-2 text-sm">Simpan Task</button>
            </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="border-b p-5"><h3 class="font-bold">✅ Daftar Semua Task</h3></div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50"><tr><th class="p-3">Task</th><th class="p-3">Project</th><th class="p-3">Estimasi</th><th class="p-3">Fee</th><th class="p-3">Status</th><th class="p-3">Aksi</th></tr></thead>
                    <tbody>${state.tasks.map(t => {
                        const project = state.projects.find(p => p.id === t.projectId);
                        return `<tr class="border-t"><td class="p-3">${t.name}</td><td class="p-3">${project?.name || '-'}</td><td class="p-3">${t.estMinutes} menit</td><td class="p-3">${formatRupiah(t.fee)}</td><td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${t.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${t.status}</span></td><td class="p-3"><button onclick="deleteTask('${t.id}')" class="text-red-500"><i class="fa-regular fa-trash-can"></i></button></td></tr>`;
                    }).join('')}</tbody>
                </table>
            </div>
        </div>
    `;
}

function addTask() {
    const projectId = document.getElementById('taskProjectId')?.value;
    const name = document.getElementById('newTaskName')?.value.trim();
    const minutes = parseInt(document.getElementById('newTaskMinutes')?.value);
    const fee = parseInt(document.getElementById('newTaskFee')?.value);
    
    if (!projectId) { showToast('Pilih project!', 'error'); return; }
    if (!name) { showToast('Nama task wajib diisi!', 'error'); return; }
    if (!minutes || !fee) { showToast('Isi estimasi menit dan fee!', 'error'); return; }
    
    state.tasks.push({
        id: "T" + (state.tasks.length + 1).toString().padStart(3, '0'),
        projectId: projectId,
        name: name,
        estMinutes: minutes,
        fee: fee,
        status: 'available'
    });
    saveAllData();
    renderManageTasks(document.getElementById('contentContainer'));
    showToast('Task berhasil ditambahkan!');
}

function deleteTask(id) {
    if (confirm('Hapus task ini?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveAllData();
        renderManageTasks(document.getElementById('contentContainer'));
        showToast('Task dihapus');
    }
}

// ========== FINANCIAL REPORT (LENGKAP + EXPORT) ==========
function renderFinancialReport(container) {
    const months = [...new Set([...state.assignments.map(a => getMonthKey(a.completedDate)), ...state.operationalExpenses.map(e => getMonthKey(e.date))])].sort().reverse();
    
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div class="flex justify-between items-center flex-wrap gap-4 mb-6">
                <h3 class="font-bold text-xl">📊 Laporan Keuangan</h3>
                <div class="flex gap-3">
                    <select id="reportMonthFilter" class="border rounded-xl px-4 py-2 text-sm">
                        <option value="all">Semua Periode</option>
                        ${months.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                    <button onclick="exportToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm">
                        <i class="fa-solid fa-file-excel mr-2"></i> Export ke Excel
                    </button>
                </div>
            </div>
            <div id="financialSummary"></div>
            <div class="mt-6"><canvas id="financeChart" height="150"></canvas></div>
            <div class="mt-6 overflow-x-auto"><table class="w-full text-sm" id="financeDetailTable"></table></div>
        </div>
    `;
    
    document.getElementById('reportMonthFilter').addEventListener('change', () => updateFinancialReport());
    updateFinancialReport();
}

function updateFinancialReport() {
    const filter = document.getElementById('reportMonthFilter')?.value || 'all';
    
    // Filter data
    let filteredAssignments = state.assignments.filter(a => a.completed);
    let filteredOperasional = state.operationalExpenses;
    let filteredEcommerce = state.ecommerce;
    
    if (filter !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => getMonthKey(a.completedDate) === filter);
        filteredOperasional = filteredOperasional.filter(e => getMonthKey(e.date) === filter);
        filteredEcommerce = filteredEcommerce.filter(e => getMonthKey(e.date) === filter);
    }
    
    const totalIncome = filteredEcommerce.reduce((sum, e) => sum + e.total, 0);
    const totalFeeOut = filteredAssignments.reduce((sum, a) => sum + a.fee, 0);
    const totalOperasional = filteredOperasional.reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = totalFeeOut + totalOperasional;
    const netProfit = totalIncome - totalExpense;
    
    document.getElementById('financialSummary').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-green-50 p-4 rounded-xl text-center"><p class="text-sm text-gray-500">Total Pendapatan</p><p class="text-xl font-bold text-green-600">${formatRupiah(totalIncome)}</p></div>
            <div class="bg-red-50 p-4 rounded-xl text-center"><p class="text-sm text-gray-500">Total Pengeluaran</p><p class="text-xl font-bold text-red-600">${formatRupiah(totalExpense)}</p></div>
            <div class="bg-yellow-50 p-4 rounded-xl text-center"><p class="text-sm text-gray-500">Fee Eksekutor</p><p class="text-xl font-bold text-yellow-600">${formatRupiah(totalFeeOut)}</p></div>
            <div class="bg-blue-50 p-4 rounded-xl text-center"><p class="text-sm text-gray-500">Laba Bersih</p><p class="text-xl font-bold text-blue-600">${formatRupiah(netProfit)}</p></div>
        </div>
    `;
    
    const ctx = document.getElementById('financeChart')?.getContext('2d');
    if (ctx) {
        if (window.financeChart) window.financeChart.destroy();
        window.financeChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Pemasukan', 'Fee Eksekutor', 'Operasional', 'Laba Bersih'], datasets: [{ label: 'Nominal', data: [totalIncome, totalFeeOut, totalOperasional, netProfit], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'] }] }
        });
    }
    
    document.getElementById('financeDetailTable').innerHTML = `
        <thead class="bg-gray-50"><tr><th class="p-3">Tanggal</th><th class="p-3">Sumber</th><th class="p-3">Keterangan</th><th class="p-3">Tipe</th><th class="p-3">Nominal</th></tr></thead>
        <tbody>
            ${filteredEcommerce.map(e => `<tr class="border-t"><td class="p-3">${formatDate(e.date)}</td><td class="p-3">Ecommerce</td><td class="p-3">Penjualan ${e.product}</td><td class="p-3 text-green-600">Pemasukan</td><td class="p-3">${formatRupiah(e.total)}</td></tr>`).join('')}
            ${filteredAssignments.map(a => `<tr class="border-t"><td class="p-3">${formatDate(a.completedDate)}</td><td class="p-3">Task</td><td class="p-3">Fee ke ${a.executorName}</td><td class="p-3 text-red-600">Pengeluaran</td><td class="p-3">${formatRupiah(a.fee)}</td></tr>`).join('')}
            ${filteredOperasional.map(o => `<tr class="border-t"><td class="p-3">${formatDate(o.date)}</td><td class="p-3">Operasional</td><td class="p-3">${o.description}</td><td class="p-3 text-red-600">Pengeluaran</td><td class="p-3">${formatRupiah(o.amount)}</td></tr>`).join('')}
        </tbody>
    `;
}

function exportToExcel() {
    const filter = document.getElementById('reportMonthFilter')?.value || 'all';
    let filteredAssignments = state.assignments.filter(a => a.completed);
    let filteredOperasional = state.operationalExpenses;
    let filteredEcommerce = state.ecommerce;
    
    if (filter !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => getMonthKey(a.completedDate) === filter);
        filteredOperasional = filteredOperasional.filter(e => getMonthKey(e.date) === filter);
        filteredEcommerce = filteredEcommerce.filter(e => getMonthKey(e.date) === filter);
    }
    
    const totalIncome = filteredEcommerce.reduce((sum, e) => sum + e.total, 0);
    const totalFeeOut = filteredAssignments.reduce((sum, a) => sum + a.fee, 0);
    const totalOperasional = filteredOperasional.reduce((sum, e) => sum + e.amount, 0);
    
    const summaryData = [['LAPORAN KEUANGAN AGENCYOS'], ['Periode:', filter === 'all' ? 'Semua Periode' : filter], ['Tanggal Export:', new Date().toLocaleString()], [], ['RINGKASAN'], ['Total Pendapatan', formatRupiah(totalIncome)], ['Total Fee Eksekutor', formatRupiah(totalFeeOut)], ['Total Biaya Operasional', formatRupiah(totalOperasional)], ['Laba Bersih', formatRupiah(totalIncome - totalFeeOut - totalOperasional)], []];
    
    const pemasukanData = [['Tanggal', 'Sumber', 'Produk', 'Total']];
    filteredEcommerce.forEach(e => pemasukanData.push([formatDate(e.date), 'Ecommerce', e.product, e.total]));
    
    const pengeluaranData = [['Tanggal', 'Jenis', 'Keterangan', 'Nominal']];
    filteredAssignments.forEach(a => pengeluaranData.push([formatDate(a.completedDate), 'Fee Eksekutor', `Fee ke ${a.executorName}`, a.fee]));
    filteredOperasional.forEach(o => pengeluaranData.push([formatDate(o.date), 'Operasional', o.description, o.amount]));
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.aoa_to_sheet(pemasukanData);
    const ws3 = XLSX.utils.aoa_to_sheet(pengeluaranData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "RINGKASAN");
    XLSX.utils.book_append_sheet(wb, ws2, "PEMASUKAN");
    XLSX.utils.book_append_sheet(wb, ws3, "PENGELUARAN");
    
    XLSX.writeFile(wb, `Laporan_AgencyOS_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('✅ Laporan berhasil diekspor ke Excel!');
}

function renderOperasional(container) {
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 class="font-bold mb-4">➕ Tambah Biaya Operasional</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="date" id="opDate" value="${new Date().toISOString().split('T')[0]}" class="border rounded-xl px-3 py-2 text-sm">
                <select id="opCategory" class="border rounded-xl px-3 py-2 text-sm">
                    <option value="Hosting">Hosting & Domain</option><option value="Tools">Tools/Lisensi</option><option value="Utilitas">Internet/Listrik</option><option value="Lainnya">Lainnya</option>
                </select>
                <input type="text" id="opDesc" placeholder="Keterangan" class="border rounded-xl px-3 py-2 text-sm">
                <input type="number" id="opAmount" placeholder="Nominal (Rp)" class="border rounded-xl px-3 py-2 text-sm">
                <button onclick="addOperasional()" class="bg-indigo-600 text-white rounded-xl py-2 text-sm col-span-4 md:col-span-1">Simpan</button>
            </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="border-b p-5"><h3 class="font-bold">📋 Riwayat Biaya Operasional</h3></div>
            <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3">Tanggal</th><th class="p-3">Kategori</th><th class="p-3">Keterangan</th><th class="p-3">Nominal</th><th class="p-3">Aksi</th></tr></thead><tbody>${state.operationalExpenses.map(o => `<tr class="border-t"><td class="p-3">${formatDate(o.date)}</td><td class="p-3">${o.category}</td><td class="p-3">${o.description}</td><td class="p-3 text-red-600">${formatRupiah(o.amount)}</td><td class="p-3"><button onclick="deleteOperasional('${o.id}')" class="text-red-500"><i class="fa-regular fa-trash-can"></i></button></td></tr>`).join('')}</tbody></table></div>
        </div>
    `;
}

function addOperasional() {
    const date = document.getElementById('opDate')?.value;
    const category = document.getElementById('opCategory')?.value;
    const description = document.getElementById('opDesc')?.value.trim();
    const amount = parseInt(document.getElementById('opAmount')?.value);
    if (!description || !amount) { showToast('Isi keterangan dan nominal!', 'error'); return; }
    state.operationalExpenses.push({ id: "OP" + (state.operationalExpenses.length + 1).toString().padStart(3, '0'), date: date || new Date().toISOString(), category: category, description: description, amount: amount });
    saveAllData();
    renderOperasional(document.getElementById('contentContainer'));
    showToast('Biaya operasional ditambahkan');
}

function deleteOperasional(id) {
    if (confirm('Hapus biaya ini?')) {
        state.operationalExpenses = state.operationalExpenses.filter(o => o.id !== id);
        saveAllData();
        renderOperasional(document.getElementById('contentContainer'));
        showToast('Data dihapus');
    }
}

// ========== INITIALIZATION ==========
loadAllData();

// Cek session
const savedUser = sessionStorage.getItem('currentUser');
if (savedUser) {
    currentUser = JSON.parse(savedUser);
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').classList.remove('hidden');
    initDashboard();
} else {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').classList.add('hidden');
}