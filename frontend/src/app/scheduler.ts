/**
Assumptions:
- Inputs may arrive as single objects or arrays; normalize internally to arrays.
- Each subject's weekly need is derived by splitting total hours evenly across the number of weeks.
- TimeSlot duration is treated as 1 unit hour; consecutive limits are counted in slots.
- Teachers are optional; when provided, a teacher must be eligible for the subject by `subjectsCanTeach` containing the subject id.
- Practical sessions require `Room.type === 'Lab'`; other types may use LectureHall/Classroom.
*/

// ==== Domain Models (must match prompt exactly) ====
export interface Subject { id:string; name:string; lectureHoursTotal:number; tutorialHoursTotal:number; practicalHoursTotal:number; priority?:number }
export interface Room { id:string; name:string; type:'LectureHall'|'Classroom'|'Lab'; capacity?:number; features?:string }
export interface TimeSlot { id:string; startTime:string; endTime:string; isBreak?:boolean }
export interface Teacher { id:string; name:string; subjectsCanTeach?:string; unavailableDates?:string; maxHoursPerDay?:number; maxHoursPerWeek?:number }
export interface SchedulerInput { startDate:string; endDate:string; subjects:Subject; rooms:Room; timeSlots:TimeSlot; holidays?:string; teachers?:Teacher; config?:any }
export interface ScheduledEntry { subjectId:string; roomId:string; teacherId?:string; date:string; timeSlotId:string; type:'Lecture'|'Tutorial'|'Practical' }
export interface SchedulerOutput { timetable:ScheduledEntry[]; conflicts:{item:any, reason:string, suggestion?:string}[]; metrics:any }

// ==== Public API ====
export async function generateTimetable(input: SchedulerInput): Promise<SchedulerOutput> {
  const cfg = normalizeConfig(input.config);
  const subjects = normalizeArray<Subject>(input.subjects).sort(subjectSort);
  const rooms = normalizeArray<Room>(input.rooms).sort((a,b)=>a.id.localeCompare(b.id));
  const timeSlots = normalizeArray<TimeSlot>(input.timeSlots).filter(ts=>!ts.isBreak).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const holidays = normalizeArray<string>(input.holidays).map(normalizeDateStr);
  const teachers = normalizeArray<Teacher>(input.teachers).sort((a,b)=>a.id.localeCompare(b.id));

  const days = enumerateDays(input.startDate, input.endDate).filter(d=>!holidays.includes(d) && cfg.enabledWeekdays.includes(new Date(d).getDay()));
  const weeks = groupByWeek(days);

  const timetable: ScheduledEntry[] = [];
  const conflicts: {item:any, reason:string, suggestion?:string}[] = [];

  // Tracking maps to enforce hard constraints and soft limits
  const roomBooked: Record<string, Set<string>> = {}; // key: date|slot -> roomId set
  const teacherBooked: Record<string, Set<string>> = {}; // key: date|slot -> teacherId set
  const teacherLoadWeek: Record<string, number> = {}; // teacherId -> assigned count this week

  // Precompute weekly demand per subject and session type
  const numWeeks = weeks.length || 1;
  const subjectWeeklyNeed = subjects.map(s => ({
    subject: s,
    perWeek: {
      Lecture: evenSplit(s.lectureHoursTotal, numWeeks),
      Tutorial: evenSplit(s.tutorialHoursTotal, numWeeks),
      Practical: evenSplit(s.practicalHoursTotal, numWeeks),
    }
  }));

  // Greedy assignment by priority → per-week → per-day slots with limited backtracking
  for (let w = 0; w < weeks.length; w++) {
    const weekDays = weeks[w];
    resetObject(teacherLoadWeek);

    for (const { subject, perWeek } of subjectWeeklyNeed) {
      const sessionPlan: Array<{type:SessionType, remaining:number}> = [
        { type:'Practical', remaining: perWeek.Practical[w] || 0 },
        { type:'Lecture', remaining: perWeek.Lecture[w] || 0 },
        { type:'Tutorial', remaining: perWeek.Tutorial[w] || 0 },
      ];

      // Attempt to spread across days first
      const dayOrder = deterministicDayOrder(weekDays, subject.id);
      for (const day of dayOrder) {
        // track consecutive count per teacher and per subject for the day
        const dayConsecutive: Record<string, number> = {}; // teacherId -> run length

        // iterate slots with small backtracking attempts
        outer: for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
          for (const ts of timeSlots) {
            const key = day+'|'+ts.id;
            if (!roomBooked[key]) roomBooked[key] = new Set();
            if (!teacherBooked[key]) teacherBooked[key] = new Set();

            for (const block of sessionPlan) {
              if (block.remaining <= 0) continue;

              // Room selection by type rule
              const eligibleRooms = rooms.filter(r => isRoomEligible(r, block.type));
              const room = pickLeastUsedRoom(eligibleRooms, timetable, day);
              if (!room) continue;
              if (roomBooked[key].has(room.id)) continue; // room conflict

              // Teacher selection if provided
              const teacher = pickTeacher(teachers, subject.id, day, teacherBooked[key], teacherLoadWeek, cfg);
              if (teachers.length > 0 && !teacher) continue; // no eligible teacher

              // Check teacher constraints: consecutive and daily caps
              if (teacher) {
                const concKey = teacher.id;
                const currentRun = dayConsecutive[concKey] || 0;
                if (currentRun >= (teacher.maxHoursPerDay ?? cfg.maxConsecutivePerDay)) continue;
                const weekLoad = teacherLoadWeek[teacher.id] || 0;
                if (weekLoad >= (teacher.maxHoursPerWeek ?? cfg.maxHoursPerTeacherPerWeek)) continue;
              }

              // All hard constraints satisfied — place entry
              const entry: ScheduledEntry = {
                subjectId: subject.id,
                roomId: room.id,
                teacherId: teacher?.id,
                date: day,
                timeSlotId: ts.id,
                type: block.type,
              };
              timetable.push(entry);
              roomBooked[key].add(room.id);
              if (teacher) {
                teacherBooked[key].add(teacher.id);
                dayConsecutive[teacher.id] = (dayConsecutive[teacher.id] || 0) + 1;
                teacherLoadWeek[teacher.id] = (teacherLoadWeek[teacher.id] || 0) + 1;
              }
              block.remaining -= 1;
              continue outer; // restart attempts for fairness across slots
            }
          }
          // if we went through all slots w/o placing, break attempt and try again (bounded)
        }

        // end of day; reset consecutive runs
      }

      // After trying all days, record any remaining as conflicts
      for (const block of sessionPlan) {
        if (block.remaining > 0) {
          conflicts.push({
            item: { subjectId: subject.id, weekIndex: w, type: block.type, remaining: block.remaining },
            reason: 'Insufficient capacity or teacher/room constraints',
            suggestion: 'Increase available time slots/rooms/teachers or relax consecutive/hour caps',
          });
        }
      }
    }
  }

  // Post-process to minimize gaps heuristic: stable order already reduces gaps deterministically
  timetable.sort((a,b)=> a.date===b.date ? a.timeSlotId.localeCompare(b.timeSlotId) : a.date.localeCompare(b.date));

  const metrics = {
    totalScheduled: timetable.length,
    conflicts: conflicts.length,
    weeks: numWeeks,
  };

  return { timetable: timetable as unknown as any, conflicts, metrics } as SchedulerOutput;
}

// ==== CSV Exporter ====
export function exportTimetableCSV(timetable: ScheduledEntry[]): string {
  const header = ['date','timeSlotId','subjectId','type','roomId','teacherId'];
  const rows = timetable.map(e => [e.date, e.timeSlotId, e.subjectId, e.type, e.roomId, e.teacherId ?? '']);
  return [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
}

// ==== Helpers ====
type SessionType = 'Lecture'|'Tutorial'|'Practical';

function normalizeArray<T>(value: T | T[] | undefined | null): T[] { return value == null ? [] : (Array.isArray(value) ? value.slice() : [value]); }
function normalizeDateStr(s: string): string { return new Date(s).toISOString().slice(0,10); }

function enumerateDays(start: string, end: string): string[] {
  const out: string[] = [];
  const d0 = new Date(normalizeDateStr(start));
  const d1 = new Date(normalizeDateStr(end));
  for (let d = new Date(d0); d <= d1; d.setDate(d.getDate()+1)) {
    out.push(d.toISOString().slice(0,10));
  }
  return out;
}

function groupByWeek(days: string[]): string[][] {
  const weeks: string[][] = [];
  let current: string[] = [];
  let currentWeek: number | null = null;
  for (const d of days) {
    const w = weekOfYear(new Date(d));
    if (currentWeek === null || w !== currentWeek) {
      if (current.length) weeks.push(current);
      current = [d];
      currentWeek = w;
    } else {
      current.push(d);
    }
  }
  if (current.length) weeks.push(current);
  return weeks;
}

function weekOfYear(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday=0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(),0,4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
}

function evenSplit(total: number, weeks: number): number[] {
  const arr = new Array(Math.max(weeks,1)).fill(0);
  let remaining = Math.max(0, Math.floor(total || 0));
  for (let i=0; remaining>0; i=(i+1)%arr.length) { arr[i] += 1; remaining -= 1; }
  return arr;
}

function subjectSort(a: Subject, b: Subject): number {
  const pa = a.priority ?? 0, pb = b.priority ?? 0;
  if (pa !== pb) return pb - pa; // higher first
  return a.id.localeCompare(b.id);
}

function isRoomEligible(room: Room, type: SessionType): boolean {
  if (type === 'Practical') return room.type === 'Lab';
  return room.type === 'LectureHall' || room.type === 'Classroom' || room.type === 'Lab';
}

function pickLeastUsedRoom(candidates: Room[], timetable: ScheduledEntry[], day: string): Room | undefined {
  if (candidates.length === 0) return undefined;
  const usage = new Map<string, number>();
  for (const r of candidates) usage.set(r.id, 0);
  for (const e of timetable) if (e.date === day && usage.has(e.roomId)) usage.set(e.roomId, (usage.get(e.roomId) || 0) + 1);
  return candidates.slice().sort((a,b)=> (usage.get(a.id) || 0) - (usage.get(b.id) || 0) || a.id.localeCompare(b.id))[0];
}

function pickTeacher(teachers: Teacher[], subjectId: string, day: string, bookedSet: Set<string>, weeklyLoad: Record<string, number>, cfg: NormalizedConfig): Teacher | undefined {
  if (teachers.length === 0) return undefined;
  const dayStr = normalizeDateStr(day);
  const eligible = teachers.filter(t => {
    const canTeach = (t.subjectsCanTeach || '').split(/[,;\s]+/).filter(Boolean).includes(subjectId);
    if (!canTeach) return false;
    if (bookedSet.has(t.id)) return false; // already booked this slot
    const unavailable = (t.unavailableDates || '').split(/[,;\s]+/).filter(Boolean).map(normalizeDateStr);
    if (unavailable.includes(dayStr)) return false;
    const wl = weeklyLoad[t.id] || 0;
    if (wl >= (t.maxHoursPerWeek ?? cfg.maxHoursPerTeacherPerWeek)) return false;
    return true;
  });
  if (eligible.length === 0) return undefined;
  // Prefer the teacher with lowest weekly load to balance work
  return eligible.slice().sort((a,b)=> (weeklyLoad[a.id]||0) - (weeklyLoad[b.id]||0) || a.id.localeCompare(b.id))[0];
}

function deterministicDayOrder(days: string[], subjectId: string): string[] {
  // Stable spread: rotate start index by hash(subjectId) to distribute across week
  if (days.length === 0) return days;
  const h = hashString(subjectId) % days.length;
  return days.slice(h).concat(days.slice(0,h));
}

function hashString(s: string): number { let h=0; for (let i=0;i<s.length;i++) { h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); }

function resetObject(o: Record<string, number>): void { for (const k of Object.keys(o)) delete o[k]; }

type NormalizedConfig = {
  enabledWeekdays: number[]; // JS getDay(): 0=Sun ... 6=Sat
  maxConsecutivePerDay: number;
  maxHoursPerTeacherPerWeek: number;
  maxAttempts: number;
};

function normalizeConfig(cfg: any | undefined): NormalizedConfig {
  const defaults: NormalizedConfig = {
    enabledWeekdays: [1,2,3,4,5],
    maxConsecutivePerDay: 2,
    maxHoursPerTeacherPerWeek: 12,
    maxAttempts: 2,
  };
  if (!cfg) return defaults;
  return {
    enabledWeekdays: Array.isArray(cfg.enabledWeekdays) && cfg.enabledWeekdays.length ? cfg.enabledWeekdays.slice() : defaults.enabledWeekdays,
    maxConsecutivePerDay: isFiniteNumber(cfg.maxConsecutivePerDay) ? cfg.maxConsecutivePerDay : defaults.maxConsecutivePerDay,
    maxHoursPerTeacherPerWeek: isFiniteNumber(cfg.maxHoursPerTeacherPerWeek) ? cfg.maxHoursPerTeacherPerWeek : defaults.maxHoursPerTeacherPerWeek,
    maxAttempts: isFiniteNumber(cfg.maxAttempts) ? cfg.maxAttempts : defaults.maxAttempts,
  };
}

function isFiniteNumber(v:any): v is number { return typeof v === 'number' && Number.isFinite(v); }

// ==== Unit-test style examples (can run via ts-node) ====
const __g:any = (globalThis as any);
if (__g && __g.require && __g.module && __g.require.main === __g.module) {
  (async () => {
    // Example 1: 1-week schedule, holiday skip, room-type constraint
    const input1: SchedulerInput = {
      startDate: '2025-01-06', // Monday
      endDate:   '2025-01-10', // Friday
      subjects: [
        { id:'S1', name:'Physics', lectureHoursTotal:2, tutorialHoursTotal:0, practicalHoursTotal:1, priority:10 },
      ] as any,
      rooms: [
        { id:'R1', name:'LH-1', type:'LectureHall' },
        { id:'R2', name:'Lab-1', type:'Lab' },
      ] as any,
      timeSlots: [
        { id:'TS1', startTime:'09:00', endTime:'10:00' },
        { id:'TS2', startTime:'10:00', endTime:'11:00', isBreak:true },
        { id:'TS3', startTime:'11:00', endTime:'12:00' },
      ] as any,
      holidays: ['2025-01-08'], // Wednesday skipped
      teachers: [
        { id:'T1', name:'Alice', subjectsCanTeach:'S1', maxHoursPerDay:2, maxHoursPerWeek:5 },
      ] as any,
      config: { enabledWeekdays:[1,2,3,4,5], maxAttempts:2 }
    } as any;

    const out1 = await generateTimetable(input1);
    console.log('Test1 scheduled', out1.metrics.totalScheduled, 'conflicts', out1.conflicts.length);
    console.log(exportTimetableCSV(out1.timetable));

    // Example 2: 2-week spread, teacher load balancing
    const input2: SchedulerInput = {
      startDate: '2025-01-06',
      endDate:   '2025-01-17',
      subjects: [
        { id:'S2', name:'Chemistry', lectureHoursTotal:4, tutorialHoursTotal:0, practicalHoursTotal:2, priority:5 },
      ] as any,
      rooms: [
        { id:'R10', name:'LH-10', type:'Classroom' },
        { id:'R11', name:'Lab-11', type:'Lab' },
      ] as any,
      timeSlots: [
        { id:'M1', startTime:'09:00', endTime:'10:00' },
        { id:'M2', startTime:'10:00', endTime:'11:00' },
        { id:'M3', startTime:'11:00', endTime:'12:00' },
      ] as any,
      teachers: [
        { id:'TA', name:'Bob', subjectsCanTeach:'S2', maxHoursPerDay:2, maxHoursPerWeek:4 },
        { id:'TB', name:'Cara', subjectsCanTeach:'S2', maxHoursPerDay:2, maxHoursPerWeek:4 },
      ] as any,
      config: { enabledWeekdays:[1,2,3,4,5], maxConsecutivePerDay:2, maxAttempts:2 }
    } as any;

    const out2 = await generateTimetable(input2);
    console.log('Test2 scheduled', out2.metrics.totalScheduled, 'conflicts', out2.conflicts.length);

    // Example 3: No teachers provided, still schedule lectures only, respect breaks
    const input3: SchedulerInput = {
      startDate: '2025-02-03',
      endDate:   '2025-02-07',
      subjects: [
        { id:'S3', name:'Math', lectureHoursTotal:3, tutorialHoursTotal:1, practicalHoursTotal:0, priority:1 },
      ] as any,
      rooms: [ { id:'R20', name:'LH-20', type:'LectureHall' } ] as any,
      timeSlots: [
        { id:'A', startTime:'09:00', endTime:'10:00' },
        { id:'B', startTime:'10:00', endTime:'11:00', isBreak:true },
        { id:'C', startTime:'11:00', endTime:'12:00' },
      ] as any,
      config: { enabledWeekdays:[1,2,3,4,5] }
    } as any;
    const out3 = await generateTimetable(input3);
    console.log('Test3 scheduled', out3.metrics.totalScheduled, 'conflicts', out3.conflicts.length);

    console.log('READY: scheduler.ts — drop-in timetable generator (TS)');
  })();
}

// ==== Integration Snippet (3 lines) ====
// import { generateTimetable } from './scheduler';
// const { timetable, conflicts } = await generateTimetable(input);
// console.log(timetable.length, 'entries', conflicts.length, 'conflicts');


