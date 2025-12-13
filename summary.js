// =====================
// MMW / MindScan - Summary Page (SYNCED)
// =====================
const HISTORY_KEY = "mindscan_history_v3";
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
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

// Elements
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

const reportContent = document.getElementById("reportContent");
const generateReportBtn = document.getElementById("generateReportBtn");
const printReportBtn = document.getElementById("printReportBtn");

let weeklyChartInstance = null;

// Profile render
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

// History
const history = loadHistory();

let summaryStatsData = {
  total: 0,
  avg: 0,
  counts: { green: 0, yellow: 0, red: 0 },
  last: null,
};

if (!history.length) {
  if (summaryNone) summaryNone.hidden = false;
  if (summaryStats) summaryStats.style.display = "none";
} else {
  if (summaryNone) summaryNone.hidden = true;
  if (summaryStats) summaryStats.style.display = "block";

  const total = history.length;
  const sum = history.reduce((acc, h) => acc + (Number(h.wellness) || 0), 0);
  const avg = sum / total;
  const last = history[history.length - 1];

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

  summaryStatsData = { total, avg, counts, last };

  totalScansEl.textContent = String(total);
  avgScoreEl.textContent = avg.toFixed(1);
  lastDateEl.textContent = last.date || "-";
  lastScoreEl.textContent = Number(last.wellness).toFixed(1);
  lastLabelEl.textContent = last.label || "-";

  // Category breakdown
  if (categoryList) {
    categoryList.innerHTML = "";
    [
      { name: "Green - doing okay", value: counts.green },
      { name: "Yellow - mild to moderate stress", value: counts.yellow },
      { name: "Red - high stress risk", value: counts.red },
    ].forEach((c) => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = c.name;
      right.textContent = String(c.value);
      right.className = "history-score";
      li.appendChild(left);
      li.appendChild(right);
      categoryList.appendChild(li);
    });
  }

  // All scans list
  if (allScansList) {
    allScansList.innerHTML = "";
    history.slice().reverse().forEach((item) => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = `${item.date} - ${item.label}`;
      right.textContent = `Score ${Number(item.wellness).toFixed(1)}`;
      right.className = "history-score";
      li.appendChild(left);
      li.appendChild(right);
      allScansList.appendChild(li);
    });
  }

  // Weekly chart (last 7 days average wellness)
  const chartCanvas = document.getElementById("weeklyChart");
  if (chartCanvas && window.Chart) {
    const byDate = {};
    history.forEach((h) => {
      if (!h.date) return;
      if (!byDate[h.date]) byDate[h.date] = [];
      byDate[h.date].push(Number(h.wellness) || 0);
    });

    const allDates = Object.keys(byDate).sort();
    const last7 = allDates.slice(-7);

    const labels = last7;
    const data = last7.map((d) => {
      const arr = byDate[d];
      const sum = arr.reduce((a, b) => a + b, 0);
      return Number((sum / arr.length).toFixed(2));
    });

    if (weeklyChartInstance) weeklyChartInstance.destroy();
    weeklyChartInstance = new Chart(chartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "Average wellness", data, tension: 0.35, borderWidth: 2 }],
      },
      options: { scales: { y: { suggestedMin: 0, suggestedMax: 12 } } },
    });
  }
}

// Report
function buildReport() {
  if (!reportContent) return;
  const { total, avg, counts, last } = summaryStatsData;

  if (!total) {
    reportContent.innerHTML = "<p>You need at least one scan before a report can be generated.</p>";
    return;
  }

  const mainLevel =
    counts.red >= counts.yellow && counts.red >= counts.green
      ? "high stress risk"
      : counts.yellow >= counts.green
      ? "mild to moderate stress"
      : "generally stable wellness";

  reportContent.innerHTML = `
    <p><strong>Overview:</strong> You completed <strong>${total}</strong> MMW sessions with an average score of <strong>${avg.toFixed(1)}</strong> / 12.</p>
    <p><strong>Latest scan:</strong> <strong>${last.date || "-"}</strong> → <strong>${Number(last.wellness).toFixed(1)}</strong> (${last.label || "-"})</p>
    <p><strong>General pattern:</strong> Your results suggest <strong>${mainLevel}</strong> across the recorded period.</p>
    <p><strong>Colour breakdown:</strong></p>
    <ul>
      <li>Green: ${counts.green}</li>
      <li>Yellow: ${counts.yellow}</li>
      <li>Red: ${counts.red}</li>
    </ul>
    <p><strong>Next step:</strong> Use the action plan in the main page, and track improvements daily using the weekly chart.</p>
  `;
}

generateReportBtn?.addEventListener("click", buildReport);
printReportBtn?.addEventListener("click", () => window.print());

