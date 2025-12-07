// MindScan Lite - main logic (final stable version)

// ---------- CONSTANTS ----------
var HISTORY_KEY = "mindscan_history_v1";
var PROFILE_KEY = "mindscan_profile_v1";
var HABITS_KEY = "mindscan_habits_v1";
var THEME_KEY = "mindscan_theme";

// ---------- DOM ELEMENTS ----------
var form = document.getElementById("scanForm");
var clearBtn = document.getElementById("clearBtn");

var resultCard = document.getElementById("resultCard");
var resultBadge = document.getElementById("resultBadge");
var resultLabel = document.getElementById("resultLabel");
var resultScore = document.getElementById("resultScore");
var resultMessage = document.getElementById("resultMessage");
var suggestionList = document.getElementById("suggestionList");

var historyList = document.getElementById("historyList");
var clearHistoryBtn = document.getElementById("clearHistory");

var scoreBarInner = document.getElementById("scoreBarInner");
var scoreBarLabel = document.getElementById("scoreBarLabel");

var wellnessAvatar = document.getElementById("wellnessAvatar");
var avatarText = document.getElementById("avatarText");

// Profile
var profileForm = document.getElementById("profileForm");
var saveProfileBtn = document.getElementById("saveProfileBtn");

// Breathing
var breathingCircle = document.getElementById("breathingCircle");
var breathingInstruction = document.getElementById("breathingInstruction");
var breathingToggle = document.getElementById("breathingToggle");

// Extra tips
var extraTipsBtn = document.getElementById("extraTipsBtn");
var extraTipsList = document.getElementById("extraTipsList");

// Habits
var habitsForm = document.getElementById("habitsForm");
var habitScoreText = document.getElementById("habitScoreText");

// Insights
var insightsText = document.getElementById("insightsText");

// Theme
var themeToggle = document.getElementById("themeToggle");

// ---------- STORAGE HELPERS ----------
function loadHistory() {
  try {
    var data = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function loadProfile() {
  try {
    var data = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return data || {};
  } catch (e) {
    return {};
  }
}

function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

function todayKey() {
  var d = new Date();
  return d.toISOString().slice(0, 10);
}

function loadHabits() {
  try {
    var raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return {};
    var data = JSON.parse(raw);
    return data || {};
  } catch (e) {
    return {};
  }
}

function saveHabits(all) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(all));
}

// ---------- PROFILE ----------
function fillProfileForm() {
  if (!profileForm) return;
  var p = loadProfile();
  profileForm.name.value = p.name || "";
  profileForm.age.value = p.age || "";
  profileForm.gender.value = p.gender || "";
  profileForm.studentId.value = p.studentId || "";
  profileForm.course.value = p.course || "";
  profileForm.email.value = p.email || "";
}

// ---------- SCORING ----------
function computeScore(values) {
  var sleep = Number(values.sleep);
  var energy = Number(values.energy);
  var motivation = Number(values.motivation);
  var stress = Number(values.stress);
  var screen = Number(values.screen);
  var mood = Number(values.mood);

  var sleepPts = sleep;
  var energyPts = energy;
  var motivationPts = motivation;
  var moodPts = mood;

  var stressPenalty = stress;
  var screenPenalty = 0;
  if (screen === 2) screenPenalty = 1;
  if (screen === 3) screenPenalty = 2;

  var raw =
    sleepPts + energyPts + motivationPts + moodPts - (stressPenalty + screenPenalty);

  if (raw < 0) raw = 0;
  return raw;
}

// ---------- INTERPRETATION ----------
function interpretScore(score) {
  var s = Math.max(0, Math.round(score));

  var status, label, message;
  if (s >= 9) {
    status = "green";
    label = "Green - doing okay";
    message =
      "You seem to be in a relatively good state overall. Keep maintaining your healthy behaviours and continue to monitor your stress.";
  } else if (s >= 5) {
    status = "yellow";
    label = "Yellow - mild stress warning";
    message =
      "You show some signs of stress or imbalance. It is a good time to slow down a bit and give yourself more care.";
  } else {
    status = "red";
    label = "Red - high stress risk";
    message =
      "Your answers suggest a high level of stress or low mood. It is important to rest and, if possible, talk to someone you trust.";
  }

  var suggestionMap = {
    0: [
      "Stop everything for a moment and check basic needs: have you eaten, drunk water, and slept enough?",
      "Find a quiet place and do 3–5 minutes of slow breathing before continuing tasks.",
      "If this level continues for several days, please consider contacting a counsellor or trusted adult."
    ],
    1: [
      "Give yourself permission to take a full break from study/work for at least 30 minutes.",
      "Reach out to someone you trust and tell them honestly how you feel.",
      "Avoid big decisions today; focus only on simple, necessary tasks."
    ],
    2: [
      "Choose one small task only and complete it slowly, then rest.",
      "Limit social media for the next few hours to reduce mental overload.",
      "Plan one comforting activity for tonight, such as a warm shower or favourite show."
    ],
    3: [
      "Drink a full glass of water and have a light, balanced snack.",
      "Do a 5-minute stretch for neck, shoulders, and back to release tension.",
      "Write down everything that is worrying you, then circle only what needs attention today."
    ],
    4: [
      "Schedule a short walk (5–10 minutes) outside or along the corridor.",
      "Reduce caffeine for the rest of the day to avoid feeling more wired and anxious.",
      "Set a realistic cut-off time tonight to stop studying and start winding down."
    ],
    5: [
      "Organise your to-do list into: must do today, can do later, can drop.",
      "Take a 5-minute breathing break before starting your next task.",
      "If possible, talk briefly with a friend just to share how your day is going."
    ],
    6: [
      "Protect 10–15 minutes tonight just for yourself (no phone) to unwind.",
      "Swap one unhealthy snack today with a fruit, nuts, or yogurt.",
      "Check your posture while studying and adjust your chair or table height."
    ],
    7: [
      "Plan your next 24 hours with one small goal for sleep, food, and movement.",
      "Do a quick digital declutter: close unused tabs and mute unnecessary notifications.",
      "Celebrate one thing you handled well today, even if it feels small."
    ],
    8: [
      "Maintain your current routine, but add one extra self-care action (for example, stretching before sleep).",
      "Share something positive about your day with someone close to you.",
      "Prepare your study/work area for tomorrow so you can start calmly."
    ],
    9: [
      "Keep the same sleep schedule for the next few days to support your good state.",
      "Use your energy to finish one task you’ve been delaying.",
      "Do something kind for another person; helping others also supports your own wellness."
    ],
    10: [
      "Document what is working well for you now (sleep, food, routine) so you can repeat it later.",
      "Schedule a purposeful break: maybe light exercise, hobby time, or spiritual practice.",
      "Check if there is any small habit that you can improve further, such as drinking more water."
    ],
    11: [
      "Maintain balance: don’t overload yourself just because you feel okay now.",
      "Take a moment to reflect on what you are grateful for today.",
      "Keep practising short breaks to protect your mental energy in the long term."
    ],
    12: [
      "You are doing very well; use this period to build strong habits that will help during stressful times.",
      "Support a friend or classmate who may not be feeling as good as you right now.",
      "Review your weekly schedule to ensure you still have enough time for rest and hobbies."
    ],
    13: [
      "Great score. Continue maintaining your healthy lifestyle and boundaries.",
      "Consider writing down your current routine as a ‘personal wellness plan’ to use during exam weeks.",
      "Remember balance: even when you feel good, rest and downtime are still important."
    ]
  };

  var suggestions = suggestionMap[s];
  if (!suggestions) {
    suggestions = [
      "Take a short break and move your body for a few minutes.",
      "Drink some water and check if you need food or rest.",
      "Plan one small positive action for yourself before the day ends."
    ];
  }

  return { status: status, label: label, message: message, suggestions: suggestions };
}

// ---------- RENDER RESULT ----------
function renderResult(score, interpretation) {
  if (!resultCard) return;

  resultCard.hidden = false;

  resultBadge.classList.remove("status-green", "status-yellow", "status-red");
  if (interpretation.status === "green") {
    resultBadge.classList.add("status-green");
  } else if (interpretation.status === "yellow") {
    resultBadge.classList.add("status-yellow");
  } else {
    resultBadge.classList.add("status-red");
  }

  resultLabel.textContent = interpretation.label;
  resultScore.textContent = "Score: " + score.toFixed(1);
  resultMessage.textContent = interpretation.message;

  // suggestions
  suggestionList.innerHTML = "";
  for (var i = 0; i < interpretation.suggestions.length; i++) {
    var li = document.createElement("li");
    li.textContent = interpretation.suggestions[i];
    suggestionList.appendChild(li);
  }

  // wellness bar
  if (scoreBarInner && scoreBarLabel) {
    var maxScore = 13;
    var pct = (score / maxScore) * 100;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    scoreBarInner.style.width = pct + "%";

    var desc;
    if (interpretation.status === "green") desc = "Wellness level: good";
    else if (interpretation.status === "yellow") desc = "Wellness level: moderate";
    else desc = "Wellness level: low";

    scoreBarLabel.textContent =
      desc + " (" + score.toFixed(1) + " / " + maxScore + ")";
  }

  // wellness avatar
  if (wellnessAvatar && avatarText) {
    var emoji;
    var text;
    if (interpretation.status === "green") {
      emoji = "🟢";
      text =
        "You are generally coping well today. Keep balanced habits and regular breaks.";
    } else if (interpretation.status === "yellow") {
      emoji = "🟡";
      text =
        "Early signs of stress. Try to slow down a bit and use breathing or a short walk.";
    } else {
      emoji = "🔴";
      text =
        "Your stress seems high. Please prioritise rest and, if possible, talk to someone you trust.";
    }
    wellnessAvatar.textContent = emoji;
    avatarText.textContent = text;
  }
}

// ---------- HISTORY ----------
function renderHistory() {
  if (!historyList) return;
  var history = loadHistory();

  historyList.innerHTML = "";
  if (!history.length) {
    var liEmpty = document.createElement("li");
    liEmpty.textContent = "No previous scans yet.";
    historyList.appendChild(liEmpty);
    generateInsights();
    return;
  }

  var copy = history.slice().reverse();
  for (var i = 0; i < copy.length; i++) {
    var item = copy[i];
    var li = document.createElement("li");
    var left = document.createElement("span");
    var right = document.createElement("span");
    left.textContent = item.date + " - " + item.label;
    right.textContent = "Score " + Number(item.score).toFixed(1);
    right.className = "history-score";
    li.appendChild(left);
    li.appendChild(right);
    historyList.appendChild(li);
  }

  generateInsights();
}

// ---------- EXTRA TIPS ----------
var extraTipsPool = [
  "Take 5 deep breaths before you check your phone in the morning.",
  "Keep a water bottle on your table and sip every 20 minutes.",
  "Stand up and stretch for 30 seconds after each long task.",
  "Try to keep one hour before sleep free from social media scrolling.",
  "Write down three things you are grateful for today.",
  "Eat at least one serving of fruit or vegetables with your main meal.",
  "Schedule a ‘no-study’ block this week just for rest or hobbies.",
  "Do a short walk outdoors or near a window to get some daylight.",
  "Lower your screen brightness at night and turn on night mode.",
  "Choose one person to send a kind message to today."
];

function pickRandomTips(n) {
  var copy = extraTipsPool.slice();
  var chosen = [];
  while (copy.length && chosen.length < n) {
    var idx = Math.floor(Math.random() * copy.length);
    chosen.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return chosen;
}

function renderExtraTips() {
  if (!extraTipsList) return;
  extraTipsList.innerHTML = "";
  var tips = pickRandomTips(3);
  for (var i = 0; i < tips.length; i++) {
    var li = document.createElement("li");
    li.textContent = tips[i];
    extraTipsList.appendChild(li);
  }
}

// ---------- BREATHING (4-4-4) ----------
var breathingOn = false;
var breathingTimer = null;

function resetBreathingText() {
  if (breathingInstruction) {
    breathingInstruction.textContent =
      'Tap "Start breathing" to begin a 4–4–4 breathing cycle.';
  }
}

function startBreathingLoop() {
  if (!breathingInstruction) return;
  var phase = 0; // 0 inhale, 1 hold, 2 exhale

  function nextPhase() {
    if (!breathingOn) return;

    if (phase === 0) {
      breathingInstruction.textContent = "Inhale slowly for 4 seconds…";
    } else if (phase === 1) {
      breathingInstruction.textContent = "Hold your breath for 4 seconds…";
    } else {
      breathingInstruction.textContent = "Exhale gently for 4 seconds…";
    }

    if (navigator.vibrate) {
      navigator.vibrate(80);
    }

    phase = (phase + 1) % 3;
    breathingTimer = setTimeout(nextPhase, 4000);
  }

  nextPhase();
}

function stopBreathingLoop() {
  if (breathingTimer) clearTimeout(breathingTimer);
  breathingTimer = null;
  resetBreathingText();
}

if (breathingToggle && breathingCircle) {
  resetBreathingText();
  breathingToggle.addEventListener("click", function () {
    breathingOn = !breathingOn;
    if (breathingOn) {
      breathingCircle.classList.add("breathing-active");
      breathingToggle.textContent = "Stop breathing exercise";
      startBreathingLoop();
    } else {
      breathingCircle.classList.remove("breathing-active");
      breathingToggle.textContent = "Start breathing";
      stopBreathingLoop();
    }
  });
}

// ---------- HABIT TRACKER ----------
function updateHabitUI() {
  if (!habitsForm || !habitScoreText) return;
  var all = loadHabits();
  var today = todayKey();
  var todayData = all[today] || {};
  var total = 5;
  var done = 0;

  ["sleep7", "water", "movement", "mindful", "lowScreen"].forEach(function (name) {
    var input = habitsForm.elements[name];
    if (input) {
      input.checked = !!todayData[name];
      if (input.checked) done++;
    }
  });

  habitScoreText.textContent = "Today’s habit score: " + done + " / " + total;
}

if (habitsForm) {
  habitsForm.addEventListener("change", function () {
    var all = loadHabits();
    var today = todayKey();
    all[today] = {
      sleep7: habitsForm.elements["sleep7"].checked,
      water: habitsForm.elements["water"].checked,
      movement: habitsForm.elements["movement"].checked,
      mindful: habitsForm.elements["mindful"].checked,
      lowScreen: habitsForm.elements["lowScreen"].checked
    };
    saveHabits(all);
    updateHabitUI();
    generateInsights();
  });
}

// ---------- SMART INSIGHTS ----------
function generateInsights() {
  if (!insightsText) return;

  var history = loadHistory();
  if (!history.length) {
    insightsText.textContent =
      "Run MindScan a few times and we will show patterns in your stress, mood and habits here.";
    return;
  }

  var last = history[history.length - 1];
  var total = history.length;
  var sum = 0;
  var redCount = 0;
  var yellowCount = 0;
  var greenCount = 0;

  history.forEach(function (h) {
    var sc = Number(h.score) || 0;
    sum += sc;
    var label = h.label || "";
    if (label.indexOf("Red") === 0) redCount++;
    else if (label.indexOf("Yellow") === 0) yellowCount++;
    else if (label.indexOf("Green") === 0) greenCount++;
  });

  var avg = sum / total;

  var trendText = "";
  if (history.length >= 4) {
    var firstAvg =
      (Number(history[0].score) + Number(history[1].score)) / 2;
    var lastAvg =
      (Number(history[history.length - 1].score) +
        Number(history[history.length - 2].score)) /
      2;

    if (lastAvg - firstAvg > 1) {
      trendText =
        "Your recent scores are improving compared to earlier scans.";
    } else if (firstAvg - lastAvg > 1) {
      trendText =
        "Recent scores are slightly lower than before, which may indicate increasing stress.";
    } else {
      trendText = "Your overall wellness has been fairly stable.";
    }
  }

  var colourText = "";
  if (redCount >= 2) {
    colourText =
      "You have had " +
      redCount +
      " high-stress (red) scans. It may help to plan more rest or talk to someone you trust.";
  } else if (yellowCount > greenCount) {
    colourText =
      "Many of your scans are in the yellow zone. These are early warning signs; small changes in sleep, screen time and breaks can help.";
  } else {
    colourText =
      "Most of your scans are in the green zone. Keep protecting your healthy habits.";
  }

  var predictionText = "";
  if (history.length >= 3) {
    var last3 = history.slice(-3);
    var psum = 0;
    last3.forEach(function (h) {
      psum += Number(h.score) || 0;
    });
    var pred = psum / last3.length;
    var level;
    if (pred >= 9) level = "likely to be in the green zone (doing okay)";
    else if (pred >= 5)
      level = "likely to be in the yellow zone (mild stress)";
    else level = "at risk of entering the red zone (high stress)";

    predictionText =
      "Based on your last three scans, your wellness for the next day is " +
      level +
      ".";
  }

  var habitExtra = "";
  if (habitScoreText) {
    var t = habitScoreText.textContent || "";
    if (t.indexOf("0 / 5") !== -1 || t.indexOf("1 / 5") !== -1) {
      habitExtra =
        "Your habit score today is quite low. Strengthening basic habits (sleep, water, movement, quiet time, low screen) will support better scores.";
    } else if (t.indexOf("4 / 5") !== -1 || t.indexOf("5 / 5") !== -1) {
      habitExtra =
        "You are doing well with your daily habits. This strongly supports your mental health.";
    }
  }

  insightsText.innerHTML =
    "<strong>Latest status:</strong> " +
    last.label +
    " (score " +
    Number(last.score).toFixed(1) +
    ").<br>" +
    "<strong>Average score:</strong> " +
    avg.toFixed(1) +
    " across " +
    total +
    " scans.<br>" +
    (trendText ? "<strong>Trend:</strong> " + trendText + "<br>" : "") +
    "<strong>Colour pattern:</strong> " +
    colourText +
    "<br>" +
    (predictionText
      ? "<strong>Prediction:</strong> " + predictionText + "<br>"
      : "") +
    (habitExtra ? "<strong>Habits:</strong> " + habitExtra : "");
}

// ---------- THEME ----------
function applyThemeFromStorage() {
  var theme = localStorage.getItem(THEME_KEY);
  if (theme === "light") {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    var theme = localStorage.getItem(THEME_KEY);
    if (theme === "light") {
      theme = "dark";
    } else {
      theme = "light";
    }
    localStorage.setItem(THEME_KEY, theme);
    applyThemeFromStorage();
  });
}

// ---------- EVENT LISTENERS ----------

// Main form submit
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var formData = new FormData(form);
    var values = {
      sleep: formData.get("sleep"),
      energy: formData.get("energy"),
      motivation: formData.get("motivation"),
      stress: formData.get("stress"),
      screen: formData.get("screen"),
      mood: formData.get("mood")
    };

    var score = computeScore(values);
    var interpretation = interpretScore(score);
    renderResult(score, interpretation);

    var today = new Date();
    var dateStr = today.toISOString().slice(0, 10);

    var history = loadHistory();
    history.push({
      date: dateStr,
      score: score,
      label: interpretation.label
    });
    saveHistory(history);
    renderHistory();
  });
}

// Clear form
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    if (form) form.reset();
    if (resultCard) resultCard.hidden = true;
  });
}

// Clear history
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", function () {
    if (confirm("Clear all saved scan history from this browser?")) {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
    }
  });
}

// Save profile
if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", function () {
    if (!profileForm) return;
    var data = {
      name: profileForm.name.value.trim(),
      age: profileForm.age.value.trim(),
      gender: profileForm.gender.value,
      studentId: profileForm.studentId.value.trim(),
      course: profileForm.course.value.trim(),
      email: profileForm.email.value.trim()
    };
    saveProfile(data);
    alert("Profile saved successfully!");
  });
}

// Extra tips button
if (extraTipsBtn) {
  extraTipsBtn.addEventListener("click", renderExtraTips);
}

// ---------- INITIALISE ----------
applyThemeFromStorage();
fillProfileForm();
renderHistory();
renderExtraTips();
updateHabitUI();
generateInsights();



  
