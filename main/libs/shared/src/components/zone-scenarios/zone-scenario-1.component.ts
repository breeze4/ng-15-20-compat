import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Scenario 1: Outer → Inner (Input Binding)
 * Host updates a value, passes it via attribute/input.
 * Component displays the value.
 * Expected: Works in all modes (zoned and zoneless).
 */
@Component({
  selector: 'zone-scenario-1',
  standalone: true,
  template: `
    <div class="scenario">
      <h3>Scenario 1: Input Binding</h3>
      <p>Value from host: <strong>{{ value }}</strong></p>
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
    p {
      margin: 0;
    }
  `],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneScenario1Component {
  @Input() value: string = '';
}
