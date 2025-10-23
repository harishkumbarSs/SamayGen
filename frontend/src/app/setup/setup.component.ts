import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, TimeSlot, Holiday } from '../api.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="setup-container">
      <h2>Setup - Time Slots & Holidays</h2>

      <!-- Time Slot Management -->
      <div class="section">
        <h3>Time Slot Management</h3>
        <div class="form-container">
          <form (ngSubmit)="createTimeSlot()" #timeSlotForm="ngForm">
            <div class="form-row">
              <div class="form-group">
                <label for="startTime">Start Time:</label>
                <input
                  type="time"
                  id="startTime"
                  [(ngModel)]="newTimeSlot.start_time"
                  name="startTime"
                  required>
              </div>
              <div class="form-group">
                <label for="endTime">End Time:</label>
                <input
                  type="time"
                  id="endTime"
                  [(ngModel)]="newTimeSlot.end_time"
                  name="endTime"
                  required>
              </div>
              <div class="form-group">
                <label for="isBreak">Is Break:</label>
                <input
                  type="checkbox"
                  id="isBreak"
                  [(ngModel)]="newTimeSlot.is_break"
                  name="isBreak">
              </div>
              <div class="form-group">
                <button type="submit" class="btn-primary" [disabled]="!timeSlotForm.valid">
                  Add Time Slot
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="list-container">
          <h4>Existing Time Slots</h4>
          <div class="list" *ngIf="timeSlots.length > 0; else noTimeSlots">
            <div class="list-item" *ngFor="let slot of timeSlots; let i = index">
              <span>{{ slot.start_time }} - {{ slot.end_time }}
                <span *ngIf="slot.is_break" class="break-badge">Break</span>
              </span>
              <button class="btn-danger" (click)="deleteTimeSlot(slot.id)">
                Delete
              </button>
            </div>
          </div>
          <ng-template #noTimeSlots>
            <p>No time slots configured yet.</p>
          </ng-template>
        </div>
      </div>

      <!-- Holiday Management -->
      <div class="section">
        <h3>Holiday Management</h3>
        <div class="form-container">
          <form (ngSubmit)="createHoliday()" #holidayForm="ngForm">
            <div class="form-row">
              <div class="form-group">
                <label for="holidayDate">Date:</label>
                <input
                  type="date"
                  id="holidayDate"
                  [(ngModel)]="newHoliday.date"
                  name="holidayDate"
                  required>
              </div>
              <div class="form-group">
                <label for="holidayDescription">Description:</label>
                <input
                  type="text"
                  id="holidayDescription"
                  [(ngModel)]="newHoliday.description"
                  name="holidayDescription"
                  placeholder="e.g., Diwali, Christmas"
                  required>
              </div>
              <div class="form-group">
                <button type="submit" class="btn-primary" [disabled]="!holidayForm.valid">
                  Add Holiday
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="list-container">
          <h4>Existing Holidays</h4>
          <div class="list" *ngIf="holidays.length > 0; else noHolidays">
            <div class="list-item" *ngFor="let holiday of holidays; let i = index">
              <span>{{ holiday.date | date:'mediumDate' }} - {{ holiday.description }}</span>
              <button class="btn-danger" (click)="deleteHoliday(holiday.id)">
                Delete
              </button>
            </div>
          </div>
          <ng-template #noHolidays>
            <p>No holidays configured yet.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setup-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    h2 {
      color: #333;
      margin-bottom: 2rem;
      text-align: center;
    }

    .section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    h3 {
      color: #555;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .form-container {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .form-group {
      flex: 1;
      min-width: 200px;
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
      margin-top: 1rem;
    }

    .list-container h4 {
      margin-bottom: 1rem;
      color: #666;
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
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      transition: box-shadow 0.2s ease;
    }

    .list-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .break-badge {
      background: #ffc107;
      color: #212529;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    @media (max-width: 768px) {
      .setup-container {
        margin: 1rem auto;
        padding: 0 1rem;
      }

      .form-row {
        flex-direction: column;
      }

      .form-group {
        min-width: auto;
      }
    }
  `]
})
export class SetupComponent implements OnInit {
  timeSlots: TimeSlot[] = [];
  holidays: Holiday[] = [];

  newTimeSlot: Omit<TimeSlot, 'id'> = {
    start_time: '',
    end_time: '',
    is_break: false
  };

  newHoliday: Omit<Holiday, 'id'> = {
    date: '',
    description: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTimeSlots();
    this.loadHolidays();
  }

  loadTimeSlots(): void {
    this.apiService.getTimeSlots().subscribe({
      next: (data) => this.timeSlots = data,
      error: (error) => console.error('Error loading time slots:', error)
    });
  }

  loadHolidays(): void {
    this.apiService.getHolidays().subscribe({
      next: (data) => this.holidays = data,
      error: (error) => console.error('Error loading holidays:', error)
    });
  }

  createTimeSlot(): void {
    this.apiService.createTimeSlot(this.newTimeSlot).subscribe({
      next: () => {
        this.loadTimeSlots();
        this.newTimeSlot = { start_time: '', end_time: '', is_break: false };
      },
      error: (error) => console.error('Error creating time slot:', error)
    });
  }

  deleteTimeSlot(id: number): void {
    if (confirm('Are you sure you want to delete this time slot?')) {
      this.apiService.deleteTimeSlot(id).subscribe({
        next: () => this.loadTimeSlots(),
        error: (error) => console.error('Error deleting time slot:', error)
      });
    }
  }

  createHoliday(): void {
    this.apiService.createHoliday(this.newHoliday).subscribe({
      next: () => {
        this.loadHolidays();
        this.newHoliday = { date: '', description: '' };
      },
      error: (error) => console.error('Error creating holiday:', error)
    });
  }

  deleteHoliday(id: number): void {
    if (confirm('Are you sure you want to delete this holiday?')) {
      this.apiService.deleteHoliday(id).subscribe({
        next: () => this.loadHolidays(),
        error: (error) => console.error('Error deleting holiday:', error)
      });
    }
  }
}
