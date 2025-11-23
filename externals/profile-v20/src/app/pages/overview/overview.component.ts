import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Profile Overview</h2>
      <p>View and manage your profile information.</p>
      <div class="profile-card">
        <div class="avatar">
          <span>DU</span>
        </div>
        <div class="profile-info">
          <h3>Demo User</h3>
          <p>demo&#64;example.com</p>
          <p class="joined">Member since January 2024</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { margin-top: 0; }
    .profile-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.25rem;
    }
    .profile-info h3 { margin: 0 0 0.25rem 0; }
    .profile-info p { margin: 0.25rem 0; opacity: 0.8; }
    .joined { font-size: 0.875rem; }
  `]
})
export class OverviewComponent {}
