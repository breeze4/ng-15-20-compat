import { Routes } from '@angular/router';
import { OverviewComponent } from './pages/overview/overview.component';
import { PreferencesComponent } from './pages/preferences/preferences.component';
import { ActivityComponent } from './pages/activity/activity.component';

export const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: OverviewComponent },
  { path: 'preferences', component: PreferencesComponent },
  { path: 'activity', component: ActivityComponent },
  { path: '**', redirectTo: 'overview' }
];
