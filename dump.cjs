const fs = require('fs');

let code = fs.readFileSync('src/app.jsx', 'utf8');
code = code.replace(/import React[\s\S]*?;/g, '');
code = code.replace(/const App = \(\) => {[\s\S]*/, '');
code = code.replace(/export default App;/, '');
code = code.replace(/<svg[\s\S]*?<\/svg>/g, '""');

fs.writeFileSync('test_run.cjs', code + `
const plan = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
const targetDayId = "2026-07-17"; // July 17th
const schedule = plan.schedule;

console.log("=== Schedule para el "+targetDayId+" ===");
EMPLOYEES.forEach(emp => {
    let type = schedule[emp.id][targetDayId];
    console.log(emp.name + " (" + emp.officeDays + "): " + type);
});

// Also evaluate dailyCoverage directly if we can
const dayObj = plan.days.find(d => d.id === targetDayId);
const statsState = buildChartDataRows({employees: EMPLOYEES, intensiveWeeksByEmp: {}, forcedOfficeDetails: []}); 
// Actually we need the alerts. Let's rebuild the dailyCoverage for this day using the logic from the app.
let shift18hOfficeCount = 0;
let hasO40InOffice = EMPLOYEES.some(emp => {
    const type = schedule[emp.id][targetDayId];
    if (type !== "O40") return false;
    const daysOffice = emp.officeDays.split(",").map(d => d.trim());
    return daysOffice.includes("V");
});

console.log("\\n¿Alguien con O40 presencial? " + hasO40InOffice);

// Evaluemos si hay alertas
let present = 0;
EMPLOYEES.forEach(e => {
    if(schedule[e.id][targetDayId] !== "V") present++;
});
console.log("Presentes: " + present);

`);
