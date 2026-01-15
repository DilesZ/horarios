const { useState, useMemo } = React;

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

const buildDaysRange = () => {
  const start = new Date(2026, 5, 1);
  const end = new Date(2026, 8, 30);
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
const DAYS = buildDaysRange();

const TYPES = {
  O40: { label: "40h (hasta las 17:00)", color: "bg-blue-600", text: "text-white", short: "40" },
  O42: { label: "42h (hasta las 18:00, Viernes 14:00)", color: "bg-indigo-600", text: "text-white", short: "42" },
  O30: { label: "Intensiva 30h (hasta las 14:00)", color: "bg-emerald-500", text: "text-white", short: "30" },
  T30: { label: "Teletrabajo 30h", color: "bg-teal-500", text: "text-white", short: "T30" },
  V: { label: "Vacaciones", color: "bg-rose-500", text: "text-white", short: "VAC" },
};

const VACATION_PLAN = {
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
    "2026-07-27",
    "2026-07-28",
    "2026-07-29",
    "2026-07-30",
    "2026-07-31",
    "2026-08-25",
  ],
};

const GROUP1 = ["Enrique", "Luis", "David"];
const GROUP2 = ["Jose", "Ariel", "Kike"];
const SHIFT_BASE_A_18H = true;
const HOURS_PER_TYPE = { O30: 6, O40: 8, O42: 9, V: 0 };

const generateInitialSchedule = () => {
  const schedule = {};
  const vacWeeksByEmp = {};
  EMPLOYEES.forEach((emp) => {
    const set = new Set();
    const vacs = VACATION_PLAN[emp.name] || [];
    vacs.forEach((dateStr) => {
      const dayEntry = DAYS.find((d) => d.id === dateStr);
      if (dayEntry) set.add(dayEntry.weekIndex);
    });
    vacWeeksByEmp[emp.id] = set;
  });
  EMPLOYEES.forEach((emp) => {
    schedule[emp.id] = {};
    DAYS.forEach((day) => {
      const vacationsForEmp = VACATION_PLAN[emp.name] || [];
      if (vacationsForEmp.includes(day.id)) {
        schedule[emp.id][day.id] = "V";
        return;
      }
      const isGroupA = emp.group === "A";
      const isTurnoTarde = SHIFT_BASE_A_18H
        ? isGroupA
          ? day.weekIndex % 2 === 0
          : day.weekIndex % 2 !== 0
        : isGroupA
        ? day.weekIndex % 2 !== 0
        : day.weekIndex % 2 === 0;
      if (!isTurnoTarde) schedule[emp.id][day.id] = "O40";
      else schedule[emp.id][day.id] = "O42";
    });
  });
  const weeks = {};
  DAYS.forEach((day) => {
    weeks[day.weekIndex] = weeks[day.weekIndex] || [];
    weeks[day.weekIndex].push(day);
  });
  const intensiveWeeksByEmp = {};
  EMPLOYEES.forEach((emp) => (intensiveWeeksByEmp[emp.id] = 0));
  Object.keys(weeks).forEach((wiStr) => {
    const wi = parseInt(wiStr, 10);
    const weekDays = weeks[wi];
    const lateGroupA = SHIFT_BASE_A_18H ? wi % 2 === 0 : wi % 2 !== 0;
    const lateGroup = lateGroupA ? "A" : "B";
    const lateAvailable = EMPLOYEES.filter((emp) => emp.group === lateGroup && !vacWeeksByEmp[emp.id].has(wi)).sort((a, b) => {
      const diff = intensiveWeeksByEmp[b.id] - intensiveWeeksByEmp[a.id];
      return diff !== 0 ? diff : a.id - b.id;
    });
    const anchor = lateAvailable.length ? lateAvailable[0] : null;
    const allEligible = EMPLOYEES.filter((emp) => !vacWeeksByEmp[emp.id].has(wi) && (!anchor || emp.id !== anchor.id));
    allEligible.sort((a, b) => {
      const diff = intensiveWeeksByEmp[a.id] - intensiveWeeksByEmp[b.id];
      return diff !== 0 ? diff : a.id - b.id;
    });
    const nonLate = EMPLOYEES.filter((emp) => emp.group !== lateGroup);
    const nonLateHasVacation = nonLate.some((emp) => vacWeeksByEmp[emp.id].has(wi));
    let reserve = null;
    if (nonLateHasVacation) {
      const reserveCandidates = nonLate.filter((emp) => !vacWeeksByEmp[emp.id].has(wi));
      reserveCandidates.sort((a, b) => {
        const diff = intensiveWeeksByEmp[b.id] - intensiveWeeksByEmp[a.id];
        return diff !== 0 ? diff : a.id - b.id;
      });
      reserve = reserveCandidates[0] || null;
    }
    const eligibleIntensive = reserve ? allEligible.filter((emp) => emp.id !== reserve.id) : allEligible;
    const selected = eligibleIntensive.filter((emp) => intensiveWeeksByEmp[emp.id] < 7).slice(0, 3);
    selected.forEach((emp) => {
      weekDays.forEach((day) => {
        if (schedule[emp.id][day.id] !== "V") schedule[emp.id][day.id] = "O30";
      });
      intensiveWeeksByEmp[emp.id] += 1;
    });
    if (anchor) {
      weekDays.forEach((day) => {
        if (schedule[anchor.id][day.id] !== "V") schedule[anchor.id][day.id] = "O42";
      });
    }
    EMPLOYEES.forEach((emp) => {
      if (vacWeeksByEmp[emp.id].has(wi)) return;
      if (anchor && emp.id === anchor.id) return;
      if (!selected.includes(emp)) {
        weekDays.forEach((day) => {
          if (schedule[emp.id][day.id] !== "V" && schedule[emp.id][day.id] !== "O30") {
            const isGroupA = emp.group === "A";
            const isTurnoTarde = SHIFT_BASE_A_18H
              ? isGroupA
                ? wi % 2 === 0
                : wi % 2 !== 0
              : isGroupA
              ? wi % 2 !== 0
              : wi % 2 === 0;
            if (!isTurnoTarde) schedule[emp.id][day.id] = "O40";
            else schedule[emp.id][day.id] = "O42";
          }
        });
      }
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
        if (pick) schedule[pick.id][day.id] = "O42";
      }
    });
    weekDays.forEach((day) => {
      if (day.weekdayLetter !== "V") return;
      const hasOfficeO40 = EMPLOYEES.some((emp) => {
        const type = schedule[emp.id][day.id];
        if (type !== "O40") return false;
        const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
        return daysOffice.includes("V");
      });
      if (!hasOfficeO40) {
        let candidate = EMPLOYEES.find((e) => e.name === "Luis" && schedule[e.id][day.id] !== "V");
        if (!candidate) {
          candidate =
            EMPLOYEES.find((e) => e.group !== lateGroup && schedule[e.id][day.id] !== "V") ||
            EMPLOYEES.find((e) => schedule[e.id][day.id] !== "V");
        }
        if (candidate) schedule[candidate.id][day.id] = "O40";
      }
    });
  });
  const weeksList = {};
  DAYS.forEach((d) => {
    weeksList[d.weekIndex] = weeksList[d.weekIndex] || [];
    weeksList[d.weekIndex].push(d);
  });
  const currentIntensiveWeeks = {};
  EMPLOYEES.forEach((emp) => {
    let count = 0;
    Object.keys(weeksList).forEach((wiStr) => {
      const daysInWeek = weeksList[wiStr];
      const allO30 = daysInWeek.every((day) => schedule[emp.id][day.id] === "O30");
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
        const hasO42ForEmp = daysInWeek.some((day) => schedule[emp.id][day.id] === "O42");
        if (hasO42ForEmp) return;
        const allO40 = daysInWeek.every((day) => schedule[emp.id][day.id] === "O40");
        if (!allO40) return;
        const canFlip = daysInWeek.every((day) => {
          const o30Count = EMPLOYEES.filter((e) => schedule[e.id][day.id] === "O30").length;
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
  return schedule;
};

const App = () => {
  const [schedule, setSchedule] = useState(generateInitialSchedule);
  const [selectedEmp, setSelectedEmp] = useState("all");
  const [modalData, setModalData] = useState({ isOpen: false, emp: null, day: null, typeKey: null });
  const [oListOpen, setOListOpen] = useState(false);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-1">
              {emp.name} <span className="text-slate-500 text-sm font-normal">({emp.role})</span>
            </h3>
            <p className="text-blue-400 font-medium">Fecha {day.label}</p>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Estado Actual</p>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${typeInfo.color}`}></div>
                <span className="text-lg font-semibold text-white">{typeInfo.label}</span>
              </div>
            </div>
            {typeKey !== "V" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Horario Salida</p>
                    <p className={`text-lg font-bold ${typeKey.includes("30") ? "text-emerald-400" : "text-amber-400"}`}>{horarioSalida}</p>
                  </div>
                  <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Grupo Turno</p>
                    <p className="text-lg font-bold text-slate-200">Grupo {emp.group}</p>
                  </div>
                </div>
                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Días en Oficina (Fijos)</p>
                  <p className="text-white font-medium">{diasOficina}</p>
                </div>
              </>
            )}
            {typeKey === "V" && (
              <div className="bg-rose-900/20 p-4 rounded-lg border border-rose-900/50 text-center">
                <p className="text-rose-300">🌴 Disfrutando de vacaciones</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ForcedOfficeListModal = ({ open, onClose }) => {
    if (!open) return null;
    const entries = stats.forcedOfficeDetails
      .map((it) => {
        const day = DAYS.find((d) => d.id === it.dayId);
        const emp = EMPLOYEES.find((e) => e.id === it.empId);
        return { day, emp, reason: it.reason };
      })
      .sort((a, b) => a.day.id.localeCompare(b.day.id) || a.emp.id - b.emp.id);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Listado de O forzadas</h3>
            <p className="text-slate-400 text-sm">Motivo por el que deben asistir a la oficina</p>
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b border-slate-700 text-slate-300">Fecha</th>
                  <th className="p-2 border-b border-slate-700 text-slate-300">Día</th>
                  <th className="p-2 border-b border-slate-700 text-slate-300">Integrante</th>
                  <th className="p-2 border-b border-slate-700 text-slate-300">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-slate-500">No hay O forzadas en el periodo.</td></tr>}
                {entries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30">
                    <td className="p-2 border-b border-slate-700 text-slate-200">{row.day.label}</td>
                    <td className="p-2 border-b border-slate-700 text-slate-400">{WEEKDAY_FULL[row.day.weekdayLetter]}</td>
                    <td className="p-2 border-b border-slate-700 text-slate-200">{row.emp.name}</td>
                    <td className="p-2 border-b border-slate-700 text-slate-300">{row.reason}</td>
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
    const dailyCoverage = DAYS.map((day) => {
      let present = 0,
        vacation = 0,
        shift18hCount = 0,
        intensiveCount = 0;
      let group1HasOffice = false,
        group2HasOffice = false;
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
        if (daysOffice.includes(day.weekdayLetter)) {
          if (GROUP1.includes(emp.name)) group1HasOffice = true;
          if (GROUP2.includes(emp.name)) group2HasOffice = true;
        }
      });
      if (!group1HasOffice) {
        const candidate = EMPLOYEES.find((emp) => {
          if (!GROUP1.includes(emp.name)) return false;
          const type = schedule[emp.id][day.id];
          if (type === "V") return false;
          const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
          return !daysOffice.includes(day.weekdayLetter);
        });
        if (candidate) {
          forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
          forcedOfficeSet[day.id].add(candidate.id);
          forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo {Enrique/Luis/David}" });
          group1HasOffice = true;
        }
      }
      if (!group2HasOffice) {
        const candidate = EMPLOYEES.find((emp) => {
          if (!GROUP2.includes(emp.name)) return false;
          const type = schedule[emp.id][day.id];
          if (type === "V") return false;
          const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
          return !daysOffice.includes(day.weekdayLetter);
        });
        if (candidate) {
          forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
          forcedOfficeSet[day.id].add(candidate.id);
          forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Falta presencia del grupo {Jose/Ariel/Kike}" });
          group2HasOffice = true;
        }
      }
      if (day.weekdayLetter === "V") {
        const isGroupALate = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
        const lateGroup = isGroupALate ? "A" : "B";
        const o40NotOffice = EMPLOYEES.filter((emp) => {
          const type = schedule[emp.id][day.id];
          if (type !== "O40") return false;
          const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
          return !daysOffice.includes("V");
        });
        if (o40NotOffice.length > 0) {
          let candidate = o40NotOffice.find((e) => e.name === "Luis") || o40NotOffice.find((e) => e.group !== lateGroup) || o40NotOffice[0];
          if (candidate) {
            forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
            forcedOfficeSet[day.id].add(candidate.id);
            forcedOfficeDetails.push({ dayId: day.id, empId: candidate.id, reason: "Viernes: se requiere 40h en oficina tras 14:00" });
          }
        }
      }
      return { dayId: day.id, present, vacation, shift18hCount, intensiveCount, group1HasOffice, group2HasOffice };
    });
    const alerts = dailyCoverage.filter((d) => {
      const day = DAYS.find((x) => x.id === d.dayId);
      const need18h = day.weekdayLetter !== "V";
      return d.present < 3 || (need18h && d.shift18hCount < 1) || d.intensiveCount > 3 || !d.group1HasOffice || !d.group2HasOffice;
    });
    const weeksMap = {};
    DAYS.forEach((d) => {
      weeksMap[d.weekIndex] = weeksMap[d.weekIndex] || [];
      weeksMap[d.weekIndex].push(d);
    });
    const intensiveWeeksByEmp = {};
    const totalHoursByEmp = {};
    EMPLOYEES.forEach((emp) => {
      intensiveWeeksByEmp[emp.id] = 0;
      totalHoursByEmp[emp.id] = 0;
    });
    DAYS.forEach((day) => {
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
  }, [schedule]);

  const handleCellClick = (emp, day) => {
    const typeKey = schedule[emp.id][day.id];
    setModalData({ isOpen: true, emp, day, typeKey });
  };

  const filteredEmployees = selectedEmp === "all" ? EMPLOYEES : EMPLOYEES.filter((e) => e.id === parseInt(selectedEmp));

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <WeekDetailModal {...modalData} onClose={() => setModalData({ ...modalData, isOpen: false })} />
      <ForcedOfficeListModal open={oListOpen} onClose={() => setOListOpen(false)} />
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            <span className="text-blue-500">IT Ops</span> Calendar 2026
          </h1>
          <p className="text-slate-400 mt-1">Gestión de Vacaciones, Turnos y Presencialidad</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
          <button onClick={() => setOListOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm border border-slate-700 transition-colors">
            Ver O forzadas
          </button>
          <button onClick={() => setSchedule(generateInitialSchedule())} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm border border-slate-700 transition-colors">
            Resetear Plan
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-blue-500 bg-opacity-20 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Integrantes</p>
            <p className="text-2xl font-bold text-white">{EMPLOYEES.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${stats.alerts.length > 0 ? "bg-rose-500" : "bg-emerald-500"} bg-opacity-20 text-white`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-400">Conflictos / Alertas</p>
            <p className="text-2xl font-bold text-white">{stats.alerts.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-amber-500 bg-opacity-20 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-400">Días con forzado oficina (O)</p>
            <p className="text-2xl font-bold text-white">{stats.forcedOfficeDetails.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 flex flex-col justify-center">
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Leyenda</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-emerald-500"></div>
              <span className="text-xs text-slate-300">Intensiva 30h</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-600"></div>
              <span className="text-xs text-slate-300">40h (17:00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-indigo-600"></div>
              <span className="text-xs text-slate-300">42h (18:00, V 14:00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-rose-500"></div>
              <span className="text-xs text-slate-300">Vacaciones</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">* Click en celda para ver detalle de turno</p>
        </div>
      </div>
      <div className="overflow-x-auto pb-4 border border-slate-700 rounded-xl bg-slate-850 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-850 p-4 border-b border-r border-slate-700 w-48 min-w-[12rem]">
                <div className="font-bold text-slate-200">Integrante</div>
              </th>
              {DAYS.map((day) => {
                const turnoA_18h = SHIFT_BASE_A_18H ? day.weekIndex % 2 === 0 : day.weekIndex % 2 !== 0;
                return (
                  <th key={day.id} className={`p-2 border-b border-slate-700 min-w-[4.5rem] text-center border-l border-slate-800`}>
                    <div className="text-[11px] text-slate-300">{WEEKDAY_FULL[day.weekdayLetter]}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{day.month.substring(0, 3)}</div>
                    <div className="text-xs font-mono text-slate-300">{day.label.split(" ")[1]}</div>
                    <div className="mt-1 text-[9px] text-slate-500 font-normal">{turnoA_18h ? "Gr.A 18h" : "Gr.B 18h"}</div>
                    <div className="mt-2 h-1 w-full bg-slate-800 rounded overflow-hidden">
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
              <tr key={emp.id} className="group hover:bg-slate-800/50 transition-colors">
                <td className="sticky left-0 z-10 bg-slate-850 p-3 border-r border-b border-slate-700 group-hover:bg-slate-800/50">
                  <div className="font-medium text-slate-200">{emp.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${emp.group === "A" ? "bg-purple-500" : "bg-orange-500"}`}></span>Grupo {emp.group}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Intensiva: {stats.intensiveWeeksByEmp[emp.id]} semanas · Horas: {stats.totalHoursByEmp[emp.id]}
                  </div>
                </td>
                {DAYS.map((day) => {
                  const typeKey = schedule[emp.id][day.id];
                  const style = TYPES[typeKey] || TYPES["O30"];
                  const isForcedOffice = stats.forcedOfficeSet[day.id]?.has(emp.id);
                  const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
                  const isWFH = !daysOffice.includes(day.weekdayLetter) && typeKey !== "V" && !isForcedOffice;
                  return (
                    <td key={day.id} className={`p-1 border-b border-slate-700 relative cursor-pointer border-l border-slate-800`} onClick={() => handleCellClick(emp, day)}>
                      <div className={`w-full h-10 rounded-md flex flex-col items-center justify-center text-xs font-bold shadow-sm cell-transition relative overflow-hidden ${style.color} ${style.text} hover:brightness-110 hover:scale-105 transform`}>
                        <span>{style.short}</span>
                        {typeKey === "O42" && <div className="absolute bottom-0 w-full h-1 bg-amber-400 opacity-70"></div>}
                        {isWFH && <div className="absolute top-1 left-1 text-[10px] font-bold bg-slate-900/60 border border-slate-700 rounded px-1">T</div>}
                        {isForcedOffice && <div className="absolute top-1 right-1 text-[10px] font-bold bg-slate-900/60 border border-slate-700 rounded px-1">O</div>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>Generado por AI Assistant • 2026 Planning Dashboard</p>
        <p className="mt-2 text-xs opacity-60">Barra amarilla inferior en celda = Turno hasta 18h</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
