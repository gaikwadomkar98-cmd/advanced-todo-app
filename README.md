# TaskFlow — Advanced To-do App

A front-end task manager built with HTML, CSS and vanilla JavaScript.

## Features
- Add, edit and delete tasks
- Mark tasks as complete/incomplete
- Priority levels: High, Medium and Low
- Optional due dates and overdue indicators
- Categories: Work, Personal, Study, Health and Other
- Search tasks
- Filter by status and category
- Sort by newest, due date, priority or name
- Dashboard counts for total, in-progress, completed and overdue tasks
- Clear completed tasks with confirmation
- Light/dark theme toggle
- Local storage persistence
- Responsive layout for mobile and desktop

## Run locally
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Open `index.html` in your browser, or use the VS Code Live Server extension.

## Publish on GitHub Pages
1. Put `index.html`, `style.css` and `script.js` in the repository root.
2. Commit and push the files to the `main` branch.
3. In GitHub repository Settings → Pages, choose `Deploy from a branch`, branch `main`, folder `/(root)`.
4. Wait for the deployment to complete.

## Data note
Tasks are saved in the current browser's localStorage. They do not automatically sync across devices or users. Clearing browser storage can remove saved tasks.
