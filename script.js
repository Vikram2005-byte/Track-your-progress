document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("new-task");
    const addTaskButton = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");
    const taskSummary = document.getElementById("task-summary");
    const filterButtons = Array.from(document.querySelectorAll(".filters button"));

    const storageKey = "track-your-progress:tasks";
    let tasks = loadTasks();
    let currentFilter = "all";

    function loadTasks() {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
            if (!Array.isArray(saved)) return [];
            return saved.filter((task) =>
                task &&
                Number.isFinite(task.id) &&
                typeof task.text === "string" &&
                typeof task.completed === "boolean"
            );
        } catch {
            return [];
        }
    }

    function saveTasks() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(tasks));
        } catch {
            // The list still works for the current page if storage is unavailable.
        }
    }

    addTaskButton.addEventListener("click", addTask);
    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addTask();
        }
    });

    function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            taskSummary.textContent = "Write a task first, then add it to the list.";
            return;
        }

        tasks.push({ id: Date.now() + Math.random(), text, completed: false });
        saveTasks();
        taskInput.value = "";
        renderTasks();
        taskInput.focus();
    }

    taskList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        const listItem = button?.closest("li");
        if (!button || !listItem || listItem.dataset.id === undefined) return;

        const taskId = Number(listItem.dataset.id);
        const task = tasks.find((item) => item.id === taskId);
        if (!task) return;

        if (button.classList.contains("delete")) {
            tasks = tasks.filter((item) => item.id !== taskId);
        } else if (button.classList.contains("edit")) {
            const newText = prompt("Edit task:", task.text);
            if (newText === null) return;
            if (!newText.trim()) {
                taskSummary.textContent = "A task can't be empty, so the original text was kept.";
                return;
            }
            task.text = newText.trim().slice(0, 200);
        } else if (button.classList.contains("toggle")) {
            task.completed = !task.completed;
        } else {
            return;
        }

        saveTasks();
        renderTasks();
    });

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter || "all";
            updateFilterButtons();
            renderTasks();
        });
    });

    function createButton(className, label, taskText) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        button.setAttribute("aria-label", `${label} task: ${taskText}`);
        return button;
    }

    function updateFilterButtons() {
        filterButtons.forEach((button) => {
            const active = (button.dataset.filter || "all") === currentFilter;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function renderTasks() {
        taskList.replaceChildren();

        const visibleTasks = tasks.filter((task) => {
            if (currentFilter === "completed") return task.completed;
            if (currentFilter === "pending") return !task.completed;
            return true;
        });

        if (visibleTasks.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.className = "empty-state";
            emptyItem.textContent = tasks.length === 0
                ? "Nothing on the list yet. Add your first task above."
                : currentFilter === "completed"
                    ? "No completed tasks yet."
                    : currentFilter === "pending"
                        ? "You're all caught up. No tasks are waiting."
                        : "No tasks match this view.";
            taskList.appendChild(emptyItem);
        } else {
            visibleTasks.forEach((task) => {
                const li = document.createElement("li");
                li.dataset.id = String(task.id);
                li.classList.toggle("task-done", task.completed);

                const text = document.createElement("span");
                text.className = "task-text" + (task.completed ? " completed" : "");
                text.textContent = task.text;
                li.appendChild(text);

                const actions = document.createElement("div");
                actions.className = "task-actions";
                actions.appendChild(createButton("toggle", task.completed ? "Undo" : "Complete", task.text));
                actions.appendChild(createButton("edit", "Edit", task.text));
                actions.appendChild(createButton("delete", "Delete", task.text));
                li.appendChild(actions);

                taskList.appendChild(li);
            });
        }

        const completedCount = tasks.filter((task) => task.completed).length;
        const remainingCount = tasks.length - completedCount;
        taskSummary.textContent = tasks.length === 0
            ? "No tasks added yet."
            : `${remainingCount} to do · ${completedCount} done · ${tasks.length} total`;
    }

    updateFilterButtons();
    renderTasks();
});
