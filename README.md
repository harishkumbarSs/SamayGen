# SamayGen - Academic Timetable Generator

SamayGen is a comprehensive curriculum-based academic timetable generator that creates semester-long schedules based on subject requirements, teacher availability, room constraints, and academic rules.

## Features

### Backend (Python & FastAPI)
- **AI-Powered Scheduling**: Uses Google OR-Tools CP-SAT solver for optimal timetable generation
- **Comprehensive Constraints**: Handles teacher conflicts, room availability, subject requirements, and contiguous practical sessions
- **Full CRUD API**: Complete REST API for managing teachers, subjects, rooms, time slots, and holidays
- **SQLite Database**: File-based database for easy portability and setup

### Frontend (Angular)
- **Intuitive Interface**: Modern, responsive web application with clean design
- **Interactive Timetable Grid**: Visual weekly schedule with editable cells
- **Management Dashboards**: Separate pages for managing teachers, subjects, rooms, and schedule setup
- **Export Functionality**: Download timetables as PDF or Word documents
- **Real-time Generation**: Generate schedules for any date range with immediate feedback

## Technology Stack

- **Backend**: Python 3.8+, FastAPI, SQLAlchemy, Google OR-Tools, SQLite
- **Frontend**: Angular 17, TypeScript, SCSS, jsPDF, Material Icons
- **Database**: SQLite (file-based, no server required)

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the FastAPI server**:
   ```bash
   python -m app.main
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   ng serve
   ```

The frontend will be available at `http://localhost:4200`

## Usage Guide

### 1. Initial Setup

**Configure Time Slots**:
- Go to Setup page
- Add time slots for your college schedule (e.g., 9:00-10:00, 10:00-11:00)
- Mark break periods as needed

**Add Holidays**:
- Specify dates when classes won't be held (weekends are automatically excluded)

### 2. Data Management

**Add Teachers**:
- Navigate to Teachers page
- Add all faculty members who will be teaching

**Configure Subjects**:
- Go to Subjects page
- Add each subject with its L-T-P requirements:
  - **L**: Lecture hours per week
  - **T**: Tutorial hours per week
  - **P**: Practical hours per week

**Setup Rooms**:
- Navigate to Rooms page
- Add classrooms, lecture halls, and labs
- Specify room type (Lecture Hall, Classroom, Lab)

### 3. Generate Timetable

**Select Date Range**:
- Go to Scheduler page
- Choose semester start and end dates
- Click "Generate Timetable"

**Review Results**:
- View the generated schedule in the grid
- Check the legend for teacher assignments
- Edit individual cells if needed

### 4. Export Results

**Download Options**:
- **PDF Export**: Professional formatted timetable
- **Word Export**: Editable document format

## Architecture Overview

### Backend Structure
```
backend/
├── app/
│   ├── models.py      # SQLAlchemy database models
│   ├── schemas.py     # Pydantic request/response schemas
│   ├── database.py    # Database connection and session management
│   ├── main.py        # FastAPI application and API endpoints
│   └── solver.py      # Core AI scheduling algorithm
└── requirements.txt   # Python dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── api.service.ts              # Backend communication
│   │   ├── app.routes.ts               # Application routing
│   │   ├── navbar/                     # Navigation component
│   │   ├── setup/                      # Time slots & holidays management
│   │   ├── teacher-manager/            # Teacher management
│   │   ├── subject-manager/            # Subject management
│   │   ├── room-manager/               # Room management
│   │   └── scheduler/                  # Main timetable interface
│   ├── styles.scss                     # Global styles
│   └── main.ts                         # Application bootstrap
└── package.json                        # Node.js dependencies
```

## Key Features Explained

### AI Solver Algorithm

The core scheduling logic uses **Google OR-Tools CP-SAT** solver with these constraints:

1. **Subject Decomposition**: Breaks subjects into atomic L/T/P components
2. **Calendar Awareness**: Excludes Sundays and specified holidays
3. **Resource Constraints**: Prevents teacher and room conflicts
4. **Room Type Matching**: Ensures practicals are in labs, lectures in appropriate rooms
5. **Contiguous Practicals**: Schedules practical sessions back-to-back on the same day
6. **Total Hours Verification**: Ensures all required hours are scheduled

### Advanced Constraints

- **Teacher Assignment**: Each subject is assigned to a specific teacher
- **Room Capacity**: Rooms can only host one class at a time
- **Time Slot Optimization**: Efficiently distributes classes across available time slots
- **Performance Optimization**: 20-second timeout prevents infinite loops

## API Endpoints

### Core Resources
- `GET/POST/PUT/DELETE /teachers/` - Teacher management
- `GET/POST/PUT/DELETE /subjects/` - Subject management
- `GET/POST/PUT/DELETE /rooms/` - Room management
- `GET/POST/PUT/DELETE /timeslots/` - Time slot management
- `GET/POST/PUT/DELETE /holidays/` - Holiday management

### Schedule Generation
- `POST /generate/` - Generate curriculum schedule for date range

## Troubleshooting

### Common Issues

**Backend Connection Errors**:
- Ensure FastAPI server is running on port 8000
- Check CORS settings in .env file

**Solver Timeout**:
- Complex schedules may take time to solve
- Consider reducing the date range for testing

**No Solution Found**:
- Verify all required data is entered (teachers, subjects, rooms, time slots)
- Check for conflicting constraints (insufficient rooms/teachers for subjects)

### Development

**Running in Development Mode**:
```bash
# Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
ng serve --host 0.0.0.0 --port 4200
```


https://github.com/user-attachments/assets/07b18fbf-ff67-413a-9a36-e6057d081019


## Contributing

This is a complete, production-ready application. For enhancements:
1. Backend improvements can be made to `solver.py`
2. Frontend features can be added to respective components
3. Database schema changes require model updates

## License

This project is open source and available under the MIT License.
