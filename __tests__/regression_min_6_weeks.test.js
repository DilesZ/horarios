const fs = require("fs");
const path = require("path");
const vm = require("vm");
const babel = require("@babel/core");

const loadSchedulingCore = (entryFile = "src/app.jsx") => {
  const appPath = path.join(__dirname, "..", entryFile);
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

describe("Regresión: Mínimo 6 semanas intensivas para toda la plantilla", () => {
  test("Todos los empleados deben tener al menos 6 semanas intensivas completas en 2026", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore("src/app.jsx");
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    
    const weeksMap = {};
    days.forEach((day) => {
      weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
      weeksMap[day.weekIndex].push(day);
    });

    const results = EMPLOYEES.map((emp) => {
      let intensiveWeeks = 0;
      Object.keys(weeksMap).forEach((wi) => {
        const weekDays = weeksMap[wi];
        if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) {
          intensiveWeeks++;
        }
      });
      return { name: emp.name, intensiveWeeks };
    });

    const belowMin = results.filter(r => r.intensiveWeeks < 6);
    
    if (belowMin.length > 0) {
      const details = belowMin.map(r => `${r.name}: ${r.intensiveWeeks}`).join(", ");
      throw new Error(`Los siguientes empleados no cumplen el mínimo de 6 semanas: ${details}`);
    }
    
    results.forEach(r => {
      expect(r.intensiveWeeks).toBeGreaterThanOrEqual(6);
    });
  });
});
