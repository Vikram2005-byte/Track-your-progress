# Track Your Progress

A lightweight task-tracking web app built with HTML, CSS, and vanilla JavaScript.

## Features
- Add tasks
- Mark tasks as complete or pending
- Edit and delete tasks
- Filter tasks by all, completed, or pending status
- Responsive layout for smaller screens

## Run locally
1. Clone this repository: **git clone https://github.com/Vikram2005-byte/Track-your-progress.git**
2. Open the repository folder.
3. Open **index.html** in a modern browser.

Alternatively, run **python -m http.server 8000** in the project folder and visit **http://localhost:8000**.

## Project files
- **index.html** — task entry and list interface
- **style.css** — responsive styling
- **script.js** — task operations and filters

## Data storage
Tasks are saved in the browser's `localStorage`, so they remain available after refreshing the page in the same browser. The app does not sync tasks across devices or use a backend. Clearing the browser's site data removes saved tasks.
