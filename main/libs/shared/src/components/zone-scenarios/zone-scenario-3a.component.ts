import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Scenario 3a: Async - Well-Behaved (FALSE POSITIVE)
 * setTimeout → state change → explicit markForCheck → dispatch event
 * Expected: Works everywhere because component explicitly triggers CD.
 */
@Component({
  selector: 'zone-scenario-3a',
  standalone: true,
  template: `
    <div class="scenario">
      <h3>Scenario 3a: Well-Behaved Async</h3>
      <button (click)="startAsync()">Start Async</button>
      <p>Counter: <strong>{{ counter }}</strong></p>
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
    }
    button {
      padding: 0.5rem 1rem;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }
    p {
      margin: 0;
    }
  `],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneScenario3aComponent {
  @Output() asyncComplete = new EventEmitter<number>();

  counter = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      this.cdr.markForCheck(); // Explicit CD trigger - works in zoneless
      this.asyncComplete.emit(this.counter);
    }, 1000);
  }
}
