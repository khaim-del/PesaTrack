import { Component, inject } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private router = inject(Router);
  private authService = inject(AuthService);

  email = '';
  password = '';
  showPassword = false;

  errorMessage = '';
  successMessage = '';

  async login() {
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const { authUser, profile } = await this.authService.login(
        this.email.trim(),
        this.password.trim()
      );

      console.log('Auth user:', authUser);
      console.log('Full profile from Firestore:', profile);

      this.successMessage = 'Login successful! Redirecting...';
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);

    } catch (err: any) {
      this.errorMessage = err.message;
      console.error('Login failed', err);
    }
  }

}
