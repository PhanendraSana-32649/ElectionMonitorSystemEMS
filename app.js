/* ================= UTIL SHORTCUT ================= */
const $ = (id) => document.getElementById(id);

/* ================= THEME ================= */
function loadTheme() {
  const saved = localStorage.getItem("emsTheme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    $("themeToggle").textContent = "☀️ Light Mode";
  }
}

$("themeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  $("themeToggle").textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("emsTheme", dark ? "dark" : "light");
});

/* ================= ROLE SYSTEM ================= */
function loadRole() {
  const role = localStorage.getItem("userRole") || "citizen";
  $("roleDisplay").textContent = "Logged in as: " + role.toUpperCase();
  return role;
}

function showSection(id) {
  document.querySelectorAll(".section").forEach((sec) => (sec.style.display = "none"));
  $(id).style.display = "block";
}

function applyRolePermissions() {
  const role = loadRole();

  document.querySelectorAll(".menu-admin,.menu-citizen,.menu-observer,.menu-analyst")
    .forEach((el) => (el.style.display = "none"));

  document.querySelectorAll("#adminPanel,#citizenDashboard,#observerDashboard,#analystDashboard")
    .forEach((el) => (el.style.display = "none"));

  if (role === "admin") {
    document.querySelector(".menu-admin").style.display = "block";
    $("adminPanel").style.display = "block";
  } else if (role === "citizen") {
    document.querySelector(".menu-citizen").style.display = "block";
    $("citizenDashboard").style.display = "block";
  } else if (role === "observer") {
    document.querySelector(".menu-observer").style.display = "block";
    $("observerDashboard").style.display = "block";
  } else if (role === "analyst") {
    document.querySelector(".menu-analyst").style.display = "block";
    $("analystDashboard").style.display = "block";
  }

  $("livevotes").style.display = "block";
}

/* ================= TOAST ================= */
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

/* ================= VOTER VERIFICATION ================= */
function verifyVoterId() {
  const input = $("voterIdInput").value.trim();
  const result = $("voterResult");

  if (!input) return (result.textContent = "Enter voter ID", result.className = "verify-result error");

  const ok = /[A-Za-z]/.test(input) && /\d/.test(input) && input.length >= 6;
  result.textContent = ok ? "Valid voter ID format ✔️" : "Invalid ID ❌";
  result.className = ok ? "verify-result success" : "verify-result error";
}

/* ================= MODAL ================= */
function openReportModal() {
  $("reportModal").style.display = "flex";
}
function closeReportModal() {
  $("reportModal").style.display = "none";
}
window.addEventListener("click", (e) => {
  if (e.target === $("reportModal")) closeReportModal();
});

/* ================= COMPLAINTS ================= */
function getComplaints() {
  return JSON.parse(localStorage.getItem("emsComplaints") || "[]");
}
function saveComplaints(list) {
  localStorage.setItem("emsComplaints", JSON.stringify(list));
}

function submitReport(e) {
  e.preventDefault();
  const list = getComplaints();
  list.push({
    id: "CMP" + Date.now(),
    name: $("repName").value.trim(),
    location: $("repLocation").value.trim(),
    category: $("repCategory").value,
    severity: $("repSeverity").value,
    description: $("repDescription").value.trim(),
    status: "Pending",
    createdAt: new Date().toLocaleString(),
  });
  saveComplaints(list);
  $("reportForm").reset();
  closeReportModal();
  renderComplaints();
  renderAdminComplaints();
  updateAdminStats();
  showToast("Complaint submitted");
}

function renderComplaints(search = "") {
  const list = getComplaints();
  const container = $("complaintsContainer");
  const msg = $("noComplaintsMsg");

  container.innerHTML = "";
  const filtered = search
    ? list.filter((c) =>
        (c.id + c.location + c.category + c.severity + c.description)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : list;

  if (!filtered.length) return (msg.style.display = "block");
  msg.style.display = "none";

  filtered.forEach((c) => {
    const div = document.createElement("div");
    div.className = "complaint-card";
    div.innerHTML = `
      <div class="complaint-header">
        <span>${c.id}</span>
        <span class="status">${c.status}</span>
      </div>
      <p><strong>Location:</strong> ${c.location}</p>
      <p><strong>${c.category}</strong> | Severity: ${c.severity}</p>
      <p>${c.description}</p>
      <p class="complaint-time">${c.createdAt}</p>
    `;
    container.appendChild(div);
  });
}

$("complaintSearch")?.addEventListener("input", (e) => renderComplaints(e.target.value));

/* ================= ADMIN USER CONTROL ================= */
function getUsers() {
  return JSON.parse(localStorage.getItem("emsUsers") || "[]");
}
function saveUsers(list) {
  localStorage.setItem("emsUsers", JSON.stringify(list));
}

function renderUsersTable() {
  const users = getUsers();
  $("totalUsers").textContent = users.length;
  const body = $("usersTableBody");
  body.innerHTML = "";

  users.forEach((u, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.status || "active"}</td>
      <td>
        <button class="table-btn" onclick="toggleUserStatus(${i})">Toggle</button>
        <button class="table-btn danger" onclick="deleteUser(${i})">Delete</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

function toggleUserStatus(i) {
  const users = getUsers();
  users[i].status = users[i].status === "blocked" ? "active" : "blocked";
  saveUsers(users);
  renderUsersTable();
}

function deleteUser(i) {
  const users = getUsers();
  users.splice(i, 1);
  saveUsers(users);
  renderUsersTable();
}

function updateAdminStats() {
  const list = getComplaints();
  $("adminTotalComplaints").textContent = list.length;
  $("adminPendingComplaints").textContent = list.filter((c) => c.status === "Pending").length;
}

function renderAdminComplaints() {
  const list = getComplaints();
  const body = $("adminComplaintsBody");
  body.innerHTML = "";

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td><td>${c.location}</td><td>${c.category}</td><td>${c.severity}</td><td>${c.status}</td>
      <td>
        <button class="table-btn" onclick="changeComplaintStatus(${i}, 'Approved')">Approve</button>
        <button class="table-btn danger" onclick="changeComplaintStatus(${i}, 'Rejected')">Reject</button>
        <button class="table-btn" onclick="changeComplaintStatus(${i}, 'Resolved')">Resolve</button>
      </td>`;
    body.appendChild(tr);
  });
}

function changeComplaintStatus(i, status) {
  const list = getComplaints();
  list[i].status = status;
  saveComplaints(list);
  renderComplaints();
  renderAdminComplaints();
  updateAdminStats();
}

/* ================= OBSERVER – BOOTH REPORTS ================= */
function getBoothReports() {
  return JSON.parse(localStorage.getItem("emsBoothReports") || "[]");
}
function saveBoothReports(list) {
  localStorage.setItem("emsBoothReports", JSON.stringify(list));
}

function submitBoothReport(e) {
  e.preventDefault();
  const list = getBoothReports();
  list.push({
    boothId: $("boothId").value.trim(),
    location: $("boothLocation").value.trim(),
    evmStatus: $("boothEvmStatus").value,
    notes: $("boothNotes").value.trim(),
    time: new Date().toLocaleTimeString(),
  });
  saveBoothReports(list);
  $("boothForm").reset();
  renderBoothReports();
}

function renderBoothReports() {
  const list = getBoothReports();
  const container = $("boothReportsContainer");
  container.innerHTML = !list.length
    ? `<p class="no-data-msg">No booth reports yet.</p>`
    : list
        .slice()
        .reverse()
        .map(
          (b) => `<div class="booth-card">
      <p><strong>${b.boothId}</strong> (${b.location})</p>
      <p>${b.evmStatus}</p>
      <p>${b.notes}</p>
      <p class="complaint-time">${b.time}</p>
    </div>`
        )
        .join("");
}

/* ================= LIVE VOTES + BLOCKCHAIN ================= */
function getLiveVotes() {
  return JSON.parse(
    localStorage.getItem("liveVotes") ||
      JSON.stringify({ ABC: 0, XYZ: 0, IND: 0, verified: 0, unverified: 0, blocks: [] })
  );
}
function saveLiveVotes(d) {
  localStorage.setItem("liveVotes", JSON.stringify(d));
}

let liveChart = null;
let verificationChart = null;

function castVote(party) {
  const d = getLiveVotes();
  d[party]++;
  Math.random() > 0.25 ? d.verified++ : d.unverified++;

  d.blocks.push({
    time: new Date().toLocaleTimeString(),
    party,
    prevHash: d.blocks.length ? d.blocks[d.blocks.length - 1].hash : "GENESIS",
    hash: btoa(Date.now() + party).slice(0, 12),
  });

  saveLiveVotes(d);
  updateLiveVotesUI();
  showToast("Vote cast for " + party);
}

setInterval(() => castVote(["ABC", "XYZ", "IND"][Math.floor(Math.random() * 3)]), 8000);

function updateLiveVotesUI() {
  const d = getLiveVotes();
  $("verVotes").textContent = d.verified;
  $("unverVotes").textContent = d.unverified;
  $("lastUpdated").textContent = "Last Updated: " + new Date().toLocaleTimeString();
  $("hashValue").textContent = d.blocks.length ? d.blocks[d.blocks.length - 1].hash : "---";

  $("leaderboardContent").innerHTML = Object.entries({ ABC: d.ABC, XYZ: d.XYZ, IND: d.IND })
    .sort((a, b) => b[1] - a[1])
    .map((p) => `<div class="leader-row"><span>${p[0]}</span><span>${p[1]} votes</span></div>`)
    .join("");

  $("blockchainLog").innerHTML = d.blocks
    .slice()
    .reverse()
    .slice(0, 5)
    .map(
      (b) => `<div class="block-card"><strong>${b.time}</strong> – ${b.party} <br>
    Hash: ${b.hash}<br><span class="small">Prev: ${b.prevHash}</span></div>`
    )
    .join("");

  const ctx1 = $("liveVotesChart").getContext("2d");
  const ctx2 = $("verifyChart").getContext("2d");

  if (!liveChart) {
    liveChart = new Chart(ctx1, {
      type: "bar",
      data: { labels: ["ABC", "XYZ", "IND"], datasets: [{ data: [d.ABC, d.XYZ, d.IND] }] },
    });
  } else {
    liveChart.data.datasets[0].data = [d.ABC, d.XYZ, d.IND];
    liveChart.update();
  }

  if (!verificationChart) {
    verificationChart = new Chart(ctx2, {
      type: "pie",
      data: { labels: ["Verified", "Pending"], datasets: [{ data: [d.verified, d.unverified] }] },
    });
  } else {
    verificationChart.data.datasets[0].data = [d.verified, d.unverified];
    verificationChart.update();
  }

  renderAnalystCharts();
}

/* ================= ANALYST ================= */
let analystComplaintChart, analystSeverityChart, analystVerifyChart, analystTimelineChart;

function renderAnalystCharts() {
  const c = getComplaints();
  const v = getLiveVotes();

  const byCat = {};
  c.forEach((x) => (byCat[x.category] = (byCat[x.category] || 0) + 1));

  const catLabels = Object.keys(byCat);
  const catData = Object.values(byCat);

  const ctx1 = $("analystComplaintsChart").getContext("2d");
  if (!analystComplaintChart)
    analystComplaintChart = new Chart(ctx1, {
      type: "bar",
      data: { labels: catLabels, datasets: [{ data: catData }] },
    });
  else {
    analystComplaintChart.data.labels = catLabels;
    analystComplaintChart.data.datasets[0].data = catData;
    analystComplaintChart.update();
  }

  const sev = {};
  c.forEach((x) => (sev[x.severity] = (sev[x.severity] || 0) + 1));
  const ctx2 = $("analystSeverityChart").getContext("2d");

  if (!analystSeverityChart)
    analystSeverityChart = new Chart(ctx2, {
      type: "pie",
      data: { labels: Object.keys(sev), datasets: [{ data: Object.values(sev) }] },
    });
  else {
    analystSeverityChart.data.labels = Object.keys(sev);
    analystSeverityChart.data.datasets[0].data = Object.values(sev);
    analystSeverityChart.update();
  }

  const ctx3 = $("analystVerifyChart").getContext("2d");
  if (!analystVerifyChart)
    analystVerifyChart = new Chart(ctx3, {
      type: "bar",
      data: { labels: ["Verified", "Pending"], datasets: [{ data: [v.verified, v.unverified] }] },
    });
  else {
    analystVerifyChart.data.datasets[0].data = [v.verified, v.unverified];
    analystVerifyChart.update();
  }

  const ctx4 = $("analystTimelineChart").getContext("2d");
  const timeline = ["8AM", "10AM", "12PM", "2PM", "4PM"];
  const values = timeline.map((_, i) => (c.length * (i + 1)) / 5);

  if (!analystTimelineChart)
    analystTimelineChart = new Chart(ctx4, {
      type: "line",
      data: { labels: timeline, datasets: [{ data: values, tension: 0.4 }] },
    });
  else {
    analystTimelineChart.data.datasets[0].data = values;
    analystTimelineChart.update();
  }
}

/* ================= CHAT ================= */
function getChatMessages() {
  return JSON.parse(localStorage.getItem("emsChat") || "[]");
}
function saveChatMessages(list) {
  localStorage.setItem("emsChat", JSON.stringify(list));
}

function renderChat() {
  const list = getChatMessages();
  const box = $("chatMessages");
  const role = localStorage.getItem("userRole") || "citizen";

  box.innerHTML = "";
  list.forEach((m) => {
    const div = document.createElement("div");
    div.className = "chat-message " + (m.role === role ? "me" : "other");
    div.innerHTML = `<strong>${m.name}</strong> (${m.role})<br>${m.text}<br><span class="chat-time">${m.time}</span>`;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}

function sendChatMessage() {
  const txt = $("chatInput").value.trim();
  if (!txt) return;

  const user = JSON.parse(localStorage.getItem("loggedUser") || "{}");
  const role = localStorage.getItem("userRole") || "citizen";

  const list = getChatMessages();
  list.push({
    name: user.name || "User",
    role,
    text: txt,
    time: new Date().toLocaleTimeString(),
  });

  saveChatMessages(list);
  $("chatInput").value = "";
  renderChat();
}

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  applyRolePermissions();
  renderUsersTable();
  renderComplaints();
  renderAdminComplaints();
  renderBoothReports();
  updateLiveVotesUI();
  renderAnalystCharts();
  renderChat();
  updateAdminStats();
});
