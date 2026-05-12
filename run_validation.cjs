
const fs = require('fs');
const content = fs.readFileSync('src/app.jsx', 'utf8');

let script = 'const React = { useState: () => [null, () => {}], useMemo: (f) => f(), useEffect: () => {} };\n' + 
    content
    .replace(/\/\* global .* \*\//g, '')
    .replace(/const {.*} = React;/g, '')
    .replace(/const LoginForm =[\s\S]*?const root = ReactDOM\.createRoot.*/s, '');

script += `
const plan = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
const results = EMPLOYEES.map(emp => {
  let weeks = 0;
  const weeksMap = {};
  plan.days.forEach(d => {
    weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || [];
    weeksMap[d.weekIndex].push(d);
  });
  Object.values(weeksMap).forEach(wDays => {
    if (wDays.every(d => plan.schedule[emp.id][d.id] === "O30")) weeks++;
  });
  return { name: emp.name, weeks };
});
console.log(JSON.stringify(results, null, 2));
`;

fs.writeFileSync('temp_test.cjs', script);
