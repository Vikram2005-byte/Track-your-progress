document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("new-task");
    const taskDueDate = document.getElementById("task-due-date");
    const addTaskButton = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");
    const taskSummary = document.getElementById("task-summary");
    const filterButtons = Array.from(document.querySelectorAll(".filters button"));
    const undoNotice = document.getElementById("undo-notice");
    const undoMessage = document.getElementById("undo-message");
    const undoDeleteButton = document.getElementById("undo-delete");
    const calendarGrid = document.getElementById("calendar-grid");
    const calendarMonthLabel = document.getElementById("calendar-month-label");
    const previousMonthButton = document.getElementById("previous-month");
    const nextMonthButton = document.getElementById("next-month");
    const todayButton = document.getElementById("today-button");
    const clearDateFilterButton = document.getElementById("clear-date-filter");

    const storageKey = "track-your-progress:tasks";
    let tasks = loadTasks();
    let currentFilter = "all";
    let editingTaskId = null;
    let lastDeletedTask = null;
    let lastDeletedIndex = -1;
    let visibleMonth = startOfMonth(new Date());
    let selectedCalendarDate = "";

    function getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    }

    function dateFromKey(dateKey) {
        const parts = dateKey.split("-").map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function isValidDateKey(value) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const parts = value.split("-").map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.getFullYear() === parts[0] &&
            date.getMonth() === parts[1] - 1 &&
            date.getDate() === parts[2];
    }

    function startOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function formatDate(dateKey, options) {
        if (!isValidDateKey(dateKey)) return "";
        const defaultOptions = { month: "short", day: "numeric" };
        return dateFromKey(dateKey).toLocaleDateString(undefined, options || defaultOptions);
    }

    function loadTasks() {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
            if (!Array.isArray(saved)) return [];
            return saved.filter((task) =>
                task &&
                Number.isFinite(task.id) &&
                typeof task.text === "string" &&
                typeof task.completed === "boolean"
            ).map((task) => ({
                ...task,
                dueDate: isValidDateKey(task.dueDate) ? task.dueDate : ""
            }));
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

    previousMonthButton.addEventListener("click", () => changeMonth(-1));
    nextMonthButton.addEventListener("click", () => changeMonth(1));

    todayButton.addEventListener("click", () => {
        const today = new Date();
        visibleMonth = startOfMonth(today);
        selectedCalendarDate = getDateKey(today);
        taskDueDate.value = selectedCalendarDate;
        renderCalendar();
        renderTasks();
    });

    clearDateFilterButton.addEventListener("click", () => {
        selectedCalendarDate = "";
        renderCalendar();
        renderTasks();
    });

    taskDueDate.addEventListener("change", () => {
        if (taskDueDate.value !== selectedCalendarDate) selectedCalendarDate = "";
        renderCalendar();
        renderTasks();
    });

    calendarGrid.addEventListener("click", (event) => {
        const dayButton = event.target.closest("button[data-date]");
        if (!dayButton) return;

        selectedCalendarDate = dayButton.dataset.date;
        taskDueDate.value = selectedCalendarDate;
        renderCalendar();
        renderTasks();
        taskInput.focus();
    });

    function changeMonth(offset) {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
        selectedCalendarDate = "";
        renderCalendar();
        renderTasks();
    }

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
        renderCalendar();
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

        const dueDate = isValidDateKey(taskDueDate.value) ? taskDueDate.value : "";
        tasks.push({
            id: Date.now() + Math.random(),
            text: text.slice(0, 200),
            completed: false,
            dueDate
        });
        saveTasks();
        taskInput.value = "";
        renderCalendar();
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
        renderCalendar();
        renderTasks();
    }

    function startEditing(taskId) {
        editingTaskId = taskId;
        renderTasks();

        const input = taskList.querySelector('li[data-id="' + taskId + '"] .task-editor input[name="task-text"]');
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

    function saveTaskEdit(taskId, value, dueDateValue) {
        const text = value.trim();
        const task = tasks.find((item) => item.id === taskId);

        if (!task) {
            editingTaskId = null;
            renderTasks();
            return;
        }

        if (!text) {
            taskSummary.textContent = "A task can't be empty. Add some text or cancel the edit.";
            const input = taskList.querySelector('li[data-id="' + taskId + '"] .task-editor input[name="task-text"]');
            if (input) input.focus();
            return;
        }

        if (dueDateValue && !isValidDateKey(dueDateValue)) {
            taskSummary.textContent = "Choose a valid due date or leave it blank.";
            return;
        }

        task.text = text.slice(0, 200);
        task.dueDate = dueDateValue || "";
        editingTaskId = null;
        saveTasks();
        renderCalendar();
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
            renderCalendar();
            renderTasks();
        }
    });

    taskList.addEventListener("submit", (event) => {
        const form = event.target.closest(".task-editor");
        if (!form) return;

        event.preventDefault();
        const listItem = form.closest("li");
        const textInput = form.querySelector('input[name="task-text"]');
        const dateInput = form.querySelector('input[name="task-due-date"]');
        if (!listItem || !textInput || !dateInput) return;

        saveTaskEdit(Number(listItem.dataset.id), textInput.value, dateInput.value);
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

        const textLabel = document.createElement("label");
        textLabel.className = "visually-hidden";
        textLabel.htmlFor = "edit-task-text-" + task.id;
        textLabel.textContent = "Task name";

        const textInput = document.createElement("input");
        textInput.id = "edit-task-text-" + task.id;
        textInput.name = "task-text";
        textInput.type = "text";
        textInput.maxLength = 200;
        textInput.required = true;
        textInput.autocomplete = "off";
        textInput.value = task.text;
        textInput.setAttribute("aria-describedby", "edit-task-help-" + task.id);

        const dateLabel = document.createElement("label");
        dateLabel.className = "visually-hidden";
        dateLabel.htmlFor = "edit-task-date-" + task.id;
        dateLabel.textContent = "Due date (optional)";

        const dateInput = document.createElement("input");
        dateInput.id = "edit-task-date-" + task.id;
        dateInput.name = "task-due-date";
        dateInput.type = "date";
        dateInput.value = task.dueDate || "";
        dateInput.setAttribute("aria-label", "Due date for task: " + task.text);

        const help = document.createElement("span");
        help.id = "edit-task-help-" + task.id;
        help.className = "visually-hidden";
        help.textContent = "Press Enter to save or Escape to cancel. Leave the date blank if there is no deadline.";

        const actions = document.createElement("div");
        actions.className = "task-editor-actions";

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.className = "editor-save";
        saveButton.textContent = "Save";
        saveButton.setAttribute("aria-label", "Save task: " + task.text);

        const cancelButton = createButton("cancel-edit", "Cancel", task.text);

        actions.append(saveButton, cancelButton);
        form.append(textLabel, textInput, dateLabel, dateInput, help, actions);
        return form;
    }

    function createDueDateLabel(task) {
        if (!task.dueDate || !isValidDateKey(task.dueDate)) return null;

        const label = document.createElement("span");
        label.className = "task-due-date";
        const todayKey = getDateKey(new Date());

        if (!task.completed && task.dueDate < todayKey) {
            label.classList.add("overdue");
            label.textContent = "Overdue · " + formatDate(task.dueDate);
        } else if (task.dueDate === todayKey) {
            label.classList.add("due-today");
            label.textContent = "Due today";
        } else {
            label.textContent = "Due " + formatDate(task.dueDate);
        }

        return label;
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
        clearDateFilterButton.hidden = !selectedCalendarDate;

        let visibleTasks = tasks.filter((task) => {
            if (selectedCalendarDate && task.dueDate !== selectedCalendarDate) return false;
            if (currentFilter === "completed") return task.completed;
            if (currentFilter === "pending") return !task.completed;
            return true;
        });

        if (visibleTasks.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.className = "empty-state";

            if (selectedCalendarDate) {
                const dateLabel = formatDate(selectedCalendarDate, { weekday: "long", month: "long", day: "numeric" });
                emptyItem.textContent = "No " +
                    (currentFilter === "completed" ? "completed " : currentFilter === "pending" ? "pending " : "") +
                    "tasks scheduled for " + dateLabel + ". Add a task above to put it on this date.";
            } else {
                emptyItem.textContent = tasks.length === 0
                    ? "Nothing on the list yet. Add your first task above."
                    : currentFilter === "completed"
                        ? "No completed tasks yet."
                        : currentFilter === "pending"
                            ? "You're all caught up. No tasks are waiting."
                            : "No tasks match this view.";
            }
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

                const copy = document.createElement("div");
                copy.className = "task-copy";

                const text = document.createElement("span");
                text.className = "task-text" + (task.completed ? " completed" : "");
                text.textContent = task.text;
                copy.appendChild(text);

                const dueDateLabel = createDueDateLabel(task);
                if (dueDateLabel) copy.appendChild(dueDateLabel);
                li.appendChild(copy);

                const actions = document.createElement("div");
                actions.className = "task-actions";
                actions.appendChild(createButton("toggle", task.completed ? "Undo" : "Complete", task.text));
                actions.appendChild(createButton("edit", "Edit", task.text));
                actions.appendChild(createButton("delete", "Delete", task.text));
                li.appendChild(actions);

                taskList.appendChild(li);
            });
        }

        if (selectedCalendarDate) {
            const dayTasks = tasks.filter((task) => task.dueDate === selectedCalendarDate);
            const completedCount = dayTasks.filter((task) => task.completed).length;
            taskSummary.textContent = (dayTasks.length - completedCount) + " to do · " +
                completedCount + " done · " + dayTasks.length + " scheduled for " + formatDate(selectedCalendarDate);
        } else {
            const completedCount = tasks.filter((task) => task.completed).length;
            const remainingCount = tasks.length - completedCount;
            taskSummary.textContent = tasks.length === 0
                ? "No tasks added yet."
                : remainingCount + " to do · " + completedCount + " done · " + tasks.length + " total";
        }
    }

    function renderCalendar() {
        calendarMonthLabel.textContent = visibleMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
        });
        calendarGrid.replaceChildren();

        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
        const firstVisibleDate = new Date(year, month, 1 - firstDayOfWeek);
        const todayKey = getDateKey(new Date());
        const taskCounts = new Map();

        tasks.forEach((task) => {
            if (!task.dueDate || !isValidDateKey(task.dueDate)) return;
            taskCounts.set(task.dueDate, (taskCounts.get(task.dueDate) || 0) + 1);
        });

        for (let index = 0; index < totalCells; index += 1) {
            const date = new Date(firstVisibleDate);
            date.setDate(firstVisibleDate.getDate() + index);
            const dateKey = getDateKey(date);
            const count = taskCounts.get(dateKey) || 0;
            const isCurrentMonth = date.getMonth() === month;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedCalendarDate;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-day";
            button.dataset.date = dateKey;
            if (!isCurrentMonth) button.classList.add("other-month");
            if (isToday) button.classList.add("today");
            if (isSelected) button.classList.add("selected");
            if (count > 0) button.classList.add("has-tasks");
            button.setAttribute("aria-pressed", String(isSelected));
            button.setAttribute("aria-label", formatDate(dateKey, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }) + (count === 1 ? ", 1 task" : ", " + count + " tasks") + (isToday ? ", today" : ""));

            const number = document.createElement("span");
            number.className = "calendar-day-number";
            number.textContent = String(date.getDate());
            button.appendChild(number);

            if (count > 0) {
                const countLabel = document.createElement("span");
                countLabel.className = "calendar-day-count";
                countLabel.textContent = count + (count === 1 ? " task" : " tasks");
                button.appendChild(countLabel);
            }

            calendarGrid.appendChild(button);
        }
    }

    updateFilterButtons();
    renderCalendar();
    renderTasks();
});