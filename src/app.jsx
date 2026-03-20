/* global React, ReactDOM */
/* eslint-disable no-undef */const { useState, useMemo, useEffect } = React;
/* eslint-enable no-undef */

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

const buildWeeksMap = (days) => {
  const weeksMap = {};
  days.forEach((day) => {
    weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || [];
    weeksMap[day.weekIndex].push(day);
  });
  return weeksMap;
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
  return employee.group === lateGroup ? "O42" : "O40";
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

const buildChartDataRows = ({ employees, intensiveWeeksByEmp, forcedOfficeDetails }) => {
  const forcedByEmp = {};
  employees.forEach((emp) => {
    forcedByEmp[emp.id] = 0;
  });
  forcedOfficeDetails.forEach((item) => {
    forcedByEmp[item.empId] = (forcedByEmp[item.empId] || 0) + 1;
  });
  const rows = [["Integrante", "Semanas intensivas", "Días forzados"]];
  employees.forEach((emp) => {
    rows.push([emp.name, intensiveWeeksByEmp[emp.id] || 0, forcedByEmp[emp.id] || 0]);
  });
  return rows;
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

    let reserve = null;
    if (nonLateHasVacation) {
      const reserveCandidates = nonLate
        .filter((emp) => !vacWeeksByEmp[emp.id].has(wi))
        .sort((a, b) => {
          const diff = intensiveWeeksByEmp[b.id] - intensiveWeeksByEmp[a.id];
          return diff !== 0 ? diff : a.id - b.id;
        });
      reserve = reserveCandidates[0] || null;
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
        const isGroupA = emp.group === "A";
        const isTurnoTarde = SHIFT_BASE_A_18H
          ? isGroupA
            ? wi % 2 === 0
            : wi % 2 !== 0
          : isGroupA
            ? wi % 2 !== 0
            : wi % 2 === 0;
        if (!isTurnoTarde) {
          schedule[emp.id][day.id] = "O40";
        } else {
          schedule[emp.id][day.id] = "O42";
        }
      });
    });

    weekDays.forEach((day) => {
      if (day.weekdayLetter === "V") return;
      const hasO42 = EMPLOYEES.some((emp) => schedule[emp.id][day.id] === "O42");
      if (!hasO42) {
        const lateCandidates = EMPLOYEES.filter((emp) => {
          const current = schedule[emp.id][day.id];
          if (current === "V") return false;
          return emp.group === lateGroup;
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

      if (!hasO42InOffice) {
        const candidates = EMPLOYEES.filter((emp) => {
          if (schedule[emp.id][day.id] === "V") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          return officeDays.includes(day.weekdayLetter);
        }).sort((a, b) => {
          const aIsO30 = schedule[a.id][day.id] === "O30";
          const bIsO30 = schedule[b.id][day.id] === "O30";
          if (aIsO30 && !bIsO30) return 1;
          if (!aIsO30 && bIsO30) return -1;

          const aInLateGroup = a.group === lateGroup;
          const bInLateGroup = b.group === lateGroup;
          if (aInLateGroup && !bInLateGroup) return -1;
          if (!aInLateGroup && bInLateGroup) return 1;
          const typeA = schedule[a.id][day.id];
          const typeB = schedule[b.id][day.id];
          if (typeA === "O40" && typeB !== "O40") return -1;
          if (typeB === "O40" && typeA !== "O40") return 1;
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
          // Restore O42 using the correct group for the week
          const lateGroup = getLateGroupForWeek(day.weekIndex);
          
          const candidates = EMPLOYEES.filter(
              (emp) => emp.group === lateGroup && schedule[emp.id][day.id] !== "V"
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
        const candidates = EMPLOYEES.filter((emp) => {
          if (schedule[emp.id][day.id] === "V") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          return officeDays.includes(day.weekdayLetter);
        }).sort((a, b) => {
          const aNeedsIntensive = schedule[a.id][day.id] === "O30" && finalIntensiveWeeks[a.id] <= 6;
          const bNeedsIntensive = schedule[b.id][day.id] === "O30" && finalIntensiveWeeks[b.id] <= 6;
          if (aNeedsIntensive && !bNeedsIntensive) return 1;
          if (!aNeedsIntensive && bNeedsIntensive) return -1;

          const aInLateGroup = a.group === lateGroup;
          const bInLateGroup = b.group === lateGroup;
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
    const hasOfficeO42Coverage = (currentSchedule) => {
      return days.filter((day) => day.weekdayLetter !== "V").every((day) => {
        return EMPLOYEES.some((emp) => {
          if (currentSchedule[emp.id][day.id] !== "O42") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          return officeDays.includes(day.weekdayLetter);
        });
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
          strictAudit.schedule = normalized.schedule;
          strictAudit.violations = validation.violations;
          strictAudit.summary = validation.summary;
          break;
        }
      }
    }
  }

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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const IconOffice = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
  </svg>
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return window.localStorage.getItem("horarios_auth_v2026") === "true";
  });
  const handleLogin = () => {
    setIsLoggedIn(true);
    window.localStorage.setItem("horarios_auth_v2026", "true");
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    window.localStorage.removeItem("horarios_auth_v2026");
  };

  const [year, setYear] = useState(2026);
  const [vacationPlan, setVacationPlan] = useState(DEFAULT_VACATION_PLAN_2026);
  const [planning, setPlanning] = useState(() => generateSchedule(2026, DEFAULT_VACATION_PLAN_2026));
  const [selectedEmp, setSelectedEmp] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [tableDensity, setTableDensity] = useState("comfortable");
  const [hoveredEmpId, setHoveredEmpId] = useState(null);
  const [hoveredDayId, setHoveredDayId] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, emp: null, day: null, typeKey: null });
  const [oListOpen, setOListOpen] = useState(false);
  const [selectedAlertDayId, setSelectedAlertDayId] = useState(null);
  const [mode, setMode] = useState("config");
  const [acceptedDashboards, setAcceptedDashboards] = useState(() => {
    try {
      const stored = window.localStorage.getItem("horarios_dashboards");
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });
  const [activeDashboardYear, setActiveDashboardYear] = useState(null);
  const [selectedVacationEmpName, setSelectedVacationEmpName] = useState(EMPLOYEES[0].name);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [exportStylePreset, setExportStylePreset] = useState("corporativo");
  const [exportIncludeFormulas, setExportIncludeFormulas] = useState(true);
  const [exportIncludeChartData, setExportIncludeChartData] = useState(true);
  const [exportProtectSheet, setExportProtectSheet] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportInProgress, setExportInProgress] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportLogs, setExportLogs] = useState([]);
  const [exportPanelExpanded, setExportPanelExpanded] = useState(false);
  const [vacationSectionOpen, setVacationSectionOpen] = useState(false);
  const [viewMode, setViewMode] = useState("matrix");
  const [vacationCalendarExpanded, setVacationCalendarExpanded] = useState(false);

   useEffect(() => {
     try {
       window.localStorage.setItem("horarios_dashboards", JSON.stringify(acceptedDashboards));
     } catch (error) {
       console.error('Failed to save to localStorage:', error);
     }
   }, [acceptedDashboards]);

  const savedYears = useMemo(
    () =>
      Object.keys(acceptedDashboards)
        .map((y) => parseInt(y, 10))
        .filter((y) => !isNaN(y))
        .sort((a, b) => a - b),
    [acceptedDashboards]
  );

  const currentDashboard =
    mode === "dashboard" && activeDashboardYear && acceptedDashboards[activeDashboardYear]
      ? acceptedDashboards[activeDashboardYear]
      : null;

  const schedule = currentDashboard ? currentDashboard.schedule : planning.schedule;
  const days = currentDashboard ? currentDashboard.days : planning.days;
  const strictAudit = currentDashboard ? currentDashboard.strictAudit : planning.strictAudit;
  const currentYear = currentDashboard ? activeDashboardYear : year;

  const daysByMonth = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      map[d.month] = map[d.month] || [];
      map[d.month].push(d);
    });
    return Object.entries(map);
  }, [days]);

  const handleYearChange = (value) => {
    const nextYear = parseInt(value, 10);
    if (isNaN(nextYear)) return;
    let basePlan;
    if (nextYear === 2026) {
      basePlan = DEFAULT_VACATION_PLAN_2026;
    } else if (acceptedDashboards[nextYear]) {
      basePlan = acceptedDashboards[nextYear].vacationPlan || {};
    } else {
      basePlan = createEmptyVacationPlan();
    }
    const nextPlan = {};
    EMPLOYEES.forEach((emp) => {
      nextPlan[emp.name] = [...(basePlan[emp.name] || [])];
    });
    setYear(nextYear);
    setVacationPlan(nextPlan);
    setPlanning(generateSchedule(nextYear, nextPlan));
    setMode("config");
  };

  const toggleVacationDay = (empName, dayId) => {
    const current = vacationPlan;
    const next = {};
    EMPLOYEES.forEach((emp) => {
      const list = current[emp.name] || [];
      if (emp.name === empName) {
        if (list.includes(dayId)) {
          next[emp.name] = list.filter((id) => id !== dayId);
        } else {
          next[emp.name] = [...list, dayId].sort();
        }
      } else {
        next[emp.name] = [...list];
      }
    });
    setVacationPlan(next);
    setPlanning(generateSchedule(year, next));
  };

  const handleAcceptCalendar = () => {
    const generated = generateSchedule(year, vacationPlan);
    const snapshotVacationPlan = {};
    EMPLOYEES.forEach((emp) => {
      snapshotVacationPlan[emp.name] = [...(vacationPlan[emp.name] || [])];
    });
    const entry = {
      year,
      schedule: generated.schedule,
      days: generated.days,
      strictAudit: generated.strictAudit,
      vacationPlan: snapshotVacationPlan,
    };
    setAcceptedDashboards((prev) => {
      const next = { ...prev, [year]: entry };
      return next;
    });
    setActiveDashboardYear(year);
    setMode("dashboard");
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === "dashboard") {
      if (!savedYears.length) return;
      const initialYear = activeDashboardYear || savedYears[0];
      setActiveDashboardYear(initialYear);
      setMode("dashboard");
    } else {
      setMode("config");
    }
  };

  const handleSelectDashboardYear = (y) => {
    setActiveDashboardYear(y);
    setMode("dashboard");
  };

  const WeekDetailModal = ({ isOpen, onClose, emp, day, typeKey }) => {
    if (!isOpen || !emp || !day) return null;
    const typeInfo = TYPES[typeKey];
    const horarioSalida =
      typeKey === "O42"
        ? "18:00 (Viernes 14:00)"
        : typeKey === "O40"
          ? "17:00"
          : typeKey === "O30" || typeKey === "T30"
            ? "14:00 (Intensiva)"
            : "N/A";
     const diasOficina = emp.officeDays;
     return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onClose(); } }}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {emp.name} <span className="text-gray-500 text-sm font-normal">({emp.role})</span>
            </h3>
            <p className="text-brand-blue font-medium">Fecha {day.label}</p>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado Actual</p>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${typeInfo.color}`}></div>
                <span className="text-lg font-semibold text-gray-800">{typeInfo.label}</span>
              </div>
            </div>
            {typeKey !== "V" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Horario Salida</p>
                    <p className={`text-lg font-bold ${typeKey.includes("30") ? "text-emerald-600" : "text-amber-600"}`}>{horarioSalida}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Grupo Turno</p>
                    <p className="text-lg font-bold text-gray-700">Grupo {emp.group}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Días en Oficina (Fijos)</p>
                  <p className="text-gray-800 font-medium">{diasOficina}</p>
                </div>
              </>
            )}
            {typeKey === "V" && (
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 text-center">
                <p className="text-rose-600">🌴 Disfrutando de vacaciones</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AlertDetailModal = ({ isOpen, onClose, dayId }) => {
    if (!isOpen || !dayId) return null;
    const alert = stats.alerts.find(a => a.dayId === dayId);
    if (!alert) return null;
    const day = days.find(d => d.id === dayId);
    
    const hasCritical = alert.reasons.some(r => r.severity === "critical");
    const hasWarning = alert.reasons.some(r => r.severity === "warning");
    const borderColor = hasCritical ? "border-rose-200" : hasWarning ? "border-amber-200" : "border-blue-100";
    const headerBg = hasCritical ? "bg-rose-50" : hasWarning ? "bg-amber-50" : "bg-blue-50";

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onClose(); } }}>
        <div className={`bg-white border ${borderColor} rounded-xl shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col`} onClick={(e) => e.stopPropagation()}>
          <div className={`${headerBg} px-5 py-4 flex items-center justify-between border-b ${borderColor}`}>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${hasCritical ? 'text-rose-700' : hasWarning ? 'text-amber-700' : 'text-blue-700'}`}>
                {WEEKDAY_FULL[day.weekdayLetter]} {day.label}
              </span>
              <span className="text-xs text-gray-600 bg-white/70 px-2.5 py-1 rounded-full font-medium shadow-sm">
                {alert.present}/6 disponibles
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors bg-white/50 hover:bg-white rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="p-5 space-y-3 bg-white max-h-[75vh] overflow-y-auto">
            {alert.reasons.map((reason, idx) => {
              const severityStyles = {
                critical: { bg: "bg-rose-50", border: "border-rose-200", titleColor: "text-rose-700", iconColor: "text-rose-500", detailColor: "text-rose-600" },
                warning: { bg: "bg-amber-50", border: "border-amber-200", titleColor: "text-amber-700", iconColor: "text-amber-500", detailColor: "text-amber-600" },
                info: { bg: "bg-blue-50", border: "border-blue-100", titleColor: "text-blue-700", iconColor: "text-blue-500", detailColor: "text-blue-600" }
              };
              const s = severityStyles[reason.severity] || severityStyles.info;
              const iconMap = {
                people: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>,
                clock: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
                alert: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
                group: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
                check: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              };
              return (
                <div key={idx} className={`${s.bg} border ${s.border} rounded-lg p-3.5 shadow-sm transform transition-all hover:scale-[1.01]`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${s.iconColor} bg-white p-1.5 rounded-md shadow-sm border ${s.border}`}>
                      {iconMap[reason.icon] || iconMap.alert}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${s.titleColor}`}>{reason.title}</h4>
                      <p className={`text-sm mt-1 leading-relaxed ${s.detailColor}`}>{reason.detail}</p>
                      {reason.context && <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-300 pl-2 py-0.5">{reason.context}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const ForcedOfficeListModal = ({ open, onClose }) => {
    if (!open) return null;

    // Agrupar conteo por empleado
    const countByEmp = {};
    stats.forcedOfficeDetails.forEach(item => {
      countByEmp[item.empId] = (countByEmp[item.empId] || 0) + 1;
    });

    const entries = stats.forcedOfficeDetails
      .map((it) => {
        const day = days.find((d) => d.id === it.dayId);
        const emp = EMPLOYEES.find((e) => e.id === it.empId);
        return { day, emp, reason: it.reason };
      })
      .sort((a, b) => a.day.id.localeCompare(b.day.id) || a.emp.id - b.emp.id);

     return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onClose(); } }}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-3xl w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">Listado de O forzadas</h3>
            <p className="text-gray-500 text-sm mb-4">Motivo por el que deben asistir a la oficina</p>

            {/* Resumen por integrante */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              <h4 className="text-sm font-bold text-brand-blue mb-2">Resumen por Integrante:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(countByEmp).length === 0 && <span className="text-xs text-gray-500">Sin registros.</span>}
                {Object.entries(countByEmp).map(([empId, count]) => {
                  const emp = EMPLOYEES.find(e => e.id === parseInt(empId));
                  return (
                    <span key={empId} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-brand-blue font-medium shadow-sm">
                      {emp.name}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b border-gray-200 text-gray-600">Fecha</th>
                  <th className="p-2 border-b border-gray-200 text-gray-600">Día</th>
                  <th className="p-2 border-b border-gray-200 text-gray-600">Integrante</th>
                  <th className="p-2 border-b border-gray-200 text-gray-600">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay O forzadas en el periodo.</td></tr>}
                {entries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border-b border-gray-200 text-gray-800">{row.day.label}</td>
                    <td className="p-2 border-b border-gray-200 text-gray-500">{WEEKDAY_FULL[row.day.weekdayLetter]}</td>
                    <td className="p-2 border-b border-gray-200 text-gray-800">{row.emp.name}</td>
                    <td className="p-2 border-b border-gray-200 text-gray-600">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const stats = useMemo(() => {
    const forcedOfficeSet = {};
    const forcedOfficeDetails = [];

    // Rastreo local de carga para reparto equitativo
    const tempForcedCount = {};
    EMPLOYEES.forEach(e => tempForcedCount[e.id] = 0);
    const pickLowestForcedCandidate = (candidates) => {
      if (!candidates || candidates.length === 0) return null;
      const minLoad = Math.min(...candidates.map((candidate) => tempForcedCount[candidate.id] || 0));
      const pool = candidates
        .filter((candidate) => (tempForcedCount[candidate.id] || 0) === minLoad)
        .sort((a, b) => a.id - b.id);
      return pool[0] || null;
    };

    const getBestCandidate = (groupNames, day) => {
      const candidates = EMPLOYEES.filter(emp => {
        if (!groupNames.includes(emp.name)) return false;
        const type = schedule[emp.id][day.id];
        if (type === "V") return false;
        if (type === "O30") return false; // Enforce afternoon coverage
        const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
        return !daysOffice.includes(day.weekdayLetter);
      });

      if (candidates.length === 0) return null;

      return pickLowestForcedCandidate(candidates);
    };
    const dailyCoverage = days.map((day) => {
      let present = 0,
        vacation = 0,
        shift18hCount = 0,
        shift18hOfficeCount = 0,
        intensiveCount = 0;
      let group1HasOffice = false,
        group2HasOffice = false;
      let group1Covering = [];
      let group2Covering = [];

      EMPLOYEES.forEach((emp) => {
        const type = schedule[emp.id][day.id];
        if (type === "V") {
          vacation++;
          return;
        }
        present++;
        if (type === "O30") intensiveCount++;
        if (type === "O42") shift18hCount++;
        const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
        const isInOffice = daysOffice.includes(day.weekdayLetter);
        if (type === "O42" && isInOffice) shift18hOfficeCount++;
        const hasFullSchedule = day.weekdayLetter === "V" ? (type === "O40") : (type === "O40" || type === "O42");

        if (isInOffice && hasFullSchedule) {
          if (GROUP1.includes(emp.name)) {
            group1HasOffice = true;
            group1Covering.push(emp.name);
          }
          if (GROUP2.includes(emp.name)) {
            group2HasOffice = true;
            group2Covering.push(emp.name);
          }
        }
      });

      // Si un grupo falta pero el otro puede cubrirlo, no forzamos a nadie
      if (day.weekdayLetter !== "V") {
        if (shift18hOfficeCount < 1) {
          const o42Candidates = EMPLOYEES.filter((emp) => {
            if (schedule[emp.id][day.id] !== "O42") return false;
            const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
            return !daysOffice.includes(day.weekdayLetter);
          });
          if (o42Candidates.length > 0) {
            const candidate = pickLowestForcedCandidate(o42Candidates);
            forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
            forcedOfficeSet[day.id].add(candidate.id);
            forcedOfficeDetails.push({
              dayId: day.id,
              empId: candidate.id,
              reason: "Cobertura 18h presencial (17:00-18:00)",
            });
            tempForcedCount[candidate.id]++;
            shift18hOfficeCount = 1;
          }
        }

        if (!group1HasOffice && group2Covering.length === 0) {
          const candidate = getBestCandidate(GROUP1, day);
          if (candidate) {
            forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
            forcedOfficeSet[day.id].add(candidate.id);
            forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo {Enrique/Luis/David} y el otro grupo no cubre" });
            group1HasOffice = true;
            group1Covering.push(candidate.name);
            tempForcedCount[candidate.id]++;
          }
        }
        if (!group2HasOffice && group1Covering.length === 0) {
          const candidate = getBestCandidate(GROUP2, day);
          if (candidate) {
            forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
            forcedOfficeSet[day.id].add(candidate.id);
            forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo {Jose/Ariel/Kike} y el otro grupo no cubre" });
            group2HasOffice = true;
            group2Covering.push(candidate.name);
            tempForcedCount[candidate.id]++;
          }
        }
      }
      if (day.weekdayLetter === "V") {
        const hasO40InOffice = EMPLOYEES.some((emp) => {
          const type = schedule[emp.id][day.id];
          if (type !== "O40") return false;
          const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
          return daysOffice.includes("V");
        });

        if (!hasO40InOffice) {
          const isGroupALate = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
          const lateGroup = isGroupALate ? "A" : "B";
          const o40NotOffice = EMPLOYEES.filter((emp) => {
            const type = schedule[emp.id][day.id];
            if (type !== "O40") return false;
            const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
            return !daysOffice.includes("V");
          });
          if (o40NotOffice.length > 0) {
            const preferred = o40NotOffice.filter((e) => e.name === "Luis");
            const nonLate = o40NotOffice.filter((e) => e.group !== lateGroup);
            const candidate =
              pickLowestForcedCandidate(preferred) ||
              pickLowestForcedCandidate(nonLate) ||
              pickLowestForcedCandidate(o40NotOffice);
            if (candidate) {
              // Ensure the candidate is actually assigned O40 for Friday afternoon coverage
              schedule[candidate.id][day.id] = "O40";
              
              forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
              forcedOfficeSet[day.id].add(candidate.id);
              forcedOfficeDetails.push({
                dayId: day.id,
                empId: candidate.id,
                reason: "Viernes: se requiere 40h en oficina hasta las 17:00",
              });
              tempForcedCount[candidate.id]++;
            }
          }
        }
      }
      return { dayId: day.id, present, vacation, shift18hCount, shift18hOfficeCount, intensiveCount, group1HasOffice, group2HasOffice, group1Covering, group2Covering };
    });
    const alerts = [];
    dailyCoverage.forEach((d) => {
      const day = days.find((x) => x.id === d.dayId);
      const need18h = day.weekdayLetter !== "V";
      const reasons = [];

      if (d.present < 3) {
        const onVacation = EMPLOYEES.filter(e => schedule[e.id][day.id] === "V").map(e => e.name);
        reasons.push({
          category: "cobertura",
          severity: "critical",
          title: "Cobertura insuficiente",
          detail: `Solo ${d.present} de 6 integrantes disponibles (mínimo 3).`,
          context: onVacation.length > 0 ? `De vacaciones: ${onVacation.join(", ")}` : null,
          icon: "people"
        });
      }

      if (need18h && d.shift18hOfficeCount < 1) {
        reasons.push({
          category: "turno18h",
          severity: "critical",
          title: "Sin cobertura presencial de tarde (17h-18h)",
          detail: `No hay nadie en oficina cubriendo de 17:00 a 18:00 en ${WEEKDAY_FULL[day.weekdayLetter]}.`,
          context: d.shift18hCount < 1 ? "No hay ningún turno O42 asignado." : "Hay turno O42 asignado, pero en teletrabajo.",
          icon: "clock"
        });
      }

      if (d.intensiveCount > 3) {
        const inIntensive = EMPLOYEES.filter(e => schedule[e.id][day.id] === "O30").map(e => e.name);
        reasons.push({
          category: "intensiva",
          severity: "warning",
          title: "Exceso de intensivas",
          detail: `${d.intensiveCount} personas en intensiva (máximo permitido: 3).`,
          context: `En intensiva: ${inIntensive.join(", ")}`,
          icon: "alert"
        });
      }

      if (need18h && !d.group1HasOffice) {
        const g1OnVac = EMPLOYEES.filter(e => GROUP1.includes(e.name) && schedule[e.id][day.id] === "V").map(e => e.name);
        const g1OnIntensive = EMPLOYEES.filter(e => GROUP1.includes(e.name) && schedule[e.id][day.id] === "O30").map(e => e.name);
        const g1OnTelework = EMPLOYEES.filter(e => {
          if (!GROUP1.includes(e.name)) return false;
          if (schedule[e.id][day.id] === "V") return false;
          const od = e.officeDays.split(",").map(x => x.trim());
          return !od.includes(day.weekdayLetter);
        }).map(e => e.name);

        const isCovered = d.group2Covering && d.group2Covering.length > 0;
        if (!isCovered) {
          let contextParts = [];
          if (g1OnVac.length > 0) contextParts.push(`Vacaciones: ${g1OnVac.join(", ")}`);
          if (g1OnIntensive.length > 0) contextParts.push(`Intensiva: ${g1OnIntensive.join(", ")}`);
          if (g1OnTelework.length > 0) contextParts.push(`Teletrabajo: ${g1OnTelework.join(", ")}`);

          reasons.push({
            category: "grupo1",
            severity: "critical",
            title: "Grupo {Enrique/Luis/David} sin presencia",
            detail: `Ningún miembro del grupo está en oficina con turno completo.`,
            context: contextParts.length > 0 ? contextParts.join(" · ") : null,
            icon: "group"
          });
        }
      }

      if (need18h && !d.group2HasOffice) {
        const g2OnVac = EMPLOYEES.filter(e => GROUP2.includes(e.name) && schedule[e.id][day.id] === "V").map(e => e.name);
        const g2OnIntensive = EMPLOYEES.filter(e => GROUP2.includes(e.name) && schedule[e.id][day.id] === "O30").map(e => e.name);
        const g2OnTelework = EMPLOYEES.filter(e => {
          if (!GROUP2.includes(e.name)) return false;
          if (schedule[e.id][day.id] === "V") return false;
          const od = e.officeDays.split(",").map(x => x.trim());
          return !od.includes(day.weekdayLetter);
        }).map(e => e.name);

        const isCovered = d.group1Covering && d.group1Covering.length > 0;
        if (!isCovered) {
          let contextParts = [];
          if (g2OnVac.length > 0) contextParts.push(`Vacaciones: ${g2OnVac.join(", ")}`);
          if (g2OnIntensive.length > 0) contextParts.push(`Intensiva: ${g2OnIntensive.join(", ")}`);
          if (g2OnTelework.length > 0) contextParts.push(`Teletrabajo: ${g2OnTelework.join(", ")}`);

          reasons.push({
            category: "grupo2",
            severity: "critical",
            title: "Grupo {Jose/Ariel/Kike} sin presencia",
            detail: `Ningún miembro del grupo está en oficina con turno completo.`,
            context: contextParts.length > 0 ? contextParts.join(" · ") : null,
            icon: "group"
          });
        }
      }

      if (reasons.length > 0) {
        alerts.push({ ...d, reasons });
      }
    });

    const weeksMap = {};
    days.forEach((d) => {
      weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || [];
      weeksMap[d.weekIndex].push(d);
    });
    const intensiveWeeksByEmp = {};
    const totalHoursByEmp = {};
    EMPLOYEES.forEach((emp) => {
      intensiveWeeksByEmp[emp.id] = 0;
      totalHoursByEmp[emp.id] = 0;
    });
    days.forEach((day) => {
      EMPLOYEES.forEach((emp) => {
        totalHoursByEmp[emp.id] += HOURS_PER_TYPE[schedule[emp.id][day.id]] || 0;
      });
    });
    Object.keys(weeksMap).forEach((wiStr) => {
      const daysInWeek = weeksMap[wiStr];
      EMPLOYEES.forEach((emp) => {
        if (daysInWeek.every((day) => schedule[emp.id][day.id] === "O30")) intensiveWeeksByEmp[emp.id] += 1;
      });
    });
    const equityAudit = buildEquityAudit({
      employees: EMPLOYEES,
      days,
      schedule,
      forcedOfficeDetails,
    });
    const strictValidation = validateStrictWeeklyRules({
      employees: EMPLOYEES,
      days,
      schedule,
    });
    return {
      dailyCoverage,
      alerts,
      forcedOfficeSet,
      forcedOfficeDetails,
      intensiveWeeksByEmp,
      totalHoursByEmp,
      equityAudit,
      strictValidation,
      strictCorrections: strictAudit?.corrections || [],
    };
  }, [schedule, days, strictAudit]);

  const exportToExcel = async () => {
    const appendExportLog = (message, level = "info") => {
      setExportLogs((prev) => [...prev, { level, message, ts: new Date().toISOString() }].slice(-80));
    };
    const waitTick = () => new Promise((resolve) => setTimeout(resolve, 0));
    const downloadBlob = (blob, filename) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };

    setExportInProgress(true);
    setExportProgress(0);
    setExportStatus("Inicializando exportación...");
    setExportError("");
    setExportLogs([]);
    appendExportLog("Inicio del proceso de exportación.");

    try {
      if (!["xlsx", "xls", "csv"].includes(exportFormat)) {
        throw new Error("Formato no soportado. Selecciona .xlsx, .xls o .csv.");
      }

      const validation = validateExportPayload({ employees: EMPLOYEES, days, schedule });
      if (!validation.ok) {
        throw new Error(`Validación fallida: ${validation.errors.join(" | ")}`);
      }
      const strictValidation = validateStrictWeeklyRules({
        employees: EMPLOYEES,
        days,
        schedule,
      });
      if (!strictValidation.ok) {
        const grouped = Object.values(STRICT_WEEKLY_RULES)
          .map((rule) => {
            const count = strictValidation.summary.byRule[rule] || 0;
            if (count === 0) return null;
            return `${STRICT_WEEKLY_RULE_MESSAGES[rule]} (${count})`;
          })
          .filter(Boolean);
        throw new Error(`Integridad semanal inválida: ${grouped.join(" | ")}`);
      }
      appendExportLog(`Validación completada. Filas: ${validation.rowCount}, columnas: ${validation.columnCount}.`);
      setExportProgress(12);
      setExportStatus("Validación completada.");
      await waitTick();

      const preset = getExportStylePreset(exportStylePreset);
      const { headers, rows } = buildExportRows({
        employees: EMPLOYEES,
        days,
        schedule,
        includeFormulas: exportIncludeFormulas && exportFormat !== "csv",
      });
      const totalRows = rows.length + 1;
      const isLargeExport = totalRows > 10000;
      appendExportLog(`Preparación de dataset completada. Registros: ${totalRows}.`);
      if (isLargeExport) {
        appendExportLog("Se activará modo optimizado para exportación pesada.", "warning");
      }
      setExportProgress(24);
      setExportStatus("Construyendo hoja principal...");
      await waitTick();

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const headerStyle = {
        font: { bold: true, color: { rgb: preset.headerText } },
        fill: { fgColor: { rgb: preset.headerBg } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: preset.border } },
          bottom: { style: "thin", color: { rgb: preset.border } },
          left: { style: "thin", color: { rgb: preset.border } },
          right: { style: "thin", color: { rgb: preset.border } },
        },
      };

      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
      }

      const lastDayColIndex = days.length;
      const lastDayColLetter = XLSX.utils.encode_col(lastDayColIndex);
      const o30FormulaCol = days.length + 1;
      const hoursFormulaCol = days.length + 2;

      for (let rIndex = 0; rIndex < rows.length; rIndex++) {
        const row = rows[rIndex];
        const rowIndex = rIndex + 1;
        for (let cIndex = 0; cIndex < row.length; cIndex++) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: cIndex });
          if (!ws[cellRef]) continue;
          if (cIndex === 0) {
            ws[cellRef].s = {
              font: { bold: true, color: { rgb: preset.rowText } },
              alignment: { horizontal: "left" },
              border: {
                top: { style: "thin", color: { rgb: preset.border } },
                bottom: { style: "thin", color: { rgb: preset.border } },
                left: { style: "thin", color: { rgb: preset.border } },
                right: { style: "thin", color: { rgb: preset.border } },
              },
            };
          } else if (cIndex <= days.length) {
            ws[cellRef].s = createExportCellStyle(row[cIndex], preset);
          } else {
            ws[cellRef].s = {
              font: { color: { rgb: preset.rowText } },
              alignment: { horizontal: "center" },
              border: {
                top: { style: "thin", color: { rgb: preset.border } },
                bottom: { style: "thin", color: { rgb: preset.border } },
                left: { style: "thin", color: { rgb: preset.border } },
                right: { style: "thin", color: { rgb: preset.border } },
              },
            };
          }
        }

        if (exportIncludeFormulas && exportFormat !== "csv") {
          const excelRow = rIndex + 2;
          const range = `B${excelRow}:${lastDayColLetter}${excelRow}`;
          const o30Cell = XLSX.utils.encode_cell({ r: rowIndex, c: o30FormulaCol });
          const hoursCell = XLSX.utils.encode_cell({ r: rowIndex, c: hoursFormulaCol });
          ws[o30Cell] = { t: "n", f: `COUNTIF(${range},"O30")`, s: ws[o30Cell]?.s };
          ws[hoursCell] = { t: "n", f: `COUNTIF(${range},"O30")*6+COUNTIF(${range},"O40")*8+COUNTIF(${range},"O42")*9`, s: ws[hoursCell]?.s };
        }

        if (isLargeExport && rIndex % 500 === 0) {
          const progressBase = 24 + Math.min(36, Math.floor((rIndex / Math.max(1, rows.length)) * 36));
          setExportProgress(progressBase);
          setExportStatus(`Aplicando estilos y fórmulas (${rIndex + 1}/${rows.length})...`);
          await waitTick();
        }
      }

      // ── Filas de totales en hoja Horarios ──────────────────────────
      if (exportFormat !== "csv") {
        const totalsTypes = [["TOTAL 30h", "O30"], ["TOTAL 40h", "O40"], ["TOTAL 42h", "O42"], ["TOTAL VAC", "V"]];
        const totalRowsAoa = totalsTypes.map(([label, type]) => {
          const tRow = [label];
          days.forEach(day => { tRow.push(EMPLOYEES.filter(emp => schedule[emp.id][day.id] === type).length); });
          if (exportIncludeFormulas) { tRow.push(null); tRow.push(null); }
          return tRow;
        });
        XLSX.utils.sheet_add_aoa(ws, totalRowsAoa, { origin: { r: rows.length + 1, c: 0 } });
        totalsTypes.forEach(([, type], tIdx) => {
          const rIdx = rows.length + 1 + tIdx;
          for (let c = 0; c < (days.length + 1 + (exportIncludeFormulas ? 2 : 0)); c++) {
            const cellRef = XLSX.utils.encode_cell({ r: rIdx, c });
            if (!ws[cellRef]) continue;
            ws[cellRef].s = c === 0
              ? { font: { bold: true, color: { rgb: preset.headerText } }, fill: { fgColor: { rgb: preset.headerBg } }, alignment: { horizontal: "left" } }
              : createExportCellStyle(type, preset);
          }
        });
        appendExportLog("Filas de totales añadidas a Horarios.");
      }

      const colWidths = [{ wch: 20 }, ...days.map(() => ({ wch: 11 }))];
      if (exportIncludeFormulas && exportFormat !== "csv") {
        colWidths.push({ wch: 18 });
        colWidths.push({ wch: 24 });
      }
      ws["!cols"] = colWidths;
      ws["!freeze"] = { xSplit: 1, ySplit: 1 };

      if (exportProtectSheet && exportFormat !== "csv") {
        ws["!protect"] = {
          password: exportPassword || "Horarios2026",
          selectLockedCells: true,
          selectUnlockedCells: true,
        };
        appendExportLog("Protección de hoja activada.");
      }

      XLSX.utils.book_append_sheet(wb, ws, "Horarios");
      setExportProgress(42);
      setExportStatus("Generando hojas adicionales...");
      await waitTick();

      // Estilos reutilizables para hojas auxiliares
      const auxHeaderStyle = {
        font: { bold: true, color: { rgb: preset.headerText } },
        fill: { fgColor: { rgb: preset.headerBg } },
        alignment: { horizontal: "center", wrapText: true },
        border: { top: { style: "thin", color: { rgb: preset.border } }, bottom: { style: "thin", color: { rgb: preset.border } }, left: { style: "thin", color: { rgb: preset.border } }, right: { style: "thin", color: { rgb: preset.border } } },
      };
      const auxSubHeaderStyle = {
        font: { bold: true, color: { rgb: preset.rowText } },
        fill: { fgColor: { rgb: "E2E8F0" } },
        alignment: { horizontal: "center" },
      };
      const auxTitleStyle = {
        font: { bold: true, sz: 12, color: { rgb: "1E40AF" } },
        fill: { fgColor: { rgb: "EFF6FF" } },
      };
      const auxSubtitleStyle = {
        font: { italic: true, color: { rgb: "64748B" } },
        fill: { fgColor: { rgb: "F8FAFC" } },
      };
      const applyRowStyle = (wsTarget, rIdx, colCount, style) => {
        for (let c = 0; c < colCount; c++) {
          const ref = XLSX.utils.encode_cell({ r: rIdx, c });
          if (wsTarget[ref]) wsTarget[ref].s = style;
        }
      };

      if (exportFormat !== "csv") {
        // ── Hoja 2: Resumen_Mensual ───────────────────────────────────
        const aoaResumen = buildResumenMensualSheet({ employees: EMPLOYEES, days, schedule });
        const wsResumen = XLSX.utils.aoa_to_sheet(aoaResumen);
        applyRowStyle(wsResumen, 0, aoaResumen[0].length, auxHeaderStyle);
        applyRowStyle(wsResumen, 1, aoaResumen[1].length, auxSubHeaderStyle);
        wsResumen["!freeze"] = { xSplit: 3, ySplit: 2 };
        wsResumen["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 10 }, ...Array(aoaResumen[0].length - 3).fill({ wch: 9 })];
        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen_Mensual");
        appendExportLog("Hoja Resumen_Mensual generada.");
        setExportProgress(52);
        await waitTick();

        // ── Hoja 3: Vista_Semanas ────────────────────────────────────
        const aoaSemanas = buildVistaSemanasSheet({ employees: EMPLOYEES, days, schedule });
        const wsSemanas = XLSX.utils.aoa_to_sheet(aoaSemanas);
        applyRowStyle(wsSemanas, 0, aoaSemanas[0].length, auxHeaderStyle);
        wsSemanas["!freeze"] = { xSplit: 1, ySplit: 1 };
        wsSemanas["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsSemanas, "Vista_Semanas");
        appendExportLog("Hoja Vista_Semanas generada.");
        setExportProgress(60);
        await waitTick();

        // ── Hoja 4: Estadisticas ─────────────────────────────────────
        const aoaStats = buildEstadisticasSheet({
          employees: EMPLOYEES, days, schedule,
          forcedOfficeDetails: stats.forcedOfficeDetails,
          intensiveWeeksByEmp: stats.intensiveWeeksByEmp,
          totalHoursByEmp: stats.totalHoursByEmp,
        });
        const wsStats = XLSX.utils.aoa_to_sheet(aoaStats);
        applyRowStyle(wsStats, 0, aoaStats[0].length, auxHeaderStyle);
        // Style totals row (last row)
        const statsLastRow = aoaStats.length - 1;
        applyRowStyle(wsStats, statsLastRow, aoaStats[0].length, { font: { bold: true }, fill: { fgColor: { rgb: "DBEAFE" } } });
        wsStats["!freeze"] = { xSplit: 1, ySplit: 1 };
        wsStats["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 13 }, { wch: 16 }, { wch: 13 }, { wch: 14 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsStats, "Estadisticas");
        appendExportLog("Hoja Estadisticas generada.");
        setExportProgress(68);
        await waitTick();

        // ── Hoja 5: Vacaciones ───────────────────────────────────────
        const aoaVac = buildVacacionesSheet({ employees: EMPLOYEES, days, schedule });
        const wsVac = XLSX.utils.aoa_to_sheet(aoaVac);
        applyRowStyle(wsVac, 0, aoaVac[0].length, auxHeaderStyle);
        // Color vacation rows rose
        const vacStyle = { fill: { fgColor: { rgb: "FFF1F2" } }, font: { color: { rgb: "9F1239" } } };
        for (let r = 1; r < EMPLOYEES.length * days.length + 1; r++) {
          const firstCell = XLSX.utils.encode_cell({ r, c: 0 });
          if (!wsVac[firstCell] || !wsVac[firstCell].v) break;
          applyRowStyle(wsVac, r, aoaVac[0].length, vacStyle);
        }
        wsVac["!freeze"] = { xSplit: 1, ySplit: 1 };
        wsVac["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsVac, "Vacaciones");
        appendExportLog("Hoja Vacaciones generada.");
        setExportProgress(75);
        await waitTick();

        // ── Hoja 6: Alertas ──────────────────────────────────────────
        const aoaAlertas = buildAlertasSheet({ alerts: stats.alerts, days, employees: EMPLOYEES, schedule });
        const wsAlertas = XLSX.utils.aoa_to_sheet(aoaAlertas);
        applyRowStyle(wsAlertas, 0, aoaAlertas[0].length, auxHeaderStyle);
        // Color rows by severity
        for (let r = 1; r < aoaAlertas.length; r++) {
          const sevCell = XLSX.utils.encode_cell({ r, c: 4 });
          if (!wsAlertas[sevCell]) continue;
          const sev = wsAlertas[sevCell].v;
          const alertRowStyle = sev === "CRÍTICO"
            ? { fill: { fgColor: { rgb: "FEF2F2" } }, font: { color: { rgb: "991B1B" } } }
            : sev === "AVISO"
              ? { fill: { fgColor: { rgb: "FFFBEB" } }, font: { color: { rgb: "92400E" } } }
              : null;
          if (alertRowStyle) applyRowStyle(wsAlertas, r, aoaAlertas[0].length, alertRowStyle);
        }
        wsAlertas["!freeze"] = { xSplit: 1, ySplit: 1 };
        wsAlertas["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 40 }, { wch: 35 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsAlertas, "Alertas");
        appendExportLog("Hoja Alertas generada.");
        setExportProgress(82);
        await waitTick();

        // ── Hoja 7: Datos_Graficos ───────────────────────────────────
        if (exportIncludeChartData) {
          const aoaGraficos = buildDatosGraficosSheet({
            employees: EMPLOYEES, days, schedule,
            intensiveWeeksByEmp: stats.intensiveWeeksByEmp,
            forcedOfficeDetails: stats.forcedOfficeDetails,
            dailyCoverage: stats.dailyCoverage,
          });
          const wsGraficos = XLSX.utils.aoa_to_sheet(aoaGraficos);
          // Style section titles and subtitles
          aoaGraficos.forEach((row, r) => {
            if (!row[0]) return;
            const v = String(row[0]);
            if (v.startsWith("TABLA")) applyRowStyle(wsGraficos, r, 1, auxTitleStyle);
            else if (v.startsWith("Gráfico")) applyRowStyle(wsGraficos, r, 1, auxSubtitleStyle);
            else if (v.startsWith("───")) applyRowStyle(wsGraficos, r, 1, { font: { bold: true, color: { rgb: "1E40AF" } } });
            else if (v.startsWith("TABLA") || v.match(/^[1-4]\./)) applyRowStyle(wsGraficos, r, 1, auxSubtitleStyle);
          });
          wsGraficos["!cols"] = [{ wch: 20 }, { wch: 14 }, ...Array(10).fill({ wch: 12 })];
          XLSX.utils.book_append_sheet(wb, wsGraficos, "Datos_Graficos");
          appendExportLog("Hoja Datos_Graficos (4 tablas con instrucciones) generada.");
          appendExportLog("Nota: los gráficos deben crearse manualmente en Excel usando los rangos indicados en cada tabla.", "warning");
          setExportProgress(90);
          await waitTick();
        }
      }

      const fileBase = `planificacion_horarios_${currentYear}`;
      if (exportFormat === "csv") {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const csvBytes = csvBlob.size;
        if (csvBytes > 1024 * 1024 && typeof CompressionStream !== "undefined") {
          const compression = new CompressionStream("gzip");
          const compressedStream = new Blob([csv]).stream().pipeThrough(compression);
          const compressedBlob = await new Response(compressedStream).blob();
          downloadBlob(compressedBlob, `${fileBase}.csv.gz`);
          appendExportLog(`CSV comprimido automáticamente (${Math.round(csvBytes / 1024)} KB -> ${Math.round(compressedBlob.size / 1024)} KB).`);
        } else {
          downloadBlob(csvBlob, `${fileBase}.csv`);
          if (csvBytes > 1024 * 1024) {
            appendExportLog("No se pudo comprimir automáticamente por limitaciones del navegador.", "warning");
          }
        }
      } else {
        const wbout = XLSX.write(wb, {
          bookType: exportFormat,
          type: "array",
          compression: isLargeExport,
        });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        downloadBlob(blob, `${fileBase}.${exportFormat}`);
      }

      setExportProgress(100);
      setExportStatus("Exportación completada correctamente.");
      appendExportLog("Exportación finalizada con éxito.");
    } catch (error) {
      const message = getExportErrorMessage(error);
      setExportError(`No se pudo completar la exportación: ${message}`);
      setExportStatus("Exportación fallida.");
      appendExportLog(`Error: ${message}`, "error");
    } finally {
      setExportInProgress(false);
    }
  };

  const handleCellClick = (emp, day) => {
    const typeKey = schedule[emp.id][day.id];
    setModalData({ isOpen: true, emp, day, typeKey });
  };

  const quickFilteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return EMPLOYEES;
    return EMPLOYEES.filter((emp) => emp.name.toLowerCase().includes(query));
  }, [employeeSearch]);

  const filteredEmployees = selectedEmp === "all"
    ? quickFilteredEmployees
    : quickFilteredEmployees.filter((e) => e.id === parseInt(selectedEmp, 10));
  const weekdaysCalendar = ["L", "M", "X", "J", "V"];
  const calendarMonths = useMemo(() => {
    return daysByMonth.map(([monthName, monthDays]) => {
      const weeksMap = {};
      monthDays.forEach((day) => {
        weeksMap[day.weekIndex] = weeksMap[day.weekIndex] || {};
        weeksMap[day.weekIndex][day.weekdayLetter] = day;
      });
      const weekIndexes = Object.keys(weeksMap)
        .map((value) => parseInt(value, 10))
        .sort((a, b) => a - b);
      return {
        monthName,
        weeks: weekIndexes.map((index) => weeksMap[index]),
      };
    });
  }, [daysByMonth]);

  const tableSpacing = tableDensity === "compact"
    ? {
        headerCell: "p-1.5",
        firstColHeader: "p-2.5",
        firstColCell: "p-2",
        bodyCell: "p-0.5",
        slotHeight: "h-8",
      }
    : {
        headerCell: "p-2",
        firstColHeader: "p-4",
        firstColCell: "p-3",
        bodyCell: "p-1",
        slotHeight: "h-10",
      };


  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6 text-brand-dark">
      <WeekDetailModal {...modalData} onClose={() => setModalData({ ...modalData, isOpen: false })} />
      <ForcedOfficeListModal open={oListOpen} onClose={() => setOListOpen(false)} />
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-6">
          <img src="logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          <div>
            <h2 className="text-2xl font-bold text-brand-blue tracking-tight">Gestion Horaria Dept. Sistemas</h2>
          </div>
        </div>
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-white text-gray-700 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-blue shadow-sm"
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
          >
            <option value="all">Todos los integrantes</option>
            {EMPLOYEES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            placeholder="Filtrar por nombre"
            className="bg-white text-gray-700 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-blue shadow-sm min-w-[12rem]"
          />

          <button onClick={() => setOListOpen(true)} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm border border-gray-300 transition-colors shadow-sm">
            Ver O forzadas
          </button>
          <button
            onClick={() => {
              setVacationSectionOpen((prev) => !prev);
              if (!vacationSectionOpen) {
                setExportPanelExpanded(false);
              }
            }}
            className={`text-white px-4 py-2 rounded text-sm shadow-md transition-colors ${vacationSectionOpen ? "bg-teal-700" : "bg-teal-600 hover:bg-teal-700"}`}
          >
            {vacationSectionOpen ? "Cerrar vacaciones" : "Ver vacaciones"}
          </button>
          <button
            onClick={() => {
              setExportPanelExpanded((prev) => !prev);
              if (!exportPanelExpanded) {
                setVacationSectionOpen(false);
              }
            }}
            className={`text-white px-4 py-2 rounded text-sm shadow-md transition-colors flex items-center gap-2 ${exportPanelExpanded ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {exportPanelExpanded ? "Cerrar exportación" : "Exportar"}
          </button>
          <button
            onClick={() => setViewMode((prev) => (prev === "matrix" ? "calendar" : "matrix"))}
            className={`text-white px-4 py-2 rounded text-sm shadow-md transition-colors ${viewMode === "calendar" ? "bg-fuchsia-700" : "bg-fuchsia-600 hover:bg-fuchsia-700"}`}
          >
            {viewMode === "calendar" ? "Vista matriz" : "Vista calendario"}
          </button>
          <button
            onClick={() => setPlanning(generateSchedule(year, vacationPlan))}
            className="bg-brand-blue hover:bg-blue-800 text-white px-4 py-2 rounded text-sm shadow-md transition-colors"
          >
            Resetear Plan
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm transition-colors border border-gray-300"
          >
            Cerrar Sesión
          </button>
          </div>
        </div>
      </header>

      {exportPanelExpanded && (
      <div className="mb-6 bg-white border border-emerald-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Exportación Excel y validaciones</h3>
            <p className="text-xs text-gray-500">Configura la exportación y lanza la descarga.</p>
          </div>
          <button
            type="button"
            onClick={() => setExportPanelExpanded(false)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
          >
            Ocultar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Formato</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <option value="xlsx">.xlsx</option>
              <option value="xls">.xls</option>
              <option value="csv">.csv</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Estilo</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm" value={exportStylePreset} onChange={(e) => setExportStylePreset(e.target.value)}>
              <option value="corporativo">Corporativo</option>
              <option value="neutro">Neutro</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={exportIncludeFormulas} onChange={(e) => setExportIncludeFormulas(e.target.checked)} />
              Fórmulas Excel
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={exportIncludeChartData} onChange={(e) => setExportIncludeChartData(e.target.checked)} />
              Datos para gráficos
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={exportProtectSheet} onChange={(e) => setExportProtectSheet(e.target.checked)} />
              Proteger hoja
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
            <input type="password" className="w-full border border-gray-300 rounded px-2 py-1 text-sm" value={exportPassword} onChange={(e) => setExportPassword(e.target.value)} disabled={!exportProtectSheet} placeholder="Opcional" />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={exportToExcel}
            disabled={exportInProgress}
            className={`px-4 py-2 rounded text-sm font-semibold text-white transition-colors ${exportInProgress ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {exportInProgress ? "Exportando..." : "Descargar archivo"}
          </button>
        </div>

        <div className="space-y-1">
          <div className="h-2 bg-gray-100 rounded overflow-hidden">
            <div className={`h-full ${exportError ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(0, Math.min(100, exportProgress))}%` }}></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={exportError ? "text-rose-600" : "text-gray-600"}>{exportError || exportStatus || "Listo para exportar"}</span>
            <span className="text-gray-500">{Math.round(exportProgress)}%</span>
          </div>
        </div>

        {exportLogs.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-36 overflow-auto">
            {exportLogs.map((entry, idx) => (
              <div key={`${entry.ts}-${idx}`} className={`text-[11px] ${entry.level === "error" ? "text-rose-700" : entry.level === "warning" ? "text-amber-700" : "text-slate-600"}`}>
                {entry.ts.slice(11, 19)} · {entry.message}
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleModeChange("config")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mode === "config" ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-gray-700 border-gray-300"}`}
            >
              Configuración
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mode === "dashboard" ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-gray-700 border-gray-300"} ${savedYears.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={savedYears.length === 0}
            >
              Dashboards definitivos
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Año activo:</span>
              <span className="text-gray-800 font-bold">{currentYear}</span>
            </div>
            {mode === "dashboard" && savedYears.length > 0 && (
              <div className="flex items-center gap-2">
                <span>Años guardados:</span>
                <div className="flex flex-wrap gap-1">
                  {savedYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectDashboardYear(y)}
                      className={`px-2 py-0.5 rounded-full border text-[11px] ${activeDashboardYear === y ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-gray-600 border-gray-300"}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {mode === "config" && vacationSectionOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Gestor de vacaciones</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">Año {year}</span>
                  <button
                    type="button"
                    onClick={() => setVacationSectionOpen(false)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Año de planificación</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-blue"
                    value={year}
                    min="2024"
                    max="2100"
                    onChange={(e) => handleYearChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Integrante</label>
                  <select
                    className="w-full bg-white text-gray-700 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-blue"
                    value={selectedVacationEmpName}
                    onChange={(e) => setSelectedVacationEmpName(e.target.value)}
                  >
                    {EMPLOYEES.map((e) => (
                      <option key={e.id} value={e.name}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Días seleccionados: {vacationPlan[selectedVacationEmpName]?.length || 0}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAcceptCalendar}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-semibold shadow-md transition-colors"
                >
                  Aceptar calendario {year}
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">Calendario de vacaciones</h4>
                <span className="text-[11px] text-gray-500">Click en un día para alternar vacaciones</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {daysByMonth.map(([monthName, monthDays]) => (
                  <div key={monthName}>
                    <div className="text-xs font-semibold text-gray-500 mb-1">{monthName}</div>
                    <div className="grid grid-cols-5 gap-1">
                      {monthDays.map((day) => {
                        const isSelected = (vacationPlan[selectedVacationEmpName] || []).includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleVacationDay(selectedVacationEmpName, day.id)}
                            className={`h-10 rounded-md border text-[11px] flex flex-col items-center justify-center ${
                              isSelected
                                ? "bg-rose-500 text-white border-rose-500"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span className="font-mono">{day.label.split(" ")[1]}</span>
                            <span className="text-[9px] opacity-80">{day.weekdayLetter}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {mode === "config" && !vacationSectionOpen && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            El gestor de vacaciones está oculto. Pulsa “Ver vacaciones” en la barra superior para abrirlo.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-full bg-brand-blue bg-opacity-20 text-brand-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Integrantes</p>
            <p className="text-2xl font-bold text-gray-800">{EMPLOYEES.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-full ${stats.alerts.length > 0 ? "bg-rose-500" : "bg-emerald-500"} bg-opacity-20 text-gray-800`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Conflictos / Alertas</p>
            <p className="text-2xl font-bold text-gray-800">{stats.alerts.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-full bg-amber-500 bg-opacity-20 text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div >
          <div>
            <p className="text-sm text-gray-500">Días con forzado oficina (O)</p>
            <p className="text-2xl font-bold text-gray-800">{stats.forcedOfficeDetails.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Leyenda</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-emerald-700"></div>
              <span className="text-xs text-gray-600">Intensiva 30h</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-700"></div>
              <span className="text-xs text-gray-600">40h (17:00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-violet-700"></div>
              <span className="text-xs text-gray-600">42h (18:00, V 14:00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-rose-700"></div>
              <span className="text-xs text-gray-600">Vacaciones</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-600 flex items-center justify-center text-white">
                <IconHome className="w-[10px] h-[10px]" />
              </div>
              <span className="text-xs text-gray-600">Teletrabajo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-600 flex items-center justify-center text-white">
                <IconOffice className="w-[10px] h-[10px]" />
              </div>
              <span className="text-xs text-gray-600">En oficina</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-white">
                <IconOffice className="w-[10px] h-[10px]" />
              </div>
              <span className="text-xs text-gray-600">Forzado oficina</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">* Click en celda para ver detalle de turno</p>
        </div>
      </div>

      {/* Alerts Section */}
      {
        stats.alerts.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Status Banner with Category Counters */}
            {(() => {
              const allReasons = stats.alerts.flatMap(a => a.reasons);
              const criticalCount = allReasons.filter(r => r.severity === "critical").length;
              const warningCount = allReasons.filter(r => r.severity === "warning").length;
              const infoCount = allReasons.filter(r => r.severity === "info").length;
              const allCovered = criticalCount === 0 && warningCount === 0;

              return (
                <div className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center gap-4 ${allCovered ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full shrink-0 ${allCovered ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {allCovered ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold ${allCovered ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {allCovered ? 'Planificación sin conflictos' : 'Atención requerida en la planificación'}
                      </h3>
                      <p className={`text-sm ${allCovered ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {allCovered
                          ? `${stats.alerts.length} días con observaciones informativas, todas cubiertas.`
                          : `${stats.alerts.length} días con alertas · ${criticalCount + warningCount} requieren revisión.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {criticalCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        {criticalCount} críticas
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        {warningCount} advertencias
                      </span>
                    )}
                    {infoCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {infoCount} cubiertas
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )
      }

      {viewMode === "matrix" ? (
        <>
          <div
            className="overflow-x-auto pb-4 border border-gray-200 rounded-xl bg-white shadow-xl"
            onMouseLeave={() => {
              setHoveredEmpId(null);
              setHoveredDayId(null);
            }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className={`sticky left-0 z-20 bg-gray-50 ${tableSpacing.firstColHeader} border-b border-r border-gray-200 w-48 min-w-[12rem]`}>
                    <div className="font-bold text-brand-blue">Integrante</div>
                  </th>
                  {days.map((day) => {
                    const turnoA_18h = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
                    const hasAlert = stats.alerts.some(a => a.dayId === day.id);
                    return (
                      <th
                        key={day.id}
                        onMouseEnter={() => setHoveredDayId(day.id)}
                        className={`${tableSpacing.headerCell} border-b border-gray-200 min-w-[4.5rem] text-center border-l border-gray-100 relative ${
                          hoveredDayId === day.id ? "bg-blue-50" : "bg-gray-50"
                        }`}
                      >
                        {hasAlert && (
                          <div
                            className="absolute top-1 right-1 cursor-pointer bg-rose-100 border border-rose-300 text-rose-700 hover:bg-rose-200 rounded-full w-[18px] h-[18px] flex items-center justify-center text-[11px] font-bold shadow-sm z-10 transition-colors"
                            title="Día con alertas (Click para ver)"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlertDayId(day.id);
                            }}
                          >
                            !
                          </div>
                        )}
                        <div className="text-[11px] text-brand-blue font-semibold">{WEEKDAY_FULL[day.weekdayLetter]}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{day.month.substring(0, 3)}</div>
                        <div className="text-xs font-mono text-gray-600">{day.label.split(" ")[1]}</div>
                        <div className="mt-1 text-[9px] text-gray-400 font-normal">{turnoA_18h ? "Gr.A 18h" : "Gr.B 18h"}</div>
                        <div className="mt-2 h-1 w-full bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`h-full ${stats.dailyCoverage.find((s) => s.dayId === day.id).present < 3 ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${(stats.dailyCoverage.find((s) => s.dayId === day.id).present / 6) * 100}%` }}
                          ></div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onMouseEnter={() => setHoveredEmpId(emp.id)}
                    className={`group transition-colors ${hoveredEmpId === emp.id ? "bg-blue-50/40" : "hover:bg-gray-50"}`}
                  >
                    <td className={`sticky left-0 z-10 ${tableSpacing.firstColCell} border-r border-b border-gray-200 ${
                      hoveredEmpId === emp.id ? "bg-blue-50" : "bg-white group-hover:bg-gray-50"
                    }`}>
                      <div className="font-medium text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${emp.group === "A" ? "bg-purple-500" : "bg-orange-500"}`}></span>Grupo {emp.group}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Intensiva: {stats.intensiveWeeksByEmp[emp.id]} semanas · Horas: {stats.totalHoursByEmp[emp.id]}
                      </div>
                    </td>
                    {days.map((day) => {
                      const typeKey = schedule[emp.id][day.id];
                      const style = TYPES[typeKey] || TYPES["O30"];
                      const isForcedOffice = stats.forcedOfficeSet[day.id]?.has(emp.id);
                      const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
                      const isInOffice = daysOffice.includes(day.weekdayLetter) && typeKey !== "V";
                      const isWFH = !daysOffice.includes(day.weekdayLetter) && typeKey !== "V" && !isForcedOffice;
                      const isHighlighted = hoveredEmpId === emp.id || hoveredDayId === day.id;
                      return (
                        <td
                          key={day.id}
                          onMouseEnter={() => {
                            setHoveredEmpId(emp.id);
                            setHoveredDayId(day.id);
                          }}
                          className={`${tableSpacing.bodyCell} border-b border-gray-200 relative cursor-pointer border-l border-gray-100 ${
                            isHighlighted ? "bg-blue-50/50" : ""
                          }`}
                          onClick={() => handleCellClick(emp, day)}
                        >
                          <div className={`w-full ${tableSpacing.slotHeight} rounded-md flex flex-col items-center justify-center text-xs font-bold shadow-sm cell-transition relative overflow-hidden ${style.color} ${style.text} ring-1 ring-black/10 ${isHighlighted ? "brightness-110 scale-[1.02]" : "hover:brightness-110 hover:scale-105"} transform`}>
                            <span>{style.short}</span>
                            {typeKey === "O42" && <div className="absolute bottom-0 w-full h-1 bg-amber-400 opacity-70"></div>}
                            {isWFH && (
                              <div className="absolute top-0.5 left-0.5 bg-gray-900/50 rounded p-0.5 text-white" title="Teletrabajo">
                                <IconHome className="w-[10px] h-[10px]" />
                              </div>
                            )}
                            {(isInOffice || isForcedOffice) && typeKey !== "V" && (
                              <div className={`absolute top-0.5 right-0.5 rounded p-0.5 text-white ${isForcedOffice ? 'bg-amber-500/70' : 'bg-gray-900/50'}`} title={isForcedOffice ? "Forzado oficina" : "En oficina"}>
                                <IconOffice className="w-[10px] h-[10px]" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={days.length + 1} className="p-6 text-center text-sm text-gray-500">
                      No hay integrantes que coincidan con el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
          {calendarMonths.map((month) => (
            <div key={month.monthName} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h4 className="text-sm font-bold text-brand-blue">{month.monthName}</h4>
                <span className="text-[11px] text-gray-500">{filteredEmployees.length} integrantes</span>
              </div>
              <div className="grid grid-cols-5 border-b border-gray-200">
                {weekdaysCalendar.map((weekday) => (
                  <div key={`${month.monthName}-${weekday}`} className="text-center text-[11px] font-semibold text-gray-600 py-2 bg-gray-50 border-r last:border-r-0 border-gray-200">
                    {WEEKDAY_FULL[weekday]}
                  </div>
                ))}
              </div>
              <div>
                {month.weeks.map((week, weekIndex) => (
                  <div key={`${month.monthName}-week-${weekIndex}`} className="grid grid-cols-5 border-b last:border-b-0 border-gray-200">
                    {weekdaysCalendar.map((weekday) => {
                      const day = week[weekday];
                      if (!day) {
                        return <div key={`${month.monthName}-empty-${weekIndex}-${weekday}`} className="min-h-[8rem] bg-gray-50/30 border-r last:border-r-0 border-gray-100"></div>;
                      }
                      const hasAlert = stats.alerts.some((item) => item.dayId === day.id);
                      const coverage = stats.dailyCoverage.find((item) => item.dayId === day.id);
                      return (
                        <div key={day.id} className={`min-h-[8rem] p-1.5 border-r last:border-r-0 border-gray-100 ${hasAlert ? "bg-rose-50/50" : "bg-white"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-gray-700">{day.label.split(" ")[1]}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${coverage.present < 3 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {coverage.present}/6
                            </span>
                          </div>
                          <div className="space-y-1">
                            {filteredEmployees.map((emp) => {
                              const typeKey = schedule[emp.id][day.id];
                              const style = TYPES[typeKey] || TYPES.O30;
                              const isForcedOffice = stats.forcedOfficeSet[day.id]?.has(emp.id);
                              const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
                              const isWFH = !daysOffice.includes(day.weekdayLetter) && typeKey !== "V" && !isForcedOffice;
                              const initials = emp.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);
                              return (
                                <button
                                  key={`${day.id}-${emp.id}`}
                                  type="button"
                                  onClick={() => handleCellClick(emp, day)}
                                  className={`w-full text-left text-[10px] px-1.5 py-1 rounded flex items-center justify-between gap-1 overflow-hidden ${style.color} ${style.text} hover:brightness-110 transition-colors`}
                                >
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="font-semibold">{initials}</span> <span>{style.short}</span>
                                  </div>
                                  {typeKey !== "V" && (
                                    <div className={`shrink-0 flex items-center justify-center ${isForcedOffice ? 'text-amber-700 bg-white/60 rounded-[2px] p-[1px]' : 'opacity-80'}`} title={isForcedOffice ? "Forzado oficina" : (isWFH ? "Teletrabajo" : "En oficina")}>
                                     {isWFH ? <IconHome className="w-3 h-3" /> : <IconOffice className={`w-3 h-3 ${isForcedOffice ? 'text-amber-700' : ''}`} />}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Creado por David Ramos (Dept. Sistemas)</p>
      </footer>
      <AlertDetailModal isOpen={!!selectedAlertDayId} onClose={() => setSelectedAlertDayId(null)} dayId={selectedAlertDayId} />
    </div >
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
