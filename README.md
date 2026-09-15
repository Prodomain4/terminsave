# Terminsave

Terminsave is a first-pass concept for a calm, Drive-like file workspace with a terminal built into the experience.

## Run it

This prototype is intentionally dependency-free. Open `index.html` in a browser, or serve the directory with any static server:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## What works

- File, folder, starred, recent, and trash views
- Search, sorting, grid view, and list view
- A browser terminal with `ls`, `pwd`, `cat`, `touch`, `mkdir`, `write`, `append`, `rm`, and `clear`
- New files and folders from the UI
- File changes persisted locally in browser storage
- Responsive visual system and empty states

This is a frontend MVP. The next production step would be to replace the local storage adapter with authenticated API calls and a sandboxed command runner.
