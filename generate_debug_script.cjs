const fs = require('fs');
const appJsx = fs.readFileSync('./src/app.jsx', 'utf8');

// Extract all JS code
const regex = /const HO.*?const App = \(\) =>/s;
let extracted = appJsx.match(regex)[0];
extracted = extracted.replace('const App = () =>', '');

const scriptBody = `
const WEEKDAY_LETTER = { 1: "L", 2: "M", 3: "X", 4: "J", 5: "V" };
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const buildDaysRange = (year) => {
  const start = new Date(year, 5, 1);
  const end = new Date(year, 8, 30);
  const days = [];
  let weekIndex = -1;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    if (day === 1) weekIndex++;
    const id = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}-\${String(d.getDate()).padStart(2, "0")}\`;
    const month = MONTH_NAMES[d.getMonth()];
    const label = \`\${month.substring(0, 3)} \${String(d.getDate()).padStart(2, "0")}\`;
    const weekdayLetter = WEEKDAY_LETTER[day];
    days.push({ id, label, month, weekdayLetter, weekIndex });
  }
  return days;
};

const EMPLOYEES = [
  { id: 1, name: "Kike", role: "SysAdmin", officeDays: "L, M, X, V", group: "A" },
  { id: 2, name: "Jose", role: "DevOps", officeDays: "L, X, J, V", group: "B" },
  { id: 3, name: "Enrique", role: "Manager", officeDays: "X, J", group: "B" },
  { id: 4, name: "David", role: "Backend", officeDays: "J, V", group: "A" },
  { id: 5, name: "Luis", role: "Frontend", officeDays: "L, M", group: "A" },
  { id: 6, name: "Ariel", role: "FullStack", officeDays: "L, M, J, V", group: "B" },
];

const GROUP1 = ["Enrique", "Luis", "David"];
const GROUP2 = ["Jose", "Ariel", "Kike"];
const SHIFT_BASE_A_18H = true;

${extracted}

const DEFAULT_VACATION_PLAN_2026 = {
  Kike: ["2026-07-06","2026-07-07","2026-07-08","2026-07-09","2026-07-10","2026-07-13","2026-07-14","2026-07-15","2026-07-16","2026-07-17","2026-07-20","2026-07-21","2026-07-22","2026-07-23","2026-07-24"],
  Jose: ["2026-08-17","2026-08-18","2026-08-19","2026-08-20","2026-08-21","2026-08-24","2026-08-25","2026-08-26","2026-08-27","2026-08-28","2026-09-07","2026-09-08","2026-09-09","2026-09-10","2026-09-11"],
  Enrique: ["2026-07-06","2026-07-07","2026-07-08","2026-07-09","2026-07-10","2026-07-27","2026-07-28","2026-07-29","2026-07-30","2026-07-31","2026-08-03","2026-08-04","2026-08-05","2026-08-06","2026-08-07"],
  David: ["2026-06-22","2026-06-23","2026-06-24","2026-06-25","2026-06-26","2026-06-29","2026-06-30","2026-07-01","2026-07-02","2026-07-03","2026-07-20","2026-07-21","2026-07-22","2026-07-23","2026-07-24"],
  Luis: ["2026-07-20","2026-07-21","2026-07-22","2026-07-23","2026-07-24","2026-08-10","2026-08-11","2026-08-12","2026-08-13","2026-08-14","2026-08-31","2026-09-01","2026-09-02","2026-09-03","2026-09-04"],
  Ariel: ["2026-08-03","2026-08-04","2026-08-05","2026-08-06","2026-08-07","2026-08-10","2026-08-11","2026-08-12","2026-08-13","2026-08-14","2026-08-17","2026-08-18","2026-08-19","2026-08-20","2026-08-21"]
};

const WEEKDAY_FULL = {
  L: "Lunes", M: "Martes", X: "Miércoles", J: "Jueves", V: "Viernes",
};

const result = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
const { schedule, days } = result;

const currentIntensiveWeeks = {};
EMPLOYEES.forEach((emp) => {
  let count = 0;
  const daysInWeek = {};
  days.forEach(d => {
    daysInWeek[d.weekIndex] = daysInWeek[d.weekIndex] || [];
    daysInWeek[d.weekIndex].push(d);
  });
  Object.values(daysInWeek).forEach(week => {
    if (week.every(day => schedule[emp.id][day.id] === "O30")) count++;
  });
  currentIntensiveWeeks[emp.name] = count;
});

// Calculate stats using the same logic we extracted but wait, calculateStats requires React so it's not extracted!
// I'll just see currentIntensiveWeeks.
console.dir(currentIntensiveWeeks);

`;

fs.writeFileSync('debug4.cjs', scriptBody);
