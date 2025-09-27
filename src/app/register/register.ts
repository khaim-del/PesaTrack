import { Component, inject } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  photoFile: File | undefined;

  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  photoPreview: string | ArrayBuffer | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => (this.photoPreview = reader.result);
      reader.readAsDataURL(this.photoFile);
    } else {
      this.photoFile = undefined;
      this.photoPreview = null;
    }
  }

  async register() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    try {
      const userCredential = await this.authService.register(
        this.email,
        this.password,
        this.name,
        this.photoFile
      );

      this.successMessage = 'Registration successful! Redirecting ...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      console.log('Success', userCredential);
    } catch (err: any) {
      this.errorMessage = err.message;
      console.error('Failure', err);
    }
  }

}
