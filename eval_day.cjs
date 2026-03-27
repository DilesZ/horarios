const fs = require("fs");
const vm = require("vm");
const babel = require("@babel/core");
const raw = fs.readFileSync("src/app.jsx", "utf8");
const cutoff = raw.indexOf("const App = () => {");
const core = cutoff >= 0 ? raw.slice(0, cutoff) : raw;
const executableCore = babel.transformSync(core, {
  presets: [["@babel/preset-env", { targets: { node: "current" } }], ["@babel/preset-react", { runtime: "classic" }]],
  babelrc: false, configFile: false,
}).code;
const wrapped = `${executableCore}\n;globalThis.__S__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 };`;
const sandbox = { console, globalThis: {}, React: { useState: () => {}, useMemo: () => {}, useEffect: () => {} } };
vm.runInNewContext(wrapped, sandbox);
const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = sandbox.globalThis.__S__;
const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

console.log("=== CHECKING O42 PRESENCE MON-THU ===");
days.filter(d => d.weekdayLetter !== "V").forEach(day => {
    const hasO42InOffice = EMPLOYEES.some(e => {
        if (schedule[e.id][day.id] !== "O42") return false;
        const od = e.officeDays.split(",").map(x => x.trim());
        return od.includes(day.weekdayLetter);
    });
    if (!hasO42InOffice) {
        const hasO40InOffice = EMPLOYEES.some(e => {
            if (schedule[e.id][day.id] !== "O40") return false;
            const od = e.officeDays.split(",").map(x => x.trim());
            return od.includes(day.weekdayLetter);
        });
        const emps = EMPLOYEES.map(e => `${e.name}:${schedule[e.id][day.id]}`).join(", ");
        console.log(`${day.id} (${day.weekdayLetter}): O42 in office? NO | O40 in office? ${hasO40InOffice ? "YES" : "NO"} | ${emps}`);
    }
});
