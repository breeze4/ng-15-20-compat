import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>User Preferences</h2>
      <p>Customize your experience.</p>
      <div class="pref-list">
        <div class="pref-item">
          <span>Display Name</span>
          <input type="text" value="Demo User">
        </div>
        <div class="pref-item">
          <span>Email</span>
          <input type="email" value="demo@example.com">
        </div>
        <div class="pref-item">
          <span>Bio</span>
          <textarea rows="3">Software developer interested in Angular</textarea>
        </div>
      </div>
      <button class="save-btn">Save Changes</button>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .pref-list { margin-top: 1rem; }
    .pref-item {
      margin-bottom: 1rem;
    }
    .pref-item span {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
      opacity: 0.8;
    }
    input, textarea {
      width: 100%;
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.2);
      color: white;
      font-family: inherit;
    }
    .save-btn {
      padding: 0.5rem 1rem;
      background: #22c55e;
      border: none;
      border-radius: 0.25rem;
      color: white;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .save-btn:hover { background: #16a34a; }
  `]
})
export class PreferencesComponent {}
