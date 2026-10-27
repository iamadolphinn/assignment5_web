"use strict";

const WIP_LIMIT = 3;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 40;
const COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "progress", title: "In progress" },
  { id: "done", title: "Done" }
];
const PRIORITY_NAMES = { 1: "Low", 2: "Medium", 3: "High" };

const quests = [
  { id: 1, title: "Clear the goblin camp", priority: 3, tags: ["combat", "forest"], status: "todo", reward: 150, urgent: true },
  { id: 2, title: "Brew healing potions", priority: 2, tags: ["crafting", "alchemy"], status: "todo", reward: 60, urgent: false },
  { id: 3, title: "Escort the merchant to Riverdale", priority: 2, tags: ["escort", "travel"], status: "progress", reward: 90, urgent: false },
  { id: 4, title: "Find the lost amulet", priority: 1, tags: ["explore", "ruins"], status: "todo", reward: 120, urgent: false },
  { id: 5, title: "Repair the village bridge", priority: 1, tags: ["crafting", "village"], status: "done", reward: 40, urgent: false },
  { id: 6, title: "Slay the cave troll", priority: 3, tags: ["combat", "cave"], status: "progress", reward: 200, urgent: true },
  { id: 7, title: "Map the northern ruins", priority: 1, tags: ["explore", "ruins"], status: "todo", reward: 70, urgent: false },
  { id: 8, title: "Deliver letters to the guild", priority: 1, tags: ["travel", "village"], status: "done", reward: 25, urgent: false },
  { id: 9, title: "Gather moonflowers", priority: 2, tags: ["alchemy", "forest"], status: "todo", reward: 55, urgent: false },
  { id: 10, title: "Train the new recruits", priority: 2, tags: ["combat", "village"], status: "done", reward: 80, urgent: false },
  { id: 11, title: "Investigate the haunted mill", priority: 3, tags: ["explore", "village"], status: "todo", reward: 110, urgent: true },
  { id: 12, title: "Forge a silver sword", priority: 2, tags: ["crafting"], status: "todo", reward: 95, urgent: false }
];

let searchText = "";
let selectedTag = "all";
let sortOrder = "none";
let flashId = null;
let focusId = null;

const board = document.querySelector("#board");
const summary = document.querySelector("#summary");
const messageBox = document.querySelector("#message");
const foundBox = document.querySelector("#found");
const searchInput = document.querySelector("#search");
const tagSelect = document.querySelector("#tag-filter");
const sortSelect = document.querySelector("#sort");
const addForm = document.querySelector("#add-form");
const titleInput = document.querySelector("#new-title");
const prioritySelect = document.querySelector("#new-priority");
const tagsInput = document.querySelector("#new-tags");
const rewardInput = document.querySelector("#new-reward");

function countByStatus(status) {
  let count = 0;
  for (let i = 0; i < quests.length; i++) {
    if (quests[i].status === status) {
      count++;
    }
  }
  return count;
}

function totalDoneReward() {
  let sum = 0;
  for (const quest of quests) {
    if (quest.status === "done") {
      sum += quest.reward;
    }
  }
  return sum;
}

function nextId() {
  let max = 0;
  for (const quest of quests) {
    if (quest.id > max) {
      max = quest.id;
    }
  }
  return max + 1;
}

function allTags() {
  const tags = [];
  for (const quest of quests) {
    for (const tag of quest.tags) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  return tags.sort();
}

function findQuest(id) {
  return quests.find(function (quest) {
    return quest.id === id;
  });
}

function columnIndex(status) {
  return COLUMNS.findIndex(function (column) {
    return column.id === status;
  });
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.classList.remove("msg--error", "msg--success", "msg--warn");
  if (type) {
    messageBox.classList.add("msg--" + type);
  }
}

function moveBlockReason(quest, targetStatus) {
  if (targetStatus === "progress" && countByStatus("progress") >= WIP_LIMIT) {
    return "Blocked: “" + quest.title + "” cannot start — only " + WIP_LIMIT +
      " quests can be in progress. Finish or move one back first.";
  }
  return "";
}

function visibleQuests() {
  const text = searchText.trim().toLowerCase();
  const result = quests.filter(function (quest) {
    const matchesText = text === "" || quest.title.toLowerCase().includes(text);
    const matchesTag = selectedTag === "all" || quest.tags.includes(selectedTag);
    return matchesText && matchesTag;
  });

  if (sortOrder === "desc") {
    result.sort(function (a, b) { return b.priority - a.priority || a.id - b.id; });
  } else if (sortOrder === "asc") {
    result.sort(function (a, b) { return a.priority - b.priority || a.id - b.id; });
  }
  return result;
}

function makeButton(text, action, label, disabled) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn--small";
  button.textContent = text;
  button.dataset.action = action;
  button.setAttribute("aria-label", label);
  button.disabled = disabled;
  return button;
}

function makeCard(quest) {
  const index = columnIndex(quest.status);

  const card = document.createElement("li");
  card.classList.add("qcard");
  card.dataset.id = quest.id;
  card.classList.toggle("is-urgent", quest.urgent);
  card.classList.toggle("is-done", quest.status === "done");
  card.classList.toggle("is-flash", quest.id === flashId);

  const title = document.createElement("h3");
  title.className = "qcard__title";
  title.textContent = quest.title;

  const meta = document.createElement("div");
  meta.className = "qcard__meta";
  const badge = document.createElement("span");
  badge.classList.add("badge", "badge--p" + quest.priority);
  badge.textContent = PRIORITY_NAMES[quest.priority];
  const reward = document.createElement("span");
  reward.textContent = "💰 " + quest.reward + " gold";
  meta.append(badge, reward);
  if (quest.urgent) {
    const urgent = document.createElement("span");
    urgent.textContent = "⚠ urgent";
    meta.append(urgent);
  }

  const tagBox = document.createElement("div");
  tagBox.className = "qcard__tags";
  for (const tag of quest.tags) {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.classList.toggle("is-active", tag === selectedTag);
    chip.textContent = "#" + tag;
    tagBox.append(chip);
  }

  const actions = document.createElement("div");
  actions.className = "qcard__actions";
  actions.append(
    makeButton("← Back", "left", "Move " + quest.title + " back", index === 0),
    makeButton("Next →", "right", "Move " + quest.title + " forward", index === COLUMNS.length - 1),
    makeButton("Remove", "remove", "Remove " + quest.title, false)
  );
  actions.lastChild.classList.add("btn--danger");

  card.append(title, meta, tagBox, actions);
  return card;
}

function renderTagOptions() {
  const tags = allTags();
  if (selectedTag !== "all" && !tags.includes(selectedTag)) {
    selectedTag = "all";
  }
  tagSelect.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All tags";
  tagSelect.append(allOption);
  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = "#" + tag;
    tagSelect.append(option);
  }
  tagSelect.value = selectedTag;
}

function renderSummary() {
  const total = quests.length;
  const done = countByStatus("done");
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const bar = document.createElement("progress");
  bar.max = total === 0 ? 1 : total;
  bar.value = done;
  bar.setAttribute("aria-label", "Finished quests");

  const text = document.createElement("div");
  text.className = "summary__text";
  const left = document.createElement("span");
  left.textContent = "Finished: " + done + " of " + total + " quests (" + percent + "%)";
  const right = document.createElement("span");
  right.textContent = "Gold earned: " + totalDoneReward();
  text.append(left, right);

  summary.replaceChildren(text, bar);
}

function render() {
  renderTagOptions();
  renderSummary();

  const visible = visibleQuests();
  const filtering = searchText.trim() !== "" || selectedTag !== "all";

  if (visible.length === 0 && filtering) {
    foundBox.textContent = "Nothing found. No quest matches your search or tag — try another word.";
    foundBox.className = "msg msg--warn";
  } else {
    foundBox.textContent = "";
    foundBox.className = "hidden";
  }

  board.replaceChildren();
  for (const column of COLUMNS) {
    const inColumn = visible.filter(function (quest) {
      return quest.status === column.id;
    });
    const realCount = countByStatus(column.id);

    const section = document.createElement("section");
    section.className = "column";
    section.setAttribute("aria-label", column.title);
    const isWipColumn = column.id === "progress";
    section.classList.toggle("is-full", isWipColumn && realCount >= WIP_LIMIT);

    const head = document.createElement("div");
    head.className = "column__head";
    const h2 = document.createElement("h2");
    h2.textContent = column.title;
    const count = document.createElement("span");
    count.className = "column__count";
    count.textContent = isWipColumn ? realCount + " / " + WIP_LIMIT : String(realCount);
    head.append(h2, count);

    const list = document.createElement("ul");
    list.className = "column__list";
    if (inColumn.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = filtering ? "No matching quests" : "No quests here";
      list.append(empty);
    }
    for (const quest of inColumn) {
      list.append(makeCard(quest));
    }

    section.append(head, list);
    board.append(section);
  }

  if (focusId !== null) {
    const card = board.querySelector('[data-id="' + focusId + '"]');
    if (card !== null) {
      const button = card.querySelector("button:not(:disabled)");
      if (button !== null) {
        button.focus();
      }
    }
    focusId = null;
  }
  flashId = null;
}

function moveQuest(quest, step) {
  const index = columnIndex(quest.status) + step;
  if (index < 0 || index >= COLUMNS.length) {
    return;
  }
  const target = COLUMNS[index].id;
  const reason = moveBlockReason(quest, target);
  if (reason !== "") {
    showMessage(reason, "error");
    flashId = quest.id;
    focusId = quest.id;
    render();
    return;
  }
  quest.status = target;
  showMessage("“" + quest.title + "” moved to " + COLUMNS[index].title + ".", "success");
  focusId = quest.id;
  render();
}

function removeQuest(quest) {
  const index = quests.indexOf(quest);
  quests.splice(index, 1);
  showMessage("“" + quest.title + "” was removed from the board.", "warn");
  render();
}

board.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const card = button.closest("[data-id]");
  const quest = findQuest(Number(card.dataset.id));
  if (quest === undefined) {
    return;
  }
  const action = button.dataset.action;
  if (action === "left") {
    moveQuest(quest, -1);
  } else if (action === "right") {
    moveQuest(quest, 1);
  } else if (action === "remove") {
    removeQuest(quest);
  }
});

searchInput.addEventListener("input", function () {
  searchText = searchInput.value;
  render();
});

tagSelect.addEventListener("change", function () {
  selectedTag = tagSelect.value;
  render();
});

sortSelect.addEventListener("change", function () {
  sortOrder = sortSelect.value;
  render();
});

addForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const reward = Number(rewardInput.value);

  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    showMessage("Blocked: the title must have " + MIN_TITLE_LENGTH + "–" + MAX_TITLE_LENGTH + " characters.", "error");
    titleInput.focus();
    return;
  }
  const duplicate = quests.some(function (quest) {
    return quest.title.toLowerCase() === title.toLowerCase();
  });
  if (duplicate) {
    showMessage("Blocked: a quest called “" + title + "” is already on the board.", "error");
    titleInput.focus();
    return;
  }
  if (rewardInput.value === "" || !Number.isInteger(reward) || reward < 0) {
    showMessage("Blocked: the reward must be a whole number, 0 or more.", "error");
    rewardInput.focus();
    return;
  }

  const tags = [];
  for (const part of tagsInput.value.split(",")) {
    const tag = part.trim().toLowerCase();
    if (tag !== "" && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  if (tags.length === 0) {
    tags.push("misc");
  }

  quests.push({
    id: nextId(),
    title: title,
    priority: Number(prioritySelect.value),
    tags: tags,
    status: "todo",
    reward: reward,
    urgent: false
  });

  addForm.reset();
  showMessage("New quest “" + title + "” added to To do.", "success");
  render();
  titleInput.focus();
});

showMessage("Tip: use the arrows on a card to move it between columns.", "");
render();