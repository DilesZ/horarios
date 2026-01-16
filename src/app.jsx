const { useState, useMemo, useEffect } = React;

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
  O40: { label: "40h (hasta las 17:00)", color: "bg-blue-600", text: "text-white", short: "40" },
  O42: { label: "42h (hasta las 18:00, Viernes 14:00)", color: "bg-indigo-600", text: "text-white", short: "42" },
  O30: { label: "Intensiva 30h (hasta las 14:00)", color: "bg-emerald-500", text: "text-white", short: "30" },
  T30: { label: "Teletrabajo 30h", color: "bg-teal-500", text: "text-white", short: "T30" },
  V: { label: "Vacaciones", color: "bg-rose-500", text: "text-white", short: "VAC" },
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

const generateSchedule = (year, vacationPlan) => {
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
      // Semana 20-24 Julio (Week 7): Enrique (B) a 40h -> B hace O40 -> A hace O42 (LATE)
      if (wi === 7) {
        weekAssignments[wi] = "A_LATE";
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
    const lateGroupA = SHIFT_BASE_A_18H ? wi % 2 === 0 : wi % 2 !== 0;
    const lateGroup = lateGroupA ? "A" : "B";

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

    const eligibleIntensive = reserve
      ? allEligible.filter((emp) => emp.id !== reserve.id)
      : allEligible;

    const safeForIntensive = eligibleIntensive.filter((emp) =>
      weekDays.every((day) => {
        const empOfficeDays = emp.officeDays.split(",").map((d) => d.trim());
        const isEmpInOffice = empOfficeDays.includes(day.weekdayLetter);
        if (!isEmpInOffice) return true;

        const empGroup = GROUP1.includes(emp.name) ? GROUP1 : GROUP2;
        const otherGroup = GROUP1.includes(emp.name) ? GROUP2 : GROUP1;

        const othersInOffice = EMPLOYEES.filter((other) => {
          if (other.id === emp.id) return false;
          if (!empGroup.includes(other.name)) return false;
          if (vacWeeksByEmp[other.id].has(wi)) return false;
          const otherOfficeDays = other.officeDays.split(",").map((d) => d.trim());
          return otherOfficeDays.includes(day.weekdayLetter);
        });

        const otherGroupHasO40 = EMPLOYEES.some((other) => {
          if (!otherGroup.includes(other.name)) return false;
          if (vacWeeksByEmp[other.id].has(wi)) return false;
          const currentType = schedule[other.id][day.id];
          if (currentType !== "O40") return false;
          const otherOfficeDays = other.officeDays.split(",").map((d) => d.trim());
          return otherOfficeDays.includes(day.weekdayLetter);
        });

        return othersInOffice.length > 0 || otherGroupHasO40;
      })
    );

    const selected = safeForIntensive
      .filter((emp) => intensiveWeeksByEmp[emp.id] < 7)
      .slice(0, 3);

    selected.forEach((emp) => {
      weekDays.forEach((day) => {
        if (schedule[emp.id][day.id] !== "V") {
          schedule[emp.id][day.id] = "O30";
        }
      });
      intensiveWeeksByEmp[emp.id] += 1;
    });

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
        const pick =
          lateCandidates[0] ||
          EMPLOYEES.find((emp) => schedule[emp.id][day.id] !== "V");
        if (pick) {
          schedule[pick.id][day.id] = "O42";
        }
      }
    });

    weekDays.forEach((day) => {
      if (day.weekdayLetter !== "V") return;

      const checkAndForceGroup = (groupNames) => {
        const hasCoverage = EMPLOYEES.some((emp) => {
          if (!groupNames.includes(emp.name)) return false;
          if (schedule[emp.id][day.id] !== "O40") return false;
          const officeDays = emp.officeDays.split(",").map((d) => d.trim());
          return officeDays.includes("V");
        });

        if (!hasCoverage) {
          const candidates = groupNames
            .map((name) => EMPLOYEES.find((e) => e.name === name))
            .filter((emp) => emp && schedule[emp.id][day.id] !== "V")
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
              intensiveWeeksByEmp[pick.id] =
                (intensiveWeeksByEmp[pick.id] || 0) - 1;
            }
            schedule[pick.id][day.id] = "O40";
          }
        }
      };

      checkAndForceGroup(GROUP1);
      checkAndForceGroup(GROUP2);
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

        const empOfficeDays = emp.officeDays.split(",").map((d) => d.trim());
        const isInOffice = empOfficeDays.includes(day.weekdayLetter);

        const currentIntensiveCount = EMPLOYEES.filter(
          (e) => schedule[e.id][day.id] === "O30"
        ).length;
        if (currentIntensiveCount >= 3) continue;

        if (!isInOffice) {
          schedule[emp.id][day.id] = "O30";
          swapped = true;
          break;
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
          swapped = true;
          break;
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
    while (currentIntensiveWeeks[emp.id] < 7) {
      let improved = false;
      Object.keys(weeksList).forEach((wiStr) => {
        if (improved) return;
        const wi = parseInt(wiStr, 10);
        if (vacWeeksByEmp[emp.id].has(wi)) return;
        const daysInWeek = weeksList[wi];
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

      if (intensiveCount < 7) {
        const day19 = days.find((d) => d.id === "2026-06-19");
        const forbiddenWeek = day19 ? day19.weekIndex : null;
        const candidateWeeks = Object.keys(weeksList)
          .map((wiStr) => parseInt(wiStr, 10))
          .sort((a, b) => a - b)
          .filter(
            (wi) =>
              wi !== forbiddenWeek &&
              !intensiveWeeksIndices.includes(wi) &&
              !vacWeeksByEmp[enrique.id].has(wi)
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

    EMPLOYEES.forEach((emp) => {
      while (finalIntensiveWeeks[emp.id] < 7) {
        let improved = false;
        Object.keys(finalWeeksMap).forEach((wiStr) => {
          if (improved) return;
          const wi = parseInt(wiStr, 10);
          if (vacWeeksByEmp[emp.id].has(wi)) return;

          if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) return;
          if (emp.name === "Luis" && forbiddenWeekLuis === wi) return;
          if (emp.name === "Kike") {
            const daysInWeekCheck = finalWeeksMap[wi];
            if (
              daysInWeekCheck.some((day) => criticalKikeSet.has(day.id))
            ) {
              return;
            }
          }

          const daysInWeek = finalWeeksMap[wi];
          let canFlip = true;

          daysInWeek.forEach((day) => {
            if (!canFlip) return;
            const current = schedule[emp.id][day.id];
            if (!current || current === "V") {
              canFlip = false;
              return;
            }
            if (
              (emp.name === "Enrique" && day.id === "2026-06-19") ||
              (emp.name === "Luis" && day.id === "2026-07-24") ||
              (emp.name === "Kike" && criticalKikeSet.has(day.id))
            ) {
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

          if (!canFlip) return;

          daysInWeek.forEach((day) => {
            if (schedule[emp.id][day.id] !== "V") {
              schedule[emp.id][day.id] = "O30";
            }
          });

          finalIntensiveWeeks[emp.id] += 1;
          improved = true;
        });
        if (!improved) break;
      }
    });
  }

  return { schedule, days };
};

const App = () => {
  const [year, setYear] = useState(2026);
  const [vacationPlan, setVacationPlan] = useState(DEFAULT_VACATION_PLAN_2026);
  const [planning, setPlanning] = useState(() => generateSchedule(2026, DEFAULT_VACATION_PLAN_2026));
  const [selectedEmp, setSelectedEmp] = useState("all");
  const [modalData, setModalData] = useState({ isOpen: false, emp: null, day: null, typeKey: null });
  const [oListOpen, setOListOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(true);
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

  useEffect(() => {
    try {
      window.localStorage.setItem("horarios_dashboards", JSON.stringify(acceptedDashboards));
    } catch {}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
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

    const getBestCandidate = (groupNames, day) => {
      const candidates = EMPLOYEES.filter(emp => {
        if (!groupNames.includes(emp.name)) return false;
        const type = schedule[emp.id][day.id];
        if (type === "V") return false;
        const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
        return !daysOffice.includes(day.weekdayLetter);
      });

      if (candidates.length === 0) return null;

      // Ordenar por quién lleva menos carga forzada hasta ahora
      candidates.sort((a, b) => tempForcedCount[a.id] - tempForcedCount[b.id]);
      return candidates[0];
    };
    const dailyCoverage = days.map((day) => {
      let present = 0,
        vacation = 0,
        shift18hCount = 0,
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

      if (day.weekdayLetter !== "V") {
        if (!group1HasOffice) {
          const candidate = getBestCandidate(GROUP1, day);
          if (candidate) {
            forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
            forcedOfficeSet[day.id].add(candidate.id);
            forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo {Enrique/Luis/David}" });
            group1HasOffice = true;
            group1Covering.push(candidate.name);
            tempForcedCount[candidate.id]++;
          }
        }
        if (!group2HasOffice) {
          const candidate = getBestCandidate(GROUP2, day);
          if (candidate) {
            forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
            forcedOfficeSet[day.id].add(candidate.id);
            forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo {Jose/Ariel/Kike}" });
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
            o40NotOffice.sort((a, b) => tempForcedCount[a.id] - tempForcedCount[b.id]);
            let candidate =
              o40NotOffice.find((e) => e.name === "Luis") ||
              o40NotOffice.find((e) => e.group !== lateGroup) ||
              o40NotOffice[0];
            if (candidate) {
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
      return { dayId: day.id, present, vacation, shift18hCount, intensiveCount, group1HasOffice, group2HasOffice, group1Covering, group2Covering };
    });
    const alerts = dailyCoverage.filter((d) => {
      const day = days.find((x) => x.id === d.dayId);
      const need18h = day.weekdayLetter !== "V";
      const needGroups = day.weekdayLetter !== "V";
      return (
        d.present < 3 ||
        (need18h && d.shift18hCount < 1) ||
        d.intensiveCount > 3 ||
        (needGroups && (!d.group1HasOffice || !d.group2HasOffice))
      );
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
    return { dailyCoverage, alerts, forcedOfficeSet, forcedOfficeDetails, intensiveWeeksByEmp, totalHoursByEmp };
  }, [schedule, days]);

  const exportToExcel = () => {
    // Definir estilos
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } }, // blue-600
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };

    const getCellStyle = (type) => {
      let fgColor = "FFFFFF"; // default white
      let fontColor = "000000";

      if (type === "O40") { fgColor = "2563EB"; fontColor = "FFFFFF"; } // blue-600
      else if (type === "O42") { fgColor = "4F46E5"; fontColor = "FFFFFF"; } // indigo-600
      else if (type === "O30") { fgColor = "10B981"; fontColor = "FFFFFF"; } // emerald-500
      else if (type === "T30") { fgColor = "14B8A6"; fontColor = "FFFFFF"; } // teal-500
      else if (type === "V") { fgColor = "F43F5E"; fontColor = "FFFFFF"; } // rose-500

      return {
        fill: { fgColor: { rgb: fgColor } },
        font: { color: { rgb: fontColor } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    };

    // Crear datos
    const headers = ["Empleado", ...days.map((d) => `${d.id} (${d.weekdayLetter})`)];
    const dataRows = EMPLOYEES.map((emp) => {
      const row = [emp.name];
      days.forEach((day) => {
        row.push(schedule[emp.id][day.id]);
      });
      return row;
    });

    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Aplicar estilos
    // Headers (Row 0)
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = headerStyle;
    }

    // Data Rows
    dataRows.forEach((row, rIndex) => {
      const rowIndex = rIndex + 1; // +1 porque row 0 es headers
      row.forEach((cellValue, cIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: cIndex });
        if (!ws[cellRef]) return;
        
        if (cIndex === 0) {
           // Columna Empleado
           ws[cellRef].s = {
             font: { bold: true },
             alignment: { horizontal: "left" },
             border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
           };
        } else {
           // Columnas de días
           ws[cellRef].s = getCellStyle(cellValue);
        }
      });
    });

    // Ajustar ancho de columnas
    const colWidths = [{ wch: 15 }]; // Primera columna más ancha
    for (let i = 1; i < headers.length; i++) {
      colWidths.push({ wch: 12 });
    }
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horarios");
    XLSX.writeFile(wb, `planificacion_horarios_${currentYear}.xlsx`);
  };

  const handleCellClick = (emp, day) => {
    const typeKey = schedule[emp.id][day.id];
    setModalData({ isOpen: true, emp, day, typeKey });
  };

  const filteredEmployees = selectedEmp === "all" ? EMPLOYEES : EMPLOYEES.filter((e) => e.id === parseInt(selectedEmp));

  return (
    <div className="min-h-screen bg-white p-6 text-brand-dark">
      <WeekDetailModal {...modalData} onClose={() => setModalData({ ...modalData, isOpen: false })} />
      <ForcedOfficeListModal open={oListOpen} onClose={() => setOListOpen(false)} />
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-6">
          <img src="logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          <div>
            <h2 className="text-2xl font-bold text-brand-blue tracking-tight">Gestion Horaria Dept. Sistemas</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
          <button onClick={() => setOListOpen(true)} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm border border-gray-300 transition-colors shadow-sm">
            Ver O forzadas
          </button>
          <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm shadow-md transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Exportar Excel
          </button>
          <button
            onClick={() => setPlanning(generateSchedule(year, vacationPlan))}
            className="bg-brand-blue hover:bg-blue-800 text-white px-4 py-2 rounded text-sm shadow-md transition-colors"
          >
            Resetear Plan
          </button>
        </div>
      </header>
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
        {mode === "config" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Gestor de vacaciones</h3>
                <span className="text-[11px] text-gray-400">Año {year}</span>
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
              <div className="w-4 h-4 rounded bg-emerald-500"></div>
              <span className="text-xs text-gray-600">Intensiva 30h</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-600"></div>
              <span className="text-xs text-gray-600">40h (17:00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-indigo-600"></div>
              <span className="text-xs text-gray-600">42h (18:00, V 14:00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-rose-500"></div>
              <span className="text-xs text-gray-600">Vacaciones</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">* Click en celda para ver detalle de turno</p>
        </div>
      </div>

      {/* Alerts Section */}
      {
        stats.alerts.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Status Banner */}
            {(() => {
              const unresolvedAlerts = stats.alerts.filter(a => {
                const isGroup1Missing = !a.group1HasOffice;
                const isGroup2Missing = !a.group2HasOffice;
                const isCovered1 = a.group2Covering && a.group2Covering.length > 0;
                const isCovered2 = a.group1Covering && a.group1Covering.length > 0;

                if (isGroup1Missing && !isCovered1) return true;
                if (isGroup2Missing && !isCovered2) return true;
                if (a.present < 3 || a.shift18hCount < 1 || a.intensiveCount > 3) return true;

                return false;
              });
              const allCovered = unresolvedAlerts.length === 0;

              return (
                <div className={`p-4 rounded-lg border flex items-center gap-3 ${allCovered ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className={`p-2 rounded-full ${allCovered ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {allCovered ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-bold ${allCovered ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {allCovered ? 'Todas las alertas cubiertas' : 'Atención requerida en la planificación'}
                    </h3>
                    <p className={`text-sm ${allCovered ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {allCovered
                        ? 'Todas las ausencias de grupo están cubiertas por integrantes del otro grupo.'
                        : `${unresolvedAlerts.length} alertas requieren revisión manual.`}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-bold flex items-center gap-2">
                  Detalle de Alertas
                </h3>
                <button
                  onClick={() => setAlertsExpanded(!alertsExpanded)}
                  className="text-gray-500 hover:text-brand-blue transition-colors focus:outline-none"
                >
                  {alertsExpanded ? (
                    <div className="flex items-center gap-1 text-sm">
                      <span>Ocultar</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm">
                      <span>Mostrar</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              </div>
              {alertsExpanded && (
                <ul className="space-y-3">
                {stats.alerts.map(alert => {
                  const day = days.find(d => d.id === alert.dayId);
                  let msgs = [];
                  let isFullyCovered = true;

                  if (alert.present < 3) { msgs.push(`Solo ${alert.present} disponibles (Mín: 3).`); isFullyCovered = false; }
                  if (alert.shift18hCount < 1) { msgs.push(`Sin cobertura hasta las 18h.`); isFullyCovered = false; }
                  if (alert.intensiveCount > 3) { msgs.push(`Más de 3 en intensiva (30h).`); isFullyCovered = false; }

                  if (!alert.group1HasOffice) {
                    let msg = `Falta alguien de {Enrique/Luis/David} en oficina.`;
                    if (alert.group2Covering && alert.group2Covering.length > 0) {
                      msg += ` (Cubierto por: ${alert.group2Covering.join(', ')}).`;
                    } else {
                      isFullyCovered = false;
                    }
                    msgs.push(msg);
                  }
                  if (!alert.group2HasOffice) {
                    let msg = `Falta alguien de {Jose/Ariel/Kike} en oficina.`;
                    if (alert.group1Covering && alert.group1Covering.length > 0) {
                      msg += ` (Cubierto por: ${alert.group1Covering.join(', ')}).`;
                    } else {
                      isFullyCovered = false;
                    }
                    msgs.push(msg);
                  }

                  return (
                    <li key={alert.dayId} className={`text-sm p-3 rounded border flex items-start gap-3 ${isFullyCovered ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                      <div className={`mt-0.5 ${isFullyCovered ? 'text-gray-400' : 'text-rose-500'}`}>
                        {isFullyCovered ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold mr-1">Día {day.label}:</span>
                        {msgs.join(' ')}
                      </div>
                    </li>
                  );
                })}
              </ul>
              )}
            </div>
          </div>
        )
      }

      <div className="overflow-x-auto pb-4 border border-gray-200 rounded-xl bg-white shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 p-4 border-b border-r border-gray-200 w-48 min-w-[12rem]">
                <div className="font-bold text-brand-blue">Integrante</div>
              </th>
              {days.map((day) => {
                const turnoA_18h = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
                return (
                  <th key={day.id} className={`p-2 border-b border-gray-200 min-w-[4.5rem] text-center border-l border-gray-100 bg-gray-50`}>
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
              <tr key={emp.id} className="group hover:bg-gray-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white p-3 border-r border-b border-gray-200 group-hover:bg-gray-50">
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
                  const isWFH = !daysOffice.includes(day.weekdayLetter) && typeKey !== "V" && !isForcedOffice;
                  return (
                    <td key={day.id} className={`p-1 border-b border-gray-200 relative cursor-pointer border-l border-gray-100`} onClick={() => handleCellClick(emp, day)}>
                      <div className={`w-full h-10 rounded-md flex flex-col items-center justify-center text-xs font-bold shadow-sm cell-transition relative overflow-hidden ${style.color} ${style.text} hover:brightness-110 hover:scale-105 transform`}>
                        <span>{style.short}</span>
                        {typeKey === "O42" && <div className="absolute bottom-0 w-full h-1 bg-amber-400 opacity-70"></div>}
                        {isWFH && <div className="absolute top-1 left-1 text-[10px] font-bold bg-gray-900/60 text-white border border-gray-500 rounded px-1">T</div>}
                        {isForcedOffice && <div className="absolute top-1 right-1 text-[10px] font-bold bg-gray-900/60 text-white border border-gray-500 rounded px-1">O</div>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Creado por David Ramos (Dept. Sistemas)</p>
      </footer>
    </div >
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
