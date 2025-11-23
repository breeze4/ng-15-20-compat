import { Routes } from '@angular/router';
import { GeneralComponent } from './pages/general/general.component';
import { SecurityComponent } from './pages/security/security.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';

export const routes: Routes = [
  { path: '', redirectTo: 'general', pathMatch: 'full' },
  { path: 'general', component: GeneralComponent },
  { path: 'security', component: SecurityComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: '**', redirectTo: 'general' }
];
