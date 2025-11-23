import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Analytics</h2>
      <p>View detailed analytics and performance metrics.</p>
      <div class="chart-placeholder">
        <p>Chart visualization would go here</p>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .chart-placeholder {
      background: rgba(255,255,255,0.05);
      border: 2px dashed rgba(255,255,255,0.2);
      padding: 3rem;
      text-align: center;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class AnalyticsComponent {}
