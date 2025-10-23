import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Teacher {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  name: string;
  room_type: string;
}

export interface Subject {
  id: number;
  name: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  semester?: number | null;
  branch?: string | null;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

export interface Holiday {
  id: number;
  date: string;
  description: string;
}

export interface ScheduleRequest {
  start_date: string;
  end_date: string;
  teacher_map?: { [subjectId: number]: number };
}

export interface ScheduleItem {
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  teacher: string;
  subject: string;
  component_type: string;
  component_index: number;
}

export interface ScheduleResponse {
  success: boolean;
  schedule?: ScheduleItem[];
  legend?: { [key: string]: string };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  // Teacher endpoints
  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.baseUrl}/teachers/`);
  }

  createTeacher(teacher: Omit<Teacher, 'id'>): Observable<Teacher> {
    return this.http.post<Teacher>(`${this.baseUrl}/teachers/`, teacher);
  }

  updateTeacher(id: number, teacher: Omit<Teacher, 'id'>): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.baseUrl}/teachers/${id}`, teacher);
  }

  deleteTeacher(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/teachers/${id}`);
  }

  // Room endpoints
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/rooms/`);
  }

  createRoom(room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.post<Room>(`${this.baseUrl}/rooms/`, room);
  }

  updateRoom(id: number, room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.put<Room>(`${this.baseUrl}/rooms/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/rooms/${id}`);
  }

  // Subject endpoints
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.baseUrl}/subjects/`);
  }

  createSubject(subject: Omit<Subject, 'id'>): Observable<Subject> {
    return this.http.post<Subject>(`${this.baseUrl}/subjects/`, subject);
  }

  updateSubject(id: number, subject: Omit<Subject, 'id'>): Observable<Subject> {
    return this.http.put<Subject>(`${this.baseUrl}/subjects/${id}`, subject);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subjects/${id}`);
  }

  // TimeSlot endpoints
  getTimeSlots(): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.baseUrl}/timeslots/`);
  }

  createTimeSlot(timeslot: Omit<TimeSlot, 'id'>): Observable<TimeSlot> {
    return this.http.post<TimeSlot>(`${this.baseUrl}/timeslots/`, timeslot);
  }

  updateTimeSlot(id: number, timeslot: Omit<TimeSlot, 'id'>): Observable<TimeSlot> {
    return this.http.put<TimeSlot>(`${this.baseUrl}/timeslots/${id}`, timeslot);
  }

  deleteTimeSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/timeslots/${id}`);
  }

  // Holiday endpoints
  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.baseUrl}/holidays/`);
  }

  createHoliday(holiday: Omit<Holiday, 'id'>): Observable<Holiday> {
    return this.http.post<Holiday>(`${this.baseUrl}/holidays/`, holiday);
  }

  updateHoliday(id: number, holiday: Omit<Holiday, 'id'>): Observable<Holiday> {
    return this.http.put<Holiday>(`${this.baseUrl}/holidays/${id}`, holiday);
  }

  deleteHoliday(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/holidays/${id}`);
  }

  // Schedule generation
  generateSchedule(request: ScheduleRequest): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(`${this.baseUrl}/generate/`, request);
  }
}
