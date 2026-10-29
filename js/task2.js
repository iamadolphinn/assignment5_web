"use strict";

const WIP_LIMIT = 3;
const COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "progress", title: "In progress" },
  { id: "done", title: "Done" }
];
const PRIORITY_NAMES = { 1: "Low", 2: "Medium", 3: "High" };

const quests = [
  { id: 1, title: "Clear the goblin camp", priority: 3, tags: ["combat", "forest"], status: "todo", urgent: true },
  { id: 2, title: "Brew healing potions", priority: 2, tags: ["crafting", "alchemy"], status: "todo", urgent: false },
  { id: 3, title: "Escort the merchant to Riverdale", priority: 2, tags: ["escort", "travel"], status: "progress", urgent: false },
  { id: 4, title: "Find the lost amulet", priority: 1, tags: ["explore", "ruins"], status: "todo", urgent: false },
  { id: 5, title: "Repair the village bridge", priority: 1, tags: ["crafting", "village"], status: "done", urgent: false },
  { id: 6, title: "Slay the cave troll", priority: 3, tags: ["combat", "cave"], status: "progress", urgent: true },
  { id: 7, title: "Map the northern ruins", priority: 1, tags: ["explore", "ruins"], status: "todo", urgent: false },
  { id: 8, title: "Deliver letters to the guild", priority: 1, tags: ["travel", "village"], status: "done", urgent: false },
  { id: 9, title: "Gather moonflowers", priority: 2, tags: ["alchemy", "forest"], status: "todo", urgent: false },
  { id: 10, title: "Train the new recruits", priority: 2, tags: ["combat", "village"], status: "done", urgent: false },
  { id: 11, title: "Investigate the haunted mill", priority: 3, tags: ["explore", "village"], status: "todo", urgent: true },
  { id: 12, title: "Forge a silver sword", priority: 2, tags: ["crafting"], status: "todo", urgent: false }
];

const board = document.querySelector("#board");
const searchInput = document.querySelector("#search");
const tagSelect = document.querySelector("#tag-filter");
const sortSelect = document.querySelector("#sort");
const progressBar = document.querySelector("#progress");
const progressText = document.querySelector("#progress-text");
const messageBox = document.querySelector("#message");

function make(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function count(status) {
  let total = 0;
  for (const quest of quests) {
    if (quest.status === status) {
      total++;
    }
  }
  return total;
}

function columnIndex(quest) {
  return COLUMNS.findIndex(column => column.id === quest.status);
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `msg msg--${type}`;
}

function fillTags() {
  const tags = [];
  for (const quest of quests) {
    for (const tag of quest.tags) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  tags.sort();
  tags.unshift("all");

  for (const tag of tags) {
    const option = make("option", "", tag === "all" ? "All tags" : `#${tag}`);
    option.value = tag;
    tagSelect.append(option);
  }
}

function getVisible() {
  const text = searchInput.value.trim().toLowerCase();
  const tag = tagSelect.value;

  const list = quests.filter(quest =>
    quest.title.toLowerCase().includes(text) && (tag === "all" || quest.tags.includes(tag))
  );

  if (sortSelect.value === "high") {
    list.sort((a, b) => b.priority - a.priority);
  } else if (sortSelect.value === "low") {
    list.sort((a, b) => a.priority - b.priority);
  }
  return list;
}

function makeButton(text, quest, step, disabled) {
  const button = make("button", "btn btn--small", text);
  button.type = "button";
  button.dataset.id = quest.id;
  button.dataset.step = step;
  button.disabled = disabled;
  return button;
}

function makeCard(quest) {
  const index = columnIndex(quest);
  const card = make("li", "card", "");
  card.classList.toggle("is-urgent", quest.urgent);
  card.classList.toggle("is-done", quest.status === "done");

  const meta = make("p", "card__meta", "");
  meta.append(make("span", `badge badge--${quest.priority}`, PRIORITY_NAMES[quest.priority]));
  if (quest.urgent) {
    meta.append(make("span", "", "⚠ urgent"));
  }

  card.append(
    make("h3", "card__title", quest.title),
    meta,
    make("p", "card__tags", quest.tags.map(tag => `#${tag}`).join(" ")),
    makeButton("← Back", quest, -1, index === 0),
    makeButton("Next →", quest, 1, index === COLUMNS.length - 1)
  );
  return card;
}

function render() {
  progressBar.max = quests.length;
  progressBar.value = count("done");
  progressText.textContent = `Finished: ${count("done")} of ${quests.length} quests`;

  const visible = getVisible();
  board.replaceChildren();

  if (visible.length === 0) {
    board.append(make("p", "msg msg--warn", "Nothing found. Try another word or tag."));
    return;
  }

  for (const column of COLUMNS) {
    const total = count(column.id);
    const isWip = column.id === "progress";

    const section = make("section", "column", "");
    section.classList.toggle("is-full", isWip && total >= WIP_LIMIT);
    const counter = isWip ? `${total} / ${WIP_LIMIT}` : total;
    const list = make("ul", "column__list", "");

    for (const quest of visible) {
      if (quest.status === column.id) {
        list.append(makeCard(quest));
      }
    }
    if (list.children.length === 0) {
      list.append(make("li", "empty", "No quests here"));
    }

    section.append(make("h2", "column__title", `${column.title} (${counter})`), list);
    board.append(section);
  }
}

function moveQuest(id, step) {
  const quest = quests.find(item => item.id === id);
  const target = COLUMNS[columnIndex(quest) + step];

  if (target.id === "progress" && count("progress") >= WIP_LIMIT) {
    showMessage(`Blocked: "${quest.title}" cannot go to In progress, the limit is ${WIP_LIMIT} quests. Move one out first.`, "error");
    return;
  }

  quest.status = target.id;
  showMessage(`"${quest.title}" moved to ${target.title}.`, "success");
  render();
}

board.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (button !== null) {
    moveQuest(Number(button.dataset.id), Number(button.dataset.step));
  }
});

searchInput.addEventListener("input", render);
tagSelect.addEventListener("change", render);
sortSelect.addEventListener("change", render);

fillTags();
render();