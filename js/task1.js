"use strict";

const MAX_HP = 100;
const HERO_MIN_DAMAGE = 8;
const HERO_MAX_DAMAGE = 15;
const ENEMY_MIN_DAMAGE = 5;
const ENEMY_MAX_DAMAGE = 14;
const HEAL_AMOUNT = 20;
const MAX_HEALS = 3;
const CRIT_CHANCE = 10;
const CRIT_MULTIPLIER = 2;
const DEFEND_DIVIDER = 2;
const LOG_SIZE = 5;
const LOW_HP_PERCENT = 30;
const MID_HP_PERCENT = 60;
const CLOSE_CALL_HP = 20;

const heroCard = document.querySelector("#hero");
const enemyCard = document.querySelector("#enemy");
const heroHpBar = document.querySelector("#hero-hp");
const enemyHpBar = document.querySelector("#enemy-hp");
const heroHpText = document.querySelector("#hero-hp-text");
const enemyHpText = document.querySelector("#enemy-hp-text");
const heroStatus = document.querySelector("#hero-status");
const enemyStatus = document.querySelector("#enemy-status");
const actionsBox = document.querySelector("#actions");
const actionButtons = document.querySelectorAll("[data-action]");
const healButton = document.querySelector("#heal-btn");
const restartButton = document.querySelector("#restart-btn");
const resultBox = document.querySelector("#result");
const messageBox = document.querySelector("#message");
const turnText = document.querySelector("#turn");
const winsText = document.querySelector("#wins");
const lossesText = document.querySelector("#losses");
const logList = document.querySelector("#log");

let heroHp;
let enemyHp;
let healsLeft;
let isDefending;
let isGameOver;
let turn;
let log;
let outcome;
let heroWasHit;
let enemyWasHit;
let wins = 0;
let losses = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollCrit() {
  return randomInt(1, 100) <= CRIT_CHANCE;
}

function addLog(text, type) {
  log.unshift({ text: text, type: type });
  if (log.length > LOG_SIZE) {
    log.pop();
  }
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.classList.remove("msg--error", "msg--success", "msg--warn");
  if (type) {
    messageBox.classList.add("msg--" + type);
  }
}

function heroAttack() {
  let damage = randomInt(HERO_MIN_DAMAGE, HERO_MAX_DAMAGE);
  const isCrit = rollCrit();
  if (isCrit) {
    damage = damage * CRIT_MULTIPLIER;
  }
  enemyHp = Math.max(0, enemyHp - damage);
  enemyWasHit = true;

  if (isCrit) {
    addLog("Turn " + turn + ": CRITICAL! Hero hits for " + damage + ".", "crit");
  } else {
    addLog("Turn " + turn + ": Hero hits for " + damage + ".", "");
  }
}

function heroDefend() {
  isDefending = true;
  addLog("Turn " + turn + ": Hero raises the shield.", "");
}

function heroHeal() {
  const before = heroHp;
  heroHp = Math.min(MAX_HP, heroHp + HEAL_AMOUNT);
  healsLeft = healsLeft - 1;
  addLog("Turn " + turn + ": Hero heals +" + (heroHp - before) + " HP.", "heal");
}

function enemyAttack() {
  let damage = randomInt(ENEMY_MIN_DAMAGE, ENEMY_MAX_DAMAGE);
  const isCrit = rollCrit();
  if (isCrit) {
    damage = damage * CRIT_MULTIPLIER;
  }

  let text = "Goblin King hits for ";
  if (isDefending) {
    damage = Math.ceil(damage / DEFEND_DIVIDER);
    text = "Shield blocks half! Goblin King hits for ";
    isDefending = false;
  }
  if (isCrit) {
    text = "CRITICAL! " + text;
  }

  heroHp = Math.max(0, heroHp - damage);
  heroWasHit = true;
  addLog("Turn " + turn + ": " + text + damage + ".", isCrit ? "crit" : "");
}

function checkEnd() {
  if (enemyHp === 0 && heroHp > CLOSE_CALL_HP) {
    outcome = "win";
  } else if (enemyHp === 0 && heroHp <= CLOSE_CALL_HP) {
    outcome = "close";
  } else if (heroHp === 0) {
    outcome = "loss";
  }

  isGameOver = enemyHp === 0 || heroHp === 0;

  if (isGameOver && outcome === "loss") {
    losses++;
  } else if (isGameOver) {
    wins++;
  }
}

function play(action) {
  if (isGameOver) {
    showMessage("The battle is over. Press Restart (R) to fight again.", "error");
    return;
  }
  if (action !== "attack" && action !== "defend" && action !== "heal") {
    showMessage("Unknown action.", "error");
    return;
  }
  if (action === "heal" && healsLeft === 0) {
    showMessage("No heals left — you can heal only " + MAX_HEALS + (MAX_HEALS === 1 ? " time." : " times."), "error");
    return;
  }
  if (action === "heal" && heroHp === MAX_HP) {
    showMessage("Your HP is already full, healing would be wasted.", "error");
    return;
  }

  turn++;
  heroWasHit = false;
  enemyWasHit = false;

  if (action === "attack") {
    heroAttack();
  } else if (action === "defend") {
    heroDefend();
  } else {
    heroHeal();
  }

  if (enemyHp > 0) {
    enemyAttack();
  }

  checkEnd();

  if (isGameOver) {
    showMessage("Press Restart (R) to play again.", outcome === "loss" ? "error" : "success");
  } else {
    showMessage("Your turn: attack, defend or heal.", "");
  }
  render();
}

function hpLevelClass(hp) {
  const percent = (hp / MAX_HP) * 100;
  if (percent <= LOW_HP_PERCENT) {
    return "is-low";
  }
  if (percent <= MID_HP_PERCENT) {
    return "is-mid";
  }
  return "";
}

function drawBar(bar, text, hp) {
  bar.max = MAX_HP;
  bar.value = hp;
  bar.classList.remove("is-low", "is-mid");
  const level = hpLevelClass(hp);
  if (level !== "") {
    bar.classList.add(level);
  }
  text.textContent = hp + " / " + MAX_HP;
}

function flash(card, wasHit) {
  card.classList.remove("is-hit");
  if (wasHit) {
    void card.offsetWidth;
    card.classList.add("is-hit");
  }
}

function render() {
  drawBar(heroHpBar, heroHpText, heroHp);
  drawBar(enemyHpBar, enemyHpText, enemyHp);

  heroStatus.textContent = "Heals left: " + healsLeft + " / " + MAX_HEALS;
  enemyStatus.textContent = "Hits back for " + ENEMY_MIN_DAMAGE + "–" + ENEMY_MAX_DAMAGE +
    " (crit chance " + CRIT_CHANCE + "%)";

  heroCard.classList.toggle("is-defeated", heroHp === 0);
  enemyCard.classList.toggle("is-defeated", enemyHp === 0);
  flash(heroCard, heroWasHit);
  flash(enemyCard, enemyWasHit);

  for (const button of actionButtons) {
    button.disabled = isGameOver;
  }
  healButton.disabled = isGameOver || healsLeft === 0;
  healButton.textContent = "Heal +" + HEAL_AMOUNT + " (" + healsLeft + ")";

  resultBox.classList.remove("result--win", "result--close", "result--loss");
  resultBox.classList.toggle("hidden", !isGameOver);
  if (outcome === "win") {
    resultBox.textContent = "Victory! The Goblin King is defeated.";
    resultBox.classList.add("result--win");
  } else if (outcome === "close") {
    resultBox.textContent = "Narrow victory! You won with only " + heroHp + " HP.";
    resultBox.classList.add("result--close");
  } else if (outcome === "loss") {
    resultBox.textContent = "Defeat… The Goblin King wins this time.";
    resultBox.classList.add("result--loss");
  }

  turnText.textContent = turn;
  winsText.textContent = wins;
  lossesText.textContent = losses;

  logList.replaceChildren();
  if (log.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No actions yet. Make the first move!";
    li.classList.add("log--empty");
    logList.append(li);
  }
  for (const entry of log) {
    const li = document.createElement("li");
    li.textContent = entry.text;
    if (entry.type !== "") {
      li.classList.add("log--" + entry.type);
    }
    logList.append(li);
  }
}

function resetGame() {
  heroHp = MAX_HP;
  enemyHp = MAX_HP;
  healsLeft = MAX_HEALS;
  isDefending = false;
  isGameOver = false;
  turn = 0;
  log = [];
  outcome = "";
  heroWasHit = false;
  enemyWasHit = false;
  showMessage("A wild Goblin King appears! Choose your action.", "");
  render();
}

actionsBox.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (button === null) {
    return;
  }
  play(button.dataset.action);
});

restartButton.addEventListener("click", function () {
  resetGame();
  actionButtons[0].focus();
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "a") {
    play("attack");
  } else if (key === "d") {
    play("defend");
  } else if (key === "h") {
    play("heal");
  } else if (key === "r") {
    resetGame();
  }
});

resetGame();