document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("new-task");
    const addTaskButton = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");
    const taskSummary = document.getElementById("task-summary");
    const filterButtons = Array.from(document.querySelectorAll(".filters button"));
    const undoNotice = document.getElementById("undo-notice");
    const undoMessage = document.getElementById("undo-message");
    const undoDeleteButton = document.getElementById("undo-delete");

    const storageKey = "track-your-progress:tasks";
    let tasks = loadTasks();
    let currentFilter = "all";
    let editingTaskId = null;
    let lastDeletedTask = null;
    let lastDeletedIndex = -1;

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
            // The list still works for this page if browser storage is unavailable.
        }
    }

    addTaskButton.addEventListener("click", addTask);
    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addTask();
        }
    });

    undoDeleteButton.addEventListener("click", () => {
        if (!lastDeletedTask) return;

        const restoredTask = lastDeletedTask;
        const insertAt = Math.max(0, Math.min(lastDeletedIndex, tasks.length));
        if (!tasks.some((task) => task.id === restoredTask.id)) {
            tasks.splice(insertAt, 0, restoredTask);
            saveTasks();
        }

        lastDeletedTask = null;
        lastDeletedIndex = -1;
        renderTasks();
        undoDeleteButton.hidden = true;
        undoNotice.hidden = true;
        undoMessage.textContent = "";
        taskSummary.textContent = "Task restored.";
    });

    function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            taskSummary.textContent = "Write a task first, then add it to the list.";
            return;
        }

        tasks.push({ id: Date.now() + Math.random(), text: text.slice(0, 200), completed: false });
        saveTasks();
        taskInput.value = "";
        renderTasks();
        taskInput.focus();
    }

    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex((item) => item.id === taskId);
        if (taskIndex === -1) return;

        lastDeletedTask = { ...tasks[taskIndex] };
        lastDeletedIndex = taskIndex;
        tasks.splice(taskIndex, 1);

        if (editingTaskId === taskId) editingTaskId = null;

        undoMessage.textContent = 'Deleted "' + lastDeletedTask.text + '".';
        undoDeleteButton.hidden = false;
        undoNotice.hidden = false;

        saveTasks();
        renderTasks();
    }

    function startEditing(taskId) {
        editingTaskId = taskId;
        renderTasks();

        const input = taskList.querySelector('li[data-id="' + taskId + '"] .task-editor input');
        if (input) {
            input.focus();
            input.select();
        }
    }

    function cancelEditing(taskId) {
        editingTaskId = null;
        renderTasks();

        const editButton = taskList.querySelector('li[data-id="' + taskId + '"] .edit');
        if (editButton) editButton.focus();
    }

    function saveTaskEdit(taskId, value) {
        const text = value.trim();
        const task = tasks.find((item) => item.id === taskId);

        if (!task) {
            editingTaskId = null;
            renderTasks();
            return;
        }

        if (!text) {
            taskSummary.textContent = "A task can't be empty. Add some text or cancel the edit.";
            const input = taskList.querySelector('li[data-id="' + taskId + '"] .task-editor input');
            if (input) input.focus();
            return;
        }

        task.text = text.slice(0, 200);
        editingTaskId = null;
        saveTasks();
        renderTasks();

        const editButton = taskList.querySelector('li[data-id="' + taskId + '"] .edit');
        if (editButton) editButton.focus();
    }

    taskList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const listItem = button.closest("li");
        if (!listItem || listItem.dataset.id === undefined) return;

        const taskId = Number(listItem.dataset.id);

        if (button.classList.contains("cancel-edit")) {
            cancelEditing(taskId);
            return;
        }

        // The editor handles its own form submission.
        if (button.closest(".task-editor")) return;

        const task = tasks.find((item) => item.id === taskId);
        if (!task) return;

        if (button.classList.contains("delete")) {
            deleteTask(taskId);
        } else if (button.classList.contains("edit")) {
            startEditing(taskId);
        } else if (button.classList.contains("toggle")) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    });

    taskList.addEventListener("submit", (event) => {
        const form = event.target.closest(".task-editor");
        if (!form) return;

        event.preventDefault();
        const listItem = form.closest("li");
        const input = form.querySelector("input");
        if (!listItem || !input) return;

        saveTaskEdit(Number(listItem.dataset.id), input.value);
    });

    taskList.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        const input = event.target.closest(".task-editor input");
        if (!input) return;

        event.preventDefault();
        const listItem = input.closest("li");
        if (listItem) cancelEditing(Number(listItem.dataset.id));
    });

    function createButton(className, label, taskText) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        button.setAttribute("aria-label", label + " task: " + taskText);
        return button;
    }

    function createTaskEditor(task) {
        const form = document.createElement("form");
        form.className = "task-editor";
        form.setAttribute("aria-label", "Edit task: " + task.text);

        const label = document.createElement("label");
        label.className = "visually-hidden";
        label.htmlFor = "edit-task-input";
        label.textContent = "Task name";

        const input = document.createElement("input");
        input.id = "edit-task-input";
        input.name = "task-text";
        input.type = "text";
        input.maxLength = 200;
        input.required = true;
        input.autocomplete = "off";
        input.value = task.text;
        input.setAttribute("aria-describedby", "edit-task-help");

        const help = document.createElement("span");
        help.id = "edit-task-help";
        help.className = "visually-hidden";
        help.textContent = "Press Enter to save or Escape to cancel.";

        const actions = document.createElement("div");
        actions.className = "task-editor-actions";

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.className = "editor-save";
        saveButton.textContent = "Save";
        saveButton.setAttribute("aria-label", "Save task: " + task.text);

        const cancelButton = createButton("cancel-edit", "Cancel", task.text);

        actions.append(saveButton, cancelButton);
        form.append(label, input, help, actions);
        return form;
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

                if (editingTaskId === task.id) {
                    li.classList.add("is-editing");
                    li.appendChild(createTaskEditor(task));
                    taskList.appendChild(li);
                    return;
                }

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
            : remainingCount + " to do · " + completedCount + " done · " + tasks.length + " total";
    }

    updateFilterButtons();
    renderTasks();
});