const fs = require("fs");
const vm = require("vm");
const babel = require("@babel/core");

const raw = fs.readFileSync("src/app.jsx", "utf8");
const cutoff = raw.lastIndexOf("root.render(<App />);");
const core = cutoff >= 0 ? raw.slice(0, cutoff) : raw;

const executableCore = babel.transformSync(core, {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "classic" }],
  ],
  babelrc: false,
  configFile: false,
}).code;

const wrapped = `${executableCore}\n;globalThis.__S__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 };`;
const sandbox = {
  console,
  globalThis: {},
  process,
  ReactDOM: {
    createRoot: () => ({ render: () => {} })
  },
  document: {
    getElementById: () => ({})
  },
  React: {
    useState: () => ["", () => {}],
    useMemo: (f) => f(),
    useEffect: () => {},
    useCallback: (f) => f,
    useRef: () => ({ current: null }),
  },
};
vm.runInNewContext(wrapped, sandbox);

const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = sandbox.globalThis.__S__;
const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

const w9 = days.filter(d => d.id >= "2026-08-03" && d.id <= "2026-08-07");
console.log("=== Week 9 O30s ===");
w9.forEach(d => {
  const o30s = EMPLOYEES.filter(e => schedule[e.id][d.id] === "O30").map(e => e.name);
  console.log(`${d.id}: ${o30s.join(", ")}`);
});
