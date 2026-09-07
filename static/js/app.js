"use strict";

// ─── Constants ──────────────────────────────────────────────

const IGNORE_WEEKEND = true;
const LIGHTER_CYCLE = 2;
const DEFAULT_PALETTE_SIZE = 5;

const CLASS_TIME_MAP = {
  1: "08:00", 2: "09:00", 3: "10:10",
  4: "11:10", 5: "13:00", 6: "14:00",
  7: "15:10", 8: "16:10", 9: "17:10",
  10: "18:40", 11: "19:40", 12: "20:40",
};
const CLASS_DURATION_MINUTES = 50;

function getClassEndTime(startTime) {
  const [hour, minute] = startTime.split(":").map(Number);
  const endMinutes = hour * 60 + minute + CLASS_DURATION_MINUTES;
  return `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
}

function formatClassTime(time, format = "24", zeroPadding = true) {
  if (!time) return time;
  const [hour, minute] = time.split(":").map(Number);
  const displayHour = format === "12" ? hour % 12 || 12 : hour;
  const hourText = zeroPadding ? String(displayHour).padStart(2, "0") : String(displayHour);
  return `${hourText}:${String(minute).padStart(2, "0")}${format === "12" ? ` ${hour < 12 ? "AM" : "PM"}` : ""}`;
}

const MEAL_BREAKS = new Set([4, 9]);
const EXPORT_PADDING = 12;
const PNG_EXPORT_SCALE = 4;
const ROW_DIVIDER_WIDTH = 1;
const INDEX_COLUMN_WIDTH = 120;

const EN2CN_NUM = ["一","二","三","四","五","六","日"];
const CN2EN_NUM = {"一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"日":7};

const DEFAULT_FONT_STYLE = "mono";
const DEFAULT_FONT_FAMILY = "roboto";
const DEFAULT_FONT_STYLE_BY_KIND = { corner: "mono", header: "mono", time: "serif", course: "mono" };
const DEFAULT_FONT_FAMILY_BY_KIND = { corner: "roboto", header: "roboto", time: "noto", course: "roboto" };
const DEFAULT_FONT_SIZE_BY_KIND = { corner: 16, header: 20, time: 30, course: 18 };

const FONT_STYLE_OPTIONS = [
  ["Noto Serif", "serif"],
  ["Noto Sans", "sans"],
  ["Roboto Mono", "mono"],
];

const FONT_FAMILY_OPTIONS = {
  serif: [
    ["Noto Serif", "noto", "'Noto Serif CJK SC', serif"],
  ],
  sans: [
    ["Noto Sans", "noto", "'Noto Sans CJK SC', sans-serif"],
  ],
  mono: [
    ["Roboto Mono", "roboto", "'Roboto Mono', 'Noto Sans CJK SC', monospace"],
  ],
};

function getFontFamilyOptions(style) {
  return FONT_FAMILY_OPTIONS[style] || FONT_FAMILY_OPTIONS[DEFAULT_FONT_STYLE];
}

function resolveFontFamily(style, familyKey) {
  const options = getFontFamilyOptions(style);
  return (options.find(([, key]) => key === familyKey) || options[0])[2];
}

const HEX_CHARS = "0123456789ABCDEF";
const HEX_LOOP = {};
for (let i = 0; i < HEX_CHARS.length; i++) {
  HEX_LOOP[HEX_CHARS[i]] = HEX_CHARS[Math.min(i + 1, HEX_CHARS.length - 1)];
}
HEX_LOOP["#"] = "#";

// ─── Default palettes (from palette.json) ───────────────────

const DEFAULT_PALETTES = {
  "default Colorful": ["#79adac","#beadf2","#a0c8f2","#adf7b6","#ffea99"],
  "Pastel Dreamland Adventure": ["#cdb4db","#ffc8dd","#ffafcc","#bde0fe","#a2d2ff"],
  "Pastel Dreams": ["#809bce","#95b8d1","#b8e0d2","#d6eadf","#eac4d5"],
  "Golden Summer Fields": ["#ccd5ae","#e9edc9","#fefae0","#faedcd","#d4a373"],
  "Spring Delight": ["#79addc","#ffc09f","#ffee93","#fcf5c7","#adf7b6"],
  "Passtel colorss": ["#f1c494","#faf3a5","#9df79c","#89d1fb","#cfaaf6"],
  "Pastel Grass": ["#b7e4ba","#95d59d","#74c691","#52b776","#40915d"],
  "Henggarae - Hana": ["#b8d6ec","#f6c7b7","#d6c8e8","#f9f3e3","#cfcbc5"],
  "SaltwaterTaffy": ["#f0ed5f","#f3c6fc","#9de0e7","#edbb7d","#b5c4fa"],
  "ego death at the bachelorette party": ["#ea7d72","#97851e","#3e5241","#2194c2","#b085de"],
  "Dark Winter Pastel Blues": ["#abb9c2","#c6d6da","#a9c7ce","#c8dce9","#a3b6ba"],
};

const CUSTOM_KEY = "__custom__";

// ─── Color helpers ──────────────────────────────────────────

function lightenHex(hex, cycles = LIGHTER_CYCLE) {
  let h = hex.toUpperCase().replace(/[^0-9A-F#]/g, "");
  for (let c = 0; c < cycles; c++) {
    h = h.split("").map(ch => HEX_LOOP[ch] || ch).join("");
  }
  return h;
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isValidHex(s) {
  return /^#[0-9A-Fa-f]{6}$/.test(s);
}

// ─── CourseCell ─────────────────────────────────────────────

// Extract frequency token directly (每周/单周/双周). Anything else in the
// same segment is returned as the remainder so callers can route it.
function splitFrequencySegment(segment) {
  const s = (segment || "").trim();
  if (!s) return { frequency: "", remainder: "" };
  const m = s.match(/每周|单周|双周/);
  if (!m) return { frequency: "", remainder: s };
  const frequency = m[0];
  const remainder = (s.slice(0, m.index) + s.slice(m.index + frequency.length))
    .replace(/^[；;，,\s]+/, "")
    .replace(/[；;]+$/, "");
  return { frequency, remainder };
}

class CourseCell {
  constructor(row, col, upperValue, lowerValue, table, rawInit = false) {
    this._label = null;
    this._row = row;
    this._col = col;
    if (!rawInit) {
      if (lowerValue !== undefined) {
        this._processXlsxValue(upperValue, lowerValue, table);
      } else {
        this._processElectiveValue(upperValue, table);
      }
    }
  }

  get label() { return this._label; }
  set label(v) { this._label = v; }
  isLabeled() { return this._label !== null; }

  // Parse 2-row xlsx format:
  //   upper: " 课程名\n（教室，频率）"
  //   lower: "考试时间：..." or "备注\n考试方式：..."
  _processXlsxValue(upperValue, lowerValue, table) {
    const upper = (upperValue || "").trim();
    const lower = (lowerValue || "").trim();

    this.classname = "";
    this.classroom = "";
    this.frequency = "";
    this.note = "";
    this.examinfo = "";

    if (upper) {
      const lines = upper.split("\n").map(s => s.trim()).filter(s => s);
      this.classname = lines[0] || "";
      if (lines.length > 1) {
        // Parse （classroom，frequency）
        const bracket = lines[1].replace(/[（()）]/g, "").trim();
        const parts = bracket.split("，").map(s => s.trim());
        this.classroom = parts[0] === "暂无上课教室数据" ? "暂无" : (parts[0] || "");
        const { frequency, remainder } = splitFrequencySegment(parts[1] || "");
        this.frequency = frequency;
        if (remainder) this.examinfo = remainder;
      }
    }

    if (lower) {
      const lowerLines = lower.split("\n").map(s => s.trim()).filter(s => s);
      for (const line of lowerLines) {
        if (line.startsWith("考试时间") || line.startsWith("考试方式")) {
          if (this.examinfo) this.examinfo += "；";
          this.examinfo += line;
        } else {
          if (this.note) this.note += "；";
          this.note += line;
        }
      }
    }
  }

  // Legacy: parse old schedule.xls single-cell format
  _processElectiveValue(value, table) {
    let v = value.replace(/ /g, "");
    const m = v.match(/周[每单双]/);
    if (m) {
      const idx = v.indexOf(m[0]) + m[0].length;
      v = v.slice(0, idx) + " " + v.slice(idx);
    }
    v = v.replace(/[()（）]/g, " ");
    let elems = v.split(" ").filter(s => s !== "");
    while (elems.length > 1 && elems[1].length <= 1) {
      const elem = elems.splice(1, 1)[0];
      elems[0] = (elems[0] + " (" + elem + ")").trim();
    }
    this.classname = elems[0] || "";
    this.classroom = elems[1] === "暂无上课教室数据" ? "暂无" : (elems[1] || "");
    this.note = (elems[2] || "").replace("备注：", "").trim();
    // Frequency slot often absorbs trailing exam info, e.g. "每周考试时间：..."
    // or "每周考试方式：...". Extract frequency token directly; the remainder
    // is exam info.
    const { frequency, remainder } = splitFrequencySegment(elems[3] || "");
    this.frequency = frequency;
    let exam = (elems[4] || "").replace(/[；;]+$/, "");
    if (remainder) {
      exam = exam ? remainder + "；" + exam : remainder;
    }
    this.examinfo = exam;
    if (this.note.includes("习题课")) {
      try {
        const result = this._parseXitike(this.note);
        if (result) {
          this._addPostAppendCell(table, " 习题课", result.freq, result.time, result.classroom);
          this.note = "";
        }
      } catch (e) {
        console.warn("[习题课] parse failed:", e);
      }
    }
    if (elems.length > 5) {
      if (this.note) this.note += "；";
      this.note += elems.slice(5).join("；");
    }
  }

  _parseXitike(note) {
    const timeMatch = note.match(
      /(每周|单周|双周)\s*周?([一二三四五六日])\s*(\d{1,2})(?:\s*[-~～—–至]\s*(\d{1,2}))?\s*节?/
    );
    const classroomMatch = note.match(/(?:上课)?教室\s*[：:]\s*([^；;]+)/);
    if (!timeMatch || !classroomMatch) throw new Error("incomplete exercise class information");

    const [, freq, day, firstPeriod, lastPeriod = firstPeriod] = timeMatch;
    const classroom = classroomMatch[1].replace(/[，,。\s]+$/, "").trim();
    return {
      freq,
      time: `周${day}${firstPeriod}-${lastPeriod}`,
      classroom,
    };
  }

  _addPostAppendCell(table, nameEx, freqRaw, timeRaw, classroomRaw) {
    const classname = this.classname + nameEx;
    const placement = timeRaw.match(/^周([一二三四五六日])(\d{1,2})-(\d{1,2})$/);
    if (!placement) return;
    const [, day, firstPeriod, lastPeriod] = placement;
    table._queuePostAppend({
      classname,
      frequency: freqRaw,
      col: CN2EN_NUM[day] - 1,
      firstRow: Number(firstPeriod) - 1,
      lastRow: Number(lastPeriod) - 1,
      classrooms: classroomRaw.split("、").map(value => value.trim()).filter(Boolean),
    });
  }
}

// ─── CourseTable ────────────────────────────────────────────

class CourseTable {
  constructor(ws) {
    this._postAppend = [];
    this._postAppendRequests = new Map();
    this._classroomChoiceRequests = [];
    this._table = [];
    this.options = null;
    this._paintMem = {};
    this._typography = {};

    const nrows = ws.length;
    const ncols = ws[0].length;
    const colLimit = IGNORE_WEEKEND ? ncols - 3 : ncols - 1;

    // Detect 2-row format: header row + paired rows (time label on odd, info on even)
    // Check if row 1 has time label "第" and row 2 does not
    const isTwoRow = nrows > 2 &&
      String(ws[1][0] || "").includes("第") &&
      !String(ws[2][0] || "").includes("第");

    if (isTwoRow) {
      // 2-row format: each period = 2 source rows (upper + lower)
      // ws[0] = header, ws[1] = period 1 upper, ws[2] = period 1 lower, etc.
      for (let period = 0; ; period++) {
        const upperRow = 1 + period * 2;
        const lowerRow = upperRow + 1;
        if (upperRow >= nrows) break;

        const row = [];
        for (let c = 0; c < colLimit; c++) {
          const srcCol = c + 1;
          const upper = ws[upperRow][srcCol];
          const lower = lowerRow < nrows ? ws[lowerRow][srcCol] : "";
          if (!upper && !lower) { row.push(null); continue; }
          const cc = new CourseCell(period, c, upper, lower, this);
          row.push(cc);
        }
        this._table.push(row);
      }
    } else {
      // Legacy: 1-row format (old schedule.xls)
      for (let r = 0; r < nrows - 1; r++) {
        const row = [];
        for (let c = 0; c < colLimit; c++) {
          const src = ws[r + 1][c + 1];
          if (!src) { row.push(null); continue; }
          const cc = new CourseCell(r, c, src, undefined, this);
          row.push(cc);
        }
        this._table.push(row);
      }
    }

    this._finalizePostAppendRequests();

    // Merge post-append cells
    for (const cc of this._postAppend) {
      if (this._table[cc._row] && cc._col < this._table[cc._row].length) {
        this._table[cc._row][cc._col] = cc;
      }
    }
  }

  shape() { return [this._table.length, this._table[0].length]; }
  getCell(r, c) { return this._table[r][c]; }

  _queuePostAppend(request) {
    const key = [request.classname, request.frequency, request.col, request.firstRow, request.lastRow].join("|");
    const existing = this._postAppendRequests.get(key);
    if (existing) {
      existing.classrooms = [...new Set([...existing.classrooms, ...request.classrooms])];
    } else {
      this._postAppendRequests.set(key, { ...request, key });
    }
  }

  _finalizePostAppendRequests() {
    for (const request of this._postAppendRequests.values()) {
      const classrooms = [...new Set(request.classrooms.filter(value => value !== "暂无"))];
      if (classrooms.length > 1) {
        this._classroomChoiceRequests.push({
          ...request,
          classrooms,
          options: [...classrooms, "暂无"],
        });
      } else {
        this._appendPostAppend(request, classrooms[0] || "暂无");
      }
    }
  }

  _appendPostAppend(request, classroom) {
    for (let row = request.firstRow; row <= request.lastRow; row++) {
      const exists = this._postAppend.some(cc =>
        cc.classname === request.classname && cc._row === row && cc._col === request.col
      );
      if (exists) continue;

      const cc = new CourseCell(row, request.col, null, undefined, null, true);
      cc.classname = request.classname;
      cc.classroom = classroom;
      cc.frequency = request.frequency;
      cc.examinfo = "";
      cc.note = "";
      this._postAppend.push(cc);
      if (this._table[row] && request.col < this._table[row].length) {
        this._table[row][request.col] = cc;
      }
    }
  }

  getClassroomChoiceRequests() {
    return this._classroomChoiceRequests.map(request => ({
      ...request,
      classrooms: [...request.classrooms],
      options: [...request.options],
    }));
  }

  selectClassroom(request, classroom) {
    const stored = this._classroomChoiceRequests.find(choice => choice.key === request.key);
    if (!stored) return;
    const selected = stored.options.includes(classroom) ? classroom : "暂无";
    this._appendPostAppend(stored, selected);
    this._classroomChoiceRequests = this._classroomChoiceRequests.filter(choice => choice.key !== stored.key);
  }

  _typographyKey(kind, row, col) {
    return kind;
  }

  getTypography(kind, row, col) {
    return this._typography[this._typographyKey(kind)] || null;
  }

  setTypography(kind, row, col, typography) {
    this._typography[this._typographyKey(kind)] = typography;
  }

  updateClassContent(classname, content) {
    for (const row of this._table) {
      for (const cell of row) {
        if (cell && cell.classname === classname) {
          Object.assign(cell, content);
        }
      }
    }
  }

  _typographyStyle(kind, row, col) {
    const typography = this.getTypography(kind, row, col);
    if (!typography) return "";
    return `--cell-font:${typography.fontFamily};--cell-font-size:${typography.fontSize}px;`;
  }

  getNeighbors(r, c) {
    const [nr, nc] = this.shape();
    const result = {};
    if (c > 0) result.left = this.getCell(r, c - 1);
    if (c < nc - 1) result.right = this.getCell(r, c + 1);
    if (r > 0) result.top = this.getCell(r - 1, c);
    if (r < nr - 1) result.bottom = this.getCell(r + 1, c);
    return result;
  }

  _getUniqueIndex(cell, paletteSize) {
    if (this.options.groupByClass && this._paintMem.hasOwnProperty(cell.classname)) {
      return this._paintMem[cell.classname];
    }
    const overlaps = new Set();
    const neighbors = this.getNeighbors(cell._row, cell._col);
    for (const [dir, neighbor] of Object.entries(neighbors)) {
      if (!neighbor) continue;
      if (dir === "left" || dir === "right") {
        if (this.options.groupByClass && this._paintMem.hasOwnProperty(neighbor.classname)) {
          overlaps.add(this._paintMem[neighbor.classname]);
        }
        if (neighbor.isLabeled()) overlaps.add(neighbor.label);
      } else {
        if (cell.classname === neighbor.classname && neighbor.isLabeled()) {
          return neighbor.label;
        }
        if (neighbor.isLabeled()) overlaps.add(neighbor.label);
      }
    }
    const available = [];
    for (let i = 0; i < paletteSize; i++) {
      if (!overlaps.has(i)) available.push(i);
    }
    if (available.length === 0) return Math.floor(Math.random() * paletteSize);
    const idx = available[Math.floor(Math.random() * available.length)];
    if (this.options.groupByClass) {
      this._paintMem[cell.classname] = idx;
    }
    return idx;
  }

  _assignColorIndices(paletteSize) {
    const [rows, cols] = this.shape();
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cell = this.getCell(r, c);
        if (cell && !cell.isLabeled()) {
          cell.label = this._getUniqueIndex(cell, paletteSize);
        }
      }
    }
  }

  prepare(options) {
    this.options = options;
    this._paintMem = {};
    for (const row of this._table) {
      for (const cell of row) {
        if (cell) cell.label = null;
      }
    }
  }

  render(palette) {
    this._assignColorIndices(palette.length);
    const [rowLen, colLen] = this.shape();

    // Initial readable width. Browser-side fitting adjusts all course columns
    // after content renders, using full table dimensions (header + index included).
    const cellW = 180;

    const html = [];

    html.push('<table class="timetable">');
    html.push(`<colgroup>`);
    html.push(`<col style="width:${INDEX_COLUMN_WIDTH}px">`);
    for (let c = 0; c < colLen; c++) {
      html.push(`<col style="width:${cellW}px">`);
    }
    html.push("</colgroup>");
    html.push("<thead><tr>");
    html.push(`<th class="corner editable-cell" data-kind="corner" style="${this._typographyStyle("corner")}"></th>`);
    for (let c = 0; c < colLen; c++) {
      html.push(`<th class="day-header editable-cell" data-kind="header" data-col="${c}" style="${this._typographyStyle("header", null, c)}">周${EN2CN_NUM[c]}</th>`);
    }
    html.push("</tr></thead><tbody>");

    for (let r = 0; r < rowLen; r++) {
      html.push('<tr class="period-row">');
      const period = r + 1;
      const startTime = CLASS_TIME_MAP[period] || "";
      const formattedStart = formatClassTime(startTime, this.options.timeFormat, this.options.zeroPadding);
      const formattedEnd = formatClassTime(getClassEndTime(startTime), this.options.timeFormat, this.options.zeroPadding);
      html.push(
        `<td class="time-label editable-cell" data-kind="time" data-row="${r}" style="${this._typographyStyle("time", r)}">` +
        `<span class="time-range start-time">${formattedStart}</span><span class="period">${period}</span>` +
        `<span class="time-range end-time">${formattedEnd}</span></td>`
      );
      for (let c = 0; c < colLen; c++) {
        const cell = this.getCell(r, c);
        if (!cell) {
          // Keep empty rows exactly as tall as a normal course cell:
          // two primary lines plus the reserved two-line remain block.
          const emptyInner = '<div class="classname empty-content" aria-hidden="true">&nbsp;' +
            '<span class="classroom-text">&nbsp;</span></div>' +
            '<div class="cell-remain empty-content" aria-hidden="true">&nbsp;</div>';
          html.push(`<td class="cell empty editable-cell" data-kind="course" data-row="${r}" data-col="${c}" style="${this._typographyStyle("course", r, c)}">${emptyInner}</td>`);
        } else {
          const bgColor = palette[cell.label] || "#ffffff";
          const lightBg = lightenHex(bgColor);
          const upperBg = hexToRgba(bgColor, 0.85);
          const lowerBg = hexToRgba(lightBg, 0.5);
          const inverseClass = lightTextColorIndexes.has(cell.label)
            ? " inverse-font-color"
            : "";

          // Line 1: classname; line 2: （classroom，frequency）
          let inner = `<div class="classname" style="background:${upperBg}">`;
          inner += "&nbsp;" + escapeHtml(cell.classname);
          if (cell.classroom || cell.frequency) {
            const parts = [cell.classroom, cell.frequency].filter(s => s).join("，");
            inner += `<span class="classroom-text">（${escapeHtml(parts)}）</span>`;
          }
          inner += "</div>";

          // Build remaining info lines (frequency already shown in classroom line)
          const remainLines = [];
          if (cell.note) remainLines.push(escapeHtml(cell.note));
          if (cell.examinfo) remainLines.push(escapeHtml(cell.examinfo));

          inner += `<div class="cell-remain" style="background:${lowerBg}">`;
          inner += remainLines.length > 0
            ? remainLines.map(line => line.replace(/[；;]+$/, "")).join("；")
            : "&nbsp;";
          inner += `</div>`;

          html.push(`<td class="cell has-data editable-cell${inverseClass}" data-kind="course" data-row="${r}" data-col="${c}" style="background:${lowerBg};${this._typographyStyle("course", r, c)}">${inner}</td>`);
        }
      }
      html.push("</tr>");
      if (MEAL_BREAKS.has(period) && period < rowLen) {
        html.push(
          `<tr class="meal-break" aria-hidden="true"><td colspan="${colLen + 1}"></td></tr>`
        );
      }
    }

    html.push("</tbody></table>");
    return html.join("");
  }
}

// ─── Utils ──────────────────────────────────────────────────

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

async function waitForFonts() {
  if (document.fonts?.ready) await document.fonts.ready;
}

function getRowDividerWidth(scale) {
  return ROW_DIVIDER_WIDTH / scale;
}

function fitTableAspect(container, targetRatio = 1.15) {
  const table = container.querySelector(".timetable");
  if (!table) return;

  table.style.transform = "none";
  table.style.removeProperty("--row-divider-width");
  container.style.height = "";

  const columns = table.querySelectorAll("col");
  const courseColumns = Array.from(columns).slice(1);
  if (courseColumns.length === 0) return;

  const indexWidth = INDEX_COLUMN_WIDTH;
  for (let pass = 0; pass < 4; pass++) {
    const tableHeight = table.getBoundingClientRect().height;
    const desiredCellWidth = Math.round(
      (tableHeight * targetRatio - indexWidth) / courseColumns.length,
    );
    const cellWidth = Math.max(160, Math.min(desiredCellWidth, 360));
    courseColumns.forEach(col => {
      col.style.width = `${cellWidth}px`;
    });
    table.style.width = `${indexWidth + cellWidth * courseColumns.length}px`;
  }
}

function fitTableDisplay(container) {
  const table = container.querySelector(".timetable");
  if (!table) return;

  table.style.transform = "none";
  table.style.removeProperty("--row-divider-width");
  const maxHeight = Math.max(320, window.innerHeight - 32);
  let scale;
  for (let pass = 0; pass < 2; pass++) {
    scale = Math.min(1, container.clientWidth / table.offsetWidth, maxHeight / table.offsetHeight);
    table.style.setProperty("--row-divider-width", `${getRowDividerWidth(scale)}px`);
  }

  table.style.transformOrigin = "top left";
  table.style.transform = `scale(${scale})`;
  container.style.height = `${Math.ceil(table.offsetHeight * scale)}px`;
}

function showStatus(msg, type = "") {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status" + (type ? " " + type : "");
}

// ─── Palette state ──────────────────────────────────────────

let palettes = { ...DEFAULT_PALETTES };
let currentPaletteKey = Object.keys(palettes)[0];
let customColors = null; // array of hex strings when user edits
let hasGenerated = false;
const lightTextColorIndexes = new Set();

function getCurrentPalette() {
  if (currentPaletteKey === CUSTOM_KEY && customColors) {
    return customColors;
  }
  return palettes[currentPaletteKey] || palettes[Object.keys(palettes)[0]];
}

function getCurrentPaletteName() {
  if (currentPaletteKey === CUSTOM_KEY) return "Custom";
  return currentPaletteKey;
}

// ─── Palette dropdown ───────────────────────────────────────

function renderSwatches(colors) {
  return colors.map(c =>
    `<span class="swatch" style="background:${c}"></span>`
  ).join("");
}

function buildPaletteMenu() {
  const menu = document.getElementById("palette-menu");
  menu.innerHTML = "";

  // Preset entries
  for (const [name, colors] of Object.entries(palettes)) {
    const item = document.createElement("div");
    item.className = "palette-menu-item";
    item.dataset.key = name;
    item.innerHTML =
      `<span class="palette-swatches">${renderSwatches(colors)}</span>` +
      `<span class="palette-menu-name">${escapeHtml(name)}</span>`;
    item.addEventListener("click", () => {
      selectPalette(name);
      closePaletteMenu();
    });
    menu.appendChild(item);
  }

  // Custom entry (only if customColors exist)
  if (customColors) {
    const divider = document.createElement("div");
    divider.className = "palette-menu-divider";
    menu.appendChild(divider);

    const item = document.createElement("div");
    item.className = "palette-menu-item";
    item.dataset.key = CUSTOM_KEY;
    item.innerHTML =
      `<span class="palette-swatches">${renderSwatches(customColors)}</span>` +
      `<span class="palette-menu-name">Custom</span>`;
    item.addEventListener("click", () => {
      selectPalette(CUSTOM_KEY);
      closePaletteMenu();
    });
    menu.appendChild(item);
  }
}

function updatePaletteButton() {
  const colors = getCurrentPalette();
  document.getElementById("palette-current-swatches").innerHTML = renderSwatches(colors);
  document.getElementById("palette-current-name").textContent = getCurrentPaletteName();
}

function selectPalette(key) {
  currentPaletteKey = key;
  lightTextColorIndexes.clear();
  updatePaletteButton();
  renderColorEditor();
}

function openPaletteMenu() {
  buildPaletteMenu();
  document.getElementById("palette-menu").hidden = false;
}

function closePaletteMenu() {
  document.getElementById("palette-menu").hidden = true;
}

// ─── Color editor ───────────────────────────────────────────

function renderColorEditor() {
  const editor = document.getElementById("color-editor");
  const colors = getCurrentPalette();
  editor.innerHTML = "";

  colors.forEach((color, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "color-edit-item";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = color;
    picker.className = "color-picker";
    picker.dataset.index = i;

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.value = color.toUpperCase();
    hexInput.className = "color-hex-input";
    hexInput.dataset.index = i;
    hexInput.maxLength = 7;

    const textColorButton = document.createElement("button");
    textColorButton.type = "button";
    textColorButton.className = "font-color-toggle";
    textColorButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/></svg>';

    function updateTextColorButton() {
      const usesLightText = lightTextColorIndexes.has(i);
      const action = usesLightText ? "Use dark text" : "Use light text";
      textColorButton.setAttribute("aria-pressed", String(usesLightText));
      textColorButton.setAttribute("aria-label", `${action} on ${picker.value.toUpperCase()}`);
      textColorButton.title = `${action} on this color`;
    }
    updateTextColorButton();

    picker.addEventListener("input", () => {
      editColor(i, picker.value);
      hexInput.value = picker.value.toUpperCase();
      updateTextColorButton();
    });

    hexInput.addEventListener("change", () => {
      let v = hexInput.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (isValidHex(v)) {
        editColor(i, v);
        picker.value = v;
        updateTextColorButton();
      } else {
        hexInput.value = colors[i].toUpperCase();
      }
    });

    textColorButton.addEventListener("click", () => {
      if (lightTextColorIndexes.has(i)) lightTextColorIndexes.delete(i);
      else lightTextColorIndexes.add(i);
      updateTextColorButton();
      if (currentTable) rerenderTable();
    });

    wrapper.appendChild(picker);
    wrapper.appendChild(hexInput);
    wrapper.appendChild(textColorButton);
    editor.appendChild(wrapper);
  });
}

function editColor(index, newHex) {
  // On first edit of a preset, clone into customColors and switch to custom
  if (currentPaletteKey !== CUSTOM_KEY) {
    customColors = [...getCurrentPalette()];
    currentPaletteKey = CUSTOM_KEY;
    updatePaletteButton();
  }

  if (currentPaletteKey === CUSTOM_KEY) {
    customColors[index] = newHex;
  }

  // Update swatches in button + editor
  updatePaletteButton();
}

// ─── Main app ───────────────────────────────────────────────

let currentTable = null;
let currentFile = null;
const classroomSelections = new Map();

function init() {
  // Palette dropdown toggle
  const toggle = document.getElementById("palette-toggle");
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("palette-menu");
    if (menu.hidden) {
      openPaletteMenu();
    } else {
      closePaletteMenu();
    }
  });

  // Close menu on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".palette-dropdown")) {
      closePaletteMenu();
    }
  });

  // Initial palette UI
  updatePaletteButton();
  renderColorEditor();

  // File input
  const fileInput = document.getElementById("file-input");
  const fileInfo = document.getElementById("file-info");
  const genBtn = document.getElementById("generate-btn");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      currentFile = file;
      fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      genBtn.disabled = false;
    } else {
      currentFile = null;
      fileInfo.textContent = "";
      genBtn.disabled = true;
    }
  });

  genBtn.addEventListener("click", generate);
  const updateTimeOptions = () => {
    if (!currentTable) return;
    currentTable.options.timeFormat = document.getElementById("time-format").checked ? "12" : "24";
    currentTable.options.zeroPadding = document.getElementById("zero-padding").checked;
    rerenderTable();
  };
  document.getElementById("time-format").addEventListener("change", updateTimeOptions);
  document.getElementById("zero-padding").addEventListener("change", updateTimeOptions);

  // Export buttons
  document.getElementById("export-svg-btn").addEventListener("click", exportSVG);
  document.getElementById("export-png-btn").addEventListener("click", exportPNG);
  document.getElementById("export-xlsx-btn").addEventListener("click", exportXLSX);

  window.addEventListener("resize", () => {
    fitTableDisplay(document.getElementById("table-container"));
  });
}

function generate() {
  if (!currentFile) return;
  showStatus("正在解析文件…");

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        header: 1,
        defval: "",
      });

      const options = {
        palette: getCurrentPalette(),
        groupByClass: document.getElementById("group-by-class").checked,
        timeFormat: document.getElementById("time-format").checked ? "12" : "24",
        zeroPadding: document.getElementById("zero-padding").checked,
      };

      currentTable = new CourseTable(ws);
      await resolveClassroomChoices(currentTable);
      currentTable.prepare(options);

      const container = document.getElementById("table-container");
      container.innerHTML = currentTable.render(options.palette);
      fitTableAspect(container);
      fitTableDisplay(container);
      waitForFonts().then(() => {
        fitTableAspect(container);
        fitTableDisplay(container);
      });

      // Attach cell click handlers
      container.querySelectorAll(".editable-cell").forEach(element => {
        element.addEventListener("click", onCellClick);
      });

      showStatus("");

      // Morph button: Generate → Regenerate
      hasGenerated = true;
      const btn = document.getElementById("generate-btn");
      btn.textContent = "Regenerate";

      // Show export buttons
      document.getElementById("export-row").hidden = false;
    } catch (err) {
      showStatus("生成失败: " + err.message, "error");
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(currentFile);
}

async function resolveClassroomChoices(table) {
  for (const request of table.getClassroomChoiceRequests()) {
    let classroom = getRememberedClassroom(request);
    if (!classroom) {
      classroom = await openClassroomChoicePopup(request);
      classroomSelections.set(request.key, classroom);
    }
    table.selectClassroom(request, classroom);
  }
}

function getRememberedClassroom(request) {
  const classroom = classroomSelections.get(request.key);
  return request.options.includes(classroom) ? classroom : null;
}

function openClassroomChoicePopup(request) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const card = document.createElement("div");
    card.className = "modal-card classroom-choice-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "classroom-choice-heading");

    const heading = document.createElement("h3");
    heading.id = "classroom-choice-heading";
    heading.className = "modal-heading";
    heading.textContent = "Select classroom";
    card.appendChild(heading);

    const description = document.createElement("p");
    description.className = "modal-description";
    const periodText = request.firstRow === request.lastRow
      ? `第${request.firstRow + 1}节`
      : `第${request.firstRow + 1}–${request.lastRow + 1}节`;
    description.textContent = `${request.classname} · 周${EN2CN_NUM[request.col]} · ${periodText}`;
    card.appendChild(description);

    const choices = document.createElement("div");
    choices.className = "classroom-choice-options";
    choices.setAttribute("aria-label", "Classroom choices");
    for (const classroom of request.options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button-secondary classroom-choice-button";
      button.textContent = classroom;
      button.addEventListener("click", () => finish(classroom));
      choices.appendChild(button);
    }
    card.appendChild(choices);
    overlay.appendChild(card);

    function finish(classroom) {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(classroom);
    }

    function onKeydown(event) {
      if (event.key === "Escape") finish("暂无");
    }

    document.addEventListener("keydown", onKeydown);
    document.body.appendChild(overlay);
    choices.querySelector("button").focus();
  });
}

// ─── Cell edit modal ────────────────────────────────────────

function onCellClick(e) {
  const element = e.currentTarget;
  const kind = element.dataset.kind;
  const row = element.dataset.row === undefined ? null : Number(element.dataset.row);
  const col = element.dataset.col === undefined ? null : Number(element.dataset.col);
  const cell = kind === "course" ? currentTable.getCell(row, col) : null;
  openEditModal({ cell, kind, row, col, element });
}

function openEditModal({ cell, kind, row, col, element }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const card = document.createElement("div");
  card.className = "modal-card";

  function closeModal() {
    document.removeEventListener("keydown", onModalKeydown);
    overlay.remove();
  }

  function onModalKeydown(event) {
    if (event.key === "Escape") closeModal();
  }

  const heading = document.createElement("h3");
  heading.className = "modal-heading";
  if (kind === "header") heading.textContent = `Edit — 周${EN2CN_NUM[col]}`;
  else if (kind === "time") heading.textContent = `Edit — 第${row + 1}节`;
  else if (kind === "course") heading.textContent = `Edit — 第${row + 1}节 周${EN2CN_NUM[col]}`;
  else heading.textContent = "Edit — Corner";
  card.appendChild(heading);

  const fields = [
    { key: "classname", label: "课程名称" },
    { key: "classroom", label: "教室" },
    { key: "frequency", label: "频率" },
    { key: "note", label: "备注", multiline: true },
    { key: "examinfo", label: "考试信息", multiline: true },
  ];

  const inputs = {};
  if (cell) {
    const originalClassname = cell.classname;
    const contentHeading = document.createElement("h4");
    contentHeading.className = "modal-subheading";
    contentHeading.textContent = "Content";
    card.appendChild(contentHeading);

    for (const f of fields) {
      const group = document.createElement("div");
      group.className = "modal-field";

      const lbl = document.createElement("label");
      lbl.textContent = f.label;
      group.appendChild(lbl);

      const input = document.createElement(f.multiline ? "textarea" : "input");
      input.value = cell[f.key] || "";
      input.dataset.key = f.key;
      group.appendChild(input);

      inputs[f.key] = input;
      card.appendChild(group);
    }

    // Content-only save: update every cell sharing the original classname;
    // typography remains independent.
    const contentActions = document.createElement("div");
    contentActions.className = "modal-actions";
    const saveContentBtn = document.createElement("button");
    saveContentBtn.className = "button-primary";
    saveContentBtn.textContent = "Save content";
    saveContentBtn.addEventListener("click", () => {
      const content = {};
      for (const [key, input] of Object.entries(inputs)) {
        content[key] = input.value;
      }
      currentTable.updateClassContent(originalClassname, content);
      closeModal();
      rerenderTable();
    });
    contentActions.appendChild(saveContentBtn);
    card.appendChild(contentActions);
  }

  const typography = currentTable.getTypography(kind, row, col);

  const fontHeading = document.createElement("h4");
  fontHeading.className = "modal-subheading";
  fontHeading.textContent = "Font (applies to all cells of this type)";
  card.appendChild(fontHeading);

  const styleGroup = document.createElement("div");
  styleGroup.className = "modal-field";
  const styleLabel = document.createElement("label");
  styleLabel.textContent = "Typeface";
  const styleSelect = document.createElement("select");
  for (const [label, value] of FONT_STYLE_OPTIONS) {
    const option = document.createElement("option");
    option.textContent = label;
    option.value = value;
    styleSelect.appendChild(option);
  }
  styleSelect.value = typography?.fontStyle || DEFAULT_FONT_STYLE_BY_KIND[kind] || DEFAULT_FONT_STYLE;
  styleGroup.appendChild(styleLabel);
  styleGroup.appendChild(styleSelect);
  card.appendChild(styleGroup);

  const sizeGroup = document.createElement("div");
  sizeGroup.className = "modal-field";
  const sizeLabel = document.createElement("label");
  sizeLabel.textContent = "字体大小 (px)";
  const sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.min = "10";
  sizeInput.max = "40";
  sizeInput.step = "1";
  sizeInput.value = String(typography?.fontSize || DEFAULT_FONT_SIZE_BY_KIND[kind] || 16);
  sizeGroup.appendChild(sizeLabel);
  sizeGroup.appendChild(sizeInput);
  card.appendChild(sizeGroup);

  // Font-only save: updates typography, never touches cell content.
  const fontActions = document.createElement("div");
  fontActions.className = "modal-actions";
  const saveFontBtn = document.createElement("button");
  saveFontBtn.className = "button-primary";
  saveFontBtn.textContent = "Save font";
  saveFontBtn.addEventListener("click", () => {
    const fontStyle = styleSelect.value;
    const fontFamilyKey = getFontFamilyOptions(fontStyle)[0][1];
    currentTable.setTypography(kind, row, col, {
      fontStyle,
      fontFamilyKey,
      fontFamily: resolveFontFamily(fontStyle, fontFamilyKey),
      fontSize: Math.max(10, Math.min(Number(sizeInput.value) || 16, 40)),
    });
    closeModal();
    rerenderTable();
  });
  fontActions.appendChild(saveFontBtn);
  card.appendChild(fontActions);

  // Actions
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "button-secondary";
  cancelBtn.textContent = "Close";
  cancelBtn.addEventListener("click", closeModal);

  actions.appendChild(cancelBtn);
  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  document.addEventListener("keydown", onModalKeydown);

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  (inputs.classname || styleSelect).focus();
}

async function rerenderTable() {
  if (!currentTable) return;
  const palette = getCurrentPalette();
  const container = document.getElementById("table-container");
  container.innerHTML = currentTable.render(palette);
  fitTableAspect(container);
  fitTableDisplay(container);
  await waitForFonts();
  fitTableAspect(container);
  fitTableDisplay(container);
  container.querySelectorAll(".editable-cell").forEach(element => {
    element.addEventListener("click", onCellClick);
  });
}

// ─── Export ─────────────────────────────────────────────────

const XLSX_COLORS = {
  canvas: "FAF9F5",
  cream: "E8E0D2",
  hairline: "D6D6D3",
  divider: "92918D",
  ink: "141413",
  body: "3D3D3A",
  muted: "6C6A64",
  inversePrimary: "FFFFFF",
  inverseSecondary: "F0F0F2",
  inverseRemain: "D5D6DA",
};

function blendHexColors(foreground, background, opacity) {
  const parse = hex => {
    const value = hex.replace("#", "");
    return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
  };
  const foregroundRgb = parse(foreground);
  const backgroundRgb = parse(background);
  return foregroundRgb.map((channel, index) =>
    Math.round(channel * opacity + backgroundRgb[index] * (1 - opacity))
      .toString(16)
      .padStart(2, "0")
  ).join("").toUpperCase();
}

function xlsxColor(hex) {
  return { rgb: `FF${hex.replace("#", "").toUpperCase()}` };
}

function xlsxFontName(fontStyle, fontFamilyKey) {
  if (fontStyle === "serif") return "Noto Serif CJK SC";
  if (fontStyle === "sans") return "Noto Sans CJK SC";
  return "Roboto Mono";
}

function xlsxTypography(table, kind, sizeOffset = 0) {
  const typography = table.getTypography(kind);
  const fontStyle = typography?.fontStyle || DEFAULT_FONT_STYLE_BY_KIND[kind];
  const fontFamilyKey = typography?.fontFamilyKey || DEFAULT_FONT_FAMILY_BY_KIND[kind];
  const fontSizePx = (typography?.fontSize || DEFAULT_FONT_SIZE_BY_KIND[kind]) + sizeOffset;
  return {
    name: xlsxFontName(fontStyle, fontFamilyKey),
    sz: Number((Math.max(8, fontSizePx) * 0.75).toFixed(2)),
  };
}

function xlsxBorder(rowRole, column, columnCount, isHeader = false) {
  const thin = { style: "thin", color: xlsxColor(XLSX_COLORS.hairline) };
  const divider = { style: "medium", color: xlsxColor(XLSX_COLORS.divider) };
  const border = {
    left: column === 0 ? divider : thin,
    right: column === columnCount - 1 ? divider : thin,
  };
  if (isHeader) {
    border.top = divider;
    border.bottom = thin;
  } else if (rowRole === 3) {
    border.bottom = divider;
  }
  return border;
}

function encodeXlsxColumn(column) {
  let value = column + 1;
  let encoded = "";
  while (value > 0) {
    value -= 1;
    encoded = String.fromCharCode(65 + (value % 26)) + encoded;
    value = Math.floor(value / 26);
  }
  return encoded;
}

function setXlsxCell(worksheet, row, column, value, style) {
  worksheet[`${encodeXlsxColumn(column)}${row + 1}`] = {
    t: "s",
    v: value || "",
    s: style,
  };
}

function buildStyledWorksheet(table, palette, dimensions = {}) {
  const [periodCount, dayCount] = table.shape();
  const columnCount = dayCount + 1;
  const columnWidths = dimensions.columnWidths || [INDEX_COLUMN_WIDTH, ...Array(dayCount).fill(180)];
  const worksheet = {
    "!ref": `A1:${encodeXlsxColumn(columnCount - 1)}${1 + periodCount * 4}`,
    "!cols": columnWidths.map(width => ({ wpx: width })),
    "!rows": [{ hpt: (dimensions.headerHeight || 44) * 0.75 }],
    "!margins": { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0, footer: 0 },
  };

  const headerFont = { ...xlsxTypography(table, "header"), bold: true, color: xlsxColor(XLSX_COLORS.ink) };
  for (let column = 0; column < columnCount; column++) {
    setXlsxCell(worksheet, 0, column, column === 0 ? "" : `周${EN2CN_NUM[column - 1]}`, {
      font: headerFont,
      fill: { patternType: "solid", fgColor: xlsxColor(XLSX_COLORS.cream) },
      alignment: { horizontal: "center", vertical: "center" },
      border: xlsxBorder(0, column, columnCount, true),
    });
  }

  const courseTypography = table.getTypography("course");
  const courseScale = (courseTypography?.fontSize || DEFAULT_FONT_SIZE_BY_KIND.course) /
    DEFAULT_FONT_SIZE_BY_KIND.course;
  const defaultRoleHeights = [
    (DEFAULT_FONT_SIZE_BY_KIND.course * 1.3 + 4) * courseScale,
    (DEFAULT_FONT_SIZE_BY_KIND.course - 3) * 1.3 * courseScale,
    ((DEFAULT_FONT_SIZE_BY_KIND.course - 4) * 1.3 + 2) * courseScale,
    ((DEFAULT_FONT_SIZE_BY_KIND.course - 4) * 1.3 + 2) * courseScale,
  ];

  for (let periodIndex = 0; periodIndex < periodCount; periodIndex++) {
    const period = periodIndex + 1;
    const firstRow = 1 + periodIndex * 4;
    const startTime = CLASS_TIME_MAP[period] || "";
    const timeValues = [
      formatClassTime(startTime, table.options.timeFormat, table.options.zeroPadding),
      String(period),
      formatClassTime(getClassEndTime(startTime), table.options.timeFormat, table.options.zeroPadding),
      "",
    ];
    const measuredPeriodHeight = dimensions.periodHeights?.[periodIndex];
    const defaultPeriodHeight = defaultRoleHeights.reduce((sum, height) => sum + height, 0);
    const heightScale = measuredPeriodHeight ? measuredPeriodHeight / defaultPeriodHeight : 1;
    const roleHeights = defaultRoleHeights.map(height =>
      Number((height * heightScale).toFixed(2))
    );

    for (let rowRole = 0; rowRole < 4; rowRole++) {
      const worksheetRow = firstRow + rowRole;
      worksheet["!rows"].push({ hpt: Number((roleHeights[rowRole] * 0.75).toFixed(2)) });
      const isPeriodNumber = rowRole === 1;
      const timeFont = {
        ...xlsxTypography(table, "time", isPeriodNumber ? 0 : -14),
        ...(rowRole !== 1 ? { name: "Roboto Mono" } : {}),
        bold: isPeriodNumber,
        color: xlsxColor(isPeriodNumber ? XLSX_COLORS.ink : XLSX_COLORS.muted),
      };
      setXlsxCell(worksheet, worksheetRow, 0, timeValues[rowRole], {
        font: timeFont,
        fill: { patternType: "solid", fgColor: xlsxColor(XLSX_COLORS.cream) },
        alignment: { horizontal: "center", vertical: "center" },
        border: xlsxBorder(rowRole, 0, columnCount),
      });
    }

    for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
      const cell = table.getCell(periodIndex, dayIndex);
      const column = dayIndex + 1;
      let values = ["", "", "", ""];
      let upperFill = XLSX_COLORS.canvas;
      let lowerFill = XLSX_COLORS.canvas;
      let inverse = false;

      if (cell) {
        const baseColor = palette[cell.label] || "#FFFFFF";
        upperFill = blendHexColors(baseColor, `#${XLSX_COLORS.canvas}`, 0.85);
        lowerFill = blendHexColors(lightenHex(baseColor), `#${XLSX_COLORS.canvas}`, 0.5);
        inverse = lightTextColorIndexes.has(cell.label);
        const classroomParts = [cell.classroom, cell.frequency].filter(Boolean);
        values = [
          cell.classname || "",
          classroomParts.length ? `（${classroomParts.join("，")}）` : "",
          cell.note ? `${cell.note.replace(/[；;]+$/, "")}${cell.examinfo ? "；" : ""}` : "",
          cell.examinfo ? cell.examinfo.replace(/[；;]+$/, "") : "",
        ];
      }

      const roleFonts = [
        { ...xlsxTypography(table, "course"), bold: true,
          color: xlsxColor(inverse ? XLSX_COLORS.inversePrimary : XLSX_COLORS.ink) },
        { ...xlsxTypography(table, "course", -3), bold: false,
          color: xlsxColor(inverse ? XLSX_COLORS.inverseSecondary : XLSX_COLORS.body) },
        { ...xlsxTypography(table, "course", -4), bold: false,
          color: xlsxColor(inverse ? XLSX_COLORS.inverseRemain : XLSX_COLORS.muted) },
        { ...xlsxTypography(table, "course", -4), bold: false,
          color: xlsxColor(inverse ? XLSX_COLORS.inverseRemain : XLSX_COLORS.muted) },
      ];

      for (let rowRole = 0; rowRole < 4; rowRole++) {
        setXlsxCell(worksheet, firstRow + rowRole, column, values[rowRole], {
          font: roleFonts[rowRole],
          fill: {
            patternType: "solid",
            fgColor: xlsxColor(rowRole < 2 ? upperFill : lowerFill),
          },
          alignment: { horizontal: "left", vertical: "center", wrapText: true },
          border: xlsxBorder(rowRole, column, columnCount),
        });
      }
    }
  }

  return worksheet;
}

function measureTimetableForXlsx() {
  const table = document.querySelector("#table-container .timetable");
  if (!table) return {};
  return {
    columnWidths: Array.from(table.querySelectorAll("col")).map(column => column.offsetWidth),
    headerHeight: table.tHead?.rows[0]?.offsetHeight,
    periodHeights: Array.from(table.querySelectorAll("tbody .period-row")).map(row => row.offsetHeight),
  };
}

function waitForNextPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function withExportBusy(button, busyLabel, task) {
  const exportButtons = document.querySelectorAll("#export-row button");
  exportButtons.forEach(exportButton => {
    exportButton.dataset.defaultLabel ||= exportButton.textContent;
    exportButton.disabled = true;
  });
  button.setAttribute("aria-busy", "true");
  button.replaceChildren();
  const spinner = document.createElement("span");
  spinner.className = "button-spinner";
  spinner.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.textContent = busyLabel;
  button.appendChild(spinner);
  button.appendChild(label);

  await waitForNextPaint();
  try {
    return await task();
  } finally {
    button.removeAttribute("aria-busy");
    exportButtons.forEach(exportButton => {
      exportButton.textContent = exportButton.dataset.defaultLabel;
      exportButton.disabled = false;
    });
  }
}

function buildRasterSvg(width, height, imageHref) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" ` +
    `preserveAspectRatio="none" href="${imageHref}"/></svg>`;
}

function drawExportTableLines(canvas, bounds, rowBoundaries, color, scale) {
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  const lineWidth = Math.max(1, Math.round(ROW_DIVIDER_WIDTH * scale));
  const left = Math.round(bounds.left * scale);
  const top = Math.round(bounds.top * scale);
  const width = Math.round(bounds.width * scale);
  const height = Math.round(bounds.height * scale);
  context.fillStyle = color;
  rowBoundaries.forEach(boundary => {
    context.fillRect(left, Math.round(boundary * scale - lineWidth / 2), width, lineWidth);
  });
  context.fillRect(Math.round(bounds.left * scale - lineWidth / 2), top, lineWidth, height);
  context.fillRect(Math.round((bounds.left + bounds.width) * scale - lineWidth / 2), top, lineWidth, height);
}

async function renderTimetableCanvas(container, table) {
  await waitForFonts();
  fitTableAspect(container);

  const tableWidth = table.offsetWidth;
  const tableHeight = table.offsetHeight;
  const staging = document.createElement("div");
  staging.style.cssText = `position:fixed;left:-100000px;top:0;box-sizing:content-box;` +
    `width:${tableWidth}px;height:${tableHeight}px;padding:${EXPORT_PADDING}px;` +
    `background:${getComputedStyle(document.body).backgroundColor};`;
  const clone = table.cloneNode(true);
  clone.style.transform = "none";
  clone.style.height = "auto";
  staging.appendChild(clone);
  document.body.appendChild(staging);

  try {
    void staging.offsetHeight;
    const fullWidth = staging.offsetWidth;
    const fullHeight = staging.offsetHeight;
    const stagingRect = staging.getBoundingClientRect();
    const tableRect = clone.getBoundingClientRect();
    const bounds = {
      left: tableRect.left - stagingRect.left,
      top: tableRect.top - stagingRect.top,
      width: tableRect.width,
      height: tableRect.height,
    };
    const rowBoundaries = [bounds.top, ...Array.from(clone.rows, row =>
      row.getBoundingClientRect().bottom - stagingRect.top,
    )];
    const lineColor = getComputedStyle(clone).getPropertyValue("--color-row-divider").trim();
    clone.style.borderColor = "transparent";
    clone.querySelectorAll("th, td").forEach(cell => {
      cell.style.borderColor = "transparent";
    });
    const canvas = await html2canvas(staging, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: PNG_EXPORT_SCALE,
      width: fullWidth,
      height: fullHeight,
      windowWidth: Math.max(document.documentElement.clientWidth, fullWidth),
      windowHeight: Math.max(document.documentElement.clientHeight, fullHeight),
    });
    drawExportTableLines(canvas, bounds, rowBoundaries, lineColor, PNG_EXPORT_SCALE);
    return canvas;
  } finally {
    staging.remove();
    fitTableDisplay(container);
  }
}

async function exportSVG() {
  const container = document.getElementById("table-container");
  const table = container.querySelector(".timetable");
  if (!table) return;

  const button = document.getElementById("export-svg-btn");
  try {
    await withExportBusy(button, "Building SVG…", async () => {
      const canvas = await renderTimetableCanvas(container, table);
      const source = buildRasterSvg(canvas.width, canvas.height, canvas.toDataURL("image/png"));
      downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), "timetable.svg");
    });
  } catch (err) {
    showStatus("SVG 导出失败: " + err.message, "error");
    console.error(err);
  }
}

async function exportPNG() {
  const container = document.getElementById("table-container");
  const table = container.querySelector(".timetable");
  if (!table) return;

  const button = document.getElementById("export-png-btn");
  try {
    await withExportBusy(button, "Building PNG…", async () => {
      const canvas = await renderTimetableCanvas(container, table);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error("Canvas encoding failed")));
      });
      downloadBlob(blob, "timetable.png");
    });
  } catch (err) {
    showStatus("PNG 导出失败: " + err.message, "error");
    console.error(err);
  }
}

async function exportXLSX() {
  if (!currentTable) return;
  const button = document.getElementById("export-xlsx-btn");
  try {
    await withExportBusy(button, "Building XLSX…", async () => {
      const worksheet = buildStyledWorksheet(
        currentTable,
        getCurrentPalette(),
        measureTimetableForXlsx(),
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
      const output = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });
      const blob = new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, "timetable.xlsx");
    });
  } catch (err) {
    showStatus("XLSX 导出失败: " + err.message, "error");
    console.error(err);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", init);
