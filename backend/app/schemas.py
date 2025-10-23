from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time


# Base and Create Schemas
class TeacherBase(BaseModel):
    name: str


class TeacherCreate(TeacherBase):
    pass


class RoomBase(BaseModel):
    name: str
    room_type: str


class RoomCreate(RoomBase):
    pass


class SubjectBase(BaseModel):
    name: str
    lecture_hours: int = 0
    tutorial_hours: int = 0
    practical_hours: int = 0
    semester: Optional[int] = None
    branch: Optional[str] = None


class SubjectCreate(SubjectBase):
    pass


class TimeSlotBase(BaseModel):
    start_time: time
    end_time: time
    is_break: bool = False


class TimeSlotCreate(TimeSlotBase):
    pass


class HolidayBase(BaseModel):
    date: date
    description: str


class HolidayCreate(HolidayBase):
    pass


# Schemas with IDs for returning data
class Teacher(TeacherBase):
    id: int

    class Config:
        from_attributes = True


class Room(RoomBase):
    id: int

    class Config:
        from_attributes = True


class Subject(SubjectBase):
    id: int

    class Config:
        from_attributes = True


class TimeSlot(TimeSlotBase):
    id: int

    class Config:
        from_attributes = True


class Holiday(HolidayBase):
    id: int

    class Config:
        from_attributes = True


# Schemas for the Solver
class ScheduleRequest(BaseModel):
    start_date: date
    end_date: date
    teacher_map: Optional[dict[int, int]] = None  # subject_id -> teacher_id


class ScheduleItem(BaseModel):
    date: str
    start_time: str
    end_time: str
    subject: str
    room: str
    teacher: Optional[str] = None
    component_type: Optional[str] = None
    component_index: Optional[int] = None


class ScheduleResponse(BaseModel):
    success: bool
    schedule: Optional[List[ScheduleItem]] = None
    legend: Optional[dict] = None
    error: Optional[str] = None