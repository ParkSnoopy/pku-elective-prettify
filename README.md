# pku-elective-prettify

Turn the `schedule.xls` exported from [elective.pku.edu.cn](https://elective.pku.edu.cn) into a beautiful timetable.

Pure client-side — no server, no install.

## Usage

1. Download `schedule.xls` from [elective.pku.edu.cn](https://elective.pku.edu.cn)
2. Open `index.html` in a browser (or deploy to any static host)
3. Select file → choose palette → generate

## Features

- Parse `schedule.xls` timetable files
- Auto-handle 习题课 and other special cells
- Multiple built-in palettes; custom `palette.json` supported
- Same class same color (toggleable)
- One-click regenerate (re-roll colors)

## Project structure

```
index.html                  Entry page
static/css/style.css        Styles
static/js/app.js            App logic (parse, color, render)
static/js/xlsx.full.min.js  SheetJS XLSX parser (vendored)
palette.json                Built-in palettes (also a custom palette example)
```

---

If something looks wrong:
- Check the raw `schedule.xls` data
- File an [ISSUE](https://github.com/ParkSnoopy/pku-elective-prettify/issues/new)
