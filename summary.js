// MindScan Lite - Summary Page

const HISTORY_KEY = "mindscan_history_v1";
const PROFILE_KEY = "mindscan_profile_v1";

function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return data || {};
  } catch {
    return {};
  }
}

const summaryNone = document.getElementById("summaryNone");
const summaryStats = document.getElementById("summaryStats");
const totalScansEl = document.getElementById("totalScans");
const avgScoreEl = document.getElementById("avgScore");
const lastDateEl = document.getElementById("lastDate");
const lastScoreEl = document.getElementById("lastScore");
const lastLabelEl = document.getElementById("lastLabel");
const categoryList = document.getElementById("categoryList");
const allScansList = document.getElementById("allScansList");
const summaryUser = document.getElementById("summaryUser");

// ---------- USER PROFILE ----------
const p = loadProfile();
if (summaryUser) {
  if (p && (p.name || p.age || p.gender || p.course || p.email)) {
    summaryUser.innerHTML = `
      <strong>Name:</strong> ${p.name || "-"} <br>
      <strong>Age:</strong> ${p.age || "-"} <br>
      <strong>Gender:</strong> ${p.gender || "-"} <br>
      <strong>Course:</strong> ${p.course || "-"} <br>
      <strong>Email:</strong> ${p.email || "-"}
    `;
  } else {
    summaryUser.textContent =
      "No profile saved yet. Fill in your details on the main page to personalise your summary.";
  }
}

// ---------- HISTORY ----------
const history = loadHistory();

if (!history.length) {
     // Weekly chart (last 7 days, average per day)
  const chartCanvas = document.getElementById("weeklyChart");
  if (chartCanvas) {
    const byDate = {};
    history.forEach((h) => {
      if (!h.date) return;
      if (!byDate[h.date]) byDate[h.date] = [];
      byDate[h.date].push(Number(h.score) || 0);
    });

    const allDates = Object.keys(byDate).sort(); // ascending
    const last7 = allDates.slice(-7);

    const labels = last7;
    const data = last7.map((d) => {
      const arr = byDate[d];
      const sum = arr.reduce((a, b) => a + b, 0);
      return (sum / arr.length).toFixed(2);
    });

    new Chart(chartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Average score",
            data,
            tension: 0.3,
            fill: false,
            borderWidth: 2
          }
        ]
      },
      options: {
        scales: {
          y: {
            suggestedMin: 0,
            suggestedMax: 13
          }
        }
      }
    });
  }

  if (summaryNone) summaryNone.hidden = false;
  if (summaryStats) summaryStats.style.display = "none";
} else {
  if (summaryNone) summaryNone.hidden = true;
  if (summaryStats) summaryStats.style.display = "block";

  const total = history.length;
  const sum = history.reduce((acc, h) => acc + (Number(h.score) || 0), 0);
  const avg = sum / total;
  const last = history[history.length - 1];

  totalScansEl.textContent = total;
  avgScoreEl.textContent = avg.toFixed(1);
  lastDateEl.textContent = last.date || "-";
  lastScoreEl.textContent = Number(last.score).toFixed(1);
  lastLabelEl.textContent = last.label || "-";

  const counts = history.reduce(
    (acc, h) => {
      const label = h.label || "";
      if (label.startsWith("Green")) acc.green++;
      else if (label.startsWith("Yellow")) acc.yellow++;
      else if (label.startsWith("Red")) acc.red++;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 }
  );

  // Category breakdown
  if (categoryList) {
    categoryList.innerHTML = "";
    const cats = [
      { name: "Green - doing okay", value: counts.green },
      { name: "Yellow - mild stress warning", value: counts.yellow },
      { name: "Red - high stress risk", value: counts.red }
    ];
    cats.forEach((c) => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = c.name;
      right.textContent = c.value;
      right.className = "history-score";
      li.appendChild(left);
      li.appendChild(right);
      categoryList.appendChild(li);
    });
  }

  // All scans list
  if (allScansList) {
    allScansList.innerHTML = "";
    history
      .slice()
      .reverse()
      .forEach((item) => {
        const li = document.createElement("li");
        const left = document.createElement("span");
        const right = document.createElement("span");
        left.textContent = `${item.date} - ${item.label}`;
        right.textContent = `Score ${Number(item.score).toFixed(1)}`;
        right.className = "history-score";
        li.appendChild(left);
        li.appendChild(right);
        allScansList.appendChild(li);
      });
  }
}

