import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Register } from './register/register';
import { Dashboard } from './dashboard/dashboard';
import { AccountSettings } from './account-settings/account-settings';
import { Folderview } from './dashboard/folderview/folderview';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, children: [
    { path: 'folder/:id', component: Folderview }
  ]},
  { path: 'settings', component: AccountSettings }
];
