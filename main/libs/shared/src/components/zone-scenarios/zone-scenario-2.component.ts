import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Scenario 2: Inner → Outer (Custom Events)
 * Component button dispatches event.
 * Host listens and updates its state.
 * Expected: Works in all modes (Angular wraps template listeners).
 */
@Component({
  selector: 'zone-scenario-2',
  standalone: true,
  template: `
    <div class="scenario">
      <h3>Scenario 2: Custom Events</h3>
      <button (click)="emitClick()">Click me (count: {{ clickCount }})</button>
    </div>
  `,
  styles: [`
    .scenario {
      padding: 1rem;
      border: 1px solid #ccc;
      margin: 0.5rem 0;
      font-family: sans-serif;
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
    }
  `],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneScenario2Component {
  @Output() clicked = new EventEmitter<number>();

  clickCount = 0;

  emitClick(): void {
    this.clickCount++;
    this.clicked.emit(this.clickCount);
  }
}
