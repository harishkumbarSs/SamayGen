import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Teacher } from '../api.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-teacher-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="manager-container">
      <h2>Teacher Management</h2>

      <div class="form-container">
        <form (ngSubmit)="createTeacher()" #teacherForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="teacherName">Teacher Name:</label>
              <input
                type="text"
                id="teacherName"
                [(ngModel)]="newTeacher.name"
                name="teacherName"
                placeholder="Enter teacher name"
                required>
            </div>
            <div class="form-group">
              <button type="submit" class="btn-primary" [disabled]="!teacherForm.valid">
                Add Teacher
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="list-container">
        <h3>Teachers</h3>
        <div class="list" *ngIf="teachers.length > 0; else noTeachers">
          <div class="list-item" *ngFor="let teacher of teachers; let i = index">
            <span>{{ teacher.name }}</span>
            <div class="actions">
              <button class="btn-secondary" (click)="editTeacher(teacher)">
                Edit
              </button>
              <button class="btn-danger" (click)="deleteTeacher(teacher.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
        <ng-template #noTeachers>
          <p>No teachers added yet.</p>
        </ng-template>
      </div>

      <!-- Edit Modal -->
      <div class="modal" *ngIf="editingTeacher" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Edit Teacher</h3>
          <form (ngSubmit)="updateTeacher()" #editForm="ngForm">
            <div class="form-group">
              <label for="editName">Teacher Name:</label>
              <input
                type="text"
                id="editName"
                [(ngModel)]="editingTeacher.name"
                name="editName"
                required>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeEditModal()">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manager-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    h2 {
      color: #333;
      margin-bottom: 2rem;
      text-align: center;
    }

    .form-container {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: end;
    }

    .form-group {
      flex: 1;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-right: 0.5rem;
      transition: background-color 0.2s ease;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s ease;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    .list-container {
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    h3 {
      margin-bottom: 1rem;
      color: #555;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      transition: box-shadow 0.2s ease;
    }

    .list-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }
  `]
})
export class TeacherManagerComponent implements OnInit {
  teachers: Teacher[] = [];
  newTeacher: Omit<Teacher, 'id'> = { name: '' };
  editingTeacher: Teacher | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.apiService.getTeachers().subscribe({
      next: (data) => this.teachers = data,
      error: (error) => console.error('Error loading teachers:', error)
    });
  }

  createTeacher(): void {
    this.apiService.createTeacher(this.newTeacher).subscribe({
      next: () => {
        this.loadTeachers();
        this.newTeacher = { name: '' };
      },
      error: (error) => console.error('Error creating teacher:', error)
    });
  }

  editTeacher(teacher: Teacher): void {
    this.editingTeacher = { ...teacher };
  }

  updateTeacher(): void {
    if (this.editingTeacher) {
      this.apiService.updateTeacher(this.editingTeacher.id, { name: this.editingTeacher.name }).subscribe({
        next: () => {
          this.loadTeachers();
          this.closeEditModal();
        },
        error: (error) => console.error('Error updating teacher:', error)
      });
    }
  }

  deleteTeacher(id: number): void {
    if (confirm('Are you sure you want to delete this teacher?')) {
      this.apiService.deleteTeacher(id).subscribe({
        next: () => this.loadTeachers(),
        error: (error) => console.error('Error deleting teacher:', error)
      });
    }
  }

  closeEditModal(): void {
    this.editingTeacher = null;
  }
}
