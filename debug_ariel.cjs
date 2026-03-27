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

const ariel = EMPLOYEES.find(e => e.name === "Ariel");

const weeksMap = {};
days.forEach((day) => {
  weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
  weeksMap[day.weekIndex].push(day);
});

console.log("=== Ariel Weeks in Window ===");
Object.keys(weeksMap).forEach(wi => {
  const weekDays = weeksMap[wi];
  const inWindow = weekDays.every(d => d.id >= "2026-06-15" && d.id <= "2026-09-18");
  if (!inWindow) return;

  const countO30 = EMPLOYEES.filter(e => weekDays.every(d => schedule[e.id][d.id] === "O30")).length;
  const types = weekDays.map(d => schedule[ariel.id][d.id]);
  const isArielO30 = types.every(t => t === "O30");
  
  const hasOfficeO42 = weekDays.every(day => {
    if (day.weekdayLetter === "V") return true;
    return EMPLOYEES.some(e => {
      if (schedule[e.id][day.id] !== "O42") return false;
      const od = e.officeDays.split(",").map(x => x.trim());
      return od.includes(day.weekdayLetter);
    });
  });

  console.log(`Week ${wi} (${weekDays[0].id}): ArielO30=${isArielO30}, O30Count=${countO30}, O42Coverage=${hasOfficeO42}, Types=${[...new Set(types)]}`);
});
