// MindScan Lite - Summary Page

const HISTORY_KEY = "mindscan_history_v2";
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

const reportContent = document.getElementById("reportContent");
const generateReportBtn = document.getElementById("generateReportBtn");
const printReportBtn = document.getElementById("printReportBtn");
const weeklyChartCanvas = document.getElementById("weeklyChart");

let summaryStatsData = {
  total: 0,
  avg: 0,
  counts: { green: 0, yellow: 0, red: 0 },
  last: null,
};

const profile = loadProfile();
if (summaryUser) {
  if (profile && (profile.name || profile.age || profile.gender || profile.course || profile.email)) {
    summaryUser.innerHTML = `
      <strong>Name:</strong> ${profile.name || "-"}<br>
      <strong>Age:</strong> ${profile.age || "-"}<br>
      <strong>Gender:</strong> ${profile.gender || "-"}<br>
      <strong>Course:</strong> ${profile.course || "-"}<br>
      <strong>Email:</strong> ${profile.email || "-"}
    `;
  } else {
    summaryUser.textContent =
      "No profile saved yet. Fill in your details on the main page to personalise your summary.";
  }
}

const history = loadHistory();

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

  summaryStatsData.total = total;
  summaryStatsData.avg = avg;
  summaryStatsData.last = last;

  totalScansEl.textContent = total;
  avgScoreEl.textContent = avg.toFixed(1);
  lastDateEl.textContent = last.date || "-";
  lastScoreEl.textContent = Number(last.wellness).toFixed(1);
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
  summaryStatsData.counts = counts;

  // Category breakdown
  if (categoryList) {
    categoryList.innerHTML = "";
    const cats = [
      { name: "Green – doing okay", value: counts.green },
      { name: "Yellow – mild stress warning", value: counts.yellow },
      { name: "Red – high stress risk", value: counts.red },
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
        left.textContent = `${item.date} – ${item.label}`;
        right.textContent = `Score ${Number(item.wellness).toFixed(1)}`;
        right.className = "history-score";
        li.appendChild(left);
        li.appendChild(right);
        allScansList.appendChild(li);
      });
  }

  // Weekly chart
  if (weeklyChartCanvas) {
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
      const s = arr.reduce((a, b) => a + b, 0);
      return (s / arr.length).toFixed(2);
    });

    new Chart(weeklyChartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Average wellness score",
            data,
            tension: 0.35,
            borderWidth: 2,
          },
        ],
      },
      options: {
        scales: {
          y: {
            suggestedMin: 0,
            suggestedMax: 12,
          },
        },
      },
    });
  }
}

function buildReport() {
  if (!reportContent) return;

  const { total, avg, counts, last } = summaryStatsData;

  if (!total) {
    reportContent.innerHTML =
      "<p>You need at least one scan before a report can be generated.</p>";
    return;
  }

  const mainLevel =
    counts.red > 0 && counts.red >= counts.green && counts.red >= counts.yellow
      ? "high stress risk"
      : counts.yellow >= counts.green
      ? "mild or moderate stress"
      : "generally stable wellness";

  reportContent.innerHTML = `
    <p><strong>Overview:</strong> You have completed <strong>${total}</strong> MindScan sessions with an average wellness score of <strong>${avg.toFixed(
      1
    )}</strong>.</p>
    <p><strong>Latest scan:</strong> On <strong>${last.date ||
      "-"}</strong> your score was <strong>${Number(
    last.wellness
  ).toFixed(1)}</strong> (${last.label || "-"}).</p>
    <p><strong>General pattern:</strong> Your results suggest <strong>${mainLevel}</strong> over the recorded period.</p>
    <p><strong>Colour breakdown:</strong></p>
    <ul>
      <li>Green (doing okay): ${counts.green}</li>
      <li>Yellow (mild stress warning): ${counts.yellow}</li>
      <li>Red (high stress risk): ${counts.red}</li>
    </ul>
    <p><strong>Simple recommendations:</strong> Continue using MindScan regularly, pay attention to days that fall in the yellow/red zone, and combine the check-ins with healthy habits such as proper sleep, movement, hydration, and talking to someone you trust when you feel overwhelmed.</p>
  `;
}

generateReportBtn?.addEventListener("click", buildReport);
printReportBtn?.addEventListener("click", () => {
  window.print();
});

