// Pure-logic extraction for Node unittests.
// Loads static/js/app.js in a vm sandbox with browser stubs, then exports
// the functions/classes the tests need.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APP_PATH = path.join(__dirname, "..", "static", "js", "app.js");
const source = fs.readFileSync(APP_PATH, "utf8");

function makeSandbox() {
  // Minimal DOM stubs so app.js top-level code doesn't crash.
  // The DOM-dependent sections (event listeners, modal builders) are never
  // invoked during logic tests — only pure functions/classes are called.
  const noop = () => {};
  const fakeElement = () => {
    const el = {
      appendChild: noop,
      addEventListener: noop,
      remove: noop,
      classList: { add: noop, remove: noop },
      style: {},
      dataset: {},
      _text: "",
      set textContent(v) { this._text = String(v); },
      get textContent() { return this._text; },
      get innerHTML() {
        return this._text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      },
    };
    return el;
  };
  const sandbox = {
    console,
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: fakeElement,
      addEventListener: noop,
      body: { appendChild: noop },
    },
    window: {},
    FileReader: function () {},
    Blob: function () {},
    URL: { createObjectURL: () => "", revokeObjectURL: noop },
    XLSX: { utils: {}, write: noop },
    html2canvas: noop,
    getComputedStyle: () => ({ fontSize: "16px", backgroundColor: "#fff" }),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function loadApp() {
  const sandbox = makeSandbox();
  // Run app.js in the sandbox. The trailing expression exposes the internals
  // we want to test.
  const expose = `
    ;({
      splitFrequencySegment,
      CourseCell,
      CourseTable,
      lightenHex,
      hexToRgba,
      isValidHex,
      escapeHtml,
      CLASS_TIME_MAP,
      EN2CN_NUM,
      CN2EN_NUM,
      IGNORE_WEEKEND,
      DEFAULT_PALETTES,
      DEFAULT_FONT_STYLE,
      DEFAULT_FONT_FAMILY,
      DEFAULT_FONT_STYLE_BY_KIND,
      DEFAULT_FONT_FAMILY_BY_KIND,
      DEFAULT_FONT_SIZE_BY_KIND,
      FONT_STYLE_OPTIONS,
      FONT_FAMILY_OPTIONS,
      getFontFamilyOptions,
      resolveFontFamily,
      MEAL_BREAKS,
      PNG_EXPORT_SCALE,
      lightTextColorIndexes,
      classroomSelections,
      getRememberedClassroom,
      buildStyledWorksheet,
    });
  `;
  return vm.runInContext(source + expose, sandbox);
}

module.exports = { loadApp };
