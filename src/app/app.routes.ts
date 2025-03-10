import { Routes } from '@angular/router';
import { LoginComponent } from './login-component/login-component.component';
import { FormComponent } from './form/form.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' }, 
    { path: 'login', component: LoginComponent },
    { path: 'form', component: FormComponent },
    { path: 'dashboard', component: DashboardComponent },

];