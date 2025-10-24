from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from . import models, schemas, database, solver
from .database import get_db, create_tables

# Create tables on startup using modern lifespan approach
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    yield
    # Shutdown (if needed)

app = FastAPI(title="SamayGen API", version="1.0.0", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200","https://samay-gen.vercel.app"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
)
@app.post("/teachers/", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    db_teacher = models.Teacher(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@app.get("/teachers/", response_model=list[schemas.Teacher])
def read_teachers(db: Session = Depends(get_db)):
    teachers = db.query(models.Teacher).all()
    return teachers

@app.get("/teachers/{teacher_id}", response_model=schemas.Teacher)
def read_teacher(teacher_id: int, db: Session = Depends(get_db)):
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return db_teacher

@app.put("/teachers/{teacher_id}", response_model=schemas.Teacher)
def update_teacher(teacher_id: int, teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    for field, value in teacher.dict().items():
        setattr(db_teacher, field, value)

    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@app.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db.delete(db_teacher)
    db.commit()
    return {"message": "Teacher deleted"}

# Room endpoints
@app.post("/rooms/", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = models.Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.get("/rooms/", response_model=list[schemas.Room])
def read_rooms(db: Session = Depends(get_db)):
    rooms = db.query(models.Room).all()
    return rooms

@app.get("/rooms/{room_id}", response_model=schemas.Room)
def read_room(room_id: int, db: Session = Depends(get_db)):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return db_room

@app.put("/rooms/{room_id}", response_model=schemas.Room)
def update_room(room_id: int, room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    for field, value in room.dict().items():
        setattr(db_room, field, value)

    db.commit()
    db.refresh(db_room)
    return db_room

@app.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    db.delete(db_room)
    db.commit()
    return {"message": "Room deleted"}

# Subject endpoints
@app.post("/subjects/", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    db_subject = models.Subject(**subject.dict())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@app.get("/subjects/", response_model=list[schemas.Subject])
def read_subjects(db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).all()
    return subjects

@app.get("/subjects/{subject_id}", response_model=schemas.Subject)
def read_subject(subject_id: int, db: Session = Depends(get_db)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if db_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return db_subject

@app.put("/subjects/{subject_id}", response_model=schemas.Subject)
def update_subject(subject_id: int, subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if db_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")

    for field, value in subject.dict().items():
        setattr(db_subject, field, value)

    db.commit()
    db.refresh(db_subject)
    return db_subject

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if db_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(db_subject)
    db.commit()
    return {"message": "Subject deleted"}

# TimeSlot endpoints
@app.post("/timeslots/", response_model=schemas.TimeSlot)
def create_timeslot(timeslot: schemas.TimeSlotCreate, db: Session = Depends(get_db)):
    db_timeslot = models.TimeSlot(**timeslot.dict())
    db.add(db_timeslot)
    db.commit()
    db.refresh(db_timeslot)
    return db_timeslot

@app.get("/timeslots/", response_model=list[schemas.TimeSlot])
def read_timeslots(db: Session = Depends(get_db)):
    timeslots = db.query(models.TimeSlot).all()
    return timeslots

@app.get("/timeslots/{timeslot_id}", response_model=schemas.TimeSlot)
def read_timeslot(timeslot_id: int, db: Session = Depends(get_db)):
    db_timeslot = db.query(models.TimeSlot).filter(models.TimeSlot.id == timeslot_id).first()
    if db_timeslot is None:
        raise HTTPException(status_code=404, detail="TimeSlot not found")
    return db_timeslot

@app.put("/timeslots/{timeslot_id}", response_model=schemas.TimeSlot)
def update_timeslot(timeslot_id: int, timeslot: schemas.TimeSlotCreate, db: Session = Depends(get_db)):
    db_timeslot = db.query(models.TimeSlot).filter(models.TimeSlot.id == timeslot_id).first()
    if db_timeslot is None:
        raise HTTPException(status_code=404, detail="TimeSlot not found")

    for field, value in timeslot.dict().items():
        setattr(db_timeslot, field, value)

    db.commit()
    db.refresh(db_timeslot)
    return db_timeslot

@app.delete("/timeslots/{timeslot_id}")
def delete_timeslot(timeslot_id: int, db: Session = Depends(get_db)):
    db_timeslot = db.query(models.TimeSlot).filter(models.TimeSlot.id == timeslot_id).first()
    if db_timeslot is None:
        raise HTTPException(status_code=404, detail="TimeSlot not found")

    db.delete(db_timeslot)
    db.commit()
    return {"message": "TimeSlot deleted"}

# Holiday endpoints
@app.post("/holidays/", response_model=schemas.Holiday)
def create_holiday(holiday: schemas.HolidayCreate, db: Session = Depends(get_db)):
    db_holiday = models.Holiday(**holiday.dict())
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@app.get("/holidays/", response_model=list[schemas.Holiday])
def read_holidays(db: Session = Depends(get_db)):
    holidays = db.query(models.Holiday).all()
    return holidays

@app.get("/holidays/{holiday_id}", response_model=schemas.Holiday)
def read_holiday(holiday_id: int, db: Session = Depends(get_db)):
    db_holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if db_holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return db_holiday

@app.put("/holidays/{holiday_id}", response_model=schemas.Holiday)
def update_holiday(holiday_id: int, holiday: schemas.HolidayCreate, db: Session = Depends(get_db)):
    db_holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if db_holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")

    for field, value in holiday.dict().items():
        setattr(db_holiday, field, value)

    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@app.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    db_holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if db_holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")

    db.delete(db_holiday)
    db.commit()
    return {"message": "Holiday deleted"}

# Main solver endpoint
@app.post("/generate/", response_model=schemas.ScheduleResponse)
def generate_schedule(request: schemas.ScheduleRequest, db: Session = Depends(get_db)):
    try:
        result = solver.create_curriculum_schedule(
            db,
            request.start_date,
            request.end_date,
            teacher_map=request.teacher_map or {}
        )
        return result
    except Exception as e:
        return schemas.ScheduleResponse(
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
