// ===== Screen switching =====
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const winnerScreen = document.getElementById("winner-screen");

const startBtn = document.getElementById("start-btn");
const showWinnerBtn = document.getElementById("show-winner-btn");
const restartBtn = document.getElementById("restart-btn");
const resetGameBtn = document.getElementById("reset-game-btn");

function showScreen(screen) {
  [startScreen, gameScreen, winnerScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

startBtn.addEventListener("click", () => showScreen(gameScreen));

restartBtn.addEventListener("click", () => {
  if (confirm("Restablecer todos los datos? (Se perderán los jugadores y sus puntos)")) {
    localStorage.removeItem("trivial_state");
    players = [];
    playerList.innerHTML = "";
    questionText.textContent = "";
    answerText.textContent = "";
    questionArea.classList.add("hidden");
    answerText.classList.add("hidden");
    showScreen(startScreen);
  }
});

resetGameBtn.addEventListener("click", () => {
  if (confirm("Restablecer todos los datos? (Se perderán los jugadores y sus puntos)")) {
    localStorage.removeItem("trivial_state");
    players = [];
    playerList.innerHTML = "";
    questionText.textContent = "";
    answerText.textContent = "";
    questionArea.classList.add("hidden");
    answerText.classList.add("hidden");
    showScreen(startScreen);
  }
});

// ===== Load questions =====
let questions = [];

fetch("../questions.json")  // Already correct
  .then(res => res.json())
  .then(data => {
    questions = data || [];
    console.log("Loaded questions:", questions.length);
  })
  .catch(err => console.error("Failed to load questions:", err));

// ===== Question panel =====
const showQuestionBtn = document.getElementById("show-question-btn");
const showAnswerBtn = document.getElementById("show-answer-btn");
const questionArea = document.getElementById("question-area");
const questionText = document.getElementById("question-text");
const answerText = document.getElementById("answer-text");
const categorySelect = document.getElementById("category-select");

let currentQuestion = null;
let currentAnswer = null;

showQuestionBtn.addEventListener("click", () => {
  if (questions.length === 0) {
    alert("No questions loaded.");
    return;
  }
  const selectedCategory = categorySelect.value;
  let filteredQuestions = questions;
  if (selectedCategory !== "Random") {
    filteredQuestions = questions.filter(q => q.category === selectedCategory);
  }
  if (filteredQuestions.length === 0) {
    alert(`No questions available for category: ${selectedCategory}`);
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
  currentQuestion = filteredQuestions[randomIndex].question;
  currentAnswer = filteredQuestions[randomIndex].answers[0];
  const actualCategory = filteredQuestions[randomIndex].category;  // Get actual category
  questionArea.classList.remove("hidden");
  questionText.textContent = `${actualCategory}: ${currentQuestion}`;  // Show actual category
  answerText.classList.add("hidden");
  saveState();
});

showAnswerBtn.addEventListener("click", () => {
  if (!currentAnswer) {
    alert("No question shown yet.");
    return;
  }
  answerText.textContent = `Respuesta: ${currentAnswer}`;
  answerText.classList.remove("hidden");
  saveState();
});

// ===== Timer =====
let timerInterval = null;
let timeRemaining = 0;
const timerCircle = document.getElementById("timer-progress");
const timerText = document.getElementById("timer-text");
const timerDurationInput = document.getElementById("timer-duration");
const startTimerBtn = document.getElementById("start-timer-btn");
const FULL_DASH_ARRAY = 283;

function startTimer() {
  clearInterval(timerInterval);
  const duration = parseInt(timerDurationInput.value, 10);
  if (isNaN(duration) || duration <= 0) return;
  timeRemaining = duration;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerText.textContent = "Time’s up!";
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerText.textContent = timeRemaining;
  const ratio = timeRemaining / parseInt(timerDurationInput.value, 10);
  const progress = ratio * FULL_DASH_ARRAY;
  timerCircle.style.strokeDashoffset = FULL_DASH_ARRAY - progress;
  timerCircle.style.stroke = ratio > 0.5 ? "green" : ratio > 0.25 ? "orange" : "red";
}

startTimerBtn.addEventListener("click", startTimer);

// ===== Scoreboard =====
const addPlayerBtn = document.getElementById("add-player-btn-game");  // Update ID
const newPlayerName = document.getElementById("new-player-name-game");  // Update ID
const playerList = document.getElementById("player-list");

let players = [];

// ===== Load categories =====
let categories = [];
let specialisations = {};

fetch("../categories.json")
  .then(res => res.json())
  .then(data => {
    categories = data.core || [];
    specialisations = data.specialisations || {};
    // Populate categorySelect
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
    // Add Random option
    const randomOption = document.createElement("option");
    randomOption.value = "Random";
    randomOption.textContent = "Random";
    categorySelect.appendChild(randomOption);
    categorySelect.value = categories[0]?.name || "Random";  // Default to first category or Random
    loadState();
    renderPlayers();
    renderCategoryLegend();
  })
  .catch(err => console.error("Failed to load categories:", err));

// ===== Add player ===== (now in game screen)
addPlayerBtn.addEventListener("click", () => {
  const name = newPlayerName.value.trim();
  if (!name) return;
  players.push({ name, specialisation: null });
  newPlayerName.value = "";
  renderPlayers();
  saveState();
});

// ===== Rendering =====
function renderPlayers() {
  playerList.innerHTML = "";
  if (categories.length === 0) return;

  players.forEach((player, idx) => {
    const li = document.createElement("li");
    li.classList.add("player-entry");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = player.name;
    li.appendChild(nameSpan);

    // Add specialization select
    const specSelect = document.createElement("select");
    specSelect.classList.add("player-spec-select");
    specSelect.innerHTML = '<option value="">No Specialisation</option>';
    Object.keys(specialisations).forEach(spec => {
      const option = document.createElement("option");
      option.value = spec;
      option.textContent = spec;
      if (player.specialisation === spec) option.selected = true;
      specSelect.appendChild(option);
    });
    specSelect.addEventListener("change", () => {
      player.specialisation = specSelect.value || null;
      renderPlayers();  // Re-render to update boxes
      saveState();
    });
    li.appendChild(specSelect);

    const boxesContainer = document.createElement("div");
    boxesContainer.classList.add("player-boxes");

    // Core categories
    categories.forEach(cat => {
      const box = createPlayerBox(idx, cat.name, cat.color);
      boxesContainer.appendChild(box);
    });

    // Specialisation categories
    if (player.specialisation && specialisations[player.specialisation]) {
      specialisations[player.specialisation].forEach(specCat => {
        for (let i = 0; i < specCat.count; i++) {
          const cat = categories.find(c => c.name === specCat.name);
          if (cat) {
            const box = createPlayerBox(idx, `${cat.name}_${i}`, cat.color);
            boxesContainer.appendChild(box);
          }
        }
      });
    }

    li.appendChild(boxesContainer);
    playerList.appendChild(li);
  });

  console.log(document.querySelectorAll(".player-box").length, "boxes rendered");
}

function createPlayerBox(playerIdx, catKey, color) {
  const box = document.createElement("div");
  box.classList.add("player-box");
  box.dataset.playerIndex = playerIdx;
  box.dataset.category = catKey;

  const initial = !!getBoxState(playerIdx, catKey);
  applyBoxStyle(box, color, initial);

  box.addEventListener("click", () => {
    const currentlyFilled = box.classList.contains("filled");
    const newState = !currentlyFilled;
    setBoxState(playerIdx, catKey, newState);
    applyBoxStyle(box, color, newState);
    saveState();
  });

  return box;
}

function applyBoxStyle(box, color, filled) {
  if (filled) {
    box.classList.add("filled");
    box.style.backgroundColor = color;
    box.style.border = `2px solid ${color}`;
  } else {
    box.classList.remove("filled");
    box.style.backgroundColor = hexToPale(color, 0.25);
    box.style.border = `2px solid ${color}`;
  }
}

function hexToPale(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ===== Persistence =====
function saveState() {
  const actualCategory = currentQuestion ? questions.find(q => q.question === currentQuestion)?.category : categorySelect.value;
  const state = {
    players,
    boxes: getAllBoxStates(),
    currentCategory: categorySelect.value,
    lastQuestion: currentQuestion,
    lastAnswer: currentAnswer,
    lastCategory: actualCategory,  // Save actual category
    questionVisible: !questionArea.classList.contains("hidden"),
    answerVisible: !answerText.classList.contains("hidden")
  };
  localStorage.setItem("trivial_state", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("trivial_state");
  if (!saved) return;
  const state = JSON.parse(saved);
  players = state.players || [];
  categorySelect.value = state.currentCategory || categories[0]?.name || "";
  currentQuestion = state.lastQuestion || null;
  currentAnswer = state.lastAnswer || null;
  if (state.questionVisible) {
    questionArea.classList.remove("hidden");
    questionText.textContent = state.lastCategory ? `${state.lastCategory}: ${currentQuestion}` : currentQuestion || "";  // Include category
  }
  if (state.answerVisible) {
    answerText.classList.remove("hidden");
    answerText.textContent = currentAnswer ? `Respuesta: ${currentAnswer}` : "";
  }

  renderPlayers();
}

function getBoxState(playerIdx, catName) {
  const state = JSON.parse(localStorage.getItem("trivial_state") || "{}");
  return state.boxes?.[playerIdx]?.[catName] || false;
}

function setBoxState(playerIdx, catName, value) {
  const state = JSON.parse(localStorage.getItem("trivial_state") || "{}");
  if (!state.boxes) state.boxes = {};
  if (!state.boxes[playerIdx]) state.boxes[playerIdx] = {};
  state.boxes[playerIdx][catName] = value;
  localStorage.setItem("trivial_state", JSON.stringify(state));
}

// Update getAllBoxStates to handle specialization boxes correctly
function getAllBoxStates() {
  const boxes = {};
  players.forEach((player, idx) => {
    boxes[idx] = {};
    categories.forEach(cat => {
      boxes[idx][cat.name] = getBoxState(idx, cat.name);
    });
    // Add specialisation boxes
    if (player.specialisation && specialisations[player.specialisation]) {
      specialisations[player.specialisation].forEach(specCat => {
        for (let i = 0; i < specCat.count; i++) {
          boxes[idx][`${specCat.name}_${i}`] = getBoxState(idx, `${specCat.name}_${i}`);
        }
      });
    }
  });
  return boxes;
}

// ===== End Game =====
showWinnerBtn.addEventListener("click", () => {
  if (players.length === 0) {
    alert("No has añadido jugadores aún!");
    return;
  }
  const winner = prompt("Quién es el ganador?");
  if (winner === null) return;  // Do nothing if cancel pressed
  document.getElementById("winner-name").textContent = winner || "No winner selected";
  showScreen(winnerScreen);
});

window.addEventListener("beforeunload", saveState);

function renderCategoryLegend() {
  const legendContainer = document.getElementById("category-legend");
  if (!legendContainer || categories.length === 0) return;
  legendContainer.innerHTML = "";
  categories.forEach(cat => {
    const item = document.createElement("div");
    item.classList.add("legend-item");
    item.innerHTML = `
      <div class="legend-color" style="background-color: ${cat.color};"></div>
      <span>${cat.name}</span>
    `;
    legendContainer.appendChild(item);
  });
}
