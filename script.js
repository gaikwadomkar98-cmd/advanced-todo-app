const STORAGE_KEY = "taskflow.tasks.v1";
const THEME_KEY = "taskflow.theme.v1";

const $ = (selector) => document.querySelector(selector);
const form = $("#taskForm");
const taskInput = $("#taskInput");
const priorityInput = $("#priorityInput");
const dueInput = $("#dueInput");
const categoryInput = $("#categoryInput");
const taskList = $("#taskList");
const searchInput = $("#searchInput");
const filterInput = $("#filterInput");
const sortInput = $("#sortInput");
const categoryChips = $("#categoryChips");
const emptyState = $("#emptyState");
const toast = $("#toast");

let tasks = loadTasks();
let editingId = null;
let activeCategory = "all";
let toastTimer;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    showToast("Could not save data in this browser.");
  }
}

function makeId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateOnly(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function isOverdue(task) {
  return Boolean(task.dueDate && task.dueDate < dateOnly() && !task.done);
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function resetForm() {
  form.reset();
  priorityInput.value = "medium";
  categoryInput.value = "Work";
  editingId = null;
  $("#formHeading").textContent = "Add a new task";
  $("#submitBtn").textContent = "＋ Add task";
  $("#cancelEditBtn").classList.add("hidden");
}

function addOrUpdateTask(event) {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    showToast("Please enter a task name.");
    taskInput.focus();
    return;
  }

  if (editingId) {
    tasks = tasks.map(task => task.id === editingId
      ? { ...task, text, priority: priorityInput.value, dueDate: dueInput.value, category: categoryInput.value, updatedAt: Date.now() }
      : task);
    showToast("Task updated successfully.");
  } else {
    tasks.unshift({
      id: makeId(),
      text,
      priority: priorityInput.value,
      dueDate: dueInput.value,
      category: categoryInput.value,
      done: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    showToast("Task added successfully.");
  }

  saveTasks();
  resetForm();
  render();
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, done: !task.done, updatedAt: Date.now() } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  tasks = tasks.filter(item => item.id !== id);
  if (editingId === id) resetForm();
  saveTasks();
  render();
  showToast("Task deleted.");
}

function startEdit(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  editingId = id;
  taskInput.value = task.text;
  priorityInput.value = task.priority || "medium";
  dueInput.value = task.dueDate || "";
  categoryInput.value = task.category || "Work";
  $("#formHeading").textContent = "Edit task";
  $("#submitBtn").textContent = "Save changes";
  $("#cancelEditBtn").classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  taskInput.focus();
}

function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  let result = tasks.filter(task => {
    const matchesSearch = `${task.text} ${task.category} ${task.priority}`.toLowerCase().includes(query);
    const matchesFilter = filterInput.value === "all"
      || (filterInput.value === "active" && !task.done)
      || (filterInput.value === "done" && task.done)
      || (filterInput.value === "overdue" && isOverdue(task));
    const matchesCategory = activeCategory === "all" || task.category === activeCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const priorityRank = { high: 0, medium: 1, low: 2 };
  switch (sortInput.value) {
    case "due":
      result.sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"));
      break;
    case "priority":
      result.sort((a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1));
      break;
    case "alphabetical":
      result.sort((a, b) => a.text.localeCompare(b.text));
      break;
    default:
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  return result;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-card${task.done ? " completed" : ""}${isOverdue(task) ? " overdue" : ""}`;
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", `Mark "${task.text}" as ${task.done ? "incomplete" : "complete"}`);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const content = document.createElement("div");
  content.className = "task-content";
  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.text;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  const category = document.createElement("span");
  category.className = "category-label";
  category.textContent = task.category || "Other";
  const priority = document.createElement("span");
  priority.className = `priority-label priority-${task.priority || "medium"}`;
  priority.textContent = `${(task.priority || "medium").toUpperCase()} PRIORITY`;
  const due = document.createElement("span");
  due.className = `due-label${isOverdue(task) ? " due-overdue" : ""}`;
  due.textContent = task.dueDate ? `${isOverdue(task) ? "Overdue · " : "Due · "}${formatDate(task.dueDate)}` : "No due date";
  meta.append(category, priority, due);
  content.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "action-btn";
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", `Edit ${task.text}`);
  edit.addEventListener("click", () => startEdit(task.id));
  const del = document.createElement("button");
  del.type = "button";
  del.className = "action-btn delete-btn";
  del.textContent = "Delete";
  del.setAttribute("aria-label", `Delete ${task.text}`);
  del.addEventListener("click", () => deleteTask(task.id));
  actions.append(edit, del);

  li.append(checkbox, content, actions);
  return li;
}

function render() {
  const visible = getVisibleTasks();
  taskList.replaceChildren(...visible.map(createTaskElement));
  emptyState.classList.toggle("visible", visible.length === 0);
  $("#visibleCount").textContent = visible.length;

  const completed = tasks.filter(task => task.done).length;
  const active = tasks.filter(task => !task.done).length;
  const overdue = tasks.filter(isOverdue).length;
  $("#totalCount").textContent = tasks.length;
  $("#activeCount").textContent = active;
  $("#doneCount").textContent = completed;
  $("#overdueCount").textContent = overdue;
  $("#remainingLabel").textContent = `${active} task${active === 1 ? "" : "s"} remaining`;
  $("#todaySummary").textContent = active === 0 ? "All caught up. Nice work!" : `${active} task${active === 1 ? "" : "s"} to focus on today.`;
}

form.addEventListener("submit", addOrUpdateTask);
$("#cancelEditBtn").addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);
sortInput.addEventListener("change", render);

categoryChips.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  categoryChips.querySelectorAll("button").forEach(chip => chip.classList.toggle("active", chip === button));
  render();
});

$("#clearCompletedBtn").addEventListener("click", () => {
  const completedCount = tasks.filter(task => task.done).length;
  if (!completedCount) {
    showToast("There are no completed tasks to clear.");
    return;
  }
  if (!window.confirm(`Delete ${completedCount} completed task${completedCount === 1 ? "" : "s"}?`)) return;
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  render();
  showToast("Completed tasks cleared.");
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("#themeBtn").textContent = theme === "dark" ? "☀" : "☾";
  $("#themeBtn").setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

$("#themeBtn").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "light";
  applyTheme(current === "light" ? "dark" : "light");
});

$("#todayLabel").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric"
});

let savedTheme = "light";
try { savedTheme = localStorage.getItem(THEME_KEY) || "light"; } catch {}
applyTheme(savedTheme);
render();
