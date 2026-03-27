/* global React, ReactDOM */
const { useState, useMemo, useEffect } = React;

/* global XLSX */

const EMPLOYEES = [
  { id: 1, name: "Kike", role: "SysAdmin", officeDays: "L, M, X, V", group: "A" },
  { id: 2, name: "Jose", role: "DevOps", officeDays: "L, X, J, V", group: "B" },
  { id: 3, name: "Enrique", role: "Manager", officeDays: "X, J", group: "B" },
  { id: 4, name: "David", role: "Backend", officeDays: "J, V", group: "A" },
  { id: 5, name: "Luis", role: "Frontend", officeDays: "L, M", group: "A" },
  { id: 6, name: "Ariel", role: "FullStack", officeDays: "L, M, J, V", group: "B" },
];

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const WEEKDAY_LETTER = { 1: "L", 2: "M", 3: "X", 4: "J", 5: "V" };
const WEEKDAY_FULL = { L: "Lunes", M: "Martes", X: "Miércoles", J: "Jueves", V: "Viernes" };

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
    const month = MONTH_NAMES[d.getMonth()];
    const label = `${month.substring(0, 3)} ${String(d.getDate()).padStart(2, "0")}`;
    const weekdayLetter = WEEKDAY_LETTER[day];
    days.push({ id, label, month, weekdayLetter, weekIndex });
  }
  return days;
};

const TYPES = {
  O40: { label: "40h (hasta las 17:00)", color: "bg-blue-700", text: "text-white", short: "40" },
  O42: { label: "42h (hasta las 18:00, Viernes 14:00)", color: "bg-violet-700", text: "text-white", short: "42" },
  O30: { label: "Intensiva 30h (hasta las 14:00)", color: "bg-emerald-700", text: "text-white", short: "30" },
  T30: { label: "Teletrabajo 30h", color: "bg-cyan-700", text: "text-white", short: "T30" },
  V: { label: "Vacaciones", color: "bg-rose-700", text: "text-white", short: "VAC" },
};

const DEFAULT_VACATION_PLAN_2026 = {
  Kike: [
    "2026-06-22",
    "2026-06-23",
    "2026-06-26",
    "2026-06-29",
    "2026-06-30",
    "2026-08-17",
    "2026-08-18",
    "2026-08-19",
    "2026-08-20",
    "2026-08-21",
    "2026-09-18",
  ],
  Jose: ["2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07"],
  Enrique: [
    "2026-08-10",
    "2026-08-11",
    "2026-08-12",
    "2026-08-13",
    "2026-08-14",
    "2026-08-17",
    "2026-08-18",
    "2026-08-19",
    "2026-08-20",
    "2026-08-21",
    "2026-08-24",
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28",
  ],
  David: [
    "2026-06-25",
    "2026-06-26",
    "2026-06-29",
    "2026-06-30",
    "2026-07-01",
    "2026-07-02",
    "2026-07-03",
    "2026-07-06",
    "2026-07-07",
    "2026-07-08",
    "2026-07-09",
    "2026-07-10",
  ],
  Luis: [
    "2026-08-31",
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
    "2026-09-07",
    "2026-09-08",
    "2026-09-09",
    "2026-09-10",
    "2026-09-11",
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
  ],
  Ariel: [
    "2026-07-14",
    "2026-07-15",
    "2026-07-16",
    "2026-07-17",
    "2026-07-20",
    "2026-07-21",
    "2026-07-22",
    "2026-07-23",
    "2026-07-24",
    "2026-07-27",
    "2026-07-28",
    "2026-07-29",
    "2026-07-30",
    "2026-07-31",
    "2026-08-25",
  ],
};

const createEmptyVacationPlan = () => {
  const plan = {};
  EMPLOYEES.forEach((emp) => {
    plan[emp.name] = [];
  });
  return plan;
};

const GROUP1 = ["Enrique", "Luis", "David"];
const GROUP2 = ["Jose", "Ariel", "Kike"];
const SHIFT_BASE_A_18H = true;
const HOURS_PER_TYPE = { O30: 6, O40: 8, O42: 9, V: 0 };
const EQUITY_MIN_INTENSIVE_WEEKS = 6;
const EQUITY_IDEAL_INTENSIVE_WEEKS = 7;
const STRICT_WEEKLY_RULES = {
  INTENSIVE_FULL_WEEK_ONLY: "INTENSIVE_FULL_WEEK_ONLY",
  MIXED_40_42_IN_WEEK: "MIXED_40_42_IN_WEEK",
  MIXED_SHIFT_TYPES_IN_WEEK: "MIXED_SHIFT_TYPES_IN_WEEK",
};
const STRICT_WEEKLY_RULE_MESSAGES = {
  [STRICT_WEEKLY_RULES.INTENSIVE_FULL_WEEK_ONLY]:
    "No se permite jornada intensiva en días sueltos. Debe asignarse la semana operativa completa.",
  [STRICT_WEEKLY_RULES.MIXED_40_42_IN_WEEK]:
    "No se permite mezclar turnos de 40h y 42h dentro de la misma semana.",
  [STRICT_WEEKLY_RULES.MIXED_SHIFT_TYPES_IN_WEEK]:
    "La semana contiene combinación de tipos de jornada no permitida.",
};
const AUTH_STORAGE_KEY = "horarios_auth_v2026";
const AUTH_MAX_AGE_MS = 1000 * 60 * 60 * 8;

const isEmployeeInShiftGroup = (employee, shiftGroup) => employee.group === shiftGroup;

const getShiftGroupMemberNames = (shiftGroup) =>
  EMPLOYEES.filter((employee) => employee.group === shiftGroup).map((employee) => employee.name);

const readAuthSession = () => {
  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed?.loggedInAt) return false;
    const isValid = Date.now() - parsed.loggedInAt < AUTH_MAX_AGE_MS;
    if (!isValid) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const writeAuthSession = () => {
  window.sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      loggedInAt: Date.now(),
    })
  );
};

const clearAuthSession = () => {
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

const buildWeeksMap = (days) => {
  const weeksMap = {};
  days.forEach((day) => {
    weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
    weeksMap[day.weekIndex].push(day);
  });
  return weeksMap;
};

const getLateGroupForWeekGlobal = (weekIndex) => {
  const defaultIsALate = SHIFT_BASE_A_18H ? weekIndex % 2 === 0 : weekIndex % 2 !== 0;
  return defaultIsALate ? "A" : "B";
};

const buildWeeklyViolation = ({ rule, employee, weekIndex, weekDays, types, detail }) => ({
  rule,
  message: STRICT_WEEKLY_RULE_MESSAGES[rule],
  employeeId: employee.id,
  employeeName: employee.name,
  weekIndex,
  weekLabel: `Semana ${weekIndex + 1}`,
  dayIds: weekDays.map((day) => day.id),
  types,
  detail,
});

const detectStrictWeeklyViolations = ({ employees, days, schedule }) => {
  const weeksMap = buildWeeksMap(days);
  const violations = [];
  Object.keys(weeksMap).forEach((weekIndexRaw) => {
    const weekIndex = parseInt(weekIndexRaw, 10);
    const weekDays = weeksMap[weekIndex];
    employees.forEach((employee) => {
      const types = weekDays.map((day) => schedule[employee.id][day.id]).filter(Boolean);
      const nonVacationTypes = types.filter((type) => type !== "V");
      if (nonVacationTypes.length === 0) return;
      const uniqueNonVacationTypes = [...new Set(nonVacationTypes)];
      const hasAnyO30 = nonVacationTypes.includes("O30");
      const hasAnyO40 = nonVacationTypes.includes("O40");
      const hasAnyO42 = nonVacationTypes.includes("O42");
      const hasVacation = types.some((type) => type === "V");
      const allWeekIsO30 = nonVacationTypes.length === weekDays.length && uniqueNonVacationTypes.length === 1 && uniqueNonVacationTypes[0] === "O30";
      if (hasAnyO30 && (!allWeekIsO30 || hasVacation)) {
        violations.push(
          buildWeeklyViolation({
            rule: STRICT_WEEKLY_RULES.INTENSIVE_FULL_WEEK_ONLY,
            employee,
            weekIndex,
            weekDays,
            types,
            detail: "Se detectó O30 parcial o combinado con otros estados semanales.",
          })
        );
      }
      if (hasAnyO40 && hasAnyO42) {
        violations.push(
          buildWeeklyViolation({
            rule: STRICT_WEEKLY_RULES.MIXED_40_42_IN_WEEK,
            employee,
            weekIndex,
            weekDays,
            types,
            detail: "La misma semana contiene O40 y O42.",
          })
        );
      }
      if (uniqueNonVacationTypes.length > 1) {
        violations.push(
          buildWeeklyViolation({
            rule: STRICT_WEEKLY_RULES.MIXED_SHIFT_TYPES_IN_WEEK,
            employee,
            weekIndex,
            weekDays,
            types,
            detail: "Se detectó mezcla de tipos de jornada en la semana.",
          })
        );
      }
    });
  });
  return violations;
};

const buildStrictWeeklySummary = (violations) => {
  const byRule = {};
  Object.values(STRICT_WEEKLY_RULES).forEach((rule) => {
    byRule[rule] = 0;
  });
  violations.forEach((item) => {
    byRule[item.rule] = (byRule[item.rule] || 0) + 1;
  });
  return {
    total: violations.length,
    byRule,
    isCompliant: violations.length === 0,
  };
};

const validateStrictWeeklyRules = ({ employees, days, schedule }) => {
  const violations = detectStrictWeeklyViolations({ employees, days, schedule });
  return {
    ok: violations.length === 0,
    violations,
    summary: buildStrictWeeklySummary(violations),
  };
};

const pickRegularWeekType = ({ employee, weekIndex, weekDays, schedule, getLateGroupForWeek }) => {
  const hasO42 = weekDays.some(day => schedule[employee.id][day.id] === "O42");
  if (hasO42) return "O42";
  const lateGroup = getLateGroupForWeek(weekIndex);
  return isEmployeeInShiftGroup(employee, lateGroup) ? "O42" : "O40";
};

const enforceStrictWeeklyRules = ({ employees, days, schedule, getLateGroupForWeek }) => {
  const weeksMap = buildWeeksMap(days);
  const correctionLog = [];
  Object.keys(weeksMap).forEach((weekIndexRaw) => {
    const weekIndex = parseInt(weekIndexRaw, 10);
    const weekDays = weeksMap[weekIndex];
    employees.forEach((employee) => {
      const weekTypes = weekDays.map((day) => schedule[employee.id][day.id]).filter(Boolean);
      const nonVacation = weekTypes.filter((type) => type !== "V");
      if (nonVacation.length === 0) return;
      const uniqueNonVacation = [...new Set(nonVacation)];
      const hasVacation = weekTypes.some((type) => type === "V");
      const allFullWeekO30 =
        uniqueNonVacation.length === 1 && uniqueNonVacation[0] === "O30" && nonVacation.length === weekDays.length;
      const mustNormalize = uniqueNonVacation.length > 1 || (uniqueNonVacation[0] === "O30" && (!allFullWeekO30 || hasVacation));
      if (!mustNormalize) return;
      const targetType = pickRegularWeekType({
        employee,
        weekIndex,
        weekDays,
        schedule,
        getLateGroupForWeek,
      });
      const before = {};
      let changed = false;
      weekDays.forEach((day) => {
        before[day.id] = schedule[employee.id][day.id];
        if (schedule[employee.id][day.id] === "V") return;
        if (schedule[employee.id][day.id] !== targetType) {
          schedule[employee.id][day.id] = targetType;
          changed = true;
        }
      });
      if (changed) {
        correctionLog.push({
          employeeId: employee.id,
          employeeName: employee.name,
          weekIndex,
          weekLabel: `Semana ${weekIndex + 1}`,
          targetType,
          before,
          message:
            "Se normalizó la semana para cumplir integridad estricta (sin mezcla de jornadas y sin intensiva parcial).",
        });
      }
    });
  });
  const validation = validateStrictWeeklyRules({ employees, days, schedule });
  return {
    schedule,
    corrections: correctionLog,
    violations: validation.violations,
    summary: validation.summary,
    isCompliant: validation.ok,
  };
};

const buildEquityAudit = ({ employees, days, schedule, forcedOfficeDetails }) => {
  const weeksMap = {};
  days.forEach((day) => {
    weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
    weeksMap[day.weekIndex].push(day);
  });

  const intensiveWeeksByEmp = {};
  employees.forEach((emp) => {
    intensiveWeeksByEmp[emp.id] = 0;
  });

  const orderedWeekIndexes = Object.keys(weeksMap)
    .map((wi) => parseInt(wi, 10))
    .sort((a, b) => a - b);

  orderedWeekIndexes.forEach((wi) => {
    const weekDays = weeksMap[wi];
    employees.forEach((emp) => {
      if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) {
        intensiveWeeksByEmp[emp.id] += 1;
      }
    });
  });

  const forcedDaysByEmp = {};
  employees.forEach((emp) => {
    forcedDaysByEmp[emp.id] = 0;
  });
  forcedOfficeDetails.forEach((item) => {
    forcedDaysByEmp[item.empId] = (forcedDaysByEmp[item.empId] || 0) + 1;
  });

  const memberRegistry = employees.map((emp) => {
    const currentWeeks = intensiveWeeksByEmp[emp.id] || 0;
    return {
      id: emp.id,
      name: emp.name,
      currentWeeks,
      minTarget: EQUITY_MIN_INTENSIVE_WEEKS,
      idealTarget: EQUITY_IDEAL_INTENSIVE_WEEKS,
      minGap: Math.max(0, EQUITY_MIN_INTENSIVE_WEEKS - currentWeeks),
      idealGap: Math.max(0, EQUITY_IDEAL_INTENSIVE_WEEKS - currentWeeks),
      forcedOfficeDays: forcedDaysByEmp[emp.id] || 0,
    };
  });

  const cumulativeByEmp = {};
  employees.forEach((emp) => {
    cumulativeByEmp[emp.id] = 0;
  });

  const weeklyAudit = orderedWeekIndexes.map((wi) => {
    const weekDays = weeksMap[wi];
    employees.forEach((emp) => {
      if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) {
        cumulativeByEmp[emp.id] += 1;
      }
    });
    const values = employees.map((emp) => cumulativeByEmp[emp.id]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const startDay = weekDays[0];
    const endDay = weekDays[weekDays.length - 1];
    return {
      weekIndex: wi,
      label: `Semana ${wi + 1}`,
      startDayId: startDay ? startDay.id : null,
      endDayId: endDay ? endDay.id : null,
      minWeeks: minValue,
      maxWeeks: maxValue,
      deviation: maxValue - minValue,
      isEqual: maxValue - minValue === 0,
    };
  });

  const intensiveValues = memberRegistry.map((item) => item.currentWeeks);
  const forcedValues = memberRegistry.map((item) => item.forcedOfficeDays);
  const minIntensive = Math.min(...intensiveValues);
  const maxIntensive = Math.max(...intensiveValues);
  const minForced = Math.min(...forcedValues);
  const maxForced = Math.max(...forcedValues);
  const belowMinMembers = memberRegistry.filter((item) => item.currentWeeks < EQUITY_MIN_INTENSIVE_WEEKS).map((item) => item.name);
  const belowIdealMembers = memberRegistry.filter((item) => item.currentWeeks < EQUITY_IDEAL_INTENSIVE_WEEKS).map((item) => item.name);
  const mostForcedMembers = memberRegistry.filter((item) => item.forcedOfficeDays === maxForced).map((item) => item.name);
  const weeklyDeviationCount = weeklyAudit.filter((item) => !item.isEqual).length;

  const equityAlerts = [];
  if (belowMinMembers.length > 0) {
    equityAlerts.push({
      severity: "critical",
      title: "Objetivo mínimo incumplido",
      detail: `No alcanzan ${EQUITY_MIN_INTENSIVE_WEEKS} semanas: ${belowMinMembers.join(", ")}.`,
      context: "Mecanismo correctivo: priorizar asignación intensiva a miembros por debajo del mínimo.",
    });
  }
  if (belowIdealMembers.length > 0) {
    equityAlerts.push({
      severity: "warning",
      title: "Objetivo ideal no homogéneo",
      detail: `No alcanzan ${EQUITY_IDEAL_INTENSIVE_WEEKS} semanas: ${belowIdealMembers.join(", ")}.`,
      context: "Mecanismo correctivo: intercambiar semanas intensivas desde perfiles con mayor carga.",
    });
  }
  if (maxIntensive - minIntensive > 0) {
    equityAlerts.push({
      severity: maxIntensive - minIntensive > 1 ? "critical" : "warning",
      title: "Desviación de reparto intensivo",
      detail: `Diferencia actual de ${maxIntensive - minIntensive} semanas entre integrantes.`,
      context: "Auditoría semanal activa hasta alcanzar igualdad absoluta.",
    });
  }
  if (maxForced - minForced > 0) {
    equityAlerts.push({
      severity: maxForced - minForced > 1 ? "critical" : "warning",
      title: "Desviación en oficina forzada",
      detail: `Diferencia actual de ${maxForced - minForced} días forzados. Mayor carga: ${mostForcedMembers.join(", ")}.`,
      context: "Mecanismo correctivo: selección obligatoria del candidato con menor carga forzada acumulada.",
    });
  }
  if (weeklyDeviationCount > 0) {
    equityAlerts.push({
      severity: "warning",
      title: "Desviación detectada en auditoría semanal",
      detail: `${weeklyDeviationCount} semanas presentan desviación respecto al criterio de igualdad absoluta.`,
      context: "Sanción operativa: bloquear nuevas intensivas a perfiles por encima del mínimo acumulado hasta equilibrar.",
    });
  }

  return {
    memberRegistry,
    weeklyAudit,
    equityAlerts,
    summary: {
      minTarget: EQUITY_MIN_INTENSIVE_WEEKS,
      idealTarget: EQUITY_IDEAL_INTENSIVE_WEEKS,
      minIntensive,
      maxIntensive,
      minForced,
      maxForced,
      intensiveDeviation: maxIntensive - minIntensive,
      forcedDeviation: maxForced - minForced,
      weeklyDeviationCount,
      equalsAbsolute: maxIntensive - minIntensive === 0 && maxForced - minForced === 0,
    },
  };
};

const EXPORT_STYLE_PRESETS = {
  corporativo: {
    headerBg: "1E40AF",
    headerText: "FFFFFF",
    border: "CBD5E1",
    rowText: "0F172A",
  },
  neutro: {
    headerBg: "334155",
    headerText: "FFFFFF",
    border: "D1D5DB",
    rowText: "111827",
  },
};

const getExportStylePreset = (key) => {
  return EXPORT_STYLE_PRESETS[key] || EXPORT_STYLE_PRESETS.corporativo;
};

const createExportCellStyle = (type, preset) => {
  let fgColor = "FFFFFF";
  let fontColor = preset.rowText;
  if (type === "O40") { fgColor = "2563EB"; fontColor = "FFFFFF"; }
  else if (type === "O42") { fgColor = "4F46E5"; fontColor = "FFFFFF"; }
  else if (type === "O30") { fgColor = "10B981"; fontColor = "FFFFFF"; }
  else if (type === "T30") { fgColor = "14B8A6"; fontColor = "FFFFFF"; }
  else if (type === "V") { fgColor = "F43F5E"; fontColor = "FFFFFF"; }

  return {
    fill: { fgColor: { rgb: fgColor } },
    font: { color: { rgb: fontColor } },
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: preset.border } },
      bottom: { style: "thin", color: { rgb: preset.border } },
      left: { style: "thin", color: { rgb: preset.border } },
      right: { style: "thin", color: { rgb: preset.border } },
    },
  };
};

const validateExportPayload = ({ employees, days, schedule }) => {
  const errors = [];
  if (!Array.isArray(employees) || employees.length === 0) {
    errors.push("No hay integrantes para exportar.");
  }
  if (!Array.isArray(days) || days.length === 0) {
    errors.push("No hay días planificados para exportar.");
  }
  if (!schedule || typeof schedule !== "object") {
    errors.push("La estructura de horarios no es válida.");
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  const validTypes = new Set(Object.keys(TYPES));
  employees.forEach((emp) => {
    if (!schedule[emp.id]) {
      errors.push(`Falta la fila de horario para ${emp.name}.`);
      return;
    }
    days.forEach((day) => {
      const value = schedule[emp.id][day.id];
      if (!validTypes.has(value)) {
        errors.push(`Valor inválido "${value}" para ${emp.name} en ${day.id}.`);
      }
    });
  });
  return {
    ok: errors.length === 0,
    errors,
    rowCount: employees.length,
    columnCount: days.length + 1,
  };
};

const buildExportRows = ({ employees, days, schedule, includeFormulas }) => {
  const headers = ["Empleado", ...days.map((d) => `${d.id} (${d.weekdayLetter})`)];
  if (includeFormulas) {
    headers.push("Días O30 (fórmula)");
    headers.push("Horas estimadas (fórmula)");
  }
  const rows = employees.map((emp) => {
    const row = [emp.name];
    days.forEach((day) => {
      row.push(schedule[emp.id][day.id]);
    });
    if (includeFormulas) {
      row.push(null);
      row.push(null);
    }
    return row;
  });
  return { headers, rows };
};

const getExportErrorMessage = (error) => {
  if (!error) return "Error desconocido durante la exportación.";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return "Error inesperado durante la exportación.";
};

const generateSchedule = (year, vacationPlan) => {
  const isWithinIntensiveWindow = (dayId) => {
    const parts = dayId.split("-");
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (m === 6 && d >= 15) return true;
    if (m === 7 || m === 8) return true;
    if (m === 9 && d <= 18) return true;
    return false;
  };
  const isIntensivePeriod = (dayId, empId) => {
    if (!empId) return isWithinIntensiveWindow(dayId);
    return isWithinIntensiveWindow(dayId);
  };
  const days = buildDaysRange(year);
  const schedule = {};
  const vacWeeksByEmp = {};
  EMPLOYEES.forEach((emp) => {
    const set = new Set();
    const vacs = vacationPlan[emp.name] || [];
    vacs.forEach((dateStr) => {
      const dayEntry = days.find((d) => d.id === dateStr);
      if (dayEntry) set.add(dayEntry.weekIndex);
    });
    vacWeeksByEmp[emp.id] = set;
  });

  const weeks = {};
  days.forEach((day) => {
    weeks[day.weekIndex] = weeks[day.weekIndex] || [];
    weeks[day.weekIndex].push(day);
  });

  const isValidCoverage = (daysInWeek, currentSchedule) => {
    return daysInWeek.every(day => {
      let valid = true;
      let group1HasOffice = false;
      let group2HasOffice = false;
      let group1Covering = 0;
      let group2Covering = 0;
      let hasO40InOfficeOnFriday = false;
      
      EMPLOYEES.forEach(e => {
        const type = currentSchedule[e.id][day.id];
        if (type === 'V') return;
        const daysOffice = e.officeDays.split(",").map(d => d.trim());
        const isInOffice = daysOffice.includes(day.weekdayLetter);
        
        if (day.weekdayLetter !== "V") {
          // Asumimos que si no tiene turno ni vacaciones, tendra turno completo de tarde o normal asignado eventualmente
          const mockType = type || "O40";
          const hasFullSchedule = (mockType === "O40" || mockType === "O42");
          if (isInOffice && hasFullSchedule) {
            if (GROUP1.includes(e.name)) { group1HasOffice = true; group1Covering++; }
            if (GROUP2.includes(e.name)) { group2HasOffice = true; group2Covering++; }
          }
        } else {
          // Viernes
          const mockType = type || "O40";
          if (isInOffice && (mockType === "O40" || mockType === "O42")) {
            hasO40InOfficeOnFriday = true;
          }
        }
      });
      
      if (day.weekdayLetter !== "V") {
        if (!group1HasOffice && group2Covering === 0) valid = false;
        if (!group2HasOffice && group1Covering === 0) valid = false;
      } else {
        if (!hasO40InOfficeOnFriday) valid = false;
      }
      return valid;
    });
  };

  const preservesOfficeCoverage = (empId, daysInWeek, currentSchedule) => {
    let originalTypes = {};
    daysInWeek.forEach(d => originalTypes[d.id] = currentSchedule[empId][d.id]);
    
    daysInWeek.forEach(d => {
        if (currentSchedule[empId][d.id] !== 'V') {
            currentSchedule[empId][d.id] = "O30";
        }
    });
    
    const valid = isValidCoverage(daysInWeek, currentSchedule);
    
    daysInWeek.forEach(d => currentSchedule[empId][d.id] = originalTypes[d.id]);
    return valid;
  };

  const MAX_FORCED_OFFICE_DAYS = 10;

  const countForcedDays = (currentSchedule, allDays) => {
    let count = 0;
    for (const day of allDays) {
      let group1HasOffice = false, group2HasOffice = false;
      let group1Covering = 0, group2Covering = 0;
      let hasO40InOfficeOnFriday = false;
      
      let candidateG1 = 0, candidateG2 = 0, candidateFriday = 0;

      EMPLOYEES.forEach(e => {
        const type = currentSchedule[e.id][day.id];
        if (type === 'V') return;
        const od = e.officeDays.split(',').map(d => d.trim());
        const inOffice = od.includes(day.weekdayLetter);
        
        if (day.weekdayLetter !== 'V') {
          if (type === 'O40' || type === 'O42') {
            if (inOffice) {
              if (GROUP1.includes(e.name)) { group1HasOffice = true; group1Covering++; }
              if (GROUP2.includes(e.name)) { group2HasOffice = true; group2Covering++; }
            } else {
              if (GROUP1.includes(e.name)) candidateG1++;
              if (GROUP2.includes(e.name)) candidateG2++;
            }
          }
        } else {
          if (type === 'O40') {
            if (inOffice) hasO40InOfficeOnFriday = true;
            else candidateFriday++;
          }
        }
      });
      
      if (day.weekdayLetter !== 'V') {
        if (!group1HasOffice && group2Covering === 0) {
          if (candidateG1 > 0 || candidateG2 > 0) count++;
          else return Infinity; // Unfixable
        } else if (!group2HasOffice && group1Covering === 0) {
          if (candidateG2 > 0 || candidateG1 > 0) count++;
          else return Infinity; // Unfixable
        }
      } else {
        if (!hasO40InOfficeOnFriday) {
          if (candidateFriday > 0) count++;
          else return Infinity; // Unfixable
        }
      }
    }
    return count;
  };

  // Determinar asignación base de turnos (O40 vs O42) por semana
  // O42 (Tarde L-J) vs O40 (Tarde V)
  // Estrategia: Asignar O40 (requiere presencia V hasta 17:00) al grupo con más presencia física en Viernes.
  const weekAssignments = {}; // index -> "A_LATE" (A hace O42, B hace O40) o "B_LATE" (B hace O42, A hace O40)

  Object.keys(weeks).forEach((wiStr) => {
    const wi = parseInt(wiStr, 10);
    const weekDays = weeks[wi];
    const friday = weekDays.find((d) => d.weekdayLetter === "V");

    // Overrides específicos solicitados por usuario para 2026
    if (year === 2026) {
      // Semana 15-19 Junio (Week 2): Ariel (B) en oficina, Enrique (B) en remoto -> B hace O40 -> A hace O42 (LATE)
      if (wi === 2) {
        weekAssignments[wi] = "A_LATE";
        return;
      }
      // Semana 22-26 Junio (Week 3): Enrique (B) a 40h -> B hace O40 -> A hace O42 (LATE)
      if (wi === 3) {
        weekAssignments[wi] = "A_LATE";
        return;
      }
      // Válvula de presión matemática para Grupo A (David, Luis, Enrique están bloqueados)
      if (wi === 4) {
        weekAssignments[wi] = "B_LATE";
        return;
      }
      // Semana 20-24 Julio (Week 7): Enrique (B) a 40h -> B hace O40 -> A hace O42 (LATE)
      if (wi === 7) {
        weekAssignments[wi] = "A_LATE";
        return;
      }
      // Válvula de presión matemática para Grupo A
      if (wi === 8) {
        weekAssignments[wi] = "B_LATE";
        return;
      }
      if (wi === 10) {
        weekAssignments[wi] = "B_LATE";
        return;
      }
    }

    if (!friday) {
      // Fallback a rotación simple si no hay viernes
      weekAssignments[wi] = wi % 2 === 0 ? "A_LATE" : "B_LATE";
      return;
    }

    // Calcular disponibilidad presencial para el viernes
    const getScore = (groupName) => {
      const groupMembers = EMPLOYEES.filter((e) => e.group === groupName);
      let score = 0;
      groupMembers.forEach((emp) => {
        // Si está de vacaciones, no cuenta
        if (vacWeeksByEmp[emp.id].has(wi)) return;
        // Si sus días de oficina incluyen Viernes, suma punto
        const officeDays = emp.officeDays.split(",").map((d) => d.trim());
        if (officeDays.includes("V")) score++;
      });
      return score;
    };

    const scoreA = getScore("A");
    const scoreB = getScore("B");

    if (scoreA > scoreB) {
      // A tiene más presencia en viernes -> A hace O40 -> B hace O42
      weekAssignments[wi] = "B_LATE";
    } else if (scoreB > scoreA) {
      // B tiene más presencia en viernes -> B hace O40 -> A hace O42
      weekAssignments[wi] = "A_LATE";
    } else {
      // Empate -> Rotación estándar basada en SHIFT_BASE_A_18H y paridad
      const defaultIsALate = SHIFT_BASE_A_18H ? wi % 2 === 0 : wi % 2 !== 0;
      weekAssignments[wi] = defaultIsALate ? "A_LATE" : "B_LATE";
    }
  });

  const getLateGroupForWeek = (weekIndex) => {
    const assignment = weekAssignments[weekIndex];
    if (assignment === "A_LATE") return "A";
    if (assignment === "B_LATE") return "B";
    const defaultIsALate = SHIFT_BASE_A_18H ? weekIndex % 2 === 0 : weekIndex % 2 !== 0;
    return defaultIsALate ? "A" : "B";
  };

  EMPLOYEES.forEach((emp) => {
    schedule[emp.id] = {};
    days.forEach((day) => {
      const vacationsForEmp = vacationPlan[emp.name] || [];
      if (vacationsForEmp.includes(day.id)) {
        schedule[emp.id][day.id] = "V";
        return;
      }
      
      const assignment = weekAssignments[day.weekIndex];
      const isGroupA = emp.group === "A";
      
      // Si assignment es A_LATE: A tiene O42, B tiene O40
      // Si assignment es B_LATE: B tiene O42, A tiene O40
      
      let isTurnoTarde = false; // O42
      if (assignment === "A_LATE") {
         isTurnoTarde = isGroupA;
      } else {
         isTurnoTarde = !isGroupA;
      }

      if (!isTurnoTarde) {
        schedule[emp.id][day.id] = "O40";
      } else {
        schedule[emp.id][day.id] = "O42";
      }
    });
  });

  const intensiveWeeksByEmp = {};
  EMPLOYEES.forEach((emp) => {
    intensiveWeeksByEmp[emp.id] = 0;
  });

  Object.keys(weeks).forEach((wiStr) => {
    const wi = parseInt(wiStr, 10);
    const weekDays = weeks[wi];
    const lateGroup = getLateGroupForWeek(wi);

    const lateAvailable = EMPLOYEES.filter(
      (emp) => emp.group === lateGroup && !vacWeeksByEmp[emp.id].has(wi)
    ).sort((a, b) => {
      const diff = intensiveWeeksByEmp[b.id] - intensiveWeeksByEmp[a.id];
      return diff !== 0 ? diff : a.id - b.id;
    });
    const anchor = lateAvailable.length ? lateAvailable[0] : null;

    const allEligible = EMPLOYEES.filter(
      (emp) => !vacWeeksByEmp[emp.id].has(wi) && (!anchor || emp.id !== anchor.id)
    ).sort((a, b) => {
      const diff = intensiveWeeksByEmp[a.id] - intensiveWeeksByEmp[b.id];
      return diff !== 0 ? diff : a.id - b.id;
    });

    const nonLate = EMPLOYEES.filter((emp) => emp.group !== lateGroup);
    const nonLateHasVacation = nonLate.some((emp) => vacWeeksByEmp[emp.id].has(wi));

    if (nonLateHasVacation) {
      nonLate
        .filter((emp) => !vacWeeksByEmp[emp.id].has(wi))
        .sort((a, b) => {
          const diff = intensiveWeeksByEmp[b.id] - intensiveWeeksByEmp[a.id];
          return diff !== 0 ? diff : a.id - b.id;
        });
    }

    const isEligibleIntensiveWeek = weekDays.every((day) => isIntensivePeriod(day.id));

    const eligibleIntensive = isEligibleIntensiveWeek ? allEligible : [];

    const selected = [];
    if (isEligibleIntensiveWeek) {
      for (const emp of eligibleIntensive) {
        if (intensiveWeeksByEmp[emp.id] >= 6) continue;
        if (selected.length >= 3) continue;
        
        if (preservesOfficeCoverage(emp.id, weekDays, schedule)) {
          selected.push(emp);
          weekDays.forEach((day) => {
            if (schedule[emp.id][day.id] !== "V") {
              schedule[emp.id][day.id] = "O30";
            }
          });
          intensiveWeeksByEmp[emp.id] += 1;
        }
      }
    }

    if (anchor) {
      weekDays.forEach((day) => {
        if (schedule[anchor.id][day.id] !== "V") {
          schedule[anchor.id][day.id] = "O42";
        }
      });
    }

    EMPLOYEES.forEach((emp) => {
      if (vacWeeksByEmp[emp.id].has(wi)) return;
      if (anchor && emp.id === anchor.id) return;
      if (selected.includes(emp)) return;

      weekDays.forEach((day) => {
        if (schedule[emp.id][day.id] === "V" || schedule[emp.id][day.id] === "O30") {
          return;
        }
        const assignment = weekAssignments[day.weekIndex];
        const isLateGroup = emp.group === "A";
        
        let isTurnoTarde = false;
        if (assignment === "A_LATE") {
           isTurnoTarde = isLateGroup;
        } else {
           isTurnoTarde = !isLateGroup;
        }
        
        if (!isTurnoTarde) {
          schedule[emp.id][day.id] = "O40";
        } else {
          schedule[emp.id][day.id] = "O42";
        }
      });
    });

    weekDays.forEach((day) => {
      if (day.weekdayLetter === "V") return;
      const lateGroupMembers = getShiftGroupMemberNames(lateGroup);
      const hasO42 = EMPLOYEES.some((emp) => schedule[emp.id][day.id] === "O42");
      if (!hasO42) {
        const lateCandidates = EMPLOYEES.filter((emp) => {
          const current = schedule[emp.id][day.id];
          if (current === "V") return false;
          return lateGroupMembers.includes(emp.name);
        }).sort((a, b) => a.id - b.id);
        const pick = lateCandidates[0] || EMPLOYEES.find((emp) => schedule[emp.id][day.id] !== "V");
        if (pick) {
          schedule[pick.id][day.id] = "O42";
        }
      }

      const hasO42InOffice = EMPLOYEES.some((emp) => {
        if (schedule[emp.id][day.id] !== "O42") return false;
        const officeDays = emp.officeDays.split(",").map((d) => d.trim());
        return officeDays.includes(day.weekdayLetter);
      });

      const currentO42Count = EMPLOYEES.filter(e => schedule[e.id][day.id] === "O42").length;
      if (!hasO42InOffice && currentO42Count < 3) {
        const candidates = EMPLOYEES.filter((emp) => {
          if (schedule[emp.id][day.id] === "V") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          if (!officeDays.includes(day.weekdayLetter)) return false;
          return lateGroupMembers.includes(emp.name);
        }).sort((a, b) => {
          const aIsO40 = schedule[a.id][day.id] === "O40";
          const bIsO40 = schedule[b.id][day.id] === "O40";
          if (aIsO40 && !bIsO40) return -1;
          if (!aIsO40 && bIsO40) return 1;
          return a.id - b.id;
        });
        const pick = candidates[0];
        if (pick) {
          if (schedule[pick.id][day.id] === "O30") {
            intensiveWeeksByEmp[pick.id] = Math.max(0, (intensiveWeeksByEmp[pick.id] || 0) - 1);
          }
          schedule[pick.id][day.id] = "O42";
        }
      }
    });

    weekDays.forEach((day) => {
      if (day.weekdayLetter !== "V") return;
      const hasO40InOffice = EMPLOYEES.some(e => {
        if (schedule[e.id][day.id] !== "O40") return false;
        return e.officeDays.includes("V");
      });
      
      if (!hasO40InOffice) {
          const candidates = EMPLOYEES.filter((emp) => schedule[emp.id][day.id] !== "V")
            .sort((a, b) => {
              const aInOffice = a.officeDays.includes("V");
              const bInOffice = b.officeDays.includes("V");
              if (aInOffice && !bInOffice) return -1;
              if (!aInOffice && bInOffice) return 1;

              const typeA = schedule[a.id][day.id] === "O40";
              const typeB = schedule[b.id][day.id] === "O40";
              if (typeA && !typeB) return -1;
              if (!typeA && typeB) return 1;

              return a.id - b.id;
            });
          const pick = candidates[0];
          if (pick) {
            if (schedule[pick.id][day.id] === "O30") {
              intensiveWeeksByEmp[pick.id] = (intensiveWeeksByEmp[pick.id] || 0) - 1;
            }
            schedule[pick.id][day.id] = "O40";
          }
      }
    });
  });

  const weeksBeforeCompensation = {};
  days.forEach((d) => {
    weeksBeforeCompensation[d.weekIndex] =
      weeksBeforeCompensation[d.weekIndex] || [];
    weeksBeforeCompensation[d.weekIndex].push(d);
  });

  GROUP2.forEach((empName) => {
    const emp = EMPLOYEES.find((e) => e.name === empName);
    if (!emp) return;

    let intensiveWeeks = 0;
    Object.keys(weeksBeforeCompensation).forEach((wiStr) => {
      const daysInWeek = weeksBeforeCompensation[wiStr];
      const allO30 = daysInWeek.every(
        (day) => schedule[emp.id][day.id] === "O30"
      );
      if (allO30) intensiveWeeks++;
    });

    while (intensiveWeeks < 7) {
      let swapped = false;

      for (const day of days) {
        if (schedule[emp.id][day.id] !== "O40") continue;
        if (schedule[emp.id][day.id] === "V") continue;
        if (!isIntensivePeriod(day.id, emp.id)) continue;

        const empOfficeDays = emp.officeDays.split(",").map((d) => d.trim());
        const isInOffice = empOfficeDays.includes(day.weekdayLetter);

        const currentIntensiveCount = EMPLOYEES.filter(
          (e) => schedule[e.id][day.id] === "O30"
        ).length;
        if (currentIntensiveCount >= 3) continue;

        if (!isInOffice) {
          schedule[emp.id][day.id] = "O30";
          if (countForcedDays(schedule, days) > MAX_FORCED_OFFICE_DAYS) {
             schedule[emp.id][day.id] = "O40";
          } else {
             swapped = true;
             break;
          }
        }

        const otherGroup = GROUP1;
        const otherGroupHasO40 = otherGroup.some((name) => {
          const other = EMPLOYEES.find((e) => e.name === name);
          if (!other) return false;
          const otherType = schedule[other.id][day.id];
          if (otherType !== "O40") return false;
          const otherOfficeDays = other.officeDays.split(",").map((d) => d.trim());
          return otherOfficeDays.includes(day.weekdayLetter);
        });

        if (otherGroupHasO40) {
          schedule[emp.id][day.id] = "O30";
          if (countForcedDays(schedule, days) > MAX_FORCED_OFFICE_DAYS) {
             schedule[emp.id][day.id] = "O40";
          } else {
             swapped = true;
             break;
          }
        }
      }

      if (!swapped) break;

      intensiveWeeks = 0;
      Object.keys(weeksBeforeCompensation).forEach((wiStr) => {
        const daysInWeek = weeksBeforeCompensation[wiStr];
        const allO30 = daysInWeek.every(
          (day) => schedule[emp.id][day.id] === "O30"
        );
        if (allO30) intensiveWeeks++;
      });
    }
  });

  const weeksList = {};
  days.forEach((d) => {
    weeksList[d.weekIndex] = weeksList[d.weekIndex] || [];
    weeksList[d.weekIndex].push(d);
  });

  const currentIntensiveWeeks = {};
  EMPLOYEES.forEach((emp) => {
    let count = 0;
    Object.keys(weeksList).forEach((wiStr) => {
      const daysInWeek = weeksList[wiStr];
      const allO30 = daysInWeek.every(
        (day) => schedule[emp.id][day.id] === "O30"
      );
      if (allO30) count += 1;
    });
    currentIntensiveWeeks[emp.id] = count;
  });

  EMPLOYEES.forEach((emp) => {
    while (currentIntensiveWeeks[emp.id] < 6) {
      let improved = false;
      Object.keys(weeksList).forEach((wiStr) => {
        if (improved) return;
        const wi = parseInt(wiStr, 10);
        if (vacWeeksByEmp[emp.id].has(wi)) return;
        const daysInWeek = weeksList[wi];
        const weekInIntensiveWindow = daysInWeek.every((day) => isIntensivePeriod(day.id, emp.id));
        if (!weekInIntensiveWindow) return;
        let hasO42ForEmp = daysInWeek.some(
          (day) => schedule[emp.id][day.id] === "O42"
        );
        if (hasO42ForEmp) {
          const daysWithO42 = daysInWeek.filter(
            (day) => schedule[emp.id][day.id] === "O42"
          );
          let allMoved = true;
          const tempSwaps = [];

          for (const day of daysWithO42) {
            const candidates = EMPLOYEES.filter((e) => {
              if (e.id === emp.id) return false;
              if (schedule[e.id][day.id] !== "O40") return false;
              if (vacWeeksByEmp[e.id].has(wi)) return false;
              return true;
            }).sort((a, b) => {
              return (
                (currentIntensiveWeeks[b.id] || 0) -
                (currentIntensiveWeeks[a.id] || 0)
              );
            });

            if (candidates.length > 0) {
              const sub = candidates[0];
              tempSwaps.push({ sub, day });
            } else {
              allMoved = false;
              break;
            }
          }

          if (allMoved) {
            tempSwaps.forEach(({ sub, day }) => {
              schedule[sub.id][day.id] = "O42";
              schedule[emp.id][day.id] = "O40";
            });
            if (countForcedDays(schedule, days) > MAX_FORCED_OFFICE_DAYS) {
               tempSwaps.forEach(({ sub, day }) => {
                 schedule[sub.id][day.id] = "O40";
                 schedule[emp.id][day.id] = "O42";
               });
               return;
            }
            hasO42ForEmp = false;
          } else {
            return;
          }
        }
        const allO40 = daysInWeek.every(
          (day) => schedule[emp.id][day.id] === "O40"
        );
        if (!allO40) return;
        const canFlip = daysInWeek.every((day) => {
          const o30Count = EMPLOYEES.filter(
            (e) => schedule[e.id][day.id] === "O30"
          ).length;
          return o30Count < 3;
        });
        if (!canFlip) return;
        if (!preservesOfficeCoverage(emp.id, daysInWeek, schedule)) {
          // Allow if within forced office budget
          daysInWeek.forEach(d => { if (schedule[emp.id][d.id] !== 'V') schedule[emp.id][d.id] = 'O30'; });
          const forced = countForcedDays(schedule, days);
          daysInWeek.forEach(d => { if (schedule[emp.id][d.id] === 'O30') schedule[emp.id][d.id] = 'O40'; });
          if (forced > MAX_FORCED_OFFICE_DAYS) return;
        }
        daysInWeek.forEach((day) => {
          schedule[emp.id][day.id] = "O30";
        });
        currentIntensiveWeeks[emp.id] += 1;
        improved = true;
      });
      if (!improved) break;
    }
  });

  if (year === 2026) {
    const findEmp = (name) => EMPLOYEES.find((e) => e.name === name);

    const enrique = findEmp("Enrique");
    if (enrique) {
      const day19 = days.find((d) => d.id === "2026-06-19");
      if (day19 && schedule[enrique.id][day19.id] !== "V") {
        schedule[enrique.id][day19.id] = "O40";
      }
    }

    const july24 = "2026-07-24";
    const luis = findEmp("Luis");
    if (luis && schedule[luis.id][july24] !== "V") {
      schedule[luis.id][july24] = "O40";
    }
    if (enrique && schedule[enrique.id][july24] === "O40") {
      schedule[enrique.id][july24] = "O42";
    }

    if (enrique) {
      let intensiveCount = 0;
      const intensiveWeeksIndices = [];
      Object.keys(weeksList).forEach((wiStr) => {
        const wi = parseInt(wiStr, 10);
        const daysInWeek = weeksList[wi];
        const allO30 = daysInWeek.every(
          (day) => schedule[enrique.id][day.id] === "O30"
        );
        if (allO30) {
          intensiveCount += 1;
          intensiveWeeksIndices.push(wi);
        }
      });

      if (intensiveCount < 6) {
        const day19 = days.find((d) => d.id === "2026-06-19");
        const forbiddenWeek = day19 ? day19.weekIndex : null;
        const candidateWeeks = Object.keys(weeksList)
          .map((wiStr) => parseInt(wiStr, 10))
          .sort((a, b) => a - b)
          .filter(
            (wi) =>
              wi !== forbiddenWeek &&
              !intensiveWeeksIndices.includes(wi) &&
              !vacWeeksByEmp[enrique.id].has(wi) &&
              weeksList[wi].every((day) => isIntensivePeriod(day.id, enrique.id))
          );

        for (const wi of candidateWeeks) {
          const daysInWeek = weeksList[wi];
          let canFlip = true;

          daysInWeek.forEach((day) => {
            if (!canFlip) return;
            const current = schedule[enrique.id][day.id];
            if (!current || current === "V") {
              canFlip = false;
              return;
            }
            const o30Count = EMPLOYEES.filter(
              (e) => schedule[e.id][day.id] === "O30"
            ).length;
            if (o30Count >= 3) {
              canFlip = false;
            }
          });

          if (!canFlip) {
            continue;
          }

          daysInWeek.forEach((day) => {
            if (schedule[enrique.id][day.id] !== "V") {
              schedule[enrique.id][day.id] = "O30";
            }
          });

          break;
        }
      }
    }

    const criticalDays = ["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23"];
    const kike = findEmp("Kike");
    if (kike) {
      criticalDays.forEach((dayId) => {
        const current = schedule[kike.id][dayId];
        if (!current || current === "V") return;
        schedule[kike.id][dayId] = "O42";
      });
    }

    const finalWeeksMap = {};
    days.forEach((d) => {
      finalWeeksMap[d.weekIndex] = finalWeeksMap[d.weekIndex] || [];
      finalWeeksMap[d.weekIndex].push(d);
    });

    const finalIntensiveWeeks = {};
    EMPLOYEES.forEach((emp) => {
      let count = 0;
      Object.keys(finalWeeksMap).forEach((wiStr) => {
        const daysInWeek = finalWeeksMap[wiStr];
        const allO30 = daysInWeek.every(
          (day) => schedule[emp.id][day.id] === "O30"
        );
        if (allO30) count += 1;
      });
      finalIntensiveWeeks[emp.id] = count;
    });

    const enriqueDay19 = days.find((d) => d.id === "2026-06-19");
    const forbiddenWeekEnrique =
      enriqueDay19 && enrique ? enriqueDay19.weekIndex : null;
    const luisDay24 = days.find((d) => d.id === "2026-07-24");
    const forbiddenWeekLuis =
      luisDay24 && luis ? luisDay24.weekIndex : null;
    const criticalKikeSet = new Set(criticalDays);

    const canTakeO30 = (emp, wi) => {
      if (vacWeeksByEmp[emp.id].has(wi)) return false;
      if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) return false;
      if (emp.name === "Luis" && forbiddenWeekLuis === wi) return false;
      const daysInWeek = finalWeeksMap[wi];
      if (!daysInWeek || !daysInWeek.every((day) => isIntensivePeriod(day.id, emp.id))) return false;
      if (emp.name === "Kike") {
        const daysInWeekCheck = finalWeeksMap[wi];
        if (daysInWeekCheck.some((day) => criticalKikeSet.has(day.id)))
          return false;
      }
      // Check specific day constraints and O42
      for (const day of daysInWeek) {
        if (emp.name === "Enrique" && day.id === "2026-06-19") return false;
        if (emp.name === "Luis" && day.id === "2026-07-24") return false;
        if (schedule[emp.id][day.id] === "O42") return false;
      }
      return true;
    };

    const getOccupants = (wi) => {
      const daysInWeek = finalWeeksMap[wi];
      return EMPLOYEES.filter((e) => {
        return daysInWeek.every((d) => schedule[e.id][d.id] === "O30");
      });
    };

    // Optimize and balance intensive weeks across all employees
    let balancing = true;
    let loops = 0;
    const targetIntensiveWeeks = 6;

    while (balancing && loops < 150) {
      balancing = false;
      loops++;

      // Sort by deficit (ascending) to prioritize those with fewer weeks
      const sortedEmps = [...EMPLOYEES].sort(
        (a, b) => finalIntensiveWeeks[a.id] - finalIntensiveWeeks[b.id]
      );

      for (const emp of sortedEmps) {
        if (finalIntensiveWeeks[emp.id] >= targetIntensiveWeeks) continue;

        const weeksIndices = Object.keys(finalWeeksMap)
          .map((k) => parseInt(k, 10))
          .sort((a, b) => a - b);

        for (const wi of weeksIndices) {
          if (finalIntensiveWeeks[emp.id] >= targetIntensiveWeeks) break;

          const occupants = getOccupants(wi);
          if (occupants.find((e) => e.id === emp.id)) continue; // Already has it
          if (!canTakeO30(emp, wi)) continue;

          // Check DAILY limits strictly for the candidate week
          const daysInWeek = finalWeeksMap[wi];
          const canAssignStrict = daysInWeek.every((day) => {
             // If vacation, no problem (but already checked in canTakeO30)
             if (schedule[emp.id][day.id] === "V") return true;
             const dailyO30 = EMPLOYEES.filter(e => schedule[e.id][day.id] === "O30").length;
             return dailyO30 < 3; // Maximum 3 intensive shifts per day
          });

          if (canAssignStrict) {
            const coverageOk = preservesOfficeCoverage(emp.id, daysInWeek, schedule);
            let withinBudget = coverageOk;
            if (!coverageOk) {
              daysInWeek.forEach(d => { if (schedule[emp.id][d.id] !== 'V') schedule[emp.id][d.id] = 'O30'; });
              withinBudget = countForcedDays(schedule, days) <= MAX_FORCED_OFFICE_DAYS;
              daysInWeek.forEach(d => { if (schedule[emp.id][d.id] !== 'V') schedule[emp.id][d.id] = 'O40'; });
            }
            if (withinBudget) {
              // Take free slot
              daysInWeek.forEach((day) => {
                if (schedule[emp.id][day.id] !== "V") {
                  schedule[emp.id][day.id] = "O30";
                }
              });
              finalIntensiveWeeks[emp.id]++;
              balancing = true;
            }
          } else {
            // Try to swap with a donor who has MORE than the target (or at least more than this emp + 1)
            const validDonors = occupants.filter(donor => 
               finalIntensiveWeeks[donor.id] > targetIntensiveWeeks || 
               finalIntensiveWeeks[donor.id] > finalIntensiveWeeks[emp.id] + 1
            ).sort((a, b) => finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id]); // Donors with most weeks first
            
            for (const donor of validDonors) {
              let moved = false;
              
              // If donor has surplus, we can just downgrade them directly
              if (finalIntensiveWeeks[donor.id] > targetIntensiveWeeks) {
                  const daysSrc = finalWeeksMap[wi];
                  daysSrc.forEach((d) => {
                     if (schedule[donor.id][d.id] !== "V") schedule[donor.id][d.id] = "O40";
                  });
                  // Check coverage or forced budget
                  daysSrc.forEach((d) => {
                     if (schedule[emp.id][d.id] !== "V") schedule[emp.id][d.id] = "O30";
                  });
                  const budgetOk = countForcedDays(schedule, days) <= MAX_FORCED_OFFICE_DAYS;
                  if (budgetOk) {
                     finalIntensiveWeeks[donor.id]--;
                     finalIntensiveWeeks[emp.id]++;
                     moved = true;
                     balancing = true;
                     break;
                  } else {
                     // Revert
                     daysSrc.forEach((d) => {
                        if (schedule[donor.id][d.id] !== "V") schedule[donor.id][d.id] = "O30";
                        if (schedule[emp.id][d.id] !== "V") schedule[emp.id][d.id] = "O40";
                     });
                  }
              }
              
              // Otherwise, try to relocate donor
              for (const destWi of weeksIndices) {
                if (destWi === wi) continue;
                if (!canTakeO30(donor, destWi)) continue;
                
                // Verify donor can move to destWi without breaking daily limits there
                const daysDest = finalWeeksMap[destWi];
                const canMoveDonorStrict = daysDest.every(day => {
                   if (schedule[donor.id][day.id] === "V") return true;
                   const dailyO30 = EMPLOYEES.filter(e => schedule[e.id][day.id] === "O30").length;
                   return dailyO30 < 3;
                });
                
                if (!canMoveDonorStrict) continue;

                // Move donor
                const daysSrc = finalWeeksMap[wi];
                const daysDest_ = finalWeeksMap[destWi];

                // Simulate full move
                daysSrc.forEach((d) => {
                   if (schedule[donor.id][d.id] !== "V")
                     schedule[donor.id][d.id] = "O40";
                });
                daysDest_.forEach((d) => {
                   if (schedule[donor.id][d.id] !== "V")
                     schedule[donor.id][d.id] = "O30";
                });
                daysSrc.forEach((d) => {
                   if (schedule[emp.id][d.id] !== "V")
                     schedule[emp.id][d.id] = "O30";
                });
                
                if (countForcedDays(schedule, days) <= MAX_FORCED_OFFICE_DAYS) {
                   finalIntensiveWeeks[emp.id]++;
                   moved = true;
                   balancing = true;
                   break;
                } else {
                   // Revert all
                   daysSrc.forEach((d) => {
                     if (schedule[emp.id][d.id] !== "V") schedule[emp.id][d.id] = "O40";
                     if (schedule[donor.id][d.id] !== "V") schedule[donor.id][d.id] = "O30";
                   });
                   daysDest_.forEach((d) => {
                     if (schedule[donor.id][d.id] !== "V") schedule[donor.id][d.id] = "O40";
                   });
                }
              }
              if (moved) break;
            }
          }
          if (balancing) break;
        }
        if (balancing) break;
      }
    }

    const recalcIntensiveWeeks = () => {
      EMPLOYEES.forEach((emp) => {
        let count = 0;
        Object.keys(finalWeeksMap).forEach((wiStr) => {
          const daysInWeek = finalWeeksMap[wiStr];
          if (daysInWeek.every((day) => schedule[emp.id][day.id] === "O30")) count += 1;
        });
        finalIntensiveWeeks[emp.id] = count;
      });
    };

    const guaranteeMinimumIntensiveWeeks = (minimumTarget) => {
      const canTakeO30ForGuarantee = (emp, wi) => {
        if (vacWeeksByEmp[emp.id].has(wi)) return false;
        if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) return false;
        if (emp.name === "Luis" && forbiddenWeekLuis === wi) return false;
        const daysInWeek = finalWeeksMap[wi];
        if (!daysInWeek || !daysInWeek.every((day) => isIntensivePeriod(day.id, emp.id))) return false;
        if (emp.name === "Kike") {
          const daysInWeekCheck = finalWeeksMap[wi];
          if (daysInWeekCheck.some((day) => criticalKikeSet.has(day.id))) return false;
        }
        for (const day of daysInWeek) {
          if (emp.name === "Enrique" && day.id === "2026-06-19") return false;
          if (emp.name === "Luis" && day.id === "2026-07-24") return false;
          if (schedule[emp.id][day.id] === "V") return false;
        }
        return true;
      };

      let changed = true;
      let safety = 0;
      while (changed && safety < 200) {
        changed = false;
        safety += 1;
        const underTarget = [...EMPLOYEES]
          .filter((emp) => finalIntensiveWeeks[emp.id] < minimumTarget)
          .sort((a, b) => finalIntensiveWeeks[a.id] - finalIntensiveWeeks[b.id]);
        if (underTarget.length === 0) break;

        for (const emp of underTarget) {
          const weeksIndices = Object.keys(finalWeeksMap)
            .map((k) => parseInt(k, 10))
            .sort((a, b) => a - b);
          let assigned = false;

          for (const wi of weeksIndices) {
            if (assigned || finalIntensiveWeeks[emp.id] >= minimumTarget) break;
            if (!canTakeO30ForGuarantee(emp, wi)) continue;
            const daysInWeek = finalWeeksMap[wi];
            const alreadyIntensive = daysInWeek.every((day) => schedule[emp.id][day.id] === "O30");
            if (alreadyIntensive) continue;

            const occupants = getOccupants(wi);
            const donors = occupants
              .filter((donor) => donor.id !== emp.id && finalIntensiveWeeks[donor.id] > minimumTarget)
              .sort((a, b) => finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id]);

            if (donors.length > 0) {
              const donor = donors[0];
              daysInWeek.forEach((day) => {
                if (schedule[donor.id][day.id] !== "V") schedule[donor.id][day.id] = "O40";
                if (schedule[emp.id][day.id] !== "V") schedule[emp.id][day.id] = "O30";
              });
              finalIntensiveWeeks[donor.id] = Math.max(0, finalIntensiveWeeks[donor.id] - 1);
              finalIntensiveWeeks[emp.id] += 1;
              changed = true;
              assigned = true;
              break;
            }

            const canAssignWithLimit = daysInWeek.every((day) => {
              if (schedule[emp.id][day.id] === "V") return false;
              const dailyO30 = EMPLOYEES.filter((e) => schedule[e.id][day.id] === "O30").length;
              const projectedO30 = schedule[emp.id][day.id] === "O30" ? dailyO30 : dailyO30 + 1;
              return projectedO30 <= 3;
            });
            if (!canAssignWithLimit) continue;

            daysInWeek.forEach((day) => {
              if (schedule[emp.id][day.id] !== "V") schedule[emp.id][day.id] = "O30";
            });
            finalIntensiveWeeks[emp.id] += 1;
            changed = true;
            assigned = true;
            break;
          }
        }
      }
      recalcIntensiveWeeks();
    };

    guaranteeMinimumIntensiveWeeks(6);

    // Final check to ensure we didn't break O42 coverage during swapping
    days.forEach((day) => {
      if (day.weekdayLetter === "V") return; // Friday doesn't need O42
      
      const hasO42 = EMPLOYEES.some((emp) => schedule[emp.id][day.id] === "O42");
      if (!hasO42) {
          const lateGroup = getLateGroupForWeek(day.weekIndex);
          const lateGroupMembers = getShiftGroupMemberNames(lateGroup);
          
          const candidates = EMPLOYEES.filter(
              (emp) => lateGroupMembers.includes(emp.name) && schedule[emp.id][day.id] !== "V"
          ).sort((a, b) => {
              const typeA = schedule[a.id][day.id];
              const typeB = schedule[b.id][day.id];
              if (typeA === "O40" && typeB !== "O40") return -1;
              if (typeB === "O40" && typeA !== "O40") return 1;
              const aAboveTarget = finalIntensiveWeeks[a.id] > targetIntensiveWeeks;
              const bAboveTarget = finalIntensiveWeeks[b.id] > targetIntensiveWeeks;
              if (aAboveTarget && !bAboveTarget) return -1;
              if (!aAboveTarget && bAboveTarget) return 1;
              return finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id];
          });
          
          let pick = candidates[0] || EMPLOYEES.find((emp) => schedule[emp.id][day.id] !== "V");
          if (pick && schedule[pick.id][day.id] === "O30" && finalIntensiveWeeks[pick.id] <= targetIntensiveWeeks) {
            const fallback = EMPLOYEES.filter((emp) => schedule[emp.id][day.id] === "O40" && schedule[emp.id][day.id] !== "V")
              .sort((a, b) => finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id])[0];
            if (fallback) pick = fallback;
          }
          if (pick) {
              if (schedule[pick.id][day.id] === "O30") finalIntensiveWeeks[pick.id]--;
              schedule[pick.id][day.id] = "O42";
          }
      }

      const hasO42InOffice = EMPLOYEES.some((emp) => {
        if (schedule[emp.id][day.id] !== "O42") return false;
        const officeDays = emp.officeDays.split(",").map((d) => d.trim());
        return officeDays.includes(day.weekdayLetter);
      });

      if (!hasO42InOffice) {
        const lateGroup = getLateGroupForWeek(day.weekIndex);
        const lateGroupMembers = getShiftGroupMemberNames(lateGroup);
        const candidates = EMPLOYEES.filter((emp) => {
          if (schedule[emp.id][day.id] === "V") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          return officeDays.includes(day.weekdayLetter);
        }).sort((a, b) => {
          const aNeedsIntensive = schedule[a.id][day.id] === "O30" && finalIntensiveWeeks[a.id] <= 6;
          const bNeedsIntensive = schedule[b.id][day.id] === "O30" && finalIntensiveWeeks[b.id] <= 6;
          if (aNeedsIntensive && !bNeedsIntensive) return 1;
          if (!aNeedsIntensive && bNeedsIntensive) return -1;

          const aInLateGroup = lateGroupMembers.includes(a.name);
          const bInLateGroup = lateGroupMembers.includes(b.name);
          if (aInLateGroup && !bInLateGroup) return -1;
          if (!aInLateGroup && bInLateGroup) return 1;
          const typeA = schedule[a.id][day.id];
          const typeB = schedule[b.id][day.id];
          if (typeA === "O40" && typeB !== "O40") return -1;
          if (typeB === "O40" && typeA !== "O40") return 1;
          const aAboveTarget = finalIntensiveWeeks[a.id] > targetIntensiveWeeks;
          const bAboveTarget = finalIntensiveWeeks[b.id] > targetIntensiveWeeks;
          if (aAboveTarget && !bAboveTarget) return -1;
          if (!aAboveTarget && bAboveTarget) return 1;
          return finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id];
        });
        let pick = candidates[0];
        if (pick && schedule[pick.id][day.id] === "O30" && finalIntensiveWeeks[pick.id] <= targetIntensiveWeeks) {
          const fallback = candidates.find((emp) => schedule[emp.id][day.id] === "O40");
          if (fallback) pick = fallback;
        }
        if (pick) {
          if (schedule[pick.id][day.id] === "O30") {
            finalIntensiveWeeks[pick.id] = Math.max(0, (finalIntensiveWeeks[pick.id] || 0) - 1);
          }
          schedule[pick.id][day.id] = "O42";
        }
      }
    });

    const canGuaranteeAfterCoverage = (emp, wi) => {
      if (vacWeeksByEmp[emp.id].has(wi)) return false;
      if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) return false;
      if (emp.name === "Luis" && forbiddenWeekLuis === wi) return false;
      const weekDays = finalWeeksMap[wi];
      if (!weekDays || !weekDays.every((day) => isIntensivePeriod(day.id, emp.id))) return false;
      if (emp.name === "Kike" && weekDays.some((day) => criticalKikeSet.has(day.id))) return false;
      if (weekDays.some((day) => schedule[emp.id][day.id] === "V")) return false;
      return true;
    };

    const enforceMinimumAfterCoverage = (minimumTarget) => {
      recalcIntensiveWeeks();
      let moved = true;
      let loops = 0;
      const weekIndexes = Object.keys(finalWeeksMap).map((k) => parseInt(k, 10)).sort((a, b) => a - b);
      while (moved && loops < 120) {
        moved = false;
        loops += 1;
        const pending = EMPLOYEES
          .filter((emp) => finalIntensiveWeeks[emp.id] < minimumTarget)
          .sort((a, b) => finalIntensiveWeeks[a.id] - finalIntensiveWeeks[b.id]);
        if (pending.length === 0) break;

        for (const emp of pending) {
          if (finalIntensiveWeeks[emp.id] >= minimumTarget) continue;
          for (const wi of weekIndexes) {
            if (!canGuaranteeAfterCoverage(emp, wi)) continue;
            const weekDays = finalWeeksMap[wi];
            if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) continue;

            const canApply = weekDays.every((day) => {
              const o30Count = EMPLOYEES.filter((e) => schedule[e.id][day.id] === "O30").length;
              const projected = schedule[emp.id][day.id] === "O30" ? o30Count : o30Count + 1;
              if (projected > 3) return false;
              if (day.weekdayLetter === "V") return true;
              const o42Exists = EMPLOYEES.some((e) => e.id !== emp.id && schedule[e.id][day.id] === "O42");
              return o42Exists;
            });
            if (!canApply) continue;

            weekDays.forEach((day) => {
              schedule[emp.id][day.id] = "O30";
            });
            recalcIntensiveWeeks();
            moved = true;
            break;
          }
          if (moved) break;
        }
      }
    };

    const improveUnderTargetWithWeekSwaps = (minimumTarget, priorityNames = []) => {
      recalcIntensiveWeeks();
      const weekIndexes = Object.keys(finalWeeksMap).map((k) => parseInt(k, 10)).sort((a, b) => a - b);
      let moved = true;
      let loops = 0;
      while (moved && loops < 120) {
        moved = false;
        loops += 1;
        const pending = EMPLOYEES.filter((emp) => finalIntensiveWeeks[emp.id] < minimumTarget).sort((a, b) => {
          const aPriority = priorityNames.includes(a.name) ? 0 : 1;
          const bPriority = priorityNames.includes(b.name) ? 0 : 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return finalIntensiveWeeks[a.id] - finalIntensiveWeeks[b.id];
        });
        if (pending.length === 0) break;

        for (const emp of pending) {
          if (finalIntensiveWeeks[emp.id] >= minimumTarget) continue;
          for (const wi of weekIndexes) {
            const weekDays = finalWeeksMap[wi];
            if (!weekDays || weekDays.length === 0) continue;
            if (vacWeeksByEmp[emp.id].has(wi)) continue;
            if (!weekDays.every((day) => isIntensivePeriod(day.id, emp.id))) continue;
            if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) continue;
            if (emp.name === "Luis" && forbiddenWeekLuis === wi) continue;
            if (emp.name === "Kike" && weekDays.some((day) => criticalKikeSet.has(day.id))) continue;
            if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) continue;
            if (weekDays.some((day) => schedule[emp.id][day.id] === "V")) continue;

            const snapshot = {};
            EMPLOYEES.forEach((member) => {
              snapshot[member.id] = {};
              weekDays.forEach((day) => {
                snapshot[member.id][day.id] = schedule[member.id][day.id];
              });
            });
            const restore = () => {
              EMPLOYEES.forEach((member) => {
                weekDays.forEach((day) => {
                  schedule[member.id][day.id] = snapshot[member.id][day.id];
                });
              });
            };

            let canMove = true;
            for (const day of weekDays) {
              const currentType = schedule[emp.id][day.id];
              if (currentType === "O42") {
                const candidates = EMPLOYEES.filter((sub) => {
                  if (sub.id === emp.id) return false;
                  if (schedule[sub.id][day.id] !== "O40") return false;
                  if (vacWeeksByEmp[sub.id].has(wi)) return false;
                  return true;
                }).sort((a, b) => {
                  const aProtected = finalIntensiveWeeks[a.id] <= minimumTarget;
                  const bProtected = finalIntensiveWeeks[b.id] <= minimumTarget;
                  if (aProtected && !bProtected) return 1;
                  if (!aProtected && bProtected) return -1;
                  return finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id];
                });
                const sub = candidates[0];
                if (!sub) {
                  canMove = false;
                  break;
                }
                schedule[sub.id][day.id] = "O42";
                schedule[emp.id][day.id] = "O40";
              }
            }
            if (!canMove) {
              restore();
              continue;
            }

            if (!weekDays.every((day) => schedule[emp.id][day.id] === "O40")) {
              restore();
              continue;
            }

            let canApply = weekDays.every((day) => {
              const o30Count = EMPLOYEES.filter((e) => schedule[e.id][day.id] === "O30").length;
              const projected = schedule[emp.id][day.id] === "O30" ? o30Count : o30Count + 1;
              return projected <= 3;
            });
            if (!canApply) {
              const donors = getOccupants(wi).filter((donor) => {
                if (donor.id === emp.id) return false;
                if (priorityNames.includes(donor.name) && finalIntensiveWeeks[donor.id] <= minimumTarget) return false;
                return finalIntensiveWeeks[donor.id] > finalIntensiveWeeks[emp.id];
              }).sort((a, b) => {
                const aAboveMin = finalIntensiveWeeks[a.id] > minimumTarget;
                const bAboveMin = finalIntensiveWeeks[b.id] > minimumTarget;
                if (aAboveMin && !bAboveMin) return -1;
                if (!aAboveMin && bAboveMin) return 1;
                return finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id];
              });
              for (const donor of donors) {
                weekDays.forEach((day) => {
                  if (schedule[donor.id][day.id] !== "V") schedule[donor.id][day.id] = "O40";
                });
                const canApplyWithDonor = weekDays.every((day) => {
                  const o30Count = EMPLOYEES.filter((e) => schedule[e.id][day.id] === "O30").length;
                  const projected = schedule[emp.id][day.id] === "O30" ? o30Count : o30Count + 1;
                  return projected <= 3;
                });
                if (canApplyWithDonor) {
                  canApply = true;
                  break;
                }
                weekDays.forEach((day) => {
                  schedule[donor.id][day.id] = snapshot[donor.id][day.id];
                });
              }
            }
            if (!canApply) {
              restore();
              continue;
            }

            const coverageOk = preservesOfficeCoverage(emp.id, weekDays, schedule);
            if (!coverageOk && countForcedDays(schedule, days) > MAX_FORCED_OFFICE_DAYS + 3) {
              restore();
              continue;
            }

            weekDays.forEach((day) => {
              schedule[emp.id][day.id] = "O30";
            });
            recalcIntensiveWeeks();
            moved = true;
            break;
          }
          if (moved) break;
        }
      }
    };

    const boostEmployeeIntensiveWeeks = (employeeName, targetWeeks) => {
      const emp = EMPLOYEES.find((item) => item.name === employeeName);
      if (!emp) return;
      const weekIndexes = Object.keys(finalWeeksMap).map((k) => parseInt(k, 10)).sort((a, b) => a - b);
      let guard = 0;
      while ((finalIntensiveWeeks[emp.id] || 0) < targetWeeks && guard < 40) {
        guard += 1;
        let assigned = false;
        for (const wi of weekIndexes) {
          const weekDays = finalWeeksMap[wi];
          if (!weekDays || weekDays.length === 0) continue;
          if (vacWeeksByEmp[emp.id].has(wi)) continue;
          if (!weekDays.every((day) => isIntensivePeriod(day.id, emp.id))) continue;
          if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) continue;
          if (emp.name === "Luis" && forbiddenWeekLuis === wi) continue;
          if (emp.name === "Kike" && weekDays.some((day) => criticalKikeSet.has(day.id))) continue;
          if (weekDays.every((day) => schedule[emp.id][day.id] === "O30")) continue;
          if (weekDays.some((day) => schedule[emp.id][day.id] === "V")) continue;

          const before = {};
          weekDays.forEach((day) => {
            before[day.id] = schedule[emp.id][day.id];
            schedule[emp.id][day.id] = "O30";
          });

          const canApply = weekDays.every((day) => {
            const o30Count = EMPLOYEES.filter((e) => schedule[e.id][day.id] === "O30").length;
            if (o30Count > 3) return false;
            if (day.weekdayLetter === "V") return true;
            return EMPLOYEES.some((e) => e.id !== emp.id && schedule[e.id][day.id] === "O42");
          });
          if (!canApply) {
            weekDays.forEach((day) => {
              schedule[emp.id][day.id] = before[day.id];
            });
            continue;
          }

          recalcIntensiveWeeks();
          assigned = true;
          break;
        }
        if (!assigned) break;
      }
    };

    enforceMinimumAfterCoverage(6);
    improveUnderTargetWithWeekSwaps(6, ["Luis", "Ariel"]);
    boostEmployeeIntensiveWeeks("Luis", 6);
    boostEmployeeIntensiveWeeks("Ariel", 6);
    recalcIntensiveWeeks();
  }

  const strictAudit = enforceStrictWeeklyRules({
    employees: EMPLOYEES,
    days,
    schedule,
    getLateGroupForWeek,
  });

  if (year === 2026) {
    const weeksMap = buildWeeksMap(days);
    const ariel = EMPLOYEES.find((emp) => emp.name === "Ariel");
    const luis = EMPLOYEES.find((emp) => emp.name === "Luis");
    const countWeeksByEmp = (currentSchedule, empId) => {
      let count = 0;
      Object.keys(weeksMap).forEach((wi) => {
        if (weeksMap[wi].every((day) => currentSchedule[empId][day.id] === "O30")) count += 1;
      });
      return count;
    };
    const countWeeksMap = (currentSchedule) => {
      const byEmp = {};
      EMPLOYEES.forEach((emp) => {
        byEmp[emp.id] = countWeeksByEmp(currentSchedule, emp.id);
      });
      return byEmp;
    };
    const allO30InWindow = (currentSchedule) => {
      return days.every((day) => {
        const inWindow = day.id >= "2026-06-15" && day.id <= "2026-09-18";
        const dailyO30 = EMPLOYEES.filter((emp) => currentSchedule[emp.id][day.id] === "O30");
        if (dailyO30.length > 3) return false;
        if (!inWindow && dailyO30.length > 0) return false;
        return true;
      });
    };
    if (ariel && luis) {
      const currentCounts = countWeeksMap(strictAudit.schedule);
      if ((currentCounts[ariel.id] || 0) < 6) {
        const candidateWeeks = Object.keys(weeksMap)
          .map((wi) => parseInt(wi, 10))
          .sort((a, b) => a - b)
          .filter((wi) => {
            const weekDays = weeksMap[wi];
            if (!weekDays || weekDays.length === 0) return false;
            if (!weekDays.every((day) => day.id >= "2026-06-15" && day.id <= "2026-09-18")) return false;
            if (weekDays.some((day) => strictAudit.schedule[ariel.id][day.id] === "V")) return false;
            if (weekDays.every((day) => strictAudit.schedule[ariel.id][day.id] === "O30")) return false;
            return true;
          });
        for (const wi of candidateWeeks) {
          const weekDays = weeksMap[wi];
          const trial = JSON.parse(JSON.stringify(strictAudit.schedule));
          weekDays.forEach((day) => {
            trial[ariel.id][day.id] = "O30";
          });
          const trialCounts = countWeeksMap(trial);
          weekDays.forEach((day) => {
            while (EMPLOYEES.filter((emp) => trial[emp.id][day.id] === "O30").length > 3) {
              const donorCandidates = EMPLOYEES.filter((emp) => {
                if (emp.id === ariel.id) return false;
                if (trial[emp.id][day.id] !== "O30") return false;
                if (emp.id === luis.id && (trialCounts[emp.id] || 0) <= 6) return false;
                return true;
              }).sort((a, b) => (trialCounts[b.id] || 0) - (trialCounts[a.id] || 0));
              const donor = donorCandidates[0];
              if (!donor) break;
              trial[donor.id][day.id] = "O40";
              trialCounts[donor.id] = countWeeksByEmp(trial, donor.id);
            }
          });
          weekDays.filter((day) => day.weekdayLetter !== "V").forEach((day) => {
            const hasOfficeO42 = EMPLOYEES.some((emp) => {
              if (trial[emp.id][day.id] !== "O42") return false;
              const officeDays = emp.officeDays.split(",").map((d) => d.trim());
              return officeDays.includes(day.weekdayLetter);
            });
            if (hasOfficeO42) return;
            const candidates = EMPLOYEES.filter((emp) => {
              if (emp.id === ariel.id) return false;
              if (trial[emp.id][day.id] === "V") return false;
              const officeDays = emp.officeDays.split(",").map((d) => d.trim());
              return officeDays.includes(day.weekdayLetter);
            }).sort((a, b) => {
              const aType = trial[a.id][day.id];
              const bType = trial[b.id][day.id];
              if (aType === "O40" && bType !== "O40") return -1;
              if (bType === "O40" && aType !== "O40") return 1;
              return (trialCounts[b.id] || 0) - (trialCounts[a.id] || 0);
            });
            const pick = candidates[0];
            if (pick) {
              weekDays.forEach((weekDay) => {
                if (trial[pick.id][weekDay.id] !== "V") trial[pick.id][weekDay.id] = "O42";
              });
              trialCounts[pick.id] = countWeeksByEmp(trial, pick.id);
            }
          });
          const normalized = enforceStrictWeeklyRules({
            employees: EMPLOYEES,
            days,
            schedule: trial,
            getLateGroupForWeek,
          });
          const normalizedCounts = countWeeksMap(normalized.schedule);
          const validation = validateStrictWeeklyRules({
            employees: EMPLOYEES,
            days,
            schedule: normalized.schedule,
          });
          const noOneBelowFive = EMPLOYEES.every((emp) => (normalizedCounts[emp.id] || 0) >= 5);
          if (!validation.ok) continue;
          if (!allO30InWindow(normalized.schedule)) continue;
          if (!noOneBelowFive) continue;
          if ((normalizedCounts[ariel.id] || 0) < 6) continue;
          if ((normalizedCounts[luis.id] || 0) < 6) continue;
          strictAudit.schedule = normalized.schedule;
          strictAudit.violations = validation.violations;
          strictAudit.summary = validation.summary;
          break;
        }
      }
    }
  }

  const ensureLuisSixWeeks = (sched) => {
    const luis = EMPLOYEES.find(e => e.name === "Luis");
    if (!luis) return sched;
    const weeksMapLocal = buildWeeksMap(days);
    const countWeeks = (s, empId) => {
      let count = 0;
      Object.keys(weeksMapLocal).forEach(wi => {
        const weekDays = weeksMapLocal[wi];
        if (weekDays.every(day => s[empId][day.id] === "O30")) count++;
      });
      return count;
    };
    const currentLuisWeeks = countWeeks(sched, luis.id);
    if (currentLuisWeeks >= 6) return sched;
    
    const intensiveCountsLocal = {};
    EMPLOYEES.forEach(emp => {
      intensiveCountsLocal[emp.id] = countWeeks(sched, emp.id);
    });
    
    let improved = true;
    let safety = 0;
    while (improved && safety < 100 && intensiveCountsLocal[luis.id] < 6) {
      improved = false;
      safety++;
      const donors = [...EMPLOYEES]
        .filter(emp => emp.id !== luis.id && intensiveCountsLocal[emp.id] > 6)
        .sort((a, b) => intensiveCountsLocal[b.id] - intensiveCountsLocal[a.id]);
      
      if (donors.length === 0) {
        break;
      }
      
      const donor = donors[0];
      const donorWeeks = [];
      Object.keys(weeksMapLocal).forEach(wi => {
        const weekDays = weeksMapLocal[wi];
        if (weekDays.every(day => sched[donor.id][day.id] === "O30")) {
          donorWeeks.push({ wi: parseInt(wi), days: weekDays });
        }
      });
      
      if (donorWeeks.length === 0) break;
      
      for (const { wi, days: weekDays } of donorWeeks) {
        if (intensiveCountsLocal[luis.id] >= 6) break;
        if (intensiveCountsLocal[donor.id] <= 6) break;
        
        const hasO42InOffice = weekDays.some(day => {
          if (day.weekdayLetter === "V") return false;
          return EMPLOYEES.some(emp => {
            if (sched[emp.id][day.id] !== "O42") return false;
            const officeDays = emp.officeDays.split(",").map(d => d.trim());
            return officeDays.includes(day.weekdayLetter);
          });
        });
        if (!hasO42InOffice) {
          continue;
        }
        
        sched[luis.id][weekDays[0].id] = "O30";
        intensiveCountsLocal[luis.id]++;
        intensiveCountsLocal[donor.id]--;
        sched[donor.id][weekDays[0].id] = "O40";
        improved = true;
      }
    }
    return sched;
  };
  
  const weeksMapFinal = buildWeeksMap(days);
  const calcIntensiveWeeksFinal = (sched) => {
    const counts = {};
    EMPLOYEES.forEach(emp => {
      let count = 0;
      Object.keys(weeksMapFinal).forEach(wi => {
        const weekDays = weeksMapFinal[wi];
        if (weekDays.every(day => sched[emp.id][day.id] === "O30")) count++;
      });
      counts[emp.id] = count;
    });
    return counts;
  };
  const intensiveCountsFinal = calcIntensiveWeeksFinal(strictAudit.schedule);
  const sortByLateGroupPriority = (lateGroupMembers, countsMap) => (a, b) => {
    const aInLateGroup = lateGroupMembers.includes(a.name);
    const bInLateGroup = lateGroupMembers.includes(b.name);
    if (aInLateGroup && !bInLateGroup) return -1;
    if (!aInLateGroup && bInLateGroup) return 1;
    const aAboveTarget = (countsMap[a.id] || 0) > 6;
    const bAboveTarget = (countsMap[b.id] || 0) > 6;
    if (aAboveTarget && !bAboveTarget) return -1;
    if (!aAboveTarget && bAboveTarget) return 1;
    return a.id - b.id;
  };
  const fillMissingScheduleEntries = (currentSchedule) => {
    Object.values(weeksMapFinal).forEach((weekDays) => {
      EMPLOYEES.forEach((employee) => {
        const existingTypes = weekDays.map((day) => currentSchedule[employee.id][day.id]).filter(Boolean);
        if (existingTypes.length === weekDays.length) return;
        const nonVacationTypes = existingTypes.filter((type) => type !== "V");
        const fallbackType =
          nonVacationTypes[0] ||
          pickRegularWeekType({
            employee,
            weekIndex: weekDays[0].weekIndex,
            weekDays,
            schedule: currentSchedule,
            getLateGroupForWeek,
          });
        weekDays.forEach((day) => {
          if (!currentSchedule[employee.id][day.id]) {
            currentSchedule[employee.id][day.id] = fallbackType;
          }
        });
      });
    });
  };
  const hasAlternativeOfficeO42 = (currentSchedule, day, employeeId) =>
    EMPLOYEES.some((employee) => {
      if (employee.id === employeeId) return false;
      if (currentSchedule[employee.id][day.id] !== "O42") return false;
      const officeDays = employee.officeDays.split(",").map((d) => d.trim());
      return officeDays.includes(day.weekdayLetter);
    });
  const restoreProtectedIntensiveWeeks = (currentSchedule, employeeNames, minimumTarget) => {
    let changed = true;
    let safety = 0;
    while (changed && safety < 60) {
      changed = false;
      safety += 1;
      const counts = calcIntensiveWeeksFinal(currentSchedule);
      for (const employeeName of employeeNames) {
        const employee = EMPLOYEES.find((item) => item.name === employeeName);
        if (!employee || (counts[employee.id] || 0) >= minimumTarget) continue;
        const weekIndexes = Object.keys(weeksMapFinal).map((key) => parseInt(key, 10)).sort((a, b) => a - b);
        for (const weekIndex of weekIndexes) {
          const weekDays = weeksMapFinal[weekIndex];
          if (!weekDays.every((day) => isIntensivePeriod(day.id, employee.id))) continue;
          if (weekDays.some((day) => currentSchedule[employee.id][day.id] === "V")) continue;
          if (weekDays.every((day) => currentSchedule[employee.id][day.id] === "O30")) continue;
          const canAssignWeek = weekDays.every((day) => {
            const currentType = currentSchedule[employee.id][day.id];
            const currentO30 = EMPLOYEES.filter((item) => currentSchedule[item.id][day.id] === "O30").length;
            const projectedO30 = currentType === "O30" ? currentO30 : currentO30 + 1;
            if (projectedO30 > 3) return false;
            if (day.weekdayLetter === "V") return true;
            return hasAlternativeOfficeO42(currentSchedule, day, employee.id);
          });
          if (!canAssignWeek) continue;
          weekDays.forEach((day) => {
            currentSchedule[employee.id][day.id] = "O30";
          });
          changed = true;
          break;
        }
      }
    }
  };

  fillMissingScheduleEntries(strictAudit.schedule);

  days.forEach((day) => {
    if (day.weekdayLetter === "V") return;
    const currentO42Count = EMPLOYEES.filter((emp) => strictAudit.schedule[emp.id][day.id] === "O42").length;
    if (currentO42Count >= 3) return;
    
    const hasO42InOffice = EMPLOYEES.some((emp) => {
      if (strictAudit.schedule[emp.id][day.id] !== "O42") return false;
      const officeDays = emp.officeDays.split(",").map((d) => d.trim());
      return officeDays.includes(day.weekdayLetter);
    });
    if (!hasO42InOffice) {
      const lateGroup = getLateGroupForWeek(day.weekIndex);
      const lateGroupMembers = getShiftGroupMemberNames(lateGroup);
      
      const o40Candidates = EMPLOYEES.filter((emp) => {
        if (strictAudit.schedule[emp.id][day.id] !== "O40") return false;
        const officeDays = emp.officeDays.split(",").map((d) => d.trim());
        return officeDays.includes(day.weekdayLetter);
      }).sort((a, b) => {
        const aInLateGroup = lateGroupMembers.includes(a.name);
        const bInLateGroup = lateGroupMembers.includes(b.name);
        if (aInLateGroup && !bInLateGroup) return -1;
        if (!aInLateGroup && bInLateGroup) return 1;
        return a.id - b.id;
      });
      
      if (o40Candidates.length > 0) {
        const pick = o40Candidates[0];
        strictAudit.schedule[pick.id][day.id] = "O42";
      } else if (currentO42Count < 3) {
        const priorityEmployees = ["Luis", "Ariel"];
        const sortCandidates = sortByLateGroupPriority(lateGroupMembers, intensiveCountsFinal);
        const o30Candidates = EMPLOYEES.filter((emp) => {
          if (strictAudit.schedule[emp.id][day.id] !== "O30") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          if (!officeDays.includes(day.weekdayLetter)) return false;
          if (priorityEmployees.includes(emp.name) && (intensiveCountsFinal[emp.id] || 0) <= 6) return false;
          return true;
        }).sort(sortCandidates);
        const fallbackO30Candidates = EMPLOYEES.filter((emp) => {
          if (strictAudit.schedule[emp.id][day.id] !== "O30") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          return officeDays.includes(day.weekdayLetter);
        }).sort(sortCandidates);
        const pick = o30Candidates[0] || fallbackO30Candidates[0];
        if (pick) {
          intensiveCountsFinal[pick.id] = Math.max(0, (intensiveCountsFinal[pick.id] || 0) - 1);
          strictAudit.schedule[pick.id][day.id] = "O42";
        }
      }
    }
  });

  restoreProtectedIntensiveWeeks(strictAudit.schedule, ["Luis", "Ariel"], 6);

  const finalEnforce = enforceStrictWeeklyRules({
    employees: EMPLOYEES,
    days,
    schedule: strictAudit.schedule,
    getLateGroupForWeek,
  });
  strictAudit.schedule = finalEnforce.schedule;

  return {
    schedule: strictAudit.schedule,
    days,
    strictAudit: {
      violations: strictAudit.violations,
      corrections: strictAudit.corrections,
      summary: strictAudit.summary,
    },
  };
};

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "Sistemas" && password === "Inicio2026") {
      onLogin();
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src="logo.png" alt="Logo" className="w-48 mx-auto object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Acceso Restringido</h2>
          <p className="text-gray-500 mt-2">Introduce tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-black font-semibold"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-black font-semibold"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              ""
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-brand-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-blue/20 transform transition-all active:scale-[0.98]"
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Dept. Sistemas &copy; 2026
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES PARA HOJAS EXCEL
// ═══════════════════════════════════════════════════════════

const buildResumenMensualSheet = ({ employees, days, schedule }) => {
  const months = [];
  const monthSet = new Set();
  days.forEach(d => { if (!monthSet.has(d.month)) { monthSet.add(d.month); months.push(d.month); } });
  const types = ["O30", "O40", "O42", "V"];
  const typeLabels = { O30: "30h", O40: "40h", O42: "42h", V: "VAC" };
  const hoursPerType = { O30: 6, O40: 8, O42: 9, V: 0 };

  const row0 = ["Integrante", "Rol", "Grupo"];
  const row1 = ["", "", ""];
  months.forEach(m => {
    types.forEach(t => { row0.push(m.substring(0, 3)); row1.push(typeLabels[t]); });
    row0.push(m.substring(0, 3)); row1.push("Horas");
  });
  row0.push("TOTAL"); row1.push("Horas");
  row0.push("Días O30"); row1.push("");
  row0.push("Sem. Intens."); row1.push("");

  const aoa = [row0, row1];
  employees.forEach(emp => {
    const row = [emp.name, emp.role, `Grupo ${emp.group}`];
    let totalHours = 0;
    let totalO30 = 0;
    months.forEach(m => {
      const mDays = days.filter(d => d.month === m);
      const cnt = { O30: 0, O40: 0, O42: 0, V: 0 };
      mDays.forEach(day => { const t = schedule[emp.id][day.id]; if (cnt[t] !== undefined) cnt[t]++; });
      types.forEach(t => row.push(cnt[t]));
      const mHours = types.reduce((s, t) => s + cnt[t] * hoursPerType[t], 0);
      row.push(mHours);
      totalHours += mHours;
      totalO30 += cnt.O30;
    });
    row.push(totalHours);
    row.push(totalO30);
    // Intensive weeks count
    const weeksMap = {};
    days.forEach(d => { weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || []; weeksMap[d.weekIndex].push(d); });
    let intensiveWeeks = 0;
    Object.values(weeksMap).forEach(wDays => {
      if (wDays.every(d => schedule[emp.id][d.id] === "O30")) intensiveWeeks++;
    });
    row.push(intensiveWeeks);
    aoa.push(row);
  });
  return aoa;
};

const buildVistaSemanasSheet = ({ employees, days, schedule }) => {
  const weeksMap = {};
  days.forEach(d => { weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || []; weeksMap[d.weekIndex].push(d); });
  const weekIdxs = Object.keys(weeksMap).map(k => parseInt(k, 10)).sort((a, b) => a - b);
  const headers = ["Semana", "Período", "Mes", "Integrante", "Rol", "Grupo", "Tipo semana", "Días O30", "Días O40", "Días O42", "Días VAC", "Horas semana"];
  const aoa = [headers];
  weekIdxs.forEach(wi => {
    const wDays = weeksMap[wi];
    const start = wDays[0]; const end = wDays[wDays.length - 1];
    const period = `${start.label} – ${end.label}`;
    const month = wDays[Math.floor(wDays.length / 2)].month;
    employees.forEach(emp => {
      const cnt = { O30: 0, O40: 0, O42: 0, V: 0 };
      wDays.forEach(day => { const t = schedule[emp.id][day.id]; if (cnt[t] !== undefined) cnt[t]++; });
      const nonVac = { O30: cnt.O30, O40: cnt.O40, O42: cnt.O42 };
      const dominant = Object.entries(nonVac).sort((a, b) => b[1] - a[1])[0][0];
      const hours = cnt.O30 * 6 + cnt.O40 * 8 + cnt.O42 * 9;
      aoa.push([`Semana ${wi + 1}`, period, month, emp.name, emp.role, `Grupo ${emp.group}`, dominant, cnt.O30, cnt.O40, cnt.O42, cnt.V, hours]);
    });
    aoa.push([]);
  });
  return aoa;
};

const buildEstadisticasSheet = ({ employees, days, schedule, forcedOfficeDetails, intensiveWeeksByEmp, totalHoursByEmp }) => {
  const forcedByEmp = {};
  employees.forEach(e => { forcedByEmp[e.id] = 0; });
  forcedOfficeDetails.forEach(item => { forcedByEmp[item.empId] = (forcedByEmp[item.empId] || 0) + 1; });
  const weeksMap = {};
  days.forEach(d => { weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || []; weeksMap[d.weekIndex].push(d); });
  const headers = ["Integrante", "Rol", "Grupo", "Días en periodo", "Días O30", "Días O40", "Días O42", "Días VAC", "Sem. Intensivas", "Obj. mín. (6 sem)", "Horas Totales", "Media H/Día lab.", "Días Forzados Oficina"];
  const aoa = [headers];
  employees.forEach(emp => {
    const o30 = days.filter(d => schedule[emp.id][d.id] === "O30").length;
    const o40 = days.filter(d => schedule[emp.id][d.id] === "O40").length;
    const o42 = days.filter(d => schedule[emp.id][d.id] === "O42").length;
    const vac = days.filter(d => schedule[emp.id][d.id] === "V").length;
    const tot = totalHoursByEmp[emp.id] || 0;
    const workDays = o30 + o40 + o42;
    const avg = workDays > 0 ? Math.round((tot / workDays) * 10) / 10 : 0;
    const intensSem = intensiveWeeksByEmp[emp.id] || 0;
    const meetsMin = intensSem >= 6 ? "SÍ ✓" : `NO (faltan ${6 - intensSem})`;
    aoa.push([emp.name, emp.role, `Grupo ${emp.group}`, days.length, o30, o40, o42, vac, intensSem, meetsMin, tot, avg, forcedByEmp[emp.id]]);
  });
  // Summary row
  aoa.push([]);
  aoa.push(["TOTALES", "", "", "",
    employees.reduce((s, e) => s + days.filter(d => schedule[e.id][d.id] === "O30").length, 0),
    employees.reduce((s, e) => s + days.filter(d => schedule[e.id][d.id] === "O40").length, 0),
    employees.reduce((s, e) => s + days.filter(d => schedule[e.id][d.id] === "O42").length, 0),
    employees.reduce((s, e) => s + days.filter(d => schedule[e.id][d.id] === "V").length, 0),
    "", "",
    employees.reduce((s, e) => s + (totalHoursByEmp[e.id] || 0), 0),
    "",
    forcedOfficeDetails.length,
  ]);
  return aoa;
};

const buildVacacionesSheet = ({ employees, days, schedule }) => {
  const headers = ["Integrante", "Rol", "Fecha", "Día semana", "Mes", "Num. semana"];
  const aoa = [headers];
  const vacList = [];
  employees.forEach(emp => {
    days.forEach(day => { if (schedule[emp.id][day.id] === "V") vacList.push({ emp, day }); });
  });
  vacList.sort((a, b) => a.day.id.localeCompare(b.day.id) || a.emp.id - b.emp.id);
  vacList.forEach(({ emp, day }) => {
    aoa.push([emp.name, emp.role, day.id, WEEKDAY_FULL[day.weekdayLetter] || day.weekdayLetter, day.month, `Semana ${day.weekIndex + 1}`]);
  });
  aoa.push([]);
  aoa.push([`Total días de vacaciones: ${vacList.length}`]);
  // Summary per employee
  aoa.push([]);
  aoa.push(["Resumen por integrante"]);
  aoa.push(["Integrante", "Total días VAC"]);
  employees.forEach(emp => {
    const cnt = days.filter(d => schedule[emp.id][d.id] === "V").length;
    aoa.push([emp.name, cnt]);
  });
  return aoa;
};

const buildAlertasSheet = ({ alerts, days, employees, schedule }) => {
  const headers = ["Fecha", "Día semana", "Mes", "Semana", "Severidad", "Categoría", "Título alerta", "Detalle", "Contexto adicional", "Disponibles"];
  const aoa = [headers];
  if (alerts.length === 0) {
    aoa.push(["Sin alertas", "", "", "", "", "", "La planificación no presenta conflictos."]);
    return aoa;
  }
  alerts.forEach(alert => {
    const day = days.find(d => d.id === alert.dayId);
    if (!day) return;
    alert.reasons.forEach(reason => {
      const sev = reason.severity === "critical" ? "CRÍTICO" : reason.severity === "warning" ? "AVISO" : "INFO";
      aoa.push([day.id, WEEKDAY_FULL[day.weekdayLetter] || day.weekdayLetter, day.month, `Semana ${day.weekIndex + 1}`, sev, reason.category || "", reason.title, reason.detail, reason.context || "", alert.present]);
    });
  });
  aoa.push([]);
  aoa.push([`Total alertas: ${alerts.reduce((s, a) => s + a.reasons.length, 0)}`]);
  return aoa;
};

const buildDatosGraficosSheet = ({ employees, days, schedule, intensiveWeeksByEmp, forcedOfficeDetails, dailyCoverage }) => {
  const months = [];
  const monthSet = new Set();
  days.forEach(d => { if (!monthSet.has(d.month)) { monthSet.add(d.month); months.push(d.month); } });
  const weeksMap = {};
  days.forEach(d => { weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || []; weeksMap[d.weekIndex].push(d); });
  const weekIdxs = Object.keys(weeksMap).map(k => parseInt(k, 10)).sort((a, b) => a - b);
  const weekToMonth = {};
  Object.keys(weeksMap).forEach(wi => {
    const cnt = {};
    weeksMap[wi].forEach(d => { cnt[d.month] = (cnt[d.month] || 0) + 1; });
    weekToMonth[wi] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
  });
  const forcedByEmp = {};
  employees.forEach(e => { forcedByEmp[e.id] = 0; });
  forcedOfficeDetails.forEach(item => { forcedByEmp[item.empId] = (forcedByEmp[item.empId] || 0) + 1; });

  const aoa = [];

  // ── Tabla 1: Semanas intensivas por mes e integrante ──────────────
  aoa.push(["TABLA 1 — Semanas con jornada intensiva (O30 completa) por integrante y mes"]);
  aoa.push(["Gráfico sugerido: Barras agrupadas — columnas=meses, series=integrante"]);
  aoa.push([]);
  aoa.push(["Integrante", "Rol", ...months.map(m => m.substring(0, 3)), "Total", "Días forzados oficina"]);
  employees.forEach(emp => {
    const byMonth = {};
    months.forEach(m => { byMonth[m] = 0; });
    weekIdxs.forEach(wi => {
      const wDays = weeksMap[wi];
      if (wDays.every(d => schedule[emp.id][d.id] === "O30")) {
        const m = weekToMonth[wi];
        if (byMonth[m] !== undefined) byMonth[m]++;
      }
    });
    const total = months.reduce((s, m) => s + byMonth[m], 0);
    aoa.push([emp.name, emp.role, ...months.map(m => byMonth[m]), total, forcedByEmp[emp.id]]);
  });

  aoa.push([]); aoa.push([]);

  // ── Tabla 2: Horas totales y distribución por tipo ───────────────
  aoa.push(["TABLA 2 — Horas totales trabajadas por integrante en el periodo"]);
  aoa.push(["Gráfico sugerido: Barras horizontales apiladas por tipo de jornada"]);
  aoa.push([]);
  aoa.push(["Integrante", "Rol", "Grupo", "H. O30", "H. O40", "H. O42", "Horas Totales", "Días O30", "Días O40", "Días O42", "Días VAC"]);
  employees.forEach(emp => {
    const o30 = days.filter(d => schedule[emp.id][d.id] === "O30").length;
    const o40 = days.filter(d => schedule[emp.id][d.id] === "O40").length;
    const o42 = days.filter(d => schedule[emp.id][d.id] === "O42").length;
    const vac = days.filter(d => schedule[emp.id][d.id] === "V").length;
    aoa.push([emp.name, emp.role, `Grupo ${emp.group}`, o30 * 6, o40 * 8, o42 * 9, o30 * 6 + o40 * 8 + o42 * 9, o30, o40, o42, vac]);
  });

  aoa.push([]); aoa.push([]);

  // ── Tabla 3: Distribución de tipos por semana ────────────────────
  aoa.push(["TABLA 3 — Distribución de tipos de jornada por semana (total días-persona)"]);
  aoa.push(["Gráfico sugerido: Barras apiladas al 100% — eje X= semanas"]);
  aoa.push([]);
  aoa.push(["Semana", "Período", "Mes", "Días O30", "Días O40", "Días O42", "Días VAC", "% Intensiva", "% 40h", "% 42h", "% VAC"]);
  weekIdxs.forEach(wi => {
    const wDays = weeksMap[wi];
    const start = wDays[0]; const end = wDays[wDays.length - 1];
    let o30 = 0, o40 = 0, o42 = 0, vac = 0;
    employees.forEach(emp => {
      wDays.forEach(day => {
        const t = schedule[emp.id][day.id];
        if (t === "O30") o30++; else if (t === "O40") o40++; else if (t === "O42") o42++; else if (t === "V") vac++;
      });
    });
    const total = o30 + o40 + o42 + vac;
    const pct = v => total > 0 ? Math.round(v / total * 100) : 0;
    aoa.push([`Sem. ${wi + 1}`, `${start.label} – ${end.label}`, weekToMonth[wi], o30, o40, o42, vac, pct(o30), pct(o40), pct(o42), pct(vac)]);
  });

  aoa.push([]); aoa.push([]);

  // ── Tabla 4: Presencia diaria ────────────────────────────────────
  aoa.push(["TABLA 4 — Presencia diaria de integrantes"]);
  aoa.push(["Gráfico sugerido: Gráfico de líneas — eje X=fechas, eje Y=personas disponibles"]);
  aoa.push([]);
  aoa.push(["Fecha", "Día", "Mes", "Semana", "Disponibles (no VAC)", "De vacaciones", "Con O30", "Con O40", "Con O42"]);
  dailyCoverage.forEach(cov => {
    const day = days.find(d => d.id === cov.dayId);
    if (!day) return;
    const o30c = employees.filter(e => schedule[e.id][cov.dayId] === "O30").length;
    const o40c = employees.filter(e => schedule[e.id][cov.dayId] === "O40").length;
    const o42c = employees.filter(e => schedule[e.id][cov.dayId] === "O42").length;
    aoa.push([day.id, WEEKDAY_FULL[day.weekdayLetter], day.month, `Sem. ${day.weekIndex + 1}`, cov.present, employees.length - cov.present, o30c, o40c, o42c]);
  });

  aoa.push([]); aoa.push([]);
  aoa.push(["─── INSTRUCCIONES PARA CREAR GRÁFICOS EN EXCEL ───"]);
  aoa.push(["TABLA 1 → Seleccionar el rango de datos → Insertar → Gráfico de Columnas Agrupadas"]);
  aoa.push(["         Eje horizontal: Meses de verano, Series: un integrante por serie"]);
  aoa.push(["TABLA 2 → Seleccionar Integrante + H.O30 + H.O40 + H.O42 → Insertar → Barras apiladas"]);
  aoa.push(["TABLA 3 → Seleccionar Semana + columnas % → Insertar → Barras apiladas al 100%"]);
  aoa.push(["TABLA 4 → Seleccionar Fecha + Disponibles → Insertar → Gráfico de Líneas"]);

  return aoa;
};

const IconHome = ({ className = "" }) => (
  ""
);

const IconOffice = ({ className = "" }) => (
  ""
);

const buildChartDataRows = ({ employees, intensiveWeeksByEmp, forcedOfficeDetails }) => {
  const forcedDaysByEmp = {};
  employees.forEach((emp) => {
    forcedDaysByEmp[emp.id] = 0;
  });
  if (forcedOfficeDetails) {
    forcedOfficeDetails.forEach((item) => {
      forcedDaysByEmp[item.empId] = (forcedDaysByEmp[item.empId] || 0) + 1;
    });
  }

  const rows = [["Integrante", "Semanas intensivas", "Días forzados"]];
  employees.forEach((emp) => {
    rows.push([
      emp.name,
      intensiveWeeksByEmp[emp.id] || 0,
      forcedDaysByEmp[emp.id] || 0
    ]);
  });
  return rows;
};


const plan = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);
const counts = {};
EMPLOYEES.forEach(emp => {
    let count = 0;
    const weeks = [...new Set(plan.days.map(d => d.weekIndex))];
    weeks.forEach(wi => {
        const daysInWeek = plan.days.filter(d => d.weekIndex === wi);
        if (daysInWeek.every(d => plan.schedule[emp.id][d.id] === "O30")) count++;
    });
    counts[emp.name] = count;
});
console.log(counts);
