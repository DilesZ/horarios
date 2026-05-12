const fs = require('fs');
const content = fs.readFileSync('src/app.jsx', 'utf8');

// We extract just the logic we need by simulating a React environment or simple eval.
// The easiest is just to replace React methods with stubs and run the code.

let codeToRun = content
  .replace(/const \{ useState, useMemo, useEffect \} = React;/g, '')
  .replace(/const App = \(\) => \{[\s\S]*/, '') // Remove the App component entirely
  .replace(/\/\* global React.*?\*\//g, '')
  .replace(/\/\* eslint-.*?\*\//g, '');

codeToRun += `
const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

// Re-create the useMemo logic for stats
const forcedOfficeSet = {};
const forcedOfficeDetails = [];

// Rastreo local de carga para reparto equitativo
const tempForcedCount = {};
EMPLOYEES.forEach(e => tempForcedCount[e.id] = 0);

const getBestCandidate = (groupNames, day) => {
  const candidates = EMPLOYEES.filter(emp => {
    if (!groupNames.includes(emp.name)) return false;
    const type = schedule[emp.id][day.id];
    if (type === "V") return false;
    const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
    return !daysOffice.includes(day.weekdayLetter);
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => tempForcedCount[a.id] - tempForcedCount[b.id]);
  return candidates[0];
};



const dailyCoverage = days.map((day) => {
  let present = 0, vacation = 0, shift18hCount = 0, intensiveCount = 0;
  let group1HasOffice = false, group2HasOffice = false;
  let group1Covering = [], group2Covering = [];

  EMPLOYEES.forEach((emp) => {
    const type = schedule[emp.id][day.id];
    if (type === "V") {
      vacation++;
      return;
    }
    present++;
    if (type === "O30") intensiveCount++;
    if (type === "O42") shift18hCount++;
    const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
    const isInOffice = daysOffice.includes(day.weekdayLetter);
    const hasFullSchedule = day.weekdayLetter === "V" ? (type === "O40") : (type === "O40" || type === "O42");

    if (isInOffice && hasFullSchedule) {
      if (GROUP1.includes(emp.name)) {
        group1HasOffice = true;
        group1Covering.push(emp.name);
      }
      if (GROUP2.includes(emp.name)) {
        group2HasOffice = true;
        group2Covering.push(emp.name);
      }
    }
  });

  if (day.weekdayLetter !== "V") {
    if (!group1HasOffice && group2Covering.length === 0) {
      const candidate = getBestCandidate(GROUP1, day);
      if (candidate) {
        forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
        forcedOfficeSet[day.id].add(candidate.id);
        forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo 1" });
        group1HasOffice = true;
        group1Covering.push(candidate.name);
        tempForcedCount[candidate.id]++;
      }
    }
    if (!group2HasOffice && group1Covering.length === 0) {
      const candidate = getBestCandidate(GROUP2, day);
      if (candidate) {
        forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
        forcedOfficeSet[day.id].add(candidate.id);
        forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo 2" });
        group2HasOffice = true;
        group2Covering.push(candidate.name);
        tempForcedCount[candidate.id]++;
      }
    }
  }
  if (day.weekdayLetter === "V") {
    const hasO40InOffice = EMPLOYEES.some((emp) => {
      const type = schedule[emp.id][day.id];
      if (type !== "O40") return false;
      const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
      return daysOffice.includes("V");
    });

    if (!hasO40InOffice) {
      const isGroupALate = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
      const lateGroup = isGroupALate ? "A" : "B";
      const o40NotOffice = EMPLOYEES.filter((emp) => {
        const type = schedule[emp.id][day.id];
        if (type !== "O40") return false;
        const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
        return !daysOffice.includes("V");
      });
      if (o40NotOffice.length > 0) {
        o40NotOffice.sort((a, b) => tempForcedCount[a.id] - tempForcedCount[b.id]);
        let candidate = o40NotOffice.find((e) => e.name === "Luis") || o40NotOffice.find((e) => e.group !== lateGroup) || o40NotOffice[0];
        if (candidate) {
          forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
          forcedOfficeSet[day.id].add(candidate.id);
          forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Viernes" });
          tempForcedCount[candidate.id]++;
        }
      }
    }
  }
});

console.log("Total forced office days: " + forcedOfficeDetails.length);
console.log(JSON.stringify(forcedOfficeDetails, null, 2));

const intensiveWeeks = {};
EMPLOYEES.forEach(emp => {
    let count = 0;
    const weeks = {};
    days.forEach(d => { weeks[d.weekIndex] = weeks[d.weekIndex] || []; weeks[d.weekIndex].push(d); });
    Object.values(weeks).forEach(weekDays => {
        if (weekDays.every(d => schedule[emp.id][d.id] === "O30")) count++;
    });
    intensiveWeeks[emp.name] = count;
});
console.log("Intensive weeks per emp:", intensiveWeeks);
`;

fs.writeFileSync('eval_script.cjs', codeToRun);
