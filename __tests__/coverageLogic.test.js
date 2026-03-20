const fs = require("fs");
const path = require("path");
const vm = require("vm");

const loadSchedulingCore = () => {
  const appPath = path.join(__dirname, "..", "app.js");
  const raw = fs.readFileSync(appPath, "utf8");
  const cutoff = raw.indexOf("const App = () => {");
  const core = cutoff >= 0 ? raw.slice(0, cutoff) : raw;
  const wrapped = `${core}\n;globalThis.__SCHEDULING__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 };`;
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
  return sandbox.globalThis.__SCHEDULING__;
};

const isInOffice = (employee, weekdayLetter) => {
  return employee.officeDays.split(",").map((d) => d.trim()).includes(weekdayLetter);
};

describe("Cobertura presencial 17:00-18:00", () => {
  test("el 4 de junio de 2026 tiene cobertura O42 en oficina", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const targetDay = days.find((d) => d.id === "2026-06-04");
    const officeO42 = EMPLOYEES.filter((emp) => {
      return schedule[emp.id][targetDay.id] === "O42" && isInOffice(emp, targetDay.weekdayLetter);
    });
    expect(officeO42.length).toBeGreaterThan(0);
  });

  test("todos los lunes-jueves tienen al menos un O42 presencial", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const weekdays = days.filter((d) => d.weekdayLetter !== "V");
    weekdays.forEach((day) => {
      const hasOfficeO42 = EMPLOYEES.some((emp) => {
        return schedule[emp.id][day.id] === "O42" && isInOffice(emp, day.weekdayLetter);
      });
      expect(hasOfficeO42).toBe(true);
    });
  });
});
