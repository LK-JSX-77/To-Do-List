const STORAGE_KEY = "daylist-tasks";
const $ = (selector) => document.querySelector(selector);
const form = $("#task-form");
const input = $("#task-input");
const addButton = $("#add-button");
const list = $("#task-list");
const empty = $("#empty");
const taskCount = $("#task-count");
const completeCount = $("#complete-count");
const ring = $("#ring");
const filterButtons = [...document.querySelectorAll(".filter")];

let tasks = loadTasks();
let currentFilter = "all";

$("#date").textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean",
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " completed" : ""}`;

  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.setAttribute("aria-pressed", task.completed);
  check.setAttribute(
    "aria-label",
    `Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`,
  );
  check.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="m3.5 8 3 3 6-6"/></svg>';

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.setAttribute("aria-label", `Delete "${task.title}"`);
  remove.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4.75 7.25h14.5M9.25 3.75h5.5l.75 3.5h-7l.75-3.5ZM7 7.25l.65 12h8.7l.65-12M10 10.75v5M14 10.75v5"/></svg>';

  check.addEventListener("click", () => {
    tasks = tasks.map((item) =>
      item.id === task.id ? { ...item, completed: !item.completed } : item,
    );
    update();
  });
  remove.addEventListener("click", () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    update();
  });
  item.append(check, title, remove);
  return item;
}

function update() {
  saveTasks();

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  list.replaceChildren(...visibleTasks.map(createTaskElement));

  empty.hidden = visibleTasks.length > 0;
  list.hidden = visibleTasks.length === 0;
  const sectionNames = { all: "All tasks", active: "Active tasks", completed: "Completed tasks" };
  taskCount.textContent = sectionNames[currentFilter];
  completeCount.hidden = total === 0;
  completeCount.textContent = `${completed} of ${total} completed`;
  $("#all-count").textContent = total;
  $("#active-count").textContent = active;
  $("#completed-count").textContent = completed;
  $("#percent").textContent = `${percentage}%`;
  $("#progress").style.width = `${percentage}%`;
  ring.style.setProperty("--progress", `${percentage * 3.6}deg`);
  ring.setAttribute("aria-label", `${percentage}% complete`);

  const emptyContent = {
    all: ["Your day is wide open", "Add your first task above and start making progress."],
    active: ["You're all caught up", "There are no active tasks waiting for you."],
    completed: ["Nothing completed yet", "Finish a task and it will appear here."],
  };
  [$("#empty-title").textContent, $("#empty-message").textContent] = emptyContent[currentFilter];

  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected);
  });
}

input.addEventListener("input", () => {
  addButton.disabled = !input.value.trim();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    update();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  tasks.push({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    title,
    completed: false,
  });
  currentFilter = "active";
  form.reset();
  addButton.disabled = true;
  update();
  input.focus();
});

update();