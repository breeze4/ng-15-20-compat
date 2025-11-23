import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Activity Log</h2>
      <p>Your recent activity.</p>
      <div class="activity-list">
        <div class="activity-item">
          <span class="time">2 hours ago</span>
          <span class="action">Updated profile settings</span>
        </div>
        <div class="activity-item">
          <span class="time">1 day ago</span>
          <span class="action">Changed password</span>
        </div>
        <div class="activity-item">
          <span class="time">3 days ago</span>
          <span class="action">Logged in from new device</span>
        </div>
        <div class="activity-item">
          <span class="time">1 week ago</span>
          <span class="action">Account created</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .activity-list { margin-top: 1rem; }
    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }
    .time {
      font-size: 0.75rem;
      opacity: 0.6;
      min-width: 100px;
    }
    .action {
      flex: 1;
    }
  `]
})
export class ActivityComponent {}
