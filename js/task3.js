"use strict";

const TOTAL_POINTS = 20;
const MIN_MAIN_SKILL = 5;
const TAKEN_NAMES = ["Arthur", "Merlin", "Lyra", "Borin", "Selene"];
const CLASSES = {
  warrior: { label: "Warrior", main: "strength" },
  mage: { label: "Mage", main: "magic" },
  rogue: { label: "Rogue", main: "agility" },
  paladin: { label: "Paladin", main: "endurance" }
};

const form = document.querySelector("#hero-form");
const nameInput = document.querySelector("#name");
const classSelect = document.querySelector("#class");
const colorSelect = document.querySelector("#color");
const skillInputs = document.querySelectorAll(".skill");
const skillsGroup = document.querySelector("#skills-group");
const skillsError = document.querySelector("#skills-error");
const pointsBox = document.querySelector("#points");
const summaryBox = document.querySelector("#error-summary");
const preview = document.querySelector("#preview");
const roster = document.querySelector("#roster");

form.noValidate = true;

const fields = [nameInput, classSelect, colorSelect, ...skillInputs];
const touched = new Set();

function make(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function skillTotal() {
  let total = 0;
  for (const input of skillInputs) {
    total += Number(input.value);
  }
  return total;
}

function attributeError(field) {
  const v = field.validity;
  if (v.badInput || v.stepMismatch) {
    return "Enter a whole number.";
  }
  if (v.valueMissing) {
    return "This field is required.";
  }
  if (v.tooShort) {
    return `Too short: at least ${field.minLength} characters.`;
  }
  if (v.patternMismatch) {
    return "Use English letters only, no spaces or digits.";
  }
  if (v.rangeUnderflow || v.rangeOverflow) {
    return `Must be from ${field.min} to ${field.max}.`;
  }
  return "";
}

function getError(field) {
  const error = attributeError(field);
  if (error !== "") {
    return error;
  }

  if (field === nameInput) {
    const isTaken = TAKEN_NAMES.some(taken => taken.toLowerCase() === field.value.toLowerCase());
    if (isTaken) {
      return `The name ${field.value} is already taken.`;
    }
  }

  if (field === classSelect) {
    const info = CLASSES[field.value];
    const mainValue = Number(document.querySelector(`#${info.main}`).value);
    if (mainValue < MIN_MAIN_SKILL) {
      return `A ${info.label} needs ${info.main} ${MIN_MAIN_SKILL} or more (now ${mainValue}).`;
    }
  }

  if (field === colorSelect && field.value === "shadow" && classSelect.value !== "rogue") {
    return "The Shadow banner is only for the Rogue class.";
  }
  return "";
}

function totalError() {
  const total = skillTotal();
  if (total !== TOTAL_POINTS) {
    return `Skills must add up to exactly ${TOTAL_POINTS} points (now ${total}).`;
  }
  return "";
}

function validate() {
  const allSkillsTouched = [...skillInputs].every(input => touched.has(input));
  const totalMessage = allSkillsTouched ? totalError() : "";
  skillsError.textContent = totalMessage;
  skillsGroup.classList.toggle("is-invalid", totalMessage !== "");

  for (const field of fields) {
    const isTouched = touched.has(field);
    const message = isTouched ? getError(field) : "";
    const isSkill = field.classList.contains("skill");
    const invalid = message !== "" || (isSkill && totalMessage !== "");

    document.querySelector(`#${field.id}-error`).textContent = message;
    field.setAttribute("aria-invalid", invalid);
    field.classList.toggle("is-invalid", invalid);
    field.classList.toggle("is-valid", isTouched && !invalid);
  }
}

function updatePoints() {
  const left = TOTAL_POINTS - skillTotal();
  pointsBox.textContent = left >= 0 ? `Points left: ${left}` : `Too many points: ${-left} over`;
  pointsBox.classList.toggle("points--done", left === 0);
  pointsBox.classList.toggle("points--over", left < 0);
}

function buildCard() {
  const info = CLASSES[classSelect.value];
  const card = make("article", `hero-card hero-card--${colorSelect.value || "none"}`, "");
  card.classList.toggle("is-empty", nameInput.value === "");

  card.append(
    make("h3", "hero-card__name", nameInput.value || "Unnamed hero"),
    make("p", "hero-card__class", info ? info.label : "No class yet")
  );

  for (const input of skillInputs) {
    const bar = document.createElement("progress");
    bar.max = Number(input.max);
    bar.value = Number(input.value);

    const row = make("div", "skill-row", "");
    row.append(make("span", "", input.labels[0].textContent), bar, make("span", "", Number(input.value)));
    card.append(row);
  }
  return card;
}

function refresh() {
  preview.replaceChildren(buildCard());
  updatePoints();
  validate();
}

for (const field of fields) {
  field.addEventListener("blur", function () {
    touched.add(field);
    validate();
  });
}

form.addEventListener("input", function () {
  summaryBox.classList.add("hidden");
  refresh();
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  for (const field of fields) {
    touched.add(field);
  }
  validate();

  const badFields = fields.filter(field => getError(field) !== "");
  const errorCount = badFields.length + (totalError() === "" ? 0 : 1);

  if (errorCount > 0) {
    summaryBox.textContent = `${errorCount} ${errorCount === 1 ? "error" : "errors"} in the form. Fix them and try again.`;
    summaryBox.classList.remove("hidden");
    (badFields[0] || skillInputs[0]).focus();
    return;
  }

  roster.prepend(buildCard());
  TAKEN_NAMES.push(nameInput.value);
  form.reset();
  touched.clear();
  refresh();
});

refresh();