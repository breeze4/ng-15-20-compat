import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>General Settings</h2>
      <p>Configure general application settings.</p>
      <div class="settings-list">
        <div class="setting-item">
          <label>
            <span>Language</span>
            <select>
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <span>Theme</span>
            <select>
              <option>Dark</option>
              <option>Light</option>
              <option>System</option>
            </select>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <span>Timezone</span>
            <select>
              <option>UTC</option>
              <option>EST</option>
              <option>PST</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .settings-list { margin-top: 1rem; }
    .setting-item {
      margin-bottom: 1rem;
    }
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 0.25rem;
    }
    select {
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.2);
      color: white;
    }
  `]
})
export class GeneralComponent {}
