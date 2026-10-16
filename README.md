# Track Your Progress

A small browser-based task manager for keeping everyday tasks in one place. It runs locally in your browser, so there is no account to create and nothing to install.

## What it can do

- Add tasks with an optional due date.
- View a month calendar and move between months.
- Select a date to see tasks scheduled for that day.
- See how many tasks are scheduled on each calendar date.
- Edit a task inline, including its due date, with Save and Cancel controls.
- Press **Enter** to save an edit or **Escape** to cancel it.
- See overdue tasks and tasks due today highlighted.
- Delete a task and undo the most recent deletion.
- Filter the list to see everything, completed tasks, or tasks still to do.
- Keep tasks after refreshing the page using browser storage.
- Use it on a phone or desktop browser.

## Try it on your computer

1. Download this repository with **Code → Download ZIP** and extract it, or clone it:

       git clone https://github.com/Vikram2005-byte/Track-your-progress.git

2. Open the folder and launch index.html in your browser.

For a local web server, open a terminal in the project folder and run:

       python -m http.server 8000

Then visit http://127.0.0.1:8000. Keep the terminal open while using the app; press **Ctrl+C** to stop the server.

## How your tasks are saved

Tasks are stored in this browser's localStorage. They don't sync to another device, and clearing browser site data will remove them. The app has no backend or sign-in system. Older saved tasks without due dates continue to work and can be given a date by editing them.

The Undo control restores the most recently deleted task during the current session.

## A quick look at the files

- index.html — task entry, calendar, filters, task list, and undo notice
- style.css — layout, calendar, inline editor, and responsive styling
- script.js — task actions, date handling, calendar rendering, filtering, undo, and storage

This is an evolving front-end project. Future improvements could include priorities, search, task export/import, and automated tests.
