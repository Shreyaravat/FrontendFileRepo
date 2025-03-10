import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from "./components/login-component/login-component.component";

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet],
    
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'FrontendFile';
}
