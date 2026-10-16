document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("new-task");
    const addTaskButton = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");
    const filterButtons = document.querySelectorAll(".filters button");

    let tasks = [];
    let currentFilter = "all";

    addTaskButton.addEventListener("click", addTask);
    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") addTask();
    });

    function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            return;
        }

        tasks.push({ id: Date.now() + Math.random(), text, completed: false });
        taskInput.value = "";
        renderTasks();
        taskInput.focus();
    }

    taskList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        const listItem = button?.closest("li");
        if (!button || !listItem) return;

        const taskId = Number(listItem.dataset.id);
        if (button.classList.contains("delete")) {
            tasks = tasks.filter((task) => task.id !== taskId);
        } else if (button.classList.contains("edit")) {
            const task = tasks.find((item) => item.id === taskId);
            if (!task) return;

            const newText = prompt("Edit task:", task.text);
            if (newText === null || !newText.trim()) return;
            task.text = newText.trim();
        } else if (button.classList.contains("toggle")) {
            const task = tasks.find((item) => item.id === taskId);
            if (!task) return;
            task.completed = !task.completed;
        } else {
            return;
        }

        renderTasks();
    });

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter || "all";
            filterButtons.forEach((item) => item.classList.toggle("active", item === button));
            renderTasks();
        });
    });

    function createButton(className, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        return button;
    }

    function renderTasks() {
        taskList.replaceChildren();

        const visibleTasks = tasks.filter((task) => {
            if (currentFilter === "completed") return task.completed;
            if (currentFilter === "pending") return !task.completed;
            return true;
        });

        visibleTasks.forEach((task) => {
            const li = document.createElement("li");
            li.dataset.id = String(task.id);

            const text = document.createElement("span");
            text.className = "task-text" + (task.completed ? " completed" : "");
            text.textContent = task.text;
            li.appendChild(text);

            li.appendChild(createButton("toggle", task.completed ? "Undo" : "Complete"));
            li.appendChild(createButton("edit", "Edit"));
            li.appendChild(createButton("delete", "Delete"));
            taskList.appendChild(li);
        });
    }
});
