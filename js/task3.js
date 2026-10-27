"use strict";

const TOTAL_POINTS = 20;
const MIN_MAIN_SKILL = 5;
const SKILLS = ["strength", "magic", "agility", "endurance"];
const SKILL_NAMES = { strength: "Strength", magic: "Magic", agility: "Agility", endurance: "Endurance" };
const CLASSES = {
  warrior: { label: "Warrior", main: "strength" },
  mage: { label: "Mage", main: "magic" },
  rogue: { label: "Rogue", main: "agility" },
  paladin: { label: "Paladin", main: "endurance" }
};
const RESERVED_COLOR = "shadow";
const RESERVED_COLOR_CLASS = "rogue";
const takenNames = ["Arthur", "Merlin", "Lyra", "Borin", "Selene"];

const form = document.querySelector("#hero-form");
const nameInput = document.querySelector("#name");
const classSelect = document.querySelector("#hero-class");
const colorRadios = form.querySelectorAll('input[name="color"]');
const colorGroup = document.querySelector("#color-group");
const skillsGroup = document.querySelector("#skills-group");
const mottoInput = document.querySelector("#motto");
const pointsBox = document.querySelector("#points");
const summaryBox = document.querySelector("#error-summary");
const summaryTitle = document.querySelector("#error-summary-title");
const summaryList = document.querySelector("#error-list");
const preview = document.querySelector("#preview");
const successBox = document.querySelector("#success");
const roster = document.querySelector("#roster");
const rosterTitle = document.querySelector("#roster-title");

const skillInputs = {};
for (const skill of SKILLS) {
  skillInputs[skill] = document.querySelector("#" + skill);
}

form.noValidate = true;

const touched = new Set();

function skillValue(skill) {
  const value = Number(skillInputs[skill].value);
  if (skillInputs[skill].value === "" || Number.isNaN(value)) {
    return 0;
  }
  return value;
}

function selectedColor() {
  for (const radio of colorRadios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return "";
}

function skillTotal() {
  let sum = 0;
  for (const skill of SKILLS) {
    sum += skillValue(skill);
  }
  return sum;
}

function readForm() {
  const skills = {};
  for (const skill of SKILLS) {
    skills[skill] = skillValue(skill);
  }
  return {
    name: nameInput.value.trim(),
    heroClass: classSelect.value,
    color: selectedColor(),
    motto: mottoInput.value.trim(),
    skills: skills
  };
}

function nameError() {
  nameInput.setCustomValidity("");
  const value = nameInput.value.trim();
  const v = nameInput.validity;
  if (v.valueMissing || value === "") {
    return "Enter a name for your hero.";
  }
  if (v.tooShort || value.length < Number(nameInput.minLength)) {
    return "The name is too short: at least " + nameInput.minLength + " characters.";
  }
  if (v.tooLong) {
    return "The name is too long: at most " + nameInput.maxLength + " characters.";
  }
  if (v.patternMismatch) {
    return "Start with a letter and use only English letters, spaces, ' or -.";
  }

  const isTaken = takenNames.some(function (taken) {
    return taken.toLowerCase() === value.toLowerCase();
  });
  if (isTaken) {
    return "“" + value + "” is already taken by another hero. Choose another name.";
  }
  return "";
}

function classError() {
  classSelect.setCustomValidity("");
  if (classSelect.validity.valueMissing) {
    return "Choose a class.";
  }
  const info = CLASSES[classSelect.value];
  const main = info.main;
  const mainValue = skillValue(main);

  if (mainValue < MIN_MAIN_SKILL) {
    return "A " + info.label + " needs " + SKILL_NAMES[main] + " " + MIN_MAIN_SKILL +
      " or more (now " + mainValue + ").";
  }

  for (const skill of SKILLS) {
    if (skill !== main && skillValue(skill) > mainValue) {
      return "A " + info.label + "'s highest skill must be " + SKILL_NAMES[main] +
        ", but " + SKILL_NAMES[skill] + " (" + skillValue(skill) + ") is higher.";
    }
  }
  return "";
}

function colorError() {
  colorRadios[0].setCustomValidity("");
  const color = selectedColor();
  if (color === "") {
    return "Pick a banner color.";
  }

  if (color === RESERVED_COLOR && classSelect.value !== RESERVED_COLOR_CLASS) {
    return "The Shadow banner is reserved for the Rogue class.";
  }
  return "";
}

function skillError(skill) {
  const input = skillInputs[skill];
  input.setCustomValidity("");
  const v = input.validity;
  if (v.badInput) {
    return "Enter a number.";
  }
  if (v.valueMissing) {
    return "Enter a value from " + input.min + " to " + input.max + ".";
  }
  if (v.rangeUnderflow || v.rangeOverflow) {
    return "Must be from " + input.min + " to " + input.max + ".";
  }
  if (v.stepMismatch) {
    return "Use a whole number.";
  }
  return "";
}

function totalError() {
  const total = skillTotal();
  if (total !== TOTAL_POINTS) {
    return "Skills must add up to exactly " + TOTAL_POINTS + " points (now " + total + ").";
  }
  return "";
}

function getErrors() {
  const errors = {
    name: nameError(),
    heroClass: classError(),
    color: colorError(),
    total: totalError()
  };
  for (const skill of SKILLS) {
    errors[skill] = skillError(skill);
  }

  nameInput.setCustomValidity(errors.name);
  classSelect.setCustomValidity(errors.heroClass);
  colorRadios[0].setCustomValidity(errors.color);
  for (const skill of SKILLS) {
    skillInputs[skill].setCustomValidity(errors[skill] || errors.total);
  }
  return errors;
}

function setState(element, message, isTouched) {
  element.classList.toggle("is-invalid", isTouched && message !== "");
  element.classList.toggle("is-valid", isTouched && message === "");
}

function showErrors(errors) {
  const nameShown = touched.has("name") ? errors.name : "";
  document.querySelector("#name-error").textContent = nameShown;
  nameInput.setAttribute("aria-invalid", String(nameShown !== ""));
  setState(nameInput, errors.name, touched.has("name"));

  const classShown = touched.has("heroClass") ? errors.heroClass : "";
  document.querySelector("#class-error").textContent = classShown;
  classSelect.setAttribute("aria-invalid", String(classShown !== ""));
  setState(classSelect, errors.heroClass, touched.has("heroClass"));

  const colorShown = touched.has("color") ? errors.color : "";
  document.querySelector("#color-error").textContent = colorShown;
  for (const radio of colorRadios) {
    radio.setAttribute("aria-invalid", String(colorShown !== ""));
  }
  setState(colorGroup, errors.color, touched.has("color"));

  const totalShown = touched.has("total") ? errors.total : "";
  document.querySelector("#skills-error").textContent = totalShown;
  setState(skillsGroup, errors.total, touched.has("total"));
  for (const skill of SKILLS) {
    const shown = touched.has(skill) ? errors[skill] : "";
    document.querySelector("#" + skill + "-error").textContent = shown;
    skillInputs[skill].setAttribute("aria-invalid", String(shown !== "" || totalShown !== ""));
    setState(skillInputs[skill], errors[skill], touched.has(skill));
  }
}

function validateTouched() {
  const errors = getErrors();
  showErrors(errors);
  return errors;
}

function updatePoints() {
  const left = TOTAL_POINTS - skillTotal();
  pointsBox.classList.remove("points--left", "points--exact", "points--over");
  if (left === 0) {
    pointsBox.textContent = "All " + TOTAL_POINTS + " points spent ✓";
    pointsBox.classList.add("points--exact");
  } else if (left > 0) {
    pointsBox.textContent = "Points left: " + left + " of " + TOTAL_POINTS;
    pointsBox.classList.add("points--left");
  } else {
    pointsBox.textContent = "Too many points: " + (-left) + " over the limit";
    pointsBox.classList.add("points--over");
  }
}

function buildCard(hero, code) {
  const card = document.createElement("article");
  card.classList.add("hero-card");
  if (hero.color !== "") {
    card.classList.add("hero-card--" + hero.color);
  }
  card.classList.toggle("is-empty", hero.name === "");

  const name = document.createElement("h3");
  name.className = "hero-card__name";
  name.textContent = hero.name === "" ? "Unnamed hero" : hero.name;

  const info = CLASSES[hero.heroClass];
  const heroClass = document.createElement("p");
  heroClass.className = "hero-card__class";
  heroClass.textContent = info ? info.label : "No class yet";

  card.append(name, heroClass);

  for (const skill of SKILLS) {
    const row = document.createElement("div");
    row.className = "skill-row";
    row.classList.toggle("is-main", Boolean(info) && info.main === skill);
    const label = document.createElement("span");
    label.textContent = SKILL_NAMES[skill];
    const bar = document.createElement("progress");
    bar.max = Number(skillInputs[skill].max);
    bar.value = hero.skills[skill];
    bar.setAttribute("aria-label", SKILL_NAMES[skill]);
    const number = document.createElement("span");
    number.textContent = hero.skills[skill];
    row.append(label, bar, number);
    card.append(row);
  }

  if (hero.motto !== "") {
    const motto = document.createElement("p");
    motto.className = "hero-card__code";
    motto.textContent = "“" + hero.motto + "”";
    card.append(motto);
  }
  if (code) {
    const codeLine = document.createElement("p");
    codeLine.className = "hero-card__code";
    codeLine.textContent = "Guild ID: " + code;
    card.append(codeLine);
  }
  return card;
}

function updatePreview() {
  preview.replaceChildren(buildCard(readForm(), ""));
  updatePoints();
}

form.addEventListener("focusout", function (event) {
  const target = event.target;
  if (target === nameInput) {
    touched.add("name");
  } else if (target === classSelect) {
    touched.add("heroClass");
  } else if (target.name === "color") {
    touched.add("color");
  } else if (SKILLS.includes(target.id)) {
    touched.add(target.id);

    if (SKILLS.every(function (skill) { return touched.has(skill); })) {
      touched.add("total");
    }
  } else {
    return;
  }
  validateTouched();
});

form.addEventListener("input", function () {
  successBox.classList.add("hidden");
  updatePreview();
  validateTouched();
});

form.addEventListener("change", function (event) {
  if (event.target === classSelect) {
    touched.add("heroClass");
  } else if (event.target.name === "color") {
    touched.add("color");
  }
  updatePreview();
  validateTouched();
});

function showSummary(errors) {
  const order = [
    { key: "name", input: nameInput, label: "Hero name" },
    { key: "heroClass", input: classSelect, label: "Class" },
    { key: "color", input: form.querySelector('input[name="color"]:checked') || colorRadios[0], label: "Banner color" },
    { key: "strength", input: skillInputs.strength, label: "Strength" },
    { key: "magic", input: skillInputs.magic, label: "Magic" },
    { key: "agility", input: skillInputs.agility, label: "Agility" },
    { key: "endurance", input: skillInputs.endurance, label: "Endurance" },
    { key: "total", input: skillInputs.strength, label: "Skill points" }
  ];
  const problems = order.filter(function (item) {
    return errors[item.key] !== "";
  });

  summaryList.replaceChildren();
  for (const item of problems) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#" + item.input.id;
    link.textContent = item.label + ": " + errors[item.key];
    link.addEventListener("click", function (event) {
      event.preventDefault();
      item.input.focus();
    });
    li.append(link);
    summaryList.append(li);
  }
  summaryTitle.textContent = problems.length === 1
    ? "There is 1 error in the form"
    : "There are " + problems.length + " errors in the form";
  summaryBox.classList.remove("hidden");
  return problems;
}

function makeCode() {
  return "HERO-" + (Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000);
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  for (const key of ["name", "heroClass", "color", "total"].concat(SKILLS)) {
    touched.add(key);
  }
  const errors = validateTouched();

  if (!form.checkValidity()) {
    const problems = showSummary(errors);

    if (problems.length > 0) {
      problems[0].input.focus();
    }
    return;
  }

  summaryBox.classList.add("hidden");
  const hero = readForm();
  const code = makeCode();
  const card = buildCard(hero, code);
  roster.prepend(card);
  rosterTitle.classList.remove("hidden");
  takenNames.push(hero.name);

  successBox.textContent = hero.name + " the " + CLASSES[hero.heroClass].label +
    " has joined the guild! Guild ID: " + code + ".";
  successBox.classList.remove("hidden");

  form.reset();
});

form.addEventListener("reset", function () {
  setTimeout(function () {
    touched.clear();
    summaryBox.classList.add("hidden");
    validateTouched();
    updatePreview();
    nameInput.focus();
  }, 0);
});

updatePreview();
validateTouched();