import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Reports</h2>
      <p>Generate and download reports.</p>
      <div class="report-list">
        <div class="report-item">
          <span>Monthly Summary</span>
          <button>Download</button>
        </div>
        <div class="report-item">
          <span>User Activity</span>
          <button>Download</button>
        </div>
        <div class="report-item">
          <span>Revenue Report</span>
          <button>Download</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .report-list {
      margin-top: 1rem;
    }
    .report-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }
    button {
      padding: 0.25rem 0.75rem;
      background: #3b82f6;
      border: none;
      border-radius: 0.25rem;
      color: white;
      cursor: pointer;
    }
    button:hover { background: #2563eb; }
  `]
})
export class ReportsComponent {}
