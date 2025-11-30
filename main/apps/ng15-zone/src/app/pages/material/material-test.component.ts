import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-material-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="material-test">
      <h2>Material Components Test</h2>
      <p class="tech-info">Angular 15.2 + Zone.js 0.12 (Zone-based)</p>

      <section class="test-section">
        <p>Material component compatibility tests will be added here.</p>
        <p>This page will demonstrate Angular Material components behavior across different Angular versions and zone modes.</p>
      </section>
    </div>
  `,
  styles: [`
    .material-test {
      padding: 1.5rem;
    }
    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      color: #1a1a1a;
      font-weight: 600;
    }
    .tech-info {
      margin: 0 0 2rem 0;
      padding: 0.75rem 1.25rem;
      background: #e3f2fd;
      border-left: 5px solid #1976d2;
      font-weight: 600;
      font-size: 0.95rem;
      color: #0d47a1;
      border-radius: 4px;
    }
    .test-section {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .test-section p {
      margin: 0.5rem 0;
      font-size: 0.9375rem;
      color: #424242;
      line-height: 1.6;
    }
  `]
})
export class MaterialTestComponent {
}
