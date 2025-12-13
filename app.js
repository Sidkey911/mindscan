// =====================
// CONFIG
// =====================
const HISTORY_KEY = "mindscan_history_v3";
const PROFILE_KEY = "mindscan_profile_v1";

// Your deployed Cloudflare Worker (Gemini) URL
const COACH_API_URL = "https://dark-dream-6139.h23a1768.workers.dev/";

// =====================
// UTILITIES & STORAGE
// =====================
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return p || {};
  } catch {
    return {};
  }
}

function loadHistory() {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(h) ? h : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// =====================
// ELEMENTS
// =====================
const profileSection = document.getElementById("profileSection");
const scanSection = document.getElementById("scanSection");
const historyCard = document.getElementById("historyCard");

const profileForm = document.getElementById("profileForm");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileStatus = document.getElementById("profileStatus");

const scanForm = document.getElementById("scanForm");
const clearBtn = document.getElementById("clearBtn");

const resultCard = document.getElementById("resultCard");
const wellnessAvatar = document.getElementById("wellnessAvatar");
const avatarText = document.getElementById("avatarText");
const scoreBarInner = document.getElementById("scoreBarInner");
const scoreBarLabel = document.getElementById("scoreBarLabel");
const resultBadge = document.getElementById("resultBadge");
const resultLabel = document.getElementById("resultLabel");
const resultScore = document.getElementById("resultScore");
const resultMessage = document.getElementById("resultMessage");
const mindMap = document.getElementById("mindMap");
const actionPlanList = document.getElementById("actionPlanList");

const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
const historyContent = document.getElementById("historyContent");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const weeklyChartCanvas = document.getElementById("weeklyChart");

// widgets
const breathingFab = document.getElementById("breathingFab");
const breathingPanel = document.getElementById("breathingPanel");
const closeBreathing = document.getElementById("closeBreathing");
const breathingToggle = document.getElementById("breathingToggle");
const breathingCircle = document.getElementById("breathingCircle");
const breathingInstruction = document.getElementById("breathingInstruction");
const breathingCounter = document.getElementById("breathingCounter");

const coachFab = document.getElementById("coachFab");
const coachPanel = document.getElementById("coachPanel");
const closeCoach = document.getElementById("closeCoach");
const coachMessages = document.getElementById("coachMessages");
const coachForm = document.getElementById("coachForm");
const coachInput = document.getElementById("coachInput");

const tipsFab = document.getElementById("tipsFab");
const tipsPanel = document.getElementById("tipsPanel");
const closeTips = document.getElementById("closeTips");
const tipsList = document.getElementById("tipsList");
const tipsNewBtn = document.getElementById("tipsNewBtn");

let history = loadHistory();
let weeklyChartInstance = null;
let coachHistory = [];

// =====================
// LOGIN FLOW (PROFILE FIRST)
// =====================
function showLoginOnly() {
  if (profileSection) profileSection.style.display = "";
  if (scanSection) scanSection.style.display = "none";
  if (resultCard) resultCard.style.display = "none";
  if (historyCard) historyCard.style.display = "none";
  if (breathingFab) breathingFab.style.display = "none";
  if (coachFab) coachFab.style.display = "none";
  if (tipsFab) tipsFab.style.display = "none";
}

function showMainScan() {
  if (profileSection) profileSection.style.display = "none";
  if (scanSection) scanSection.style.display = "";
  if (historyCard) historyCard.style.display = "";
  if (breathingFab) breathingFab.style.display = "";
  if (coachFab) coachFab.style.display = "";
  if (tipsFab) tipsFab.style.display = "";
  // resultCard stays hidden until first scan
}

// on load, decide which view
const existingProfile = loadProfile();
if (existingProfile && Object.keys(existingProfile).length) {
  // prefill fields (if user wants to see)
  Array.from(profileForm.elements).forEach((el) => {
    if (!el.name) return;
    if (existingProfile[el.name] != null) {
      el.value = existingProfile[el.name];
    }
  });
  showMainScan();
} else {
  showLoginOnly();
}

saveProfileBtn?.addEventListener("click", () => {
  const formData = new FormData(profileForm);
  const profile = {};
  for (const [key, val] of formData.entries()) {
    profile[key] = val.toString();
  }
  if (!profile.name || !profile.age || !profile.gender) {
    profileStatus.textContent = "Please fill in name, age and gender.";
    profileStatus.style.color = "#b91c1c";
    return;
  }
  saveProfile(profile);
  profileStatus.textContent = "Profile saved. Loading MindScan…";
  profileStatus.style.color = "#15803d";

  showMainScan();
});

// =====================
// MAIN SCAN / ALGORITHM
// =====================

// DASS-inspired scoring + daily habits
function computeMindScanResult(values) {
  const MD_raw = values.q1 + values.q2 + values.q3; // mood/depression
  const AN_raw = values.q4 + values.q5 + values.q6; // anxiety
  const ST_raw = values.q7 + values.q8 + values.q9; // stress/tension

  const sleep_diff = 3 - values.sleep;     // lower sleep worsens
  const screen_diff = values.screen - 2;   // more screen time worsens
  const move_diff = 1 - values.move;       // less movement worsens
  const support_diff = 1 - values.support; // less support worsens

  let MD =
    MD_raw +
    0.7 * sleep_diff +
    0.4 * screen_diff -
    0.8 * move_diff -
    0.8 * support_diff;
  let AN =
    AN_raw +
    0.5 * sleep_diff +
    0.9 * screen_diff -
    0.6 * move_diff;
  let ST =
    ST_raw +
    1.0 * sleep_diff +
    1.0 * screen_diff -
    0.5 * move_diff;

  // normalise to 0–12
  MD = clamp((MD / 9) * 12, 0, 12);
  AN = clamp((AN / 9) * 12, 0, 12);
  ST = clamp((ST / 9) * 12, 0, 12);

  const symptomIndex = (MD + AN + ST) / 3;
  const wellnessScore = clamp(12 - symptomIndex, 0, 12);

  let label;
  if (wellnessScore < 4) label = "Red – high stress risk";
  else if (wellnessScore < 8) label = "Yellow – mild to moderate stress";
  else label = "Green – doing okay";

  return {
    wellnessScore,
    label,
    MD,
    AN,
    ST,
    symptomIndex,
  };
}

function buildInsights(current, historyArr) {
  const { MD, AN, ST } = current;

  // main profile type
  let profileType = "Balanced pattern";
  const maxAxis = Math.max(MD, AN, ST);
  if (maxAxis === MD) profileType = "Low mood pattern";
  else if (maxAxis === AN) profileType = "Anxiety / worry pattern";
  else if (maxAxis === ST) profileType = "Overload / tension pattern";

  // risk band
  let riskBand = "low";
  if (current.symptomIndex >= 8) riskBand = "high";
  else if (current.symptomIndex >= 4) riskBand = "medium";

  // trend last 7 days (symptom index)
  const last7 = historyArr.slice(-7);
  const scores = last7.map((h) => h.symptomIndex);
  let trendText = "Not enough data for a clear trend yet.";
  if (scores.length >= 4) {
    const mid = Math.floor(scores.length / 2);
    const firstAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const lastAvg =
      scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
    const diff = lastAvg - firstAvg;
    if (diff > 1) {
      trendText =
        "Your stress symptoms are rising compared to earlier this week.";
    } else if (diff < -1) {
      trendText =
        "Your pattern is improving compared to earlier this week.";
    } else {
      trendText =
        "Your level is fairly stable over the past few days.";
    }
  }

  // simple next day prediction based on last 3 days
  let predictionText =
    "After one scan it is still early to predict tomorrow.";
  if (historyArr.length >= 3) {
    const last3 = historyArr.slice(-3);
    const last3Sym = last3.map((h) => h.symptomIndex);
    const first = last3Sym[0];
    const lastVal = last3Sym[2];
    const trend = lastVal - first;
    const predSymptom = clamp(lastVal + 0.6 * trend, 0, 12);
    const predictedWellness = clamp(12 - predSymptom, 0, 12);

    if (trend > 0.8) {
      predictionText =
        "If nothing changes, tomorrow may feel heavier. Adjusting sleep, screen time and support today can soften this.";
    } else if (trend < -0.8) {
      predictionText =
        "If you keep your current habits, tomorrow is likely to feel a little lighter than today.";
    } else {
      predictionText =
        "Your pattern is quite steady. Tomorrow will probably feel similar unless something big changes.";
    }
    predictionText += ` Estimated wellness tomorrow: about ${predictedWellness.toFixed(
      1
    )} out of 12.`;
  }

  // use last few days of habits to decide management focus
  const recent = historyArr.slice(-5);
  let avgSleep = 3,
    avgScreen = 2,
    avgMove = 1,
    avgSupport = 1;
  if (recent.length) {
    avgSleep =
      recent.reduce((a, h) => a + (h.sleep ?? 3), 0) / recent.length;
    avgScreen =
      recent.reduce((a, h) => a + (h.screen ?? 2), 0) / recent.length;
    avgMove =
      recent.reduce((a, h) => a + (h.move ?? 1), 0) / recent.length;
    avgSupport =
      recent.reduce((a, h) => a + (h.support ?? 1), 0) / recent.length;
  }

  const leverMessages = [];
  if (avgSleep < 2.1) {
    leverMessages.push(
      "Sleep: aim to improve sleep quality by fixing bedtime, reducing bright screens and caffeine late at night."
    );
  }
  if (avgScreen > 2.1) {
    leverMessages.push(
      "Screen time: reduce long non study scrolling, especially in the hour before sleep."
    );
  }
  if (avgMove < 0.6) {
    leverMessages.push(
      "Movement: include at least 10–15 minutes of light exercise or stretching daily."
    );
  }
  if (avgSupport < 0.8) {
    leverMessages.push(
      "Support: reach out to trusted friends, family or mentors more regularly."
    );
  }

  // general action plan based on profile type
  let basePlan = [];
  if (profileType === "Low mood pattern") {
    basePlan = [
      "Keep a simple routine: choose 1–3 small tasks you can complete today.",
      "Add at least one pleasant or meaningful activity (hobby, prayer, nature, music).",
      "Limit long isolation; try to speak with at least one person you trust.",
      "If this low mood continues for 2 weeks or gets worse, consider talking to a counsellor.",
    ];
  } else if (profileType === "Anxiety / worry pattern") {
    basePlan = [
      "Practise 4–4–4 breathing when your body feels tense.",
      "Reduce very stimulating content late at night (horror videos, intense games, too much caffeine).",
      "Write worries down and break them into small steps, focus only on the first step.",
      "If fear or panic stops daily activities, please seek professional support.",
    ];
  } else if (profileType === "Overload / tension pattern") {
    basePlan = [
      "Write down all your tasks, then highlight only the top 3 for today.",
      "Schedule short stretch or walk breaks every 60–90 minutes.",
      "Set a cut off time at night to close your laptop and let your brain cool down.",
      "Ask for help to reprioritise work if deadlines feel impossible.",
    ];
  } else {
    basePlan = [
      "Keep the healthy habits that already work for you.",
      "Notice which days feel easier and copy the same sleep, screen and study pattern.",
      "Use MindScan on tougher weeks to catch early signs of overload.",
    ];
  }

  const fullPlan = [...basePlan];
  if (leverMessages.length) {
    fullPlan.push("Key focus for the next few days:");
    leverMessages.forEach((m) => fullPlan.push(m));
  }

  return {
    profileType,
    riskBand,
    trendText,
    predictionText,
    plan: fullPlan,
  };
}

scanForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(scanForm);
  const vals = {};
  for (let i = 1; i <= 9; i++) {
    vals[`q${i}`] = Number(data.get(`q${i}`));
  }
  vals.sleep = Number(data.get("sleep"));
  vals.screen = Number(data.get("screen"));
  vals.move = Number(data.get("move"));
  vals.support = Number(data.get("support"));

  const result = computeMindScanResult(vals);
  const today = new Date().toISOString().slice(0, 10);

  const entry = {
    date: today,
    wellness: result.wellnessScore,
    label: result.label,
    MD: result.MD,
    AN: result.AN,
    ST: result.ST,
    symptomIndex: result.symptomIndex,
    sleep: vals.sleep,
    screen: vals.screen,
    move: vals.move,
    support: vals.support,
  };
  history.push(entry);
  saveHistory(history);

  renderResult(result, history);
  renderHistory(history);
});

function renderResult(r, historyArr) {
  if (!resultCard) return;
  resultCard.hidden = false;
  resultCard.style.display = "";

  let emoji = "🙂";
  if (r.wellnessScore < 4) emoji = "😟";
  else if (r.wellnessScore < 8) emoji = "😐";
  else emoji = "😊";
  wellnessAvatar.textContent = emoji;
  avatarText.textContent =
    "Your latest check in shows how your mood, anxiety and stress look today.";

  scoreBarInner.style.width = `${(r.wellnessScore / 12) * 100}%`;
  scoreBarLabel.textContent = `Wellness level: ${r.wellnessScore.toFixed(
    1
  )} / 12`;

  resultScore.textContent = `Score: ${r.wellnessScore.toFixed(1)}`;
  resultLabel.textContent = r.label;

  resultBadge.classList.remove("status-green", "status-yellow", "status-red");
  if (r.wellnessScore < 4) {
    resultBadge.classList.add("status-red");
    resultMessage.textContent =
      "Your stress level is high today. Slow down and give yourself more care. Use the action plan and consider talking to someone you trust.";
  } else if (r.wellnessScore < 8) {
    resultBadge.classList.add("status-yellow");
    resultMessage.textContent =
      "You show some signs of stress. This is a good time to adjust your habits and protect your energy.";
  } else {
    resultBadge.classList.add("status-green");
    resultMessage.textContent =
      "You are generally doing okay today. Keep the habits that work for you.";
  }

  const insight = buildInsights(r, historyArr);

  mindMap.innerHTML = `
    <div class="mindmap-section">
      <div class="mindmap-title">Central node: Today s profile</div>
      <ul class="mindmap-branch">
        <li>Profile: <strong>${insight.profileType}</strong></li>
        <li>Risk level: <strong>${insight.riskBand.toUpperCase()}</strong></li>
        <li>Mood index (MD): ${r.MD.toFixed(1)}</li>
        <li>Anxiety index (AN): ${r.AN.toFixed(1)}</li>
        <li>Stress index (ST): ${r.ST.toFixed(1)}</li>
      </ul>
    </div>
    <div class="mindmap-section">
      <div class="mindmap-title">Branch: Recent pattern</div>
      <ul class="mindmap-branch">
        <li>${insight.trendText}</li>
      </ul>
    </div>
    <div class="mindmap-section">
      <div class="mindmap-title">Branch: Tomorrow outlook</div>
      <ul class="mindmap-branch">
        <li>${insight.predictionText}</li>
      </ul>
    </div>
  `;

  actionPlanList.innerHTML = "";
  insight.plan.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    actionPlanList.appendChild(li);
  });
}

clearBtn?.addEventListener("click", () => {
  scanForm.reset();
});

// =====================
// HISTORY & WEEKLY CHART
// =====================
function renderHistory(arr) {
  if (!historyList || !weeklyChartCanvas) return;

  historyList.innerHTML = "";
  arr
    .slice()
    .reverse()
    .forEach((item) => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = `${item.date} – ${item.label}`;
      right.textContent = `Score ${item.wellness.toFixed(1)}`;
      right.className = "history-score";
      li.appendChild(left);
      li.appendChild(right);
      historyList.appendChild(li);
    });

  const byDate = {};
  arr.forEach((h) => {
    if (!byDate[h.date]) byDate[h.date] = [];
    byDate[h.date].push(h.wellness);
  });

  const allDates = Object.keys(byDate).sort();
  const last7 = allDates.slice(-7);
  const labels = last7;
  const data = last7.map((d) => {
    const v = byDate[d];
    return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2);
  });

  if (weeklyChartInstance) weeklyChartInstance.destroy();
  if (labels.length) {
    weeklyChartInstance = new Chart(weeklyChartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Wellness score",
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

toggleHistoryBtn?.addEventListener("click", () => {
  const hidden = historyContent.hidden;
  historyContent.hidden = !hidden;
  toggleHistoryBtn.textContent = hidden ? "Hide history" : "Show history";
});

clearHistoryBtn?.addEventListener("click", () => {
  if (!confirm("Clear all previous scans?")) return;
  history = [];
  saveHistory(history);
  renderHistory(history);
});

if (history.length) {
  renderHistory(history);
}

// =====================
// BREATHING 4 4 4
// =====================
let breathingTimer = null;
let breathingPhaseTimer = null;

function stopBreathing() {
  breathingCircle.classList.remove("breathing-active");
  breathingInstruction.textContent =
    "Tap “Start” to begin one minute of guided breathing.";
  breathingCounter.textContent = "Ready";
  breathingToggle.textContent = "Start";
  if (breathingTimer) {
    clearTimeout(breathingTimer);
    breathingTimer = null;
  }
  if (breathingPhaseTimer) {
    clearInterval(breathingPhaseTimer);
    breathingPhaseTimer = null;
  }
}

breathingFab?.addEventListener("click", () => {
  breathingPanel.hidden = !breathingPanel.hidden;
});

closeBreathing?.addEventListener("click", () => {
  stopBreathing();
  breathingPanel.hidden = true;
});

breathingToggle?.addEventListener("click", () => {
  if (breathingTimer) {
    stopBreathing();
    return;
  }

  breathingCircle.classList.add("breathing-active");
  breathingToggle.textContent = "Stop";

  let total = 60;
  let phase = "inhale";
  let phaseTime = 4;
  let count = 4;

  breathingInstruction.textContent = "Inhale 4 seconds";
  breathingCounter.textContent = "4";

  breathingPhaseTimer = setInterval(() => {
    phaseTime--;
    total--;
    count--;

    if (count >= 0) breathingCounter.textContent = String(count);

    if (phaseTime <= 0) {
      phaseTime = 4;
      count = 4;
      if (phase === "inhale") {
        phase = "hold";
        breathingInstruction.textContent = "Hold 4 seconds";
      } else if (phase === "hold") {
        phase = "exhale";
        breathingInstruction.textContent = "Exhale 4 seconds";
      } else {
        phase = "inhale";
        breathingInstruction.textContent = "Inhale 4 seconds";
      }
    }

    if (total <= 0) {
      stopBreathing();
    }
  }, 1000);

  breathingTimer = setTimeout(stopBreathing, 65000);
});

// =====================
// PRESENTATION MODE (final touch)
// =====================
const presentToggle = document.getElementById("presentToggle");
let isPresentation = false;

presentToggle?.addEventListener("click", () => {
  isPresentation = !isPresentation;

  if (historyCard) historyCard.style.display = isPresentation ? "none" : "";
  if (breathingFab) breathingFab.style.display = isPresentation ? "none" : "";
  if (coachFab) coachFab.style.display = isPresentation ? "none" : "";
  if (tipsFab) tipsFab.style.display = isPresentation ? "none" : "";

  if (breathingPanel) breathingPanel.hidden = true;
  if (coachPanel) coachPanel.hidden = true;
  if (tipsPanel) tipsPanel.hidden = true;

  presentToggle.textContent = isPresentation ? "Exit presentation mode" : "Presentation mode";
});

// =====================
// WELLNESS COACH (Gemini via Worker)
// =====================
function pushMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "msg-user" : "msg-bot");
  div.textContent = (role === "user" ? "You: " : "Coach: ") + text;
  coachMessages.appendChild(div);
  coachMessages.scrollTop = coachMessages.scrollHeight;
}

coachFab?.addEventListener("click", () => {
  coachPanel.hidden = !coachPanel.hidden;
});

closeCoach?.addEventListener("click", () => {
  coachPanel.hidden = true;
});

coachForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = coachInput.value.trim();
  if (!text) return;

  pushMessage("user", text);
  coachHistory.push({ role: "user", content: text });
  coachInput.value = "";

  pushMessage("assistant", "Thinking…");
  const loading = coachMessages.lastChild;

  try {
    const latest = history[history.length - 1] || null;
    const profile = loadProfile();

    const res = await fetch(COACH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        chatHistory: coachHistory,
        latestScan: latest,
        profile,
      }),
    });

    const json = await res.json();
    const ans = json.answer || "Sorry, I could not generate a reply.";
    coachHistory.push({ role: "assistant", content: ans });
    loading.textContent = "Coach: " + ans;
  } catch (err) {
    loading.textContent =
      "Coach: Sorry, there was a problem contacting the wellness coach.";
  }
});

// =====================
// TIPS WIDGET
// =====================
const tipsPool = [
  "Drink a full glass of water and stretch your shoulders and neck.",
  "Choose one small task and complete it fully before opening social media.",
  "Spend 5 minutes outside or near a window and notice what you can see and hear.",
  "Write down three things that went okay today, even if they are small.",
  "Reduce bright screen use 30 minutes before sleep and switch to a calm activity.",
  "Send a short supportive message to a friend, even just to say hi.",
  "Prepare your bag or to do list for tomorrow so your mind can rest easier tonight.",
];

function showRandomTip() {
  const tip = tipsPool[Math.floor(Math.random() * tipsPool.length)];
  tipsList.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = tip;
  tipsList.appendChild(li);
}

tipsFab?.addEventListener("click", () => {
  tipsPanel.hidden = !tipsPanel.hidden;
  if (!tipsPanel.hidden) {
    showRandomTip();
  }
});

closeTips?.addEventListener("click", () => {
  tipsPanel.hidden = true;
});

tipsNewBtn?.addEventListener("click", showRandomTip);

