// MindScan Lite - Summary Page (final stable version)

var HISTORY_KEY = "mindscan_history_v1";
var PROFILE_KEY = "mindscan_profile_v1";

function loadHistory() {
  try {
    var raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    var data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function loadProfile() {
  try {
    var raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    var data = JSON.parse(raw);
    return data || {};
  } catch (e) {
    return {};
  }
}

window.addEventListener("DOMContentLoaded", function () {
  var summaryNone = document.getElementById("summaryNone");
  var summaryStats = document.getElementById("summaryStats");
  var totalScansEl = document.getElementById("totalScans");
  var avgScoreEl = document.getElementById("avgScore");
  var lastDateEl = document.getElementById("lastDate");
  var lastScoreEl = document.getElementById("lastScore");
  var lastLabelEl = document.getElementById("lastLabel");
  var categoryList = document.getElementById("categoryList");
  var allScansList = document.getElementById("allScansList");
  var summaryUser = document.getElementById("summaryUser");

  var reportContent = document.getElementById("reportContent");
  var generateReportBtn = document.getElementById("generateReportBtn");
  var printReportBtn = document.getElementById("printReportBtn");
  var weeklyCanvas = document.getElementById("weeklyChart");

  var summaryStatsData = {
    total: 0,
    avg: 0,
    counts: { green: 0, yellow: 0, red: 0 },
    last: null
  };

  // ---------- USER PROFILE ----------
  var p = loadProfile();
  if (summaryUser) {
    if (p && (p.name || p.age || p.gender || p.course || p.email)) {
      summaryUser.innerHTML =
        "<strong>Name:</strong> " + (p.name || "-") + "<br>" +
        "<strong>Age:</strong> " + (p.age || "-") + "<br>" +
        "<strong>Gender:</strong> " + (p.gender || "-") + "<br>" +
        "<strong>Course:</strong> " + (p.course || "-") + "<br>" +
        "<strong>Email:</strong> " + (p.email || "-");
    } else {
      summaryUser.textContent =
        "No profile saved yet. Fill in your details on the main page to personalise your summary.";
    }
  }

  // ---------- HISTORY ----------
  var history = loadHistory();

  if (!history.length) {
    if (summaryNone) summaryNone.hidden = false;
    if (summaryStats) summaryStats.style.display = "none";
  } else {
    if (summaryNone) summaryNone.hidden = true;
    if (summaryStats) summaryStats.style.display = "block";

    var total = history.length;
    var sum = history.reduce(function (acc, h) {
      return acc + (Number(h.score) || 0);
    }, 0);
    var avg = sum / total;
    var last = history[history.length - 1];

    // Counts for colours
    var counts = history.reduce(
      function (acc, h) {
        var label = h.label || "";
        if (label.indexOf("Green") === 0) acc.green++;
        else if (label.indexOf("Yellow") === 0) acc.yellow++;
        else if (label.indexOf("Red") === 0) acc.red++;
        return acc;
      },
      { green: 0, yellow: 0, red: 0 }
    );

    summaryStatsData = {
      total: total,
      avg: avg,
      counts: counts,
      last: last
    };

    // Overall stats
    if (totalScansEl) totalScansEl.textContent = total;
    if (avgScoreEl) avgScoreEl.textContent = avg.toFixed(1);
    if (lastDateEl) lastDateEl.textContent = last.date || "-";
    if (lastScoreEl) lastScoreEl.textContent = Number(last.score).toFixed(1);
    if (lastLabelEl) lastLabelEl.textContent = last.label || "-";

    // Category breakdown
    if (categoryList) {
      categoryList.innerHTML = "";
      var cats = [
        { name: "Green - doing okay", value: counts.green },
        { name: "Yellow - mild stress warning", value: counts.yellow },
        { name: "Red - high stress risk", value: counts.red }
      ];
      cats.forEach(function (c) {
        var li = document.createElement("li");
        var left = document.createElement("span");
        var right = document.createElement("span");
        left.textContent = c.name;
        right.textContent = c.value;
        right.className = "history-score";
        li.appendChild(left);
        li.appendChild(right);
        categoryList.appendChild(li);
      });
    }

    // All scans list (newest first)
    if (allScansList) {
      allScansList.innerHTML = "";
      history
        .slice()
        .reverse()
        .forEach(function (item) {
          var li = document.createElement("li");
          var left = document.createElement("span");
          var right = document.createElement("span");
          left.textContent = item.date + " - " + item.label;
          right.textContent = "Score " + Number(item.score).toFixed(1);
          right.className = "history-score";
          li.appendChild(left);
          li.appendChild(right);
          allScansList.appendChild(li);
        });
    }

    // ---------- WEEKLY CHART ----------
    if (weeklyCanvas && window.Chart) {
      var byDate = {};
      history.forEach(function (h) {
        if (!h.date) return;
        if (!byDate[h.date]) byDate[h.date] = [];
        byDate[h.date].push(Number(h.score) || 0);
      });

      var allDates = Object.keys(byDate).sort(); // ascending
      var last7 = allDates.slice(-7);

      var labels = last7;
      var data = last7.map(function (d) {
        var arr = byDate[d];
        var s = arr.reduce(function (a, b) { return a + b; }, 0);
        return (s / arr.length).toFixed(2);
      });

      var ctx = weeklyCanvas.getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Average score",
              data: data,
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
  }

  // ---------- PERSONAL REPORT ----------
  function buildReport() {
    if (!reportContent) return;

    var total = summaryStatsData.total;
    var avg = summaryStatsData.avg;
    var counts = summaryStatsData.counts;
    var last = summaryStatsData.last;

    if (!total) {
      reportContent.innerHTML =
        "<p>You need at least one scan before a report can be generated.</p>";
      return;
    }

    var mainLevel =
      counts.red > 0 && counts.red >= counts.green && counts.red >= counts.yellow
        ? "high stress risk"
        : counts.yellow >= counts.green
        ? "mild or moderate stress"
        : "generally stable wellness";

    reportContent.innerHTML =
      "<p><strong>Overview:</strong> You have completed <strong>" +
      total +
      "</strong> MindScan sessions with an average score of <strong>" +
      avg.toFixed(1) +
      "</strong>.</p>" +
      "<p><strong>Latest scan:</strong> On <strong>" +
      (last.date || "-") +
      "</strong> your score was <strong>" +
      Number(last.score).toFixed(1) +
      "</strong> (" +
      (last.label || "-") +
      ").</p>" +
      "<p><strong>General pattern:</strong> Your results suggest <strong>" +
      mainLevel +
      "</strong> over the recorded period.</p>" +
      "<p><strong>Colour breakdown:</strong></p>" +
      "<ul>" +
      "<li>Green (doing okay): " +
      counts.green +
      "</li>" +
      "<li>Yellow (mild stress warning): " +
      counts.yellow +
      "</li>" +
      "<li>Red (high stress risk): " +
      counts.red +
      "</li>" +
      "</ul>" +
      "<p><strong>Simple recommendations:</strong> Continue using MindScan regularly, pay attention to days that fall in the yellow/red zone, and combine the check-ins with healthy habits such as proper sleep, movement, hydration, and talking to someone you trust when you feel overwhelmed.</p>";
  }

  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", buildReport);
  }

  if (printReportBtn) {
    printReportBtn.addEventListener("click", function () {
      window.print();
    });
  }
});
