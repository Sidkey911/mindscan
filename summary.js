const PROFILE_KEY = "mindscan_profile_v1";
function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
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

const history = loadHistory();

if (!history.length) {
  summaryNone.hidden = false;
  summaryStats.style.display = "none";
} else {
  const total = history.length;
  const sum = history.reduce((acc, h) => acc + (Number(h.score) || 0), 0);
  const avg = sum / total;

  const last = history[history.length - 1];

  totalScansEl.textContent = total;
  avgScoreEl.textContent = avg.toFixed(1);
  lastDateEl.textContent = last.date || "-";
  lastScoreEl.textContent = Number(last.score).toFixed(1);
  lastLabelEl.textContent = last.label || "-";

  // Category counts
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

  categoryList.innerHTML = "";

  const catItems = [
    { name: "Green - doing okay", value: counts.green },
    { name: "Yellow - mild stress warning", value: counts.yellow },
    { name: "Red - high stress risk", value: counts.red }
  ];

  catItems.forEach((c) => {
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

  // All scans list (newest first)
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
// Load history and profile
const history = loadHistory();
const p = loadProfile();

const summaryNone = document.getElementById("summaryNone");
const summaryStats = document.getElementById("summaryStats");
const totalScansEl = document.getElementById("totalScans");
const avgScoreEl = document.getElementById("avgScore");
const lastDateEl = document.getElementById("lastDate");
const lastScoreEl = document.getElementById("lastScore");
const lastLabelEl = document.getElementById("lastLabel");
const categoryList = document.getElementById("categoryList");
const allScansList = document.getElementById("allScansList");

// Display user profile
document.getElementById("summaryUser").innerHTML = `
  <strong>Name:</strong> ${p.name || "-"} <br>
  <strong>Age:</strong> ${p.age || "-"} <br>
  <strong>Gender:</strong> ${p.gender || "-"} <br>
  <strong>Course:</strong> ${p.course || "-"} <br>
  <strong>Email:</strong> ${p.email || "-"}
`;

// If no scans
if (!history.length) {
  summaryNone.hidden = false;
  summaryStats.style.display = "none";
  return;
}

// Summary calculations
const total = history.length;
const sum = history.reduce((acc, h) => acc + (Number(h.score) || 0), 0);
const avg = sum / total;
const last = history[history.length - 1];

// Insert values
totalScansEl.textContent = total;
avgScoreEl.textContent = avg.toFixed(1);
lastDateEl.textContent = last.date;
lastScoreEl.textContent = Number(last.score).toFixed(1);
lastLabelEl.textContent = last.label;

// Category breakdown
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

// Fill category list
categoryList.innerHTML = "";
["Green", "Yellow", "Red"].forEach((color) => {
  const li = document.createElement("li");
  const left = document.createElement("span");
  const right = document.createElement("span");

  left.textContent = `${color} zone`;
  right.textContent = counts[color.toLowerCase()];

  li.appendChild(left);
  li.appendChild(right);
  categoryList.appendChild(li);
});

// Full scan list
allScansList.innerHTML = "";
history
  .slice()
  .reverse()
  .forEach((item) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${item.date} — ${item.label}</span>
      <span class="history-score">Score ${Number(item.score).toFixed(1)}</span>
    `;

    allScansList.appendChild(li);
  });


