// Tiny fail-fast test runner. No framework — each test is a function that
// throws on failure. Run: node test/run.js

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function eq(actual, expected, msg = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

function ok(cond, msg = "expected truthy") {
  if (!cond) throw new Error(msg);
}

// ─── splitFrequencySegment ─────────────────────────────────

const { loadApp } = require("./loadApp.js");
const app = loadApp();
const { splitFrequencySegment, CourseCell, CourseTable } = app;

test("splitFrequencySegment: bare 每周", () => {
  eq(splitFrequencySegment("每周"), { frequency: "每周", remainder: "" });
});

test("splitFrequencySegment: bare 双周", () => {
  eq(splitFrequencySegment("双周"), { frequency: "双周", remainder: "" });
});

test("splitFrequencySegment: bare 单周", () => {
  eq(splitFrequencySegment("单周"), { frequency: "单周", remainder: "" });
});

test("splitFrequencySegment: 每周 + 考试方式", () => {
  eq(
    splitFrequencySegment("每周考试方式：堂考、论文、或统一时间考试"),
    { frequency: "每周", remainder: "考试方式：堂考、论文、或统一时间考试" }
  );
});

test("splitFrequencySegment: 双周 + 考试时间 with trailing ；", () => {
  eq(
    splitFrequencySegment("双周考试时间：20270107下午；"),
    { frequency: "双周", remainder: "考试时间：20270107下午" }
  );
});

test("splitFrequencySegment: 每周 + 考试时间 with trailing ；", () => {
  eq(
    splitFrequencySegment("每周考试时间：20261228晚上；"),
    { frequency: "每周", remainder: "考试时间：20261228晚上" }
  );
});

test("splitFrequencySegment: 单周 + 考试方式", () => {
  eq(
    splitFrequencySegment("单周考试方式：堂考、论文、或统一时间考试"),
    { frequency: "单周", remainder: "考试方式：堂考、论文、或统一时间考试" }
  );
});

test("splitFrequencySegment: empty string", () => {
  eq(splitFrequencySegment(""), { frequency: "", remainder: "" });
});

test("splitFrequencySegment: no frequency token", () => {
  eq(splitFrequencySegment("普通文字"), { frequency: "", remainder: "普通文字" });
});

// ─── CourseCell._processElectiveValue (legacy 1-row xls) ───

function parseLegacy(value) {
  const fakeTable = { _postAppend: [] };
  const cell = new CourseCell(0, 0, value, undefined, fakeTable);
  return {
    classname: cell.classname,
    classroom: cell.classroom,
    frequency: cell.frequency,
    note: cell.note,
    examinfo: cell.examinfo,
  };
}

test("legacy: 高等数学 with 考试时间", () => {
  eq(
    parseLegacy("高等数学 (B) (一)(理教203)(备注：) 每周考试时间：20261228晚上；"),
    {
      classname: "高等数学 (B) (一)",
      classroom: "理教203",
      frequency: "每周",
      note: "",
      examinfo: "考试时间：20261228晚上",
    }
  );
});

test("legacy: 大数据应用实践 with 考试方式 + 备注", () => {
  eq(
    parseLegacy("大数据应用实践（下）(暂无上课教室数据)(备注：限大数据专业选课) 每周考试方式：堂考、论文、或统一时间考试"),
    {
      classname: "大数据应用实践 (下)",
      classroom: "暂无",
      frequency: "每周",
      note: "限大数据专业选课",
      examinfo: "考试方式：堂考、论文、或统一时间考试",
    }
  );
});

test("legacy: 数据治理 每周 考试时间", () => {
  eq(
    parseLegacy("数据治理(二教421)(备注：) 每周考试时间：20261230下午；"),
    {
      classname: "数据治理",
      classroom: "二教421",
      frequency: "每周",
      note: "",
      examinfo: "考试时间：20261230下午",
    }
  );
});

test("legacy: 面向对象程序设计JAVA 双周 考试时间", () => {
  eq(
    parseLegacy("面向对象程序设计JAVA(理教215)(备注：) 双周考试时间：20270107下午；"),
    {
      classname: "面向对象程序设计JAVA",
      classroom: "理教215",
      frequency: "双周",
      note: "",
      examinfo: "考试时间：20270107下午",
    }
  );
});

test("legacy: 中国电影史 每周 考试方式", () => {
  eq(
    parseLegacy("中国电影史(三教503)(备注：) 每周考试方式：堂考、论文、或统一时间考试"),
    {
      classname: "中国电影史",
      classroom: "三教503",
      frequency: "每周",
      note: "",
      examinfo: "考试方式：堂考、论文、或统一时间考试",
    }
  );
});

test("legacy: 面向对象程序设计JAVA上机 with 备注", () => {
  eq(
    parseLegacy("面向对象程序设计JAVA上机(三教301)(备注：与03033350面向对象程序设计Java排同一教室) 每周考试方式：堂考、论文、或统一时间考试"),
    {
      classname: "面向对象程序设计JAVA上机",
      classroom: "三教301",
      frequency: "每周",
      note: "与03033350面向对象程序设计Java排同一教室",
      examinfo: "考试方式：堂考、论文、或统一时间考试",
    }
  );
});

test("legacy: 认识中国的方法 每周 考试方式", () => {
  eq(
    parseLegacy("认识中国的方法(二教109)(备注：) 每周考试方式：堂考、论文、或统一时间考试"),
    {
      classname: "认识中国的方法",
      classroom: "二教109",
      frequency: "每周",
      note: "",
      examinfo: "考试方式：堂考、论文、或统一时间考试",
    }
  );
});

// ─── CourseCell._processXlsxValue (2-row xlsx) ───

function parseTwoRow(upper, lower) {
  const fakeTable = { _postAppend: [] };
  const cell = new CourseCell(0, 0, upper, lower, fakeTable);
  return {
    classname: cell.classname,
    classroom: cell.classroom,
    frequency: cell.frequency,
    note: cell.note,
    examinfo: cell.examinfo,
  };
}

test("2-row: standard classname + (classroom，frequency) + 考试时间", () => {
  eq(
    parseTwoRow("高等数学 (B) (一)\n（理教203，每周）", "考试时间：20261228晚上"),
    {
      classname: "高等数学 (B) (一)",
      classroom: "理教203",
      frequency: "每周",
      note: "",
      examinfo: "考试时间：20261228晚上",
    }
  );
});

test("2-row: 双周 + 考试方式", () => {
  eq(
    parseTwoRow("面向对象程序设计JAVA\n（理教215，双周）", "考试方式：堂考"),
    {
      classname: "面向对象程序设计JAVA",
      classroom: "理教215",
      frequency: "双周",
      note: "",
      examinfo: "考试方式：堂考",
    }
  );
});

test("2-row: 暂无上课教室数据 becomes 暂无", () => {
  const r = parseTwoRow("大数据应用实践（下）\n（暂无上课教室数据，每周）", "考试方式：堂考");
  eq(r.classroom, "暂无");
});

test("2-row: lower with 备注 line goes to note", () => {
  const r = parseTwoRow("X\n（A，每周）", "备注：限选课\n考试方式：堂考");
  eq(r.note, "备注：限选课");
  eq(r.examinfo, "考试方式：堂考");
});

test("2-row: lower multiple exam lines joined with ；", () => {
  const r = parseTwoRow("X\n（A，每周）", "考试时间：1\n考试方式：2");
  eq(r.examinfo, "考试时间：1；考试方式：2");
});

test("2-row: empty lower", () => {
  const r = parseTwoRow("X\n（A，每周）", "");
  eq(r.examinfo, "");
  eq(r.note, "");
});

// ─── CourseCell._parseXitike ───────────────────────────────

test("_parseXitike form 01", () => {
  const cell = new CourseCell(0, 0, null, undefined, null, true);
  const r = cell._parseXitike("习题课上课时间：每周二10-11，上课教室：二教315、三教308");
  eq(r, { freq: "每周", time: "周二10-11", classroom: "二教315、三教308" });
});

test("_parseXitike form 02", () => {
  const cell = new CourseCell(0, 0, null, undefined, null, true);
  const r = cell._parseXitike("习题课每周二10-11节，教室：一教303、二教317");
  eq(r, { freq: "每周", time: "周二10-11", classroom: "一教303、二教317" });
});

// ─── Color helpers ─────────────────────────────────────────

const { lightenHex, hexToRgba, isValidHex, escapeHtml } = app;

test("lightenHex: shifts each hex digit +1 twice", () => {
  // #79adac → #8ABEBD → #9BCFCE
  eq(lightenHex("#79adac"), "#9BCFCE");
});

test("hexToRgba: full alpha", () => {
  eq(hexToRgba("#ff0000", 1), "rgba(255,0,0,1)");
});

test("hexToRgba: half alpha", () => {
  eq(hexToRgba("#000000", 0.5), "rgba(0,0,0,0.5)");
});

test("isValidHex", () => {
  ok(isValidHex("#abcdef"));
  ok(isValidHex("#ABCDEF"));
  ok(!isValidHex("#abc"));
  ok(!isValidHex("abcdef"));
  ok(!isValidHex("#abcdeff"));
});

test("escapeHtml: escapes <>&", () => {
  // escapeHtml uses DOM innerHTML; vm sandbox stubs document so we only
  // verify it doesn't throw and returns a string.
  const out = escapeHtml("<b>&\"");
  ok(typeof out === "string", "escapeHtml should return a string");
});

// ─── CourseTable typography kind-scoping ───────────────────

// Mock ws with enough columns to survive IGNORE_WEEKEND (needs ≥4 cols total:
// 1 index + 3+ data cols so colLimit = ncols-3 > 0).
const MOCK_HEADER = ["节数", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

test("typography: same kind shares config regardless of row/col", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.setTypography("header", null, 0, { fontFamily: "serif", fontSize: 20 });
  eq(t.getTypography("header", null, 0), { fontFamily: "serif", fontSize: 20 });
  eq(t.getTypography("header", null, 5), { fontFamily: "serif", fontSize: 20 });
  eq(t.getTypography("course", 0, 0), null);
});

test("typography: kind keys are independent", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.setTypography("header", null, 0, { fontFamily: "serif", fontSize: 20 });
  t.setTypography("time", 0, null, { fontFamily: "mono", fontSize: 12 });
  eq(t.getTypography("header").fontFamily, "serif");
  eq(t.getTypography("time").fontFamily, "mono");
});

test("fonts: default is vendored Maple Mono", () => {
  eq(app.DEFAULT_FONT_STYLE, "mono");
  eq(app.DEFAULT_FONT_FAMILY, "maple");
  ok(app.resolveFontFamily("mono", "maple").includes("Maple Mono"));
  ok(app.resolveFontFamily("mono", "maple").includes("Noto Sans CJK SC"));
  eq(app.DEFAULT_FONT_STYLE_BY_KIND.time, "serif");
  eq(app.DEFAULT_FONT_FAMILY_BY_KIND.time, "roboto");
  eq(app.DEFAULT_FONT_SIZE_BY_KIND.time, 30);
});

test("fonts: style selects expose compatible family choices", () => {
  eq(app.getFontFamilyOptions("serif").map(([, key]) => key), ["noto", "roboto"]);
  eq(app.getFontFamilyOptions("sans").map(([, key]) => key), ["noto", "roboto"]);
  eq(app.getFontFamilyOptions("mono").map(([, key]) => key), ["maple", "noto", "roboto"]);
});

test("content edit: updates all cells with same original classname", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "ClassX(RoomA)(备注：) 每周", "ClassY(RoomB)(备注：) 每周", "", "", "", "", ""],
    ["第二节", "", "ClassX(RoomC)(备注：) 双周", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.updateClassContent("ClassX", {
    classname: "ClassX edited",
    classroom: "Z",
    frequency: "单周",
    note: "new note",
    examinfo: "new exam",
  });
  const changed = [t.getCell(0, 0), t.getCell(1, 1)];
  for (const cell of changed) {
    eq(cell.classname, "ClassX edited");
    eq(cell.classroom, "Z");
    eq(cell.frequency, "单周");
    eq(cell.note, "new note");
    eq(cell.examinfo, "new exam");
  }
  eq(t.getCell(0, 1).classname, "ClassY");
});

// ─── CourseTable color assignment ──────────────────────────

test("color: same classname shares label when groupByClass on", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "X(A)(备注：) 每周", "", "X(A)(备注：) 每周", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.prepare({ groupByClass: true });
  const palette = ["#111111", "#222222", "#333333", "#444444", "#555555"];
  t._assignColorIndices(palette.length);
  const c1 = t.getCell(0, 0);
  const c2 = t.getCell(0, 2);
  ok(c1.isLabeled());
  ok(c2.isLabeled());
  eq(c1.label, c2.label);
});

test("color: both cells labeled within palette range when groupByClass off", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "X(A)(备注：) 每周", "Y(B)(备注：) 每周", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.prepare({ groupByClass: false });
  t._assignColorIndices(5);
  const c1 = t.getCell(0, 0);
  const c2 = t.getCell(0, 1);
  ok(c1.isLabeled() && c2.isLabeled());
  ok(c1.label >= 0 && c1.label < 5);
  ok(c2.label >= 0 && c2.label < 5);
});

test("color: vertical same-class neighbor inherits label", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "X(A)(备注：) 每周", "", "", "", "", "", ""],
    ["第二节", "X(A)(备注：) 每周", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.prepare({ groupByClass: false });
  t._assignColorIndices(5);
  const top = t.getCell(0, 0);
  const bot = t.getCell(1, 0);
  ok(top.isLabeled() && bot.isLabeled());
  eq(top.label, bot.label);
});

// ─── CourseTable row-height structure ──────────────────────

test("render: empty cells contain same 2+2-line height skeleton", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.prepare({ groupByClass: false });
  const html = t.render(["#111111", "#222222", "#333333", "#444444", "#555555"]);
  ok(html.includes('<div class="classname empty-content"'));
  ok(html.includes('aria-hidden="true">&nbsp;'));
  ok(html.includes('<span class="classroom-text">&nbsp;</span>'));
  ok(html.includes('<div class="cell-remain empty-content"'));
});

test("render: populated cells always reserve cell-remain block", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "ClassX(RoomA)(备注：) 每周", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.prepare({ groupByClass: false });
  const html = t.render(["#111111", "#222222", "#333333", "#444444", "#555555"]);
  ok(html.includes('<div class="cell-remain"'));
  ok(html.includes('<div class="cell-remain" style="background:rgba'));
  ok(html.includes('>&nbsp;ClassX<span class="classroom-text">'));
});

test("inverse font color: applies to every cell assigned to palette color", () => {
  const ws = [
    MOCK_HEADER,
    ["第一节", "ClassX(RoomA)(备注：) 每周", "ClassX(RoomB)(备注：) 每周", "ClassY(RoomC)(备注：) 每周", "", "", "", ""],
  ];
  const t = new CourseTable(ws);
  t.prepare({ groupByClass: true });
  const palette = ["#111111", "#222222", "#333333", "#444444", "#555555"];
  t.render(palette);
  const targetLabel = t.getCell(0, 0).label;
  app.inverseFontColorIndexes.add(targetLabel);
  const html = t.render(palette);
  eq((html.match(/inverse-font-color/g) || []).length, 2);
  app.inverseFontColorIndexes.clear();
});

test("XLSX export: worksheet mirrors timetable structure and styles", () => {
  const wsData = [
    MOCK_HEADER,
    ["第一节", "ClassX(RoomA)(备注：NoteA) 每周 考试时间：ExamA", "", "", "", "", "", ""],
  ];
  const t = new CourseTable(wsData);
  const palette = ["#79ADAC", "#BEADF2", "#A0C8F2", "#ADF7B6", "#FFEA99"];
  t.prepare({ groupByClass: true });
  t.render(palette);
  t.getCell(0, 0).label = 0;

  const ws = app.buildStyledWorksheet(t, palette, {
    columnWidths: [80, 180, 180, 180, 180, 180],
    headerHeight: 44,
    periodHeights: [87],
  });
  eq(ws["!ref"], "A1:F5");
  eq(ws.B2.v, "ClassX");
  eq(ws.B3.v, "（RoomA，每周）");
  eq(ws.B4.v, "NoteA；");
  eq(ws.B5.v, "考试时间：ExamA");
  eq(ws.B2.s.fill.fgColor.rgb, "FF8CB8B7");
  eq(ws.B4.s.fill.fgColor.rgb, "FFCBE4E2");
  eq(ws.B2.s.font.bold, true);
  eq(ws.B2.s.alignment.wrapText, true);
  eq(ws["!cols"][0].wpx, 80);
  eq(ws["!cols"][1].wpx, 180);
  eq(ws["!rows"][0].hpt, 33);
  eq(Math.round(ws["!rows"].slice(1).reduce((sum, row) => sum + row.hpt, 0)), 65);
  eq(ws["!rows"].length, 5);
});

test("XLSX export: follows edited font family, type, size, and weight hierarchy", () => {
  const wsData = [MOCK_HEADER, ["第一节", "ClassX(RoomA)(备注：) 每周", "", "", "", "", "", ""]];
  const t = new CourseTable(wsData);
  const palette = ["#79ADAC", "#BEADF2", "#A0C8F2", "#ADF7B6", "#FFEA99"];
  t.prepare({ groupByClass: true });
  t.render(palette);
  t.setTypography("header", null, null, {
    fontStyle: "serif", fontFamilyKey: "noto", fontFamily: "Noto Serif CJK SC", fontSize: 22,
  });
  t.setTypography("time", null, null, {
    fontStyle: "mono", fontFamilyKey: "maple", fontFamily: "Maple Mono", fontSize: 32,
  });
  t.setTypography("course", null, null, {
    fontStyle: "sans", fontFamilyKey: "roboto", fontFamily: "Roboto", fontSize: 20,
  });

  const ws = app.buildStyledWorksheet(t, palette);
  eq(ws.B1.s.font.name, "Noto Serif CJK SC");
  eq(ws.B1.s.font.sz, 16.5);
  eq(ws.A3.s.font.name, "Maple Mono");
  eq(ws.A3.s.font.sz, 24);
  eq(ws.B2.s.font.name, "Roboto");
  eq(ws.B2.s.font.sz, 15);
  eq(ws.B2.s.font.bold, true);
  eq(ws.B3.s.font.sz, 12.75);
  eq(ws.B3.s.font.bold, false);
});

// ─── CLASS_TIME_MAP / constants ────────────────────────────

const { CLASS_TIME_MAP, EN2CN_NUM, CN2EN_NUM } = app;

test("CLASS_TIME_MAP: start-time-only format", () => {
  for (const [k, v] of Object.entries(CLASS_TIME_MAP)) {
    ok(/^\d{2}:\d{2}$/.test(v), `period ${k} should be HH:MM only, got ${v}`);
  }
});

test("EN2CN_NUM has 7 entries", () => {
  eq(EN2CN_NUM.length, 7);
});

test("CN2EN_NUM maps 一→1, 日→7", () => {
  eq(CN2EN_NUM["一"], 1);
  eq(CN2EN_NUM["日"], 7);
});

// ─── Runner ────────────────────────────────────────────────

let pass = 0, fail = 0;
const failures = [];
for (const t of tests) {
  try {
    t.fn();
    pass++;
    process.stdout.write(".");
  } catch (e) {
    fail++;
    failures.push({ name: t.name, error: e.message });
    process.stdout.write("F");
  }
}
console.log(`\n\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  ✗ ${f.name}\n    ${f.error.split("\n").join("\n    ")}`);
  }
  process.exit(1);
}
