import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Room } from '../api.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-room-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="manager-container">
      <h2>Room Management</h2>

      <div class="form-container">
        <form (ngSubmit)="createRoom()" #roomForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="roomName">Room Name:</label>
              <input
                type="text"
                id="roomName"
                [(ngModel)]="newRoom.name"
                name="roomName"
                placeholder="Enter room name"
                required>
            </div>
            <div class="form-group">
              <label for="roomType">Room Type:</label>
              <select
                id="roomType"
                [(ngModel)]="newRoom.room_type"
                name="roomType"
                required>
                <option value="">Select room type</option>
                <option value="Lecture Hall">Lecture Hall</option>
                <option value="Classroom">Classroom</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div class="form-group">
              <button type="submit" class="btn-primary" [disabled]="!roomForm.valid">
                Add Room
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="list-container">
        <h3>Rooms</h3>
        <div class="list" *ngIf="rooms.length > 0; else noRooms">
          <div class="list-item" *ngFor="let room of rooms; let i = index">
            <div class="room-info">
              <strong>{{ room.name }}</strong>
              <span class="room-type-badge" [ngClass]="'type-' + room.room_type.toLowerCase().replace(' ', '-')">
                {{ room.room_type }}
              </span>
            </div>
            <div class="actions">
              <button class="btn-secondary" (click)="editRoom(room)">
                Edit
              </button>
              <button class="btn-danger" (click)="deleteRoom(room.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
        <ng-template #noRooms>
          <p>No rooms added yet.</p>
        </ng-template>
      </div>

      <!-- Edit Modal -->
      <div class="modal" *ngIf="editingRoom" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Edit Room</h3>
          <form (ngSubmit)="updateRoom()" #editForm="ngForm">
            <div class="form-group">
              <label for="editName">Room Name:</label>
              <input
                type="text"
                id="editName"
                [(ngModel)]="editingRoom.name"
                name="editName"
                required>
            </div>
            <div class="form-group">
              <label for="editType">Room Type:</label>
              <select
                id="editType"
                [(ngModel)]="editingRoom.room_type"
                name="editType"
                required>
                <option value="Lecture Hall">Lecture Hall</option>
                <option value="Classroom">Classroom</option>
                <option value="Lab">Lab</option>
              </select>
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

    .form-group input, .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus, .form-group select:focus {
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

    .room-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .room-info strong {
      color: #333;
    }

    .room-type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .room-type-badge.type-lecture-hall {
      background: #007bff;
      color: white;
    }

    .room-type-badge.type-classroom {
      background: #28a745;
      color: white;
    }

    .room-type-badge.type-lab {
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
export class RoomManagerComponent implements OnInit {
  rooms: Room[] = [];
  newRoom: Omit<Room, 'id'> = { name: '', room_type: '' };
  editingRoom: Room | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.apiService.getRooms().subscribe({
      next: (data) => this.rooms = data,
      error: (error) => console.error('Error loading rooms:', error)
    });
  }

  createRoom(): void {
    this.apiService.createRoom(this.newRoom).subscribe({
      next: () => {
        this.loadRooms();
        this.newRoom = { name: '', room_type: '' };
      },
      error: (error) => console.error('Error creating room:', error)
    });
  }

  editRoom(room: Room): void {
    this.editingRoom = { ...room };
  }

  updateRoom(): void {
    if (this.editingRoom) {
      this.apiService.updateRoom(this.editingRoom.id, {
        name: this.editingRoom.name,
        room_type: this.editingRoom.room_type
      }).subscribe({
        next: () => {
          this.loadRooms();
          this.closeEditModal();
        },
        error: (error) => console.error('Error updating room:', error)
      });
    }
  }

  deleteRoom(id: number): void {
    if (confirm('Are you sure you want to delete this room?')) {
      this.apiService.deleteRoom(id).subscribe({
        next: () => this.loadRooms(),
        error: (error) => console.error('Error deleting room:', error)
      });
    }
  }

  closeEditModal(): void {
    this.editingRoom = null;
  }
}
