import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Notification Preferences</h2>
      <p>Choose how you want to be notified.</p>
      <div class="settings-list">
        <div class="setting-item">
          <span>Email Notifications</span>
          <input type="checkbox" checked>
        </div>
        <div class="setting-item">
          <span>Push Notifications</span>
          <input type="checkbox">
        </div>
        <div class="setting-item">
          <span>SMS Alerts</span>
          <input type="checkbox">
        </div>
        <div class="setting-item">
          <span>Weekly Digest</span>
          <input type="checkbox" checked>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .settings-list { margin-top: 1rem; }
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }
    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  `]
})
export class NotificationsComponent {}
