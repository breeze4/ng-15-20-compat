import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Security Settings</h2>
      <p>Manage your security preferences.</p>
      <div class="settings-list">
        <div class="setting-item">
          <span>Two-Factor Authentication</span>
          <button>Enable</button>
        </div>
        <div class="setting-item">
          <span>Change Password</span>
          <button>Update</button>
        </div>
        <div class="setting-item">
          <span>Active Sessions</span>
          <button>View</button>
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
    button {
      padding: 0.5rem 1rem;
      background: #8b5cf6;
      border: none;
      border-radius: 0.25rem;
      color: white;
      cursor: pointer;
    }
    button:hover { background: #7c3aed; }
  `]
})
export class SecurityComponent {}
