from sqlalchemy import Column, Integer, String, Boolean, Date, Time, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    room_type = Column(String, nullable=False)  # 'Lecture Hall', 'Classroom', 'Lab'

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lecture_hours = Column(Integer, nullable=False, default=0)
    tutorial_hours = Column(Integer, nullable=False, default=0)
    practical_hours = Column(Integer, nullable=False, default=0)
    # New categorization fields
    semester = Column(Integer, nullable=True, default=None)
    branch = Column(String, nullable=True, default=None)

class TimeSlot(Base):
    __tablename__ = "timeslots"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_break = Column(Boolean, default=False)

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
