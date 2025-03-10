import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, 
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    PasswordModule, 
    ButtonModule, 
    MessagesModule, 
    MessageModule],
  templateUrl: './login-component.component.html',
  styleUrls: ['./login-component.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: [null, [Validators.required]],  
      password: [null, [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  ngOnInit() {}

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // FIXED: Extract correct values from the form
    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        if (response.accessToken) {
          console.log('Token stored successfully:', response.accessToken);
          alert('Login Successful!');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Invalid username or password';
        }
        this.isSubmitting = false;
      },
      error: () => {
        this.errorMessage = 'Error occurred during login';
        this.isSubmitting = false;
      }
    }); 
  }
}
