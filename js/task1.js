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
const LOW_HP = 20;
const LOG_SIZE = 5;

const RESULTS = {
  win: "Victory! The Goblin King is defeated.",
  close: "Narrow victory! You barely survived.",
  loss: "Defeat... The Goblin King wins."
};

const heroBar = document.querySelector("#hero-hp");
const enemyBar = document.querySelector("#enemy-hp");
const heroText = document.querySelector("#hero-hp-text");
const enemyText = document.querySelector("#enemy-hp-text");
const actionButtons = document.querySelectorAll("[data-action]");
const healButton = document.querySelector("#heal-btn");
const resultBox = document.querySelector("#result");
const messageBox = document.querySelector("#message");
const logList = document.querySelector("#log");

let heroHp;
let enemyHp;
let healsLeft;
let isDefending;
let isGameOver;
let outcome;
let log;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollHit(min, max) {
  let damage = randomInt(min, max);
  const isCrit = randomInt(1, 100) <= CRIT_CHANCE;
  if (isCrit) {
    damage = damage * CRIT_MULTIPLIER;
  }
  return { damage: damage, isCrit: isCrit };
}

function addLog(text) {
  log.unshift(text);
  if (log.length > LOG_SIZE) {
    log.pop();
  }
}

function heroTurn(action) {
  if (action === "attack") {
    const hit = rollHit(HERO_MIN_DAMAGE, HERO_MAX_DAMAGE);
    enemyHp = Math.max(0, enemyHp - hit.damage);
    addLog(`${hit.isCrit ? "CRITICAL! " : ""}Hero hits for ${hit.damage}.`);
  } else if (action === "defend") {
    isDefending = true;
    addLog("Hero raises the shield.");
  } else {
    const healed = Math.min(HEAL_AMOUNT, MAX_HP - heroHp);
    heroHp = heroHp + healed;
    healsLeft = healsLeft - 1;
    addLog(`Hero heals ${healed} HP.`);
  }
}

function enemyTurn() {
  const hit = rollHit(ENEMY_MIN_DAMAGE, ENEMY_MAX_DAMAGE);
  let damage = hit.damage;
  let text = "Goblin King hits for";
  if (isDefending) {
    damage = Math.floor(damage / DEFEND_DIVIDER);
    isDefending = false;
    text = "The shield halves the hit! Goblin King hits for";
  }
  heroHp = Math.max(0, heroHp - damage);
  addLog(`${hit.isCrit ? "CRITICAL! " : ""}${text} ${damage}.`);
}

function checkEnd() {
  isGameOver = enemyHp === 0 || heroHp === 0;
  if (enemyHp === 0 && heroHp > LOW_HP) {
    outcome = "win";
  } else if (enemyHp === 0 && heroHp <= LOW_HP) {
    outcome = "close";
  } else if (heroHp === 0) {
    outcome = "loss";
  }
}

function play(action) {
  if (action === "heal" && healsLeft === 0) {
    messageBox.textContent = "No heals left!";
    return;
  }
  if (action === "heal" && heroHp === MAX_HP) {
    messageBox.textContent = "Your HP is already full.";
    return;
  }

  messageBox.textContent = "";
  heroTurn(action);
  if (enemyHp > 0) {
    enemyTurn();
  }
  checkEnd();
  render();
}

function drawBar(bar, text, hp) {
  bar.max = MAX_HP;
  bar.value = hp;
  bar.classList.toggle("is-low", hp <= LOW_HP);
  text.textContent = `${hp} / ${MAX_HP}`;
}

function render() {
  drawBar(heroBar, heroText, heroHp);
  drawBar(enemyBar, enemyText, enemyHp);
  healButton.textContent = `Heal +${HEAL_AMOUNT} (${healsLeft} left)`;

  for (const button of actionButtons) {
    button.disabled = isGameOver;
  }

  resultBox.textContent = RESULTS[outcome] || "";
  resultBox.className = outcome === "" ? "hidden" : `result result--${outcome}`;

  logList.replaceChildren();
  for (const text of log) {
    const item = document.createElement("li");
    item.textContent = text;
    logList.append(item);
  }
}

function resetGame() {
  heroHp = MAX_HP;
  enemyHp = MAX_HP;
  healsLeft = MAX_HEALS;
  isDefending = false;
  isGameOver = false;
  outcome = "";
  log = [];
  messageBox.textContent = "";
  render();
}

for (const button of actionButtons) {
  button.addEventListener("click", function () {
    play(button.dataset.action);
  });
}
document.querySelector("#restart-btn").addEventListener("click", resetGame);

resetGame();