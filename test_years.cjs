const React = { useState: () => {}, useMemo: (fn) => fn(), useEffect: () => {} };
const ReactDOM = { createRoot: () => ({ render: () => {} }) };

// Mocking required constants and functions from app.jsx
const EMPLOYEES = [
  { id: 1, name: "Kike", role: "SysAdmin", officeDays: "X, J, V", group: "A" },
  { id: 2, name: "Jose", role: "DevOps", officeDays: "L, M, V", group: "B" },
  { id: 3, name: "Enrique", role: "Manager", officeDays: "X, J", group: "B" },
  { id: 4, name: "David", role: "Backend", officeDays: "J, V", group: "A" },
  { id: 5, name: "Luis", role: "Frontend", officeDays: "L, M", group: "A" },
  { id: 6, name: "Ariel", role: "FullStack", officeDays: "L, M, X", group: "B" },
];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAY_LETTER = { 1: "L", 2: "M", 3: "X", 4: "J", 5: "V" };
const TYPES = { O40: {}, O42: {}, O30: {}, T30: {}, V: {} };

const buildDaysRange = (year) => {
  const start = new Date(year, 5, 1);
  const end = new Date(year, 8, 30);
  const days = [];
  let weekIndex = -1;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    if (day === 1) weekIndex++;
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekdayLetter = WEEKDAY_LETTER[day];
    days.push({ id, weekdayLetter, weekIndex });
  }
  return days;
};

// Simplified version of the new logic for testing
const testLogic = (year) => {
  const days = buildDaysRange(year);
  const jun15 = days.find(d => d.id.includes("-06-15"));
  const sep15 = days.find(d => d.id.includes("-09-15"));
  const intensiveStartWeek = jun15 ? jun15.weekIndex : -1;
  const intensiveEndWeek = sep15 ? sep15.weekIndex : -1;

  console.log(`Year: ${year}`);
  console.log(`Jun 15 week index: ${intensiveStartWeek}`);
  console.log(`Sep 15 week index: ${intensiveEndWeek}`);
  
  const intensiveWeeksCount = intensiveEndWeek - intensiveStartWeek + 1;
  console.log(`Total intensive weeks: ${intensiveWeeksCount}`);

  // Check if 2027-06-15 is in week index 2 (Monday 14 to Friday 18)
  // In 2027, June 15 is Tuesday. Week starts Monday 14.
  const d15 = days.find(d => d.id === `${year}-06-15`);
  const d14 = days.find(d => d.id === `${year}-06-14`);
  console.log(`2027-06-15 weekIndex: ${d15?.weekIndex}`);
  console.log(`2027-06-14 weekIndex: ${d14?.weekIndex}`);
};

testLogic(2027);
testLogic(2026);
