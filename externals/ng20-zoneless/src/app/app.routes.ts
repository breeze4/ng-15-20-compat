import { Routes } from '@angular/router';
import { ZonesTestComponent } from './pages/zones/zones-test.component';
import { MaterialTestComponent } from './pages/material/material-test.component';

export const routes: Routes = [
  { path: '', redirectTo: 'zones', pathMatch: 'full' },
  { path: 'zones', component: ZonesTestComponent },
  { path: 'material', component: MaterialTestComponent },
  { path: '**', redirectTo: 'zones' }
];
