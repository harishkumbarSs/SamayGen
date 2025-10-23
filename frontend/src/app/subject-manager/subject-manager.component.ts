import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Subject } from '../api.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-subject-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="manager-container">
      <h2>Subject Management</h2>

      <div class="form-container">
        <form (ngSubmit)="createSubject()" #subjectForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="semester">Semester:</label>
              <select id="semester" [(ngModel)]="newSubject.semester" name="semester">
                <option [ngValue]="null">Select semester</option>
                <option *ngFor="let s of [1,2,3,4,5,6,7,8]" [ngValue]="s">Semester {{s}}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="branch">Branch:</label>
              <input type="text" id="branch" [(ngModel)]="newSubject.branch" name="branch" placeholder="e.g., CSE, ECE">
            </div>
            <div class="form-group">
              <label for="subjectName">Subject Name:</label>
              <input
                type="text"
                id="subjectName"
                [(ngModel)]="newSubject.name"
                name="subjectName"
                placeholder="Enter subject name"
                required>
            </div>
            <div class="form-group">
              <label for="lectureHours">Lecture Hours:</label>
              <input
                type="number"
                id="lectureHours"
                [(ngModel)]="newSubject.lecture_hours"
                name="lectureHours"
                min="0"
                required>
            </div>
            <div class="form-group">
              <label for="tutorialHours">Tutorial Hours:</label>
              <input
                type="number"
                id="tutorialHours"
                [(ngModel)]="newSubject.tutorial_hours"
                name="tutorialHours"
                min="0"
                required>
            </div>
            <div class="form-group">
              <label for="practicalHours">Practical Hours:</label>
              <input
                type="number"
                id="practicalHours"
                [(ngModel)]="newSubject.practical_hours"
                name="practicalHours"
                min="0"
                required>
            </div>
            <div class="form-group">
              <button type="submit" class="btn-primary" [disabled]="!subjectForm.valid">
                Add Subject
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="list-container">
        <h3>Subjects</h3>
        <div class="list" *ngIf="subjects.length > 0; else noSubjects">
          <div class="list-item" *ngFor="let subject of subjects; let i = index">
            <div class="subject-info">
              <strong>{{ subject.name }}</strong>
              <div class="meta">
                <span *ngIf="subject.semester">Sem {{subject.semester}}</span>
                <span *ngIf="subject.branch">• {{subject.branch}}</span>
              </div>
              <div class="hours-info">
                <span class="hours-badge lecture">L: {{ subject.lecture_hours }}</span>
                <span class="hours-badge tutorial">T: {{ subject.tutorial_hours }}</span>
                <span class="hours-badge practical">P: {{ subject.practical_hours }}</span>
              </div>
            </div>
            <div class="actions">
              <button class="btn-secondary" (click)="editSubject(subject)">
                Edit
              </button>
              <button class="btn-danger" (click)="deleteSubject(subject.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
        <ng-template #noSubjects>
          <p>No subjects added yet.</p>
        </ng-template>
      </div>

      <!-- Edit Modal -->
      <div class="modal" *ngIf="editingSubject" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Edit Subject</h3>
          <form (ngSubmit)="updateSubject()" #editForm="ngForm">
            <div class="form-group">
              <label for="editName">Subject Name:</label>
              <input
                type="text"
                id="editName"
                [(ngModel)]="editingSubject.name"
                name="editName"
                required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="editLectureHours">Lecture Hours:</label>
                <input
                  type="number"
                  id="editLectureHours"
                  [(ngModel)]="editingSubject.lecture_hours"
                  name="editLectureHours"
                  min="0"
                  required>
              </div>
              <div class="form-group">
                <label for="editTutorialHours">Tutorial Hours:</label>
                <input
                  type="number"
                  id="editTutorialHours"
                  [(ngModel)]="editingSubject.tutorial_hours"
                  name="editTutorialHours"
                  min="0"
                  required>
              </div>
              <div class="form-group">
                <label for="editPracticalHours">Practical Hours:</label>
                <input
                  type="number"
                  id="editPracticalHours"
                  [(ngModel)]="editingSubject.practical_hours"
                  name="editPracticalHours"
                  min="0"
                  required>
              </div>
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
      max-width: 1000px;
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
      flex-wrap: wrap;
    }

    .form-group {
      flex: 1;
      min-width: 150px;
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

    .subject-info {
      flex: 1;
    }

    .subject-info strong {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .hours-info {
      display: flex;
      gap: 0.5rem;
    }

    .hours-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .hours-badge.lecture {
      background: #007bff;
      color: white;
    }

    .hours-badge.tutorial {
      background: #28a745;
      color: white;
    }

    .hours-badge.practical {
      background: #dc3545;
      color: white;
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
      max-width: 600px;
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
export class SubjectManagerComponent implements OnInit {
  subjects: Subject[] = [];
  newSubject: Omit<Subject, 'id'> = {
    name: '',
    lecture_hours: 0,
    tutorial_hours: 0,
    practical_hours: 0,
    semester: null,
    branch: ''
  };
  editingSubject: Subject | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.apiService.getSubjects().subscribe({
      next: (data) => this.subjects = data,
      error: (error) => console.error('Error loading subjects:', error)
    });
  }

  createSubject(): void {
    this.apiService.createSubject(this.newSubject).subscribe({
      next: () => {
        this.loadSubjects();
        this.newSubject = { name: '', lecture_hours: 0, tutorial_hours: 0, practical_hours: 0, semester: null, branch: '' };
      },
      error: (error) => console.error('Error creating subject:', error)
    });
  }

  editSubject(subject: Subject): void {
    this.editingSubject = { ...subject };
  }

  updateSubject(): void {
    if (this.editingSubject) {
      this.apiService.updateSubject(this.editingSubject.id, {
        name: this.editingSubject.name,
        lecture_hours: this.editingSubject.lecture_hours,
        tutorial_hours: this.editingSubject.tutorial_hours,
        practical_hours: this.editingSubject.practical_hours,
        semester: this.editingSubject.semester ?? null,
        branch: this.editingSubject.branch ?? ''
      }).subscribe({
        next: () => {
          this.loadSubjects();
          this.closeEditModal();
        },
        error: (error) => console.error('Error updating subject:', error)
      });
    }
  }

  deleteSubject(id: number): void {
    if (confirm('Are you sure you want to delete this subject?')) {
      this.apiService.deleteSubject(id).subscribe({
        next: () => this.loadSubjects(),
        error: (error) => console.error('Error deleting subject:', error)
      });
    }
  }

  closeEditModal(): void {
    this.editingSubject = null;
  }
}
