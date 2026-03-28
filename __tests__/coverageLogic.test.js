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
  const wrapped = `${executableCore}\n;globalThis.__SCHEDULING__ = { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026, buildEquityAudit, EQUITY_MIN_INTENSIVE_WEEKS, EQUITY_IDEAL_INTENSIVE_WEEKS, validateExportPayload, buildExportRows, buildChartDataRows, validateStrictWeeklyRules, buildWeeklyCoverageViewModel, buildCoverageDayEntry, getCoverageBandForShift, COVERAGE_VISUALIZATION_OPTIONS, COVERAGE_BANDS };`;
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

const assertHardRegressionForIntensivas = (entryFile) => {
  const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore(entryFile);
  const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
  const minDay = "2026-06-15";
  const maxDay = "2026-09-18";
  const outOfWindow = [];
  const dailyOverLimit = [];
  days.forEach((day) => {
    const intensivePeople = EMPLOYEES.filter((emp) => schedule[emp.id][day.id] === "O30");
    if (intensivePeople.length > 3) {
      dailyOverLimit.push(`${day.id} (${intensivePeople.length}): ${intensivePeople.map((p) => p.name).join(", ")}`);
    }
    if (day.id < minDay || day.id > maxDay) {
      intensivePeople.forEach((emp) => {
        outOfWindow.push(`${day.id}: ${emp.name}`);
      });
    }
  });
  if (outOfWindow.length > 0 || dailyOverLimit.length > 0) {
    throw new Error(
      [
        `Regresión de intensivas en ${entryFile}:`,
        outOfWindow.length > 0 ? `- Fuera de ventana (${minDay}..${maxDay}): ${outOfWindow.join(" | ")}` : "- Fuera de ventana: OK",
        dailyOverLimit.length > 0 ? `- Exceso diario (>3): ${dailyOverLimit.join(" | ")}` : "- Exceso diario (>3): OK",
      ].join("\n")
    );
  }
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

describe("Vista semanal de cobertura", () => {
  test("expone los modos de visualización solicitados para la nueva vista", () => {
    const { COVERAGE_VISUALIZATION_OPTIONS } = loadSchedulingCore("src/app.jsx");
    expect(COVERAGE_VISUALIZATION_OPTIONS.map((option) => option.value)).toEqual([
      "stacked",
      "timeline",
      "heatmap",
      "table",
      "calendar",
      "gantt",
    ]);
  });

  test("clasifica correctamente 14h, 17h y 18h según tipo y día", () => {
    const { getCoverageBandForShift } = loadSchedulingCore("src/app.jsx");
    expect(getCoverageBandForShift("O30", "L")).toBe("14");
    expect(getCoverageBandForShift("T30", "J")).toBe("14");
    expect(getCoverageBandForShift("O40", "M")).toBe("17");
    expect(getCoverageBandForShift("O42", "J")).toBe("18");
    expect(getCoverageBandForShift("O42", "V")).toBe("14");
    expect(getCoverageBandForShift("V", "L")).toBe(null);
  });

  test("genera semanas con conteos y personas visibles por banda horaria", () => {
    const {
      generateSchedule,
      EMPLOYEES,
      DEFAULT_VACATION_PLAN_2026,
      buildWeeklyCoverageViewModel,
      buildCoverageDayEntry,
    } = loadSchedulingCore("src/app.jsx");
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const forcedOfficeSet = {};
    const weekModel = buildWeeklyCoverageViewModel({
      days,
      employees: EMPLOYEES,
      schedule,
      forcedOfficeSet,
      shiftFilter: "all",
    });

    expect(weekModel.length).toBeGreaterThan(0);
    const mondayToThursdayEntry = weekModel
      .flatMap((week) => week.days)
      .find((entry) => entry.weekdayLetter !== "V");
    expect(mondayToThursdayEntry.activeCounts["14"]).toBeGreaterThanOrEqual(mondayToThursdayEntry.activeCounts["17"]);
    expect(mondayToThursdayEntry.activeCounts["17"]).toBeGreaterThanOrEqual(mondayToThursdayEntry.activeCounts["18"]);

    const friday = days.find((day) => day.weekdayLetter === "V");
    const fridayEntry = buildCoverageDayEntry({
      day: friday,
      employees: EMPLOYEES,
      schedule,
      forcedOfficeSet,
      shiftFilter: "all",
    });
    expect(fridayEntry.counts["18"]).toBe(0);
    expect(fridayEntry.counts["14"]).toBeGreaterThan(0);
  });

  test("permite filtrar por departamento y por tipo de jornada visible", () => {
    const {
      generateSchedule,
      EMPLOYEES,
      DEFAULT_VACATION_PLAN_2026,
      buildWeeklyCoverageViewModel,
      COVERAGE_BANDS,
    } = loadSchedulingCore("src/app.jsx");
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const desarrolloEmployees = EMPLOYEES.filter((employee) => employee.department === "Desarrollo");
    const filteredWeeks = buildWeeklyCoverageViewModel({
      days,
      employees: desarrolloEmployees,
      schedule,
      forcedOfficeSet: {},
      shiftFilter: "18",
    });
    const entries = filteredWeeks.flatMap((week) => week.days);

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => {
      expect(entry.counts["14"]).toBe(0);
      expect(entry.counts["17"]).toBe(0);
      entry.assignmentsByBand["18"].forEach((assignment) => {
        expect(assignment.department).toBe("Desarrollo");
        expect(COVERAGE_BANDS["18"].label).toBe("Hasta las 18h");
      });
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

  test("la intensiva solo se asigna entre el 15 de junio y el 18 de septiembre", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore();
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const minDay = "2026-06-15";
    const maxDay = "2026-09-18";
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
        expect(day.id >= "2026-06-15" && day.id <= "2026-09-18").toBe(true);
      }
    });
  });

  test("alterna semanas 40h y 42h fuera de la ventana intensiva en junio y septiembre", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore("src/app.jsx");
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const weeksMap = {};
    days.forEach((day) => {
      weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
      weeksMap[day.weekIndex].push(day);
    });
    const edgeWeeks = Object.keys(weeksMap)
      .map((wi) => parseInt(wi, 10))
      .filter((wi) => weeksMap[wi].every((day) => day.id < "2026-06-15" || day.id > "2026-09-18"))
      .sort((a, b) => a - b);
    const segments = edgeWeeks.reduce((accumulator, weekIndex) => {
      const lastSegment = accumulator[accumulator.length - 1];
      if (!lastSegment || lastSegment[lastSegment.length - 1] !== weekIndex - 1) {
        accumulator.push([weekIndex]);
      } else {
        lastSegment.push(weekIndex);
      }
      return accumulator;
    }, []);
    const getRegularType = (employeeId, weekDays) => {
      const regularTypes = [...new Set(
        weekDays
          .map((day) => schedule[employeeId][day.id])
          .filter((type) => type === "O40" || type === "O42")
      )];
      expect(regularTypes.length).toBe(1);
      return regularTypes[0];
    };

    EMPLOYEES.forEach((emp) => {
      segments.forEach((segment) => {
        let previousType = null;
        segment.forEach((weekIndex) => {
          const currentType = getRegularType(emp.id, weeksMap[weekIndex]);
          if (previousType) {
            expect(currentType).not.toBe(previousType);
          }
          previousType = currentType;
        });
      });
    });
  });

  test("regresión dura de intensivas para src/app.jsx", () => {
    assertHardRegressionForIntensivas("src/app.jsx");
  });

  test("mejora mínima de reparto para perfiles históricamente bajos", () => {
    const { generateSchedule, EMPLOYEES, DEFAULT_VACATION_PLAN_2026 } = loadSchedulingCore("src/app.jsx");
    const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
    const weeksMap = {};
    days.forEach((day) => {
      weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
      weeksMap[day.weekIndex].push(day);
    });
    const getIntensiveWeeks = (name) => {
      const emp = EMPLOYEES.find((e) => e.name === name);
      let count = 0;
      Object.keys(weeksMap).forEach((wi) => {
        const weekDays = weeksMap[wi];
        if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) count += 1;
      });
      return count;
    };
    expect(getIntensiveWeeks("Luis")).toBeGreaterThanOrEqual(6);
    expect(getIntensiveWeeks("Ariel")).toBeGreaterThanOrEqual(6);
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
