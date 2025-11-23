import { Routes } from '@angular/router';
import { OverviewComponent } from './pages/overview/overview.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: OverviewComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: '**', redirectTo: 'overview' }
];
