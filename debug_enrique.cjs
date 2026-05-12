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

const wrapped = `${executableCore}\n;globalThis.__S__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026, preservesOfficeCoverage };`;
const sandbox = { console, globalThis: {}, React: { useState: () => {}, useMemo: () => {}, useEffect: () => {} } };
vm.runInNewContext(wrapped, sandbox);
const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026, preservesOfficeCoverage } = sandbox.globalThis.__S__;

const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
const weeksMap = {}; days.forEach(d => { weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || []; weeksMap[d.weekIndex].push(d); });

const enrique = EMPLOYEES.find(e => e.name === "Enrique");
const week7 = weeksMap[6]; // S7 is index 6

console.log("Analyzing Enrique S7 (Week Index 6)...");
// We need to simulate the state of schedule BEFORE Enrique is considered O30 but AFTER others are.
// But generateSchedule does it in a loop.
// Let's just check preservesOfficeCoverage on the FINAL schedule (with Enrique at O42) to see if flipping him would be valid.
const result = preservesOfficeCoverage(enrique.id, week7, schedule);
console.log("preservesOfficeCoverage result:", result);

// If false, let's see which day fails.
if (!result) {
    week7.forEach(day => {
        let g1HasOffice = false;
        let g2HasOffice = false;
        let g1Cov = 0;
        let g2Cov = 0;
        const GROUP1 = ["Enrique", "Luis", "David"];
        const GROUP2 = ["Jose", "Ariel", "Kike"];

        // Mock flip Enrique to O30
        const oldType = schedule[enrique.id][day.id];
        schedule[enrique.id][day.id] = "O30";

        EMPLOYEES.forEach(e => {
            const type = schedule[e.id][day.id];
            if (type === 'V') return;
            const od = e.officeDays.split(",").map(d => d.trim());
            const isInOffice = od.includes(day.weekdayLetter);
            if (day.weekdayLetter !== "V") {
                if (isInOffice && (type === "O40" || type === "O42")) {
                    if (GROUP1.includes(e.name)) { g1HasOffice = true; g1Cov++; }
                    if (GROUP2.includes(e.name)) { g2HasOffice = true; g2Cov++; }
                }
            }
        });

        const dayValid = (day.weekdayLetter === 'V') ? true : ((g1HasOffice || g2Cov > 0) && (g2HasOffice || g1Cov > 0));
        // Wait, the rule in app.jsx is:
        // if (!group1HasOffice && group2Covering === 0) valid = false;
        // if (!group2HasOffice && group1Covering === 0) valid = false;
        // Which is valid = !(!g1 && g2c==0) && !(!g2 && g1c==0)
        // Which is valid = (g1 || g2c>0) && (g2 || g1c>0)
        
        console.log(`Day ${day.id} (${day.weekdayLetter}): Valid? ${dayValid} | G1Cov: ${g1Cov}, G2Cov: ${g2Cov}`);
        
        // Restore
        schedule[enrique.id][day.id] = oldType;
    });
}
