import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';

/**
 * Scenario 3b: Async - Zone.js Dependent (TRUE TEST)
 * setTimeout → state change → NO markForCheck
 * Expected:
 *   - Zone mode: View updates (Zone.js patches setTimeout and triggers CD)
 *   - Zoneless: View stays stale (nothing triggers re-render)
 *
 * This simulates real Angular 15 component behavior where components
 * rely on Zone.js to detect async completion and trigger CD.
 */
@Component({
  selector: 'zone-scenario-3b',
  standalone: true,
  template: `
    <div class="scenario">
      <h3>Scenario 3b: Zone-Dependent Async</h3>
      <button (click)="startAsync()">Start Lazy Async</button>
      <button (click)="forceUpdate()">Force Update</button>
      <p>Counter (internal): <strong>{{ counter }}</strong></p>
      <p class="note">In zoneless: display freezes, but events still fire. Click "Force Update" to see actual value.</p>
    </div>
  `,
  styles: [`
    .scenario {
      padding: 1rem;
      border: 1px solid #ccc;
      margin: 0.5rem 0;
      font-family: sans-serif;
      background: #fff8e1;
    }
    h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: #333;
      font-weight: 600;
    }
    button {
      padding: 0.5rem 1rem;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }
    p {
      margin: 0 0 0.25rem 0;
    }
    .note {
      font-size: 0.75rem;
      color: #666;
      font-style: italic;
    }
  `],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneScenario3bComponent {
  @Output() lazyComplete = new EventEmitter<number>();

  counter = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      // NO markForCheck() - relies on Zone.js to trigger CD
      // In zoneless mode, this view update will NOT happen
      this.lazyComplete.emit(this.counter);
    }, 1000);
  }

  forceUpdate(): void {
    // Manually trigger change detection to show the actual counter value
    this.cdr.markForCheck();
  }
}
