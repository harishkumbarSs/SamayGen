import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ScheduleResponse, TimeSlot, ScheduleItem } from '../api.service';
import { NavbarComponent } from '../navbar/navbar.component';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare global {
  interface Window {
    jspdf: any;
  }
}

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="scheduler-container">
      <h2>Academic Timetable Scheduler</h2>

      <!-- Controls -->
      <div class="controls">
        <div class="date-controls">
          <div class="form-group">
            <label for="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              [(ngModel)]="startDate"
              name="startDate"
              required>
          </div>
          <div class="form-group">
            <label for="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              [(ngModel)]="endDate"
              name="endDate"
              required>
          </div>
          <button class="btn-primary" (click)="generateSchedule()" [disabled]="isGenerating">
            {{ isGenerating ? 'Generating...' : 'Generate Timetable' }}
          </button>
        </div>

        <!-- Teacher-Subject Mapping UI -->
        <div class="mapping-controls">
          <div class="mapping-card">
            <div class="mapping-card-header">
              <div class="title-group">
                <h3>Assign Teachers to Subjects</h3>
                <span class="badge" [class.badge-warn]="unassignedCount>0">{{ subjects.length - unassignedCount }}/{{ subjects.length }} assigned</span>
              </div>
              <div class="actions">
                <input type="text" class="search" placeholder="Filter subjects..." [(ngModel)]="filterText">
                <select class="assign-all-select" [(ngModel)]="assignAllTeacherId">
                  <option [ngValue]="null">Assign all to...</option>
                  <option *ngFor="let t of teachers" [ngValue]="t.id">{{ t.name }}</option>
                </select>
                <button class="btn-secondary" (click)="applyAssignAll()" [disabled]="assignAllTeacherId==null">Apply</button>
                <button class="btn-link" (click)="clearAllMappings()">Clear all</button>
              </div>
            </div>

            <div class="mapping-grid">
              <div class="mapping-row" *ngFor="let subj of filteredSubjects">
                <div class="mapping-subject">
                  <span class="dot" [class.dot-unassigned]="!teacherMap[subj.id]"></span>
                  <span class="name">{{ subj.name }}</span>
                </div>
                <div class="mapping-select">
                  <select [(ngModel)]="teacherMap[subj.id]">
                    <option [ngValue]="null">Select teacher</option>
                    <option *ngFor="let t of teachers" [ngValue]="t.id">{{ t.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="helper" *ngIf="unassignedCount>0">{{ unassignedCount }} subject(s) unassigned. You can still generate, but teacher names will be empty in the timetable.</div>
          </div>
        </div>

        <div class="export-controls" *ngIf="scheduleResponse?.success">
          <button class="btn-secondary" (click)="exportToPDF()">
            Download as PDF
          </button>
          <button class="btn-secondary" (click)="exportToWord()">
            Download as Word
          </button>
        </div>
      </div>

      <!-- Loading/Error Messages -->
      <div class="messages">
        <div class="error-message" *ngIf="errorMessage">
          <i class="material-icons">error</i>
          {{ errorMessage }}
        </div>
        <div class="success-message" *ngIf="scheduleResponse?.success && !isGenerating">
          <i class="material-icons">check_circle</i>
          Timetable generated successfully!
        </div>
      </div>

      <!-- Timetable Grid -->
      <div class="timetable-container" *ngIf="scheduleResponse?.success && timeSlots.length > 0">
        <div class="timetable-grid">
          <!-- Header Row (Days) -->
          <div class="grid-header">
            <div class="time-column">Time</div>
            <div class="day-column" *ngFor="let day of daysOfWeek">
              {{ day }}
            </div>
          </div>

          <!-- Time Slots -->
          <div class="grid-row" *ngFor="let timeSlot of timeSlots">
            <div class="time-column">
              {{ timeSlot.start_time }} - {{ timeSlot.end_time }}
              <span *ngIf="timeSlot.is_break" class="break-label">Break</span>
            </div>

            <!-- Schedule Cells for each day -->
            <div
              class="schedule-cell"
              *ngFor="let day of daysOfWeek"
              [contentEditable]="true"
              (blur)="updateCell($event, day, timeSlot)"
              [innerHTML]="getCellContent(day, timeSlot)">
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="legend-container" *ngIf="scheduleResponse?.legend">
          <h3>Teachers assigned to subjects</h3>
          <div class="legend">
            <div class="legend-item" *ngFor="let item of legendItems">
              <strong>{{ item.subject }}:</strong> {{ item.teacher }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!scheduleResponse && !isGenerating">
        <i class="material-icons">schedule</i>
        <h3>Ready to Generate Timetable</h3>
        <p>Set your start and end dates above and click "Generate Timetable" to create your academic schedule.</p>
      </div>
    </div>
  `,
  styles: [`
    .scheduler-container {
      max-width: 1400px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    h2 {
      color: #333;
      margin-bottom: 2rem;
      text-align: center;
    }

    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .date-controls {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .export-controls {
      display: flex;
      gap: 1rem;
    }

    .mapping-controls {
      width: 100%;
      margin-top: 1rem;
    }

    .mapping-card {
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      padding: 1rem;
    }

    .mapping-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .title-group { display: flex; align-items: center; gap: 0.75rem; }
    .title-group h3 { margin: 0; }
    .badge { padding: 0.25rem 0.5rem; background: #e9ecef; border-radius: 999px; font-size: 0.8rem; }
    .badge-warn { background: #fff3cd; }

    .actions { display: flex; gap: 0.5rem; align-items: center; }
    .search { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
    .assign-all-select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
    .btn-link { background: transparent; border: none; color: #667eea; cursor: pointer; }

    .mapping-grid { display: grid; grid-template-columns: 1fr 240px; gap: 0.5rem 1rem; }
    .mapping-row { display: contents; }
    .mapping-subject { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.25rem; }
    .mapping-subject .name { font-weight: 600; color: #333; }
    .mapping-subject .dot { width: 10px; height: 10px; border-radius: 50%; background: #28a745; display: inline-block; }
    .mapping-subject .dot.dot-unassigned { background: #dc3545; }
    .mapping-select select { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
    .helper { margin-top: 0.5rem; color: #6c757d; font-size: 0.9rem; }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

    .form-group input {
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
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-secondary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
    }

    .messages {
      margin-bottom: 2rem;
    }

    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 6px;
      font-weight: 500;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .success-message {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .timetable-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .timetable-grid {
      overflow-x: auto;
    }

    .grid-header {
      display: grid;
      grid-template-columns: 150px repeat(6, 1fr);
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    }

    .grid-row {
      display: grid;
      grid-template-columns: 150px repeat(6, 1fr);
      border-bottom: 1px solid #dee2e6;
      transition: background-color 0.2s ease;
    }

    .grid-row:hover {
      background: #f8f9fa;
    }

    .time-column {
      padding: 1rem;
      font-weight: 600;
      color: #495057;
      background: #f8f9fa;
      border-right: 1px solid #dee2e6;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .day-column {
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: #495057;
      border-right: 1px solid #dee2e6;
    }

    .schedule-cell {
      padding: 0.5rem;
      border-right: 1px solid #dee2e6;
      min-height: 60px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      outline: none;
    }

    .schedule-cell:hover {
      background: #e9ecef;
    }

    .schedule-cell:focus {
      background: #fff3cd;
      border: 2px solid #ffc107;
    }

    .break-label {
      font-size: 0.8rem;
      color: #dc3545;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .legend-container {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .legend-container h3 {
      margin-bottom: 1rem;
      color: #495057;
    }

    .legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.5rem;
    }

    .legend-item {
      padding: 0.5rem;
      background: white;
      border-radius: 4px;
      border-left: 4px solid #667eea;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .empty-state i {
      font-size: 4rem;
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #6c757d;
      margin-bottom: 1rem;
    }

    .empty-state p {
      color: #6c757d;
      max-width: 500px;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .scheduler-container {
        margin: 1rem auto;
        padding: 0 1rem;
      }

      .controls {
        flex-direction: column;
        align-items: stretch;
      }

      .date-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .export-controls {
        justify-content: center;
      }

      .grid-header, .grid-row {
        grid-template-columns: 120px repeat(6, 1fr);
      }

      .time-column {
        font-size: 0.9rem;
      }
    }
  `]
})
export class SchedulerComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  isGenerating: boolean = false;
  errorMessage: string = '';
  scheduleResponse: ScheduleResponse | null = null;
  timeSlots: TimeSlot[] = [];
  teachers: { id:number; name:string }[] = [];
  subjects: { id:number; name:string }[] = [];
  teacherMap: { [subjectId: number]: number | null } = {};
  filterText: string = '';
  assignAllTeacherId: number | null = null;
  daysOfWeek: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTimeSlots();
    this.apiService.getTeachers().subscribe({ next: (t)=> this.teachers = t });
    this.apiService.getSubjects().subscribe({ next: (s)=> { this.subjects = s; s.forEach(ss=>{ if(!(ss.id in this.teacherMap)) this.teacherMap[ss.id]=null; }); } });
  }

  loadTimeSlots(): void {
    this.apiService.getTimeSlots().subscribe({
      next: (data) => this.timeSlots = data,
      error: (error) => console.error('Error loading time slots:', error)
    });
  }

  generateSchedule(): void {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Please select both start and end dates.';
      return;
    }

    this.isGenerating = true;
    this.errorMessage = '';

    const cleanMap: any = {};
    Object.entries(this.teacherMap).forEach(([sid, tid])=>{ if (tid != null) cleanMap[Number(sid)] = Number(tid); });
    this.apiService.generateSchedule({
      start_date: this.startDate,
      end_date: this.endDate,
      teacher_map: cleanMap
    }).subscribe({
      next: (response) => {
        this.isGenerating = false;
        this.scheduleResponse = response;

        console.log('Schedule response received:', response);

        if (!response.success) {
          this.errorMessage = response.error || 'Failed to generate schedule.';
          console.error('Schedule generation failed:', response.error);
        } else {
          console.log('Schedule generated successfully');
          console.log('Schedule items:', response.schedule?.length || 0);
          console.log('Legend:', response.legend);
          console.log('Sample schedule item:', response.schedule?.[0]);
        }
      },
      error: (error) => {
        this.isGenerating = false;
        this.errorMessage = 'Error generating schedule. Please check your backend connection.';
        console.error('Error:', error);
      }
    });
  }

  get filteredSubjects() {
    const ft = (this.filterText || '').trim().toLowerCase();
    return ft ? this.subjects.filter(s => s.name.toLowerCase().includes(ft)) : this.subjects;
  }

  get unassignedCount(): number {
    return this.subjects.reduce((acc, s) => acc + (this.teacherMap[s.id] ? 0 : 1), 0);
  }

  applyAssignAll(): void {
    if (this.assignAllTeacherId == null) return;
    this.subjects.forEach(s => this.teacherMap[s.id] = this.assignAllTeacherId);
  }

  clearAllMappings(): void {
    Object.keys(this.teacherMap).forEach(k => this.teacherMap[Number(k)] = null);
  }

  getCellContent(day: string, timeSlot: TimeSlot): string {
    if (!this.scheduleResponse?.schedule) {
      console.log('No schedule data available');
      return '';
    }

    console.log(`Looking for schedule item: ${day} at ${timeSlot.start_time}`);
    console.log('Available schedule items:', this.scheduleResponse.schedule.length);

    // Find ALL schedule items for this day and time slot across all dates
    const matchingItems = this.scheduleResponse.schedule.filter(item => {
      // Convert the date string to a Date object and get the day of week
      const itemDate = new Date(item.date + 'T00:00:00'); // Add time to make it a valid Date
      const itemDayIndex = itemDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Convert our day string to day index (Monday = 1, Sunday = 0)
      const dayIndexMap = {
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
      };

      const targetDayIndex = dayIndexMap[day as keyof typeof dayIndexMap] || 0;

      // Check if this is the right day and time slot
      const itemTime = item.start_time;
      const slotTime = timeSlot.start_time;

      return itemDayIndex === targetDayIndex && itemTime.startsWith(slotTime.substring(0, 5));
    });

    if (matchingItems.length > 0) {
      // For now, show the first match. In a full implementation, you might want to show all or handle conflicts
      const scheduleItem = matchingItems[0];
      const componentType = scheduleItem.component_type.toUpperCase();
      console.log(`Found ${matchingItems.length} matches. Displaying: ${scheduleItem.subject} (${componentType})`);
      return `${scheduleItem.subject} (${componentType})`;
    }

    console.log(`No schedule item found for ${day} at ${timeSlot.start_time}`);
    return '';
  }

  updateCell(event: Event, day: string, timeSlot: TimeSlot): void {
    const target = event.target as HTMLElement;
    const content = target.textContent?.trim() || '';

    // For now, we'll just log the update. In a full implementation,
    // you might want to send updates back to the backend
    console.log(`Updated ${day} ${timeSlot.start_time}: ${content}`);
  }

  exportToPDF(): void {
    if (!this.scheduleResponse?.schedule || !this.timeSlots.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.text('Academic Timetable', pageWidth / 2, 20, { align: 'center' });

    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${this.startDate} to ${this.endDate}`, pageWidth / 2, 30, { align: 'center' });

    // Prepare table data
    const headers = ['Time', ...this.daysOfWeek];

    const body = this.timeSlots.map(slot => {
      const row = [`${slot.start_time} - ${slot.end_time}`];

      this.daysOfWeek.forEach(day => {
        const content = this.getCellContent(day, slot);
        row.push(content || '-');
      });

      return row;
    });

    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: body,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Save the PDF
    doc.save(`timetable_${this.startDate}_to_${this.endDate}.pdf`);
  }

  exportToWord(): void {
    if (!this.scheduleResponse?.schedule || !this.timeSlots.length) return;

    // Create HTML content for Word export
    let htmlContent = `
      <html>
        <head>
          <title>Academic Timetable</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { text-align: center; color: #333; }
            h2 { text-align: center; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #667eea; color: white; }
            .break { background-color: #ffeaa7; }
            .legend { margin-top: 30px; }
            .legend-item { margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <h1>Academic Timetable</h1>
          <h2>Period: ${this.startDate} to ${this.endDate}</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
              </tr>
            </thead>
            <tbody>
    `;

    this.timeSlots.forEach(slot => {
      htmlContent += '<tr>';
      htmlContent += `<td${slot.is_break ? ' class="break"' : ''}>${slot.start_time} - ${slot.end_time}${slot.is_break ? ' (Break)' : ''}</td>`;

      this.daysOfWeek.forEach(day => {
        const content = this.getCellContent(day, slot);
        htmlContent += `<td>${content || '-'}</td>`;
      });

      htmlContent += '</tr>';
    });

    htmlContent += `
            </tbody>
          </table>
          <div class="legend">
            <h3>Legend</h3>
    `;

    if (this.scheduleResponse.legend) {
      Object.entries(this.scheduleResponse.legend).forEach(([subject, teacher]) => {
        htmlContent += `<div class="legend-item"><strong>${subject}:</strong> ${teacher}</div>`;
      });
    }

    htmlContent += `
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_${this.startDate}_to_${this.endDate}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  get legendItems(): { subject: string; teacher: string }[] {
    if (!this.scheduleResponse?.legend) return [];

    return Object.entries(this.scheduleResponse.legend).map(([subject, teacher]) => ({
      subject,
      teacher
    }));
  }

  // Debug method to check template conditions
  get debugInfo(): any {
    return {
      scheduleSuccess: this.scheduleResponse?.success,
      timeSlotsLength: this.timeSlots.length,
      scheduleLength: this.scheduleResponse?.schedule?.length || 0,
      hasLegend: !!this.scheduleResponse?.legend,
      isGenerating: this.isGenerating,
      errorMessage: this.errorMessage,
      templateCondition: this.scheduleResponse?.success && this.timeSlots.length > 0
    };
  }
}
