import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <h1>SamayGen</h1>
        <span>Academic Timetable Generator</span>
      </div>
      <ul class="navbar-nav">
        <li class="nav-item">
          <a routerLink="/scheduler" routerLinkActive="active" class="nav-link">
            <i class="material-icons">schedule</i>
            Scheduler
          </a>
        </li>
        <li class="nav-item">
          <a routerLink="/setup" routerLinkActive="active" class="nav-link">
            <i class="material-icons">settings</i>
            Setup
          </a>
        </li>
        <li class="nav-item">
          <a routerLink="/teachers" routerLinkActive="active" class="nav-link">
            <i class="material-icons">person</i>
            Teachers
          </a>
        </li>
        <li class="nav-item">
          <a routerLink="/subjects" routerLinkActive="active" class="nav-link">
            <i class="material-icons">book</i>
            Subjects
          </a>
        </li>
        <li class="nav-item">
          <a routerLink="/rooms" routerLinkActive="active" class="nav-link">
            <i class="material-icons">room</i>
            Rooms
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .navbar-brand h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .navbar-brand span {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .navbar-nav {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 1rem;
    }

    .nav-item {
      display: flex;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      transform: translateY(-1px);
    }

    .nav-link.active {
      background: rgba(255,255,255,0.2);
    }

    .nav-link i {
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 1rem;
      }

      .navbar-nav {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `]
})
export class NavbarComponent { }
