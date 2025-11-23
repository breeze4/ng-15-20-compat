import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Dashboard Overview</h2>
      <p>Welcome to the Angular 15 Dashboard. This is the main overview page.</p>
      <div class="stats">
        <div class="stat-card">
          <h3>Total Users</h3>
          <span class="value">1,234</span>
        </div>
        <div class="stat-card">
          <h3>Active Sessions</h3>
          <span class="value">567</span>
        </div>
        <div class="stat-card">
          <h3>Revenue</h3>
          <span class="value">$12,345</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.1);
      padding: 1rem;
      border-radius: 0.5rem;
    }
    .stat-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      opacity: 0.8;
    }
    .value {
      font-size: 1.5rem;
      font-weight: bold;
    }
  `]
})
export class OverviewComponent {}
