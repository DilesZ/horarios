const fs = require('fs');
const file = fs.readFileSync('src/app.jsx', 'utf8');
const babel = require('@babel/core');

const code = babel.transformSync(file, {
  presets: ['@babel/preset-react'],
  ast: false
}).code;

const noReact = code.split('const root = ReactDOM')[0];

const script = `
  const React = require('react');
  ${noReact}
  
  const plan = createEmptyVacationPlan();
  const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
  
  const stats = calculateStats(schedule, days);
  console.log("Intensive weeks by emp:", stats.intensiveWeeksByEmp);
  console.log("Total forced days:", Object.values(stats.tempForcedCount).reduce((a,b)=>a+b,0));
  console.log("Total alerts:", stats.alerts.length);
  const realAlerts = stats.alerts.filter(a => a.reasons.some(r => r.severity !== 'info')).length;
  console.log("Real alerts (excluding info):", realAlerts);
  
  stats.alerts.forEach(a => {
    if (a.reasons.some(r => r.severity !== 'info')) {
      console.log(a.dayId, a.reasons.filter(r => r.severity !== 'info').map(r => r.title));
    }
  });
`;

fs.writeFileSync('test_run.cjs', script);
