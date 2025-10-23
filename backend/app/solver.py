from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from . import models, schemas
import json
from types import SimpleNamespace


def hash_id(x: str) -> int:
    """Deterministic non-cryptographic hash for stable ordering."""
    h = 0
    for ch in str(x):
        h = ((h << 5) - h) + ord(ch)
        h &= 0xFFFFFFFF
    return h

def get_valid_teaching_dates(db: Session, start_date: date, end_date: date):
    """Get all valid teaching dates between start and end date, excluding Sundays and holidays"""
    valid_dates = []
    current_date = start_date

    while current_date <= end_date:
        # Skip Sundays
        if current_date.weekday() != 6:  # 0=Monday, 6=Sunday
            # Check if it's a holiday
            holiday = db.query(models.Holiday).filter(models.Holiday.date == current_date).first()
            if not holiday:
                valid_dates.append(current_date)
        current_date += timedelta(days=1)

    return valid_dates

def create_curriculum_schedule(db: Session, start_date: date, end_date: date, teacher_map: dict | None = None):
    """Create a curriculum schedule using a deterministic greedy semester-aware algorithm."""

    # Get all data from database
    teachers = db.query(models.Teacher).all()
    rooms = db.query(models.Room).all()
    subjects = db.query(models.Subject).all()
    timeslots = db.query(models.TimeSlot).all()

    if not subjects:
        return schemas.ScheduleResponse(
            success=False,
            error="No subjects found. Please add subjects first."
        )

    # Get valid teaching dates (exclude Sundays and holidays)
    valid_dates = get_valid_teaching_dates(db, start_date, end_date)
    # Defensive normalization
    if not isinstance(valid_dates, list):
        valid_dates = [valid_dates]
    if not isinstance(rooms, list):
        rooms = list(rooms) if rooms is not None else []
    if not isinstance(timeslots, list):
        timeslots = list(timeslots) if timeslots is not None else []
    if not isinstance(subjects, list):
        subjects = list(subjects) if subjects is not None else []

    if not valid_dates:
        return schemas.ScheduleResponse(
            success=False,
            error="No valid teaching dates found between the specified dates."
        )

    # Quick feasibility: check rough capacity vs required components (duration check)
    available_slots = [ts for ts in timeslots if not ts.is_break]
    total_required = 0
    for s in subjects:
        lh = getattr(s, 'lecture_hours', 0) or 0
        th = getattr(s, 'tutorial_hours', 0) or 0
        ph = getattr(s, 'practical_hours', 0) or 0
        try:
            total_required += int(lh) + int(th) + int(ph)
        except Exception:
            # If any of these are non-iterable/invalid, coerce to 0
            total_required += 0
    # Parallel capacity lower-bounded by number of rooms; teacher count may also constrain
    parallel_capacity = max(1, min(len(rooms) if rooms else 1, len(teachers) if teachers else 1))
    total_available_capacity = len(valid_dates) * max(0, len(available_slots)) * parallel_capacity
    if total_required > total_available_capacity:
        return schemas.ScheduleResponse(
            success=False,
            error=(
                f"Selected duration is short: need {total_required} slots but only {total_available_capacity} available. "
                "Add more days/slots/rooms/teachers or reduce required hours."
            )
        )

    # Deconstruct subjects into atomic components
    class_components = []
    subject_teacher_assignments = {}
    teacher_map = teacher_map or {}

    for subject in subjects:
        # Create lecture components
        for i in range(int(getattr(subject, 'lecture_hours', 0) or 0)):
            class_components.append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'component_type': 'L',
                'component_index': i + 1,
                'duration': 1  # Each lecture is 1 time slot
            })

        # Create tutorial components
        for i in range(int(getattr(subject, 'tutorial_hours', 0) or 0)):
            class_components.append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'component_type': 'T',
                'component_index': i + 1,
                'duration': 1
            })

        # Create practical components
        for i in range(int(getattr(subject, 'practical_hours', 0) or 0)):
            class_components.append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'component_type': 'P',
                'component_index': i + 1,
                'duration': 1  # Each practical hour is 1 time slot
            })

        # Teacher assignment: prefer teacher_map[subject.id], else round-robin
        if teachers:
            mapped = teacher_map.get(subject.id)
            if mapped and any(t.id == mapped for t in teachers):
                subject_teacher_assignments[subject.id] = mapped
            else:
                used = set(subject_teacher_assignments.values())
                fallback = next((t.id for t in teachers if t.id not in used), teachers[0].id)
                subject_teacher_assignments[subject.id] = fallback

    total_components = len(class_components)

    if total_components == 0:
        return schemas.ScheduleResponse(
            success=False,
            error="No class components to schedule."
        )

    # Initialize available (non-break) time slots
    # Use boolean truthiness rather than identity to handle DB values like 0/None
    available_slots = [ts for ts in timeslots if not getattr(ts, 'is_break', False)]
    # Ensure we have at least one room to render; if none exist, synthesize a placeholder
    rooms_for_build = rooms if rooms else [SimpleNamespace(id=0, name='UNASSIGNED', room_type='Classroom')]

    # Build schedule using the new semester-aware greedy logic
    schedule_data, legend = build_semester_schedule(class_components, valid_dates, available_slots, rooms_for_build, teachers, subject_teacher_assignments)
    schedule_data = append_free_classes(schedule_data, valid_dates, available_slots, rooms_for_build, subjects)

    return schemas.ScheduleResponse(
        success=True,
        schedule=schedule_data,
        legend=legend
    )

def extract_solution(solver, schedule, class_components, valid_dates, available_slots, rooms, teachers, subjects, subject_teacher_assignments):
    """Extract solution from solver results"""
    schedule_data = []
    for comp in class_components:
        for d in valid_dates:
            for ts in available_slots:
                for room in rooms:
                    for teacher in teachers:
                        comp_key = (comp['subject_id'], comp['component_type'], comp['component_index'])
                        var = schedule[(comp_key, d, ts.id, room.id, teacher.id)]
                        if solver.Value(var) == 1:
                            schedule_data.append({
                                'date': d.isoformat(),
                                'start_time': ts.start_time.strftime('%H:%M'),
                                'end_time': ts.end_time.strftime('%H:%M'),
                                'room': room.name,
                                'teacher': teacher.name,
                                'subject': comp['subject_name'],
                                'component_type': comp['component_type'],
                                'component_index': comp['component_index']
                            })

    # Create legend mapping subject names to teachers
    legend = {}
    for subject in subjects:
        teacher_id = subject_teacher_assignments.get(subject.id)
        teacher = next((t for t in teachers if t.id == teacher_id), None)
        if teacher:
            legend[subject.name] = teacher.name

    return schedule_data, legend


def generate_greedy_schedule(class_components, valid_dates, available_slots, rooms, teachers, subjects, subject_teacher_assignments):
    """Generate a schedule using a greedy algorithm as fallback"""
    import random
    random.seed(42)  # For reproducible results

    schedule_data = []
    teacher_schedule = {}  # Track teacher availability
    room_schedule = {}     # Track room availability

    # Initialize tracking dictionaries
    for teacher in teachers:
        teacher_schedule[teacher.id] = {}
    for room in rooms:
        room_schedule[room.id] = {}

    for date in valid_dates:
        for teacher in teachers:
            teacher_schedule[teacher.id][date] = set()
        for room in rooms:
            room_schedule[room.id][date] = set()

    # Sort components by priority: Practical -> Lecture -> Tutorial, then by index for determinism
    priority_order = {'P': 0, 'L': 1, 'T': 2}
    sorted_components = sorted(class_components, key=lambda x: (priority_order.get(x['component_type'], 9), x['component_index'], x['subject_id']))

    for comp in sorted_components:
        scheduled = False
        subject_id = comp['subject_id']
        assigned_teacher_id = subject_teacher_assignments.get(subject_id)

        # Find available teacher (prefer assigned teacher)
        available_teachers = [t for t in teachers if t.id == assigned_teacher_id] if assigned_teacher_id else teachers
        # deterministic order to keep output stable
        available_teachers = sorted(available_teachers, key=lambda t: t.id)

        for teacher in available_teachers:
            for date in valid_dates:
                for slot in available_slots:
                    # Check if teacher is available
                    if slot.id in teacher_schedule[teacher.id].get(date, set()):
                        continue

                    # Check if room is available (try to find appropriate room)
                    available_rooms = []
                    if comp['component_type'] == 'P':
                        available_rooms = [r for r in rooms if r.room_type == 'Lab']
                    elif comp['component_type'] == 'L':
                        available_rooms = [r for r in rooms if r.room_type in ['Lecture Hall', 'Classroom']]
                    else:  # Tutorial
                        available_rooms = [r for r in rooms if r.room_type in ['Classroom', 'Lecture Hall']]

                    if not available_rooms:
                        available_rooms = rooms  # Fallback to any room

                    # deterministic order to keep output stable
                    available_rooms = sorted(available_rooms, key=lambda r: (r.room_type, r.id))
                    for room in available_rooms:
                        if slot.id in room_schedule[room.id].get(date, set()):
                            continue

                        # Schedule this component
                        teacher_schedule[teacher.id][date].add(slot.id)
                        room_schedule[room.id][date].add(slot.id)

                        schedule_data.append({
                            'date': date.isoformat(),
                            'start_time': slot.start_time.strftime('%H:%M'),
                            'end_time': slot.end_time.strftime('%H:%M'),
                            'room': room.name,
                            'teacher': teacher.name,
                            'subject': comp['subject_name'],
                            'component_type': comp['component_type'],
                            'component_index': comp['component_index']
                        })
                        scheduled = True
                        break

                    if scheduled:
                        break

                if scheduled:
                    break

            if scheduled:
                break

        if not scheduled:
            print(f"Warning: Could not schedule {comp['subject_name']} {comp['component_type']}")

    return schedule_data, {}


def generate_minimal_schedule(class_components, valid_dates, available_slots, rooms, teachers, subjects):
    """Generate a very basic schedule as last resort"""
    import random
    random.seed(42)

    schedule_data = []

    # Just assign first available slot for each component
    for comp in class_components:
        # Get first available date and slot
        date = valid_dates[0]
        slot = available_slots[0]

        # Get first available teacher and room
        teacher = teachers[0] if teachers else None
        room = rooms[0] if rooms else None

        if teacher and room:
            schedule_data.append({
                'date': date.isoformat(),
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'room': room.name,
                'teacher': teacher.name,
                'subject': comp['subject_name'],
                'component_type': comp['component_type'],
                'component_index': comp['component_index']
            })

    return schedule_data, {}


def append_free_classes(schedule_data, valid_dates, available_slots, rooms, subjects):
    """Fill unoccupied room/slot pairs with FREE/EXTRA markers.
    - FREE: slot/room has no scheduled class.
    - EXTRA: when subject still has declared hours beyond scheduled placements, add advisory extra entries (no teacher).
    The UI can render these for clarity; downstream can ignore if not needed.
    """
    # Build occupied map
    occupied = set()
    for item in schedule_data:
        key = (item['date'], item['start_time'], item['end_time'], item['room'])
        occupied.add(key)

    # Index timeslot string times for quick mapping
    ts_map = {}
    for ts in available_slots:
        ts_map[(ts.start_time.strftime('%H:%M'), ts.end_time.strftime('%H:%M'))] = ts

    # Add FREE classes for empty slots, but keep them sparse (at most 1 free block per day)
    for d in list(valid_dates):
        dstr = getattr(d, 'isoformat', lambda: str(d))()
        free_added = False
        for ts in list(available_slots):
            st = getattr(ts.start_time, 'strftime', lambda fmt: str(ts.start_time))( '%H:%M')
            et = getattr(ts.end_time, 'strftime', lambda fmt: str(ts.end_time))( '%H:%M')
            for r in list(rooms):
                rname = getattr(r, 'name', str(getattr(r,'id','room')))
                key = (dstr, st, et, rname)
                if key in occupied:
                    continue
                if free_added:
                    continue
                schedule_data.append({
                    'date': dstr,
                    'start_time': (st if len(st.split(':'))==3 else f"{st}:00"),
                    'end_time': (et if len(et.split(':'))==3 else f"{et}:00"),
                    'room': rname,
                    'teacher': '—',
                    'subject': 'FREE',
                    'component_type': 'F',
                    'component_index': 0
                })
                free_added = True

    # Add EXTRA classes if declared hours exceed scheduled placements per subject/type
    # Count scheduled by subject/type
    from collections import defaultdict
    placed = defaultdict(lambda: defaultdict(int))  # subject -> type -> count
    for item in schedule_data:
        subj = item.get('subject')
        ctype = item.get('component_type')
        if subj and ctype in ('L','T','P'):
            placed[subj][ctype] += 1

    for s in subjects:
        declared = {
            'L': int(getattr(s, 'lecture_hours', 0) or 0),
            'T': int(getattr(s, 'tutorial_hours', 0) or 0),
            'P': int(getattr(s, 'practical_hours', 0) or 0),
        }
        for kind, need in declared.items():
            have = placed[s.name][kind] if s.name in placed else 0
            extra = max(0, need - have)
            # Put at the very end of horizon as advisory placeholders
            if extra > 0 and valid_dates and available_slots and rooms:
                d = getattr(valid_dates[-1], 'isoformat', lambda: str(valid_dates[-1]))()
                ts = available_slots[-1]
                st = getattr(ts.start_time, 'strftime', lambda fmt: str(ts.start_time))('%H:%M')
                et = getattr(ts.end_time, 'strftime', lambda fmt: str(ts.end_time))('%H:%M')
                r = rooms[-1]
                for idx in range(extra):
                    schedule_data.append({
                        'date': d,
                        'start_time': (st if len(st.split(':'))==3 else f"{st}:00"),
                        'end_time': (et if len(et.split(':'))==3 else f"{et}:00"),
                        'room': getattr(r, 'name', str(getattr(r,'id','room'))),
                        'teacher': '—',
                        'subject': f'EXTRA {s.name}',
                        'component_type': kind,
                        'component_index': 0
                    })
    return schedule_data


def build_semester_schedule(class_components, valid_dates, available_slots, rooms, teachers=None, subject_teacher_assignments=None):
    """Deterministic greedy semester scheduler respecting:
    - Subject demand by type (L/T/P)
    - Semester days (excl. Sundays and holidays via valid_dates)
    - Room type eligibility: Lecture Hall & Classroom for L/T, Lab for P/T
    - Non-break time slots only
    - Even spreading across days with deterministic rotation
    Returns (schedule_data, legend).
    """
    # Index occupancy: (date, slot_id) -> set(room_id)
    room_occ = {}
    # Ensure at most one visible class per day/slot (frontend has one cell per day-slot)
    day_slot_taken = set()
    # Deterministic order of rooms per type
    rooms_by_type = {
        'L': sorted([r for r in rooms if getattr(r, 'room_type', None) in ['Lecture Hall', 'Classroom']], key=lambda r: (getattr(r, 'room_type', ''), r.id)),
        'T': sorted([r for r in rooms if getattr(r, 'room_type', None) in ['Lecture Hall', 'Classroom', 'Lab']], key=lambda r: (getattr(r, 'room_type', ''), r.id)),
        'P': sorted([r for r in rooms if getattr(r, 'room_type', None) == 'Lab'], key=lambda r: (getattr(r, 'room_type', ''), r.id)),
    }

    # Sort to MIX subjects while preserving priorities:
    # 1) First by component index (rounds), so round 1 of all subjects appears before round 2
    # 2) Then by type priority (P > L > T)
    # 3) Then by a stable hash of subject to interleave deterministically
    order_rank = {'P': 0, 'L': 1, 'T': 2}
    def mix_key(c):
        return (
            int(c.get('component_index', 0)),
            order_rank.get(c.get('component_type'), 9),
            hash_id(str(c.get('subject_id')))
        )
    comps = sorted(class_components, key=mix_key)

    schedule_data = []
    # Cap classes per subject per day (change here to 1 if required)
    MAX_PER_SUBJECT_PER_DAY = 2
    # Track how many classes a subject has per day
    subj_day_count = {}

    if not valid_dates or not available_slots or not rooms:
        return schedule_data, {}

    # For even spread: compute rotation offsets per subject (hash_id defined at module scope)

    # Precompute slot index map for packing from the start of the day
    slot_index = {getattr(ts, 'id', ts): idx for idx, ts in enumerate(available_slots)}
    # Track next earliest slot pointer per day to reduce free gaps
    day_next_index = {getattr(d, 'isoformat', lambda: str(d))(): 0 for d in valid_dates}

    for comp in comps:
        placed = False
        ctype = comp['component_type']
        subj = comp.get('subject_name') or str(comp.get('subject_id'))
        # rotate day start by subject hash
        rot = hash_id(str(comp['subject_id'])) % len(valid_dates)
        day_iter = valid_dates[rot:] + valid_dates[:rot]
        for d in day_iter:
            d_iso = getattr(d, 'isoformat', lambda: str(d))()
            # iterate time slots starting from the day's next earliest index to pack schedule
            start_i = max(0, min(day_next_index.get(d_iso, 0), len(available_slots)-1))
            slot_iter = list(range(start_i, len(available_slots))) + list(range(0, start_i))
            for si in slot_iter:
                ts = available_slots[si]
                key = (d, getattr(ts, 'id', ts))
                if key not in room_occ:
                    room_occ[key] = set()
                # enforce per-subject per-day cap
                cap_key = (comp['subject_id'], d_iso)
                if subj_day_count.get(cap_key, 0) >= MAX_PER_SUBJECT_PER_DAY:
                    continue
                # enforce global day-slot single visible class
                if (d_iso, getattr(ts, 'id', ts)) in day_slot_taken:
                    continue
                # iterate eligible rooms
                for r in rooms_by_type.get(ctype, []):
                    rid = getattr(r, 'id', r)
                    if rid in room_occ[key]:
                        continue
                    # Tutorial can also use Lab
                    if ctype == 'T' and getattr(r, 'room_type', None) not in ['Classroom', 'Lecture Hall', 'Lab']:
                        continue
                    # Place
                    room_occ[key].add(rid)
                    day_slot_taken.add((d_iso, getattr(ts, 'id', ts)))
                    schedule_data.append({
                        'date': d_iso,
                        'start_time': getattr(ts.start_time, 'strftime', lambda fmt: str(ts.start_time))('%H:%M:%S'),
                        'end_time': getattr(ts.end_time, 'strftime', lambda fmt: str(ts.end_time))('%H:%M:%S'),
                        'room': getattr(r, 'name', str(rid)),
                        'subject': subj,
                        'component_type': ctype,
                        'component_index': comp['component_index']
                    })
                    subj_day_count[cap_key] = subj_day_count.get(cap_key, 0) + 1
                    # advance day pointer to next unused slot index
                    next_i = si + 1
                    while next_i < len(available_slots) and (d_iso, getattr(available_slots[next_i], 'id', available_slots[next_i])) in day_slot_taken:
                        next_i += 1
                    day_next_index[d_iso] = min(next_i, len(available_slots)-1)
                    placed = True
                    break
                if placed:
                    break
            if placed:
                break
        if not placed:
            # could not place; continue to next (append_free_classes will add EXTRA markers later)
            pass

    # Build legend from subject_teacher_assignments if provided
    legend = {}
    if teachers and subject_teacher_assignments:
        tid_to_name = {t.id: t.name for t in teachers}
        for comp in class_components:
            sid = comp['subject_id']
            sname = comp.get('subject_name')
            tid = subject_teacher_assignments.get(sid)
            if sname and tid in tid_to_name:
                legend[sname] = tid_to_name[tid]

    # Inject teacher names into schedule rows if available
    if teachers and subject_teacher_assignments:
        tid_to_name = {t.id: t.name for t in teachers}
        for row in schedule_data:
            # Find subject id by matching subject name from class_components
            sname = row.get('subject')
            comp = next((c for c in class_components if c.get('subject_name') == sname), None)
            if comp:
                tid = subject_teacher_assignments.get(comp['subject_id'])
                if tid in tid_to_name:
                    row['teacher'] = tid_to_name[tid]

    return schedule_data, legend
