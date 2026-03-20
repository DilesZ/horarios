const fs = require("fs");
const path = require("path");
const vm = require("vm");
const babel = require("@babel/core");

const loadSchedulingCore = (entryFile = "app.js") => {
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
  const wrapped = `${executableCore}\n;globalThis.__SCHEDULING__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026, buildEquityAudit, EQUITY_MIN_INTENSIVE_WEEKS, EQUITY_IDEAL_INTENSIVE_WEEKS, validateExportPayload, buildExportRows, buildChartDataRows, validateStrictWeeklyRules };`;
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

describe("Registro formal de equidad distributiva", () => {
  test("no supera 3 intensivas diarias", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

    days.forEach((day) => {
      const dailyIntensive = EMPLOYEES.filter((emp) => {
        return schedule[emp.id][day.id] === "O30";
      });
      expect(dailyIntensive.length).toBeLessThanOrEqual(3);
    });
  });

  test("la intensiva solo se asigna entre el 15 de junio y el 15 de septiembre", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const minDay = "2026-06-15";
    const maxDay = "2026-09-15";
    days.forEach((day) => {
      EMPLOYEES.forEach((emp) => {
        const type = schedule[emp.id][day.id];
        if (type !== "O30") return;
        expect(day.id >= minDay && day.id <= maxDay).toBe(true);
      });
    });
  });

  test("la versión de src/app.jsx también respeta ventana y tope de 3 intensivas", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore("src/app.jsx");
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    days.forEach((day) => {
      const dailyIntensive = EMPLOYEES.filter((emp) => schedule[emp.id][day.id] === "O30");
      expect(dailyIntensive.length).toBeLessThanOrEqual(3);
      if (dailyIntensive.length > 0) {
        expect(day.id >= "2026-06-15" && day.id <= "2026-09-15").toBe(true);
      }
    });
  });

  test("no permite intensiva en días sueltos: O30 solo en semana operativa completa", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const weeksMap = {};
    days.forEach((day) => {
      weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
      weeksMap[day.weekIndex].push(day);
    });
    EMPLOYEES.forEach((emp) => {
      Object.keys(weeksMap).forEach((wi) => {
        const weekDays = weeksMap[wi];
        const nonVacation = weekDays
          .map((day) => schedule[emp.id][day.id])
          .filter((type) => type !== "V");
        if (nonVacation.length === 0) return;
        const hasO30 = nonVacation.includes("O30");
        if (!hasO30) return;
        expect(nonVacation.every((type) => type === "O30")).toBe(true);
        expect(nonVacation.length).toBe(weekDays.length);
      });
    });
  });

  test("no mezcla O40 y O42 en la misma semana por integrante", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const weeksMap = {};
    days.forEach((day) => {
      weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
      weeksMap[day.weekIndex].push(day);
    });
    EMPLOYEES.forEach((emp) => {
      Object.keys(weeksMap).forEach((wi) => {
        const weekTypes = weeksMap[wi]
          .map((day) => schedule[emp.id][day.id])
          .filter((type) => type !== "V");
        expect(weekTypes.includes("O40") && weekTypes.includes("O42")).toBe(false);
      });
    });
  });

  test("cumple validación estricta de integridad semanal", () => {
    const {
      generateSchedule,
      EMPLOYEES,
      DEFAULT_VACATION_PLAN_2026,
      validateStrictWeeklyRules,
    } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const validation = validateStrictWeeklyRules({
      employees: EMPLOYEES,
      days,
      schedule,
    });
    expect(validation.ok).toBe(true);
    expect(validation.summary.total).toBe(0);
  });

  test("genera registro detallado por integrante con objetivos mínimo e ideal", () => {
    const {
      generateSchedule,
      EMPLOYEES,
      DEFAULT_VACATION_PLAN_2026,
      buildEquityAudit,
      EQUITY_MIN_INTENSIVE_WEEKS,
      EQUITY_IDEAL_INTENSIVE_WEEKS,
    } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const audit = buildEquityAudit({
      employees: EMPLOYEES,
      days,
      schedule,
      forcedOfficeDetails: [],
    });
    expect(audit.memberRegistry).toHaveLength(EMPLOYEES.length);
    audit.memberRegistry.forEach((member) => {
      expect(member).toHaveProperty("name");
      expect(member).toHaveProperty("currentWeeks");
      expect(member.minTarget).toBe(EQUITY_MIN_INTENSIVE_WEEKS);
      expect(member.idealTarget).toBe(EQUITY_IDEAL_INTENSIVE_WEEKS);
      expect(member.currentWeeks).toBeGreaterThanOrEqual(0);
    });
  });

  test("genera auditoría semanal y alertas automáticas de desviación", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026, buildEquityAudit } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const forcedOfficeDetails = [
      { dayId: "2026-06-04", empId: EMPLOYEES[0].id, reason: "Prueba de control" },
      { dayId: "2026-06-05", empId: EMPLOYEES[0].id, reason: "Prueba de control" },
    ];
    const audit = buildEquityAudit({
      employees: EMPLOYEES,
      days,
      schedule,
      forcedOfficeDetails,
    });
    expect(audit.weeklyAudit.length).toBeGreaterThan(0);
    audit.weeklyAudit.forEach((week) => {
      expect(week).toHaveProperty("deviation");
      expect(week).toHaveProperty("isEqual");
      expect(week.deviation).toBeGreaterThanOrEqual(0);
    });
    expect(audit.summary).toHaveProperty("forcedDeviation");
    expect(audit.summary.forcedDeviation).toBeGreaterThan(0);
    expect(audit.equityAlerts.length).toBeGreaterThan(0);
  });
});

describe("Integridad de exportación", () => {
  test("valida datos y detecta códigos de turno inválidos", () => {
    const {
      validateExportPayload,
      generateSchedule,
      EMPLOYEES,
      DEFAULT_VACATION_PLAN_2026,
    } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const okResult = validateExportPayload({
      employees: EMPLOYEES,
      days,
      schedule,
    });
    expect(okResult.ok).toBe(true);
    expect(okResult.errors).toHaveLength(0);

    const brokenSchedule = JSON.parse(JSON.stringify(schedule));
    brokenSchedule[EMPLOYEES[0].id][days[0].id] = "INVALIDO";
    const brokenResult = validateExportPayload({
      employees: EMPLOYEES,
      days,
      schedule: brokenSchedule,
    });
    expect(brokenResult.ok).toBe(false);
    expect(brokenResult.errors.length).toBeGreaterThan(0);
  });

  test("construye matriz exportable con columnas de fórmulas", () => {
    const { buildExportRows, generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const table = buildExportRows({
      employees: EMPLOYEES,
      days,
      schedule,
      includeFormulas: true,
    });
    expect(table.headers[0]).toBe("Empleado");
    expect(table.rows).toHaveLength(EMPLOYEES.length);
    expect(table.headers.slice(-2)).toEqual(["Días O30 (fórmula)", "Horas estimadas (fórmula)"]);
    expect(table.rows[0].length).toBe(table.headers.length);
  });

  test("genera dataset de gráficos con una fila por integrante", () => {
    const { buildChartDataRows, EMPLOYEES } = loadSchedulingCore();
    const rows = buildChartDataRows({
      employees: EMPLOYEES,
      intensiveWeeksByEmp: {
        [EMPLOYEES[0].id]: 6,
        [EMPLOYEES[1].id]: 5,
      },
      forcedOfficeDetails: [
        { dayId: "2026-06-04", empId: EMPLOYEES[0].id, reason: "Prueba" },
        { dayId: "2026-06-05", empId: EMPLOYEES[0].id, reason: "Prueba" },
      ],
    });
    expect(rows[0]).toEqual(["Integrante", "Semanas intensivas", "Días forzados"]);
    expect(rows).toHaveLength(EMPLOYEES.length + 1);
  });
});
