



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
          const hasFullSchedule = (type === "O40" || type === "O42");
          if (isInOffice && hasFullSchedule) {
            if (GROUP1.includes(e.name)) { group1HasOffice = true; group1Covering++; }
            if (GROUP2.includes(e.name)) { group2HasOffice = true; group2Covering++; }
          }
        } else {
          if (isInOffice && type === "O40") {
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

    const selected = [];
    for (const emp of eligibleIntensive) {
      if (intensiveWeeksByEmp[emp.id] >= 7) continue;
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

        const empOfficeDays = emp.officeDays.split(",").map((d) => d.trim());
        const isInOffice = empOfficeDays.includes(day.weekdayLetter);

        const currentIntensiveCount = EMPLOYEES.filter(
          (e) => schedule[e.id][day.id] === "O30"
        ).length;
        if (currentIntensiveCount >= 3) continue;

        if (!isInOffice) {
          schedule[emp.id][day.id] = "O30";
          if (!isValidCoverage([day], schedule)) {
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
          if (!isValidCoverage([day], schedule)) {
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
            if (!isValidCoverage(daysInWeek, schedule)) {
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
        if (!canFlip || !preservesOfficeCoverage(emp.id, daysInWeek, schedule)) return;
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

    const canTakeO30 = (emp, wi) => {
      if (vacWeeksByEmp[emp.id].has(wi)) return false;
      if (emp.name === "Enrique" && forbiddenWeekEnrique === wi) return false;
      if (emp.name === "Luis" && forbiddenWeekLuis === wi) return false;
      if (emp.name === "Kike") {
        const daysInWeekCheck = finalWeeksMap[wi];
        if (daysInWeekCheck.some((day) => criticalKikeSet.has(day.id)))
          return false;
      }
      const daysInWeek = finalWeeksMap[wi];
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
    const targetIntensiveWeeks = 7;

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

          if (canAssignStrict && preservesOfficeCoverage(emp.id, daysInWeek, schedule)) {
            // Take free slot
            daysInWeek.forEach((day) => {
              if (schedule[emp.id][day.id] !== "V") {
                schedule[emp.id][day.id] = "O30";
              }
            });
            finalIntensiveWeeks[emp.id]++;
            balancing = true;
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
                  if (preservesOfficeCoverage(emp.id, daysSrc, schedule)) {
                     daysSrc.forEach((d) => {
                        if (schedule[emp.id][d.id] !== "V") schedule[emp.id][d.id] = "O30";
                     });
                     finalIntensiveWeeks[donor.id]--;
                     finalIntensiveWeeks[emp.id]++;
                     moved = true;
                     balancing = true;
                     break;
                  } else {
                     // Revert donor to O30
                     daysSrc.forEach((d) => {
                        if (schedule[donor.id][d.id] !== "V") schedule[donor.id][d.id] = "O30";
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
                
                if (!canMoveDonorStrict || !preservesOfficeCoverage(donor.id, daysDest, schedule)) continue;

                // Move donor
                const daysSrc = finalWeeksMap[wi];
                const daysDest_ = finalWeeksMap[destWi];

                // Simulate donor leaving src
                daysSrc.forEach((d) => {
                   if (schedule[donor.id][d.id] !== "V")
                     schedule[donor.id][d.id] = "O40";
                });
                
                if (preservesOfficeCoverage(emp.id, daysSrc, schedule)) {
                   daysDest_.forEach((d) => {
                     if (schedule[donor.id][d.id] !== "V")
                       schedule[donor.id][d.id] = "O30";
                   });
                   daysSrc.forEach((d) => {
                     if (schedule[emp.id][d.id] !== "V")
                       schedule[emp.id][d.id] = "O30";
                   });
                   finalIntensiveWeeks[emp.id]++;
                   moved = true;
                   balancing = true;
                   break;
                } else {
                   // Revert donor simulation
                   daysSrc.forEach((d) => {
                     if (schedule[donor.id][d.id] !== "V")
                       schedule[donor.id][d.id] = "O30";
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

    // Final check to ensure we didn't break O42 coverage during swapping
    days.forEach((day) => {
      if (day.weekdayLetter === "V") return; // Friday doesn't need O42
      
      const hasO42 = EMPLOYEES.some((emp) => schedule[emp.id][day.id] === "O42");
      if (!hasO42) {
          // Restore O42 using the correct group for the week
          const lateGroupA = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
          const lateGroup = lateGroupA ? "A" : "B";
          
          const candidates = EMPLOYEES.filter(
              (emp) => emp.group === lateGroup && schedule[emp.id][day.id] !== "V"
          ).sort((a, b) => {
              // Prefer O40s to become O42s to avoid breaking intensives
              const typeA = schedule[a.id][day.id];
              const typeB = schedule[b.id][day.id];
              if (typeA === "O40" && typeB !== "O40") return -1;
              if (typeB === "O40" && typeA !== "O40") return 1;
              // Then prefer those with more intensive weeks
              return finalIntensiveWeeks[b.id] - finalIntensiveWeeks[a.id];
          });
          
          const pick = candidates[0] || EMPLOYEES.find((emp) => schedule[emp.id][day.id] !== "V");
          if (pick) {
              if (schedule[pick.id][day.id] === "O30") finalIntensiveWeeks[pick.id]--;
              schedule[pick.id][day.id] = "O42";
          }
      }
    });
  }

  return { schedule, days };
};


const { schedule, days } = generateSchedule(2026, DEFAULT_VACATION_PLAN_2026);

// Re-create the useMemo logic for stats
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

  candidates.sort((a, b) => tempForcedCount[a.id] - tempForcedCount[b.id]);
  return candidates[0];
};



const dailyCoverage = days.map((day) => {
  let present = 0, vacation = 0, shift18hCount = 0, intensiveCount = 0;
  let group1HasOffice = false, group2HasOffice = false;
  let group1Covering = [], group2Covering = [];

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
    if (!group1HasOffice && group2Covering.length === 0) {
      const candidate = getBestCandidate(GROUP1, day);
      if (candidate) {
        forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
        forcedOfficeSet[day.id].add(candidate.id);
        forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo 1" });
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
        forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo 2" });
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
        let candidate = o40NotOffice.find((e) => e.name === "Luis") || o40NotOffice.find((e) => e.group !== lateGroup) || o40NotOffice[0];
        if (candidate) {
          forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
          forcedOfficeSet[day.id].add(candidate.id);
          forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Viernes" });
          tempForcedCount[candidate.id]++;
        }
      }
    }
  }
});

console.log("Total forced office days: " + forcedOfficeDetails.length);
console.log(JSON.stringify(forcedOfficeDetails, null, 2));

const intensiveWeeks = {};
EMPLOYEES.forEach(emp => {
    let count = 0;
    const weeks = {};
    days.forEach(d => { weeks[d.weekIndex] = weeks[d.weekIndex] || []; weeks[d.weekIndex].push(d); });
    Object.values(weeks).forEach(weekDays => {
        if (weekDays.every(d => schedule[emp.id][d.id] === "O30")) count++;
    });
    intensiveWeeks[emp.name] = count;
});
console.log("Intensive weeks per emp:", intensiveWeeks);
