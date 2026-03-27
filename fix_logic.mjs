import fs from 'fs';

let content = fs.readFileSync('src/app.jsx', 'utf8');

const regexToReplace = /      if \(day\.weekdayLetter !== "V"\) \{\s+if \(shift18hOfficeCount < 1\) \{[\s\S]*?\}\s+if \(!group1HasOffice && group2Covering\.length === 0\) \{[\s\S]*?\}\s+if \(!group2HasOffice && group1Covering\.length === 0\) \{[\s\S]*?\}\s+\}/;

const newBlock = `      if (day.weekdayLetter !== "V") {
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

        shift18hOfficeCount = EMPLOYEES.filter(emp => {
          if (schedule[emp.id][day.id] !== "O42") return false;
          const daysOffice = emp.officeDays.split(",").map(d => d.trim());
          if (daysOffice.includes(day.weekdayLetter)) return true;
          if (forcedOfficeSet[day.id] && forcedOfficeSet[day.id].has(emp.id)) return true;
          return false;
        }).length;

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
          } else {
            const o40InOffice = EMPLOYEES.filter((emp) => {
              if (schedule[emp.id][day.id] !== "O40") return false;
              const daysOffice = emp.officeDays.split(",").map((d) => d.trim());
              return daysOffice.includes(day.weekdayLetter);
            });

            if (o40InOffice.length > 0) {
              const candidate = pickLowestForcedCandidate(o40InOffice);
              schedule[candidate.id][day.id] = "O42";
              forcedOfficeSet[day.id] = forcedOfficeSet[day.id] || new Set();
              forcedOfficeSet[day.id].add(candidate.id);
              forcedOfficeDetails.push({
                dayId: day.id,
                empId: candidate.id,
                reason: "Conversión a 42h: falta cobertura presencial de tarde",
              });
              tempForcedCount[candidate.id]++;
              shift18hOfficeCount = 1;
            }
          }
        }
      }`;

if (regexToReplace.test(content)) {
  content = content.replace(regexToReplace, newBlock);
  fs.writeFileSync('src/app.jsx', content, 'utf8');
  console.log("Successfully replaced!");
} else {
  console.log("Regex did not match!");
}
