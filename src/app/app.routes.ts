import { Routes } from '@angular/router';
import { FormComponent } from './components/form/form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login-component/login-component.component';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' }, 
    { path: 'login', component: LoginComponent },
    { path: 'form', component: FormComponent },
    { path: 'dashboard', component: DashboardComponent },

];
