import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zones-test',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="zones-test">
      <h2>Zone.js Compatibility Test Scenarios</h2>
      <p class="tech-info">Angular 15.2 + Zone.js 0.12 (Zone-based)</p>

      <section class="zone-scenarios">
        <h3>Scenario 1: Input Binding</h3>
        <zone-scenario-1 [attr.value]="scenario1Value"></zone-scenario-1>
        <button (click)="updateScenario1()">Update Scenario 1 Value</button>

        <h3>Scenario 2: Custom Events</h3>
        <zone-scenario-2 (clicked)="onScenario2Click($event)"></zone-scenario-2>
        <p>Host received clicks: {{ scenario2Clicks }}</p>

        <h3>Scenario 3a: Well-Behaved Async (with markForCheck)</h3>
        <zone-scenario-3a (asyncComplete)="onScenario3aComplete($event)"></zone-scenario-3a>
        <p>Host received 3a count: {{ scenario3aCount }}</p>

        <h3>Scenario 3b: Zone-Dependent Async (no markForCheck)</h3>
        <zone-scenario-3b (lazyComplete)="onScenario3bComplete($event)"></zone-scenario-3b>
        <p>Host received 3b count: {{ scenario3bCount }} (compare with component display above)</p>
      </section>
    </div>
  `,
  styles: [`
    .zones-test {
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
    .zone-scenarios {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
    .zone-scenarios h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1.125rem;
      color: #1565c0;
      font-weight: 600;
    }
    .zone-scenarios p {
      margin: 0.5rem 0;
      font-size: 0.9375rem;
      color: #424242;
      line-height: 1.6;
    }
    .zone-scenarios button {
      margin-top: 0.75rem;
      margin-right: 0.5rem;
      padding: 0.625rem 1.25rem;
      cursor: pointer;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background 0.2s;
    }
    .zone-scenarios button:hover {
      background: #1565c0;
    }
  `]
})
export class ZonesTestComponent {
  scenario1Value = 'Initial';
  scenario2Clicks = 0;
  scenario3aCount = 0;
  scenario3bCount = 0;

  updateScenario1(): void {
    this.scenario1Value = 'Updated-' + Date.now();
  }

  onScenario2Click(event: Event): void {
    this.scenario2Clicks = (event as CustomEvent).detail;
  }

  onScenario3aComplete(event: Event): void {
    this.scenario3aCount = (event as CustomEvent).detail;
  }

  onScenario3bComplete(event: Event): void {
    this.scenario3bCount = (event as CustomEvent).detail;
  }
}
