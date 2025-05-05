let scheduleData = JSON.parse(localStorage.getItem("schedules")) || [];

function updateStats() {
  const gym = scheduleData.filter((s) => s.type === "Gym").length;
  const yoga = scheduleData.filter((s) => s.type === "Yoga").length;
  const zumba = scheduleData.filter((s) => s.type === "Zumba").length;

  document.getElementById("gymCount").textContent = gym;
  document.getElementById("yogaCount").textContent = yoga;
  document.getElementById("zumbaCount").textContent = zumba;

  renderChart(gym, yoga, zumba);
}

function renderChart(gym, yoga, zumba) {
  const ctx = document.getElementById("chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Gym", "Yoga", "Zumba"],
      datasets: [
        {
          label: "Số lượng lịch",
          data: [gym, yoga, zumba],
          backgroundColor: ["#3b82f6", "#10b981", "#a855f7"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function renderTable() {
  const table = document.getElementById("scheduleTable");
  const type = document.getElementById("classType").value;
  const email = document.getElementById("emailSearch").value.toLowerCase();
  const date = document.getElementById("dateFilter").value;

  const filtered = scheduleData.filter((item) => {
    const matchType = !type || item.type === type;
    const matchEmail = !email || item.email.toLowerCase().includes(email);
    const matchDate = !date || item.date === date;
    return matchType && matchEmail && matchDate;
  });

  table.innerHTML = filtered
    .map(
      (item) => `
    <tr>
      <td>${item.type}</td>
      <td>${item.date}</td>
      <td>${item.time}</td>
      <td>${item.name}</td>
      <td>${item.email}</td>
      <td><button onclick="deleteRow('${item.id}')">Xoá</button></td>
    </tr>
  `
    )
    .join("");
}

function deleteRow(id) {
  if (confirm("Bạn có chắc chắn xoá không?")) {
    scheduleData = scheduleData.filter((item) => item.id !== id);
    localStorage.setItem("schedules", JSON.stringify(scheduleData));
    renderTable();
    updateStats();
  }
}

document.getElementById("classType").onchange = renderTable;
document.getElementById("emailSearch").oninput = renderTable;
document.getElementById("dateFilter").onchange = renderTable;

window.onload = () => {
  updateStats();
  renderTable();
};
