const fs = require("fs");
const vm = require("vm");
const babel = require("@babel/core");

const raw = fs.readFileSync("src/app.jsx", "utf8");
const cutoff = raw.indexOf("const App = () => {");
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
  React: {
    useState: () => {},
    useMemo: () => {},
    useEffect: () => {},
  },
};
vm.runInNewContext(wrapped, sandbox);

const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = sandbox.globalThis.__S__;
const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

const weeksMap = {};
days.forEach((day) => {
  weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
  weeksMap[day.weekIndex].push(day);
});

console.log("=== INTENSIVE WEEKS (O30) PER EMPLOYEE ===");
EMPLOYEES.forEach((emp) => {
  let count = 0;
  Object.keys(weeksMap).forEach((wi) => {
    const weekDays = weeksMap[wi];
    if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) {
      count++;
    }
  });
  console.log(`${emp.name}: ${count} weeks`);
});
