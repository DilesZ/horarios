const fs = require('fs');
const path = require('path');
const vm = require('vm');
const babel = require('@babel/core');

const loadSchedulingCore = (entryFile = "src/app.jsx") => {
  const appPath = path.join(__dirname, entryFile);
  const raw = fs.readFileSync(appPath, "utf8");
  const cutoff = raw.indexOf("const App = () => {");
  const core = cutoff >= 0 ? raw.slice(0, cutoff) : raw;
  const executableCore = entryFile.endsWith(".jsx")
    ? babel.transformSync(core, {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "classic" }],
        ],
        babelrc: false,
        configFile: false,
      }).code
    : core;
  const wrapped = `${executableCore}\n;globalThis.__SCHEDULING__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 };`;
  const sandbox = { console, globalThis: {}, React: { useState: () => {}, useMemo: () => {}, useEffect: () => {} } };
  vm.runInNewContext(wrapped, sandbox);
  return sandbox.globalThis.__SCHEDULING__;
};

const isInOffice = (employee, weekdayLetter) => employee.officeDays.split(",").map(d => d.trim()).includes(weekdayLetter);

const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

const targetDayId = '2026-08-26';
const targetDay = days.find(d => d.id === targetDayId);

console.log(`Schedule for ${targetDayId} (${targetDay.weekdayLetter}):`);
EMPLOYEES.forEach(emp => {
  const type = schedule[emp.id][targetDayId];
  const inOffice = isInOffice(emp, targetDay.weekdayLetter);
  console.log(`- ${emp.name}: ${type} (In Office: ${inOffice})`);
});
