import { Routes } from '@angular/router';
import { SchedulerComponent } from './scheduler/scheduler.component';
import { SetupComponent } from './setup/setup.component';
import { TeacherManagerComponent } from './teacher-manager/teacher-manager.component';
import { SubjectManagerComponent } from './subject-manager/subject-manager.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';

export const routes: Routes = [
  { path: '', redirectTo: '/scheduler', pathMatch: 'full' },
  { path: 'scheduler', component: SchedulerComponent },
  { path: 'setup', component: SetupComponent },
  { path: 'teachers', component: TeacherManagerComponent },
  { path: 'subjects', component: SubjectManagerComponent },
  { path: 'rooms', component: RoomManagerComponent }
];
