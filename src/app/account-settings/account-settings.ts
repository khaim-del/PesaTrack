import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  Auth, 
  User, 
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
 } from '@angular/fire/auth';
import { AuthService } from '../shared/auth.service';
import { doc, deleteDoc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-account-settings',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css'
})

export class AccountSettings {
  private auth = inject(Auth);
  private router = inject(Router);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  
  authUser: User | null = null;
  
  displayName = '';
  photoURL = '';
  email = '';
  photoFile?: File;
  photoPreview: string | null = null;

  newPassword: string = '';
  confirmPassword: string = '';
  currentPassword = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  showCurrentPassword: boolean = false;
  confirmDelete = false;
  showChangePassword = false;

  showDeleteAccount = false;
  confirmEmail = '';
  deleteError = '';
  deleteSuccess = '';

  successMessage = '';
  errorMessage = '';
  userData: any;

  ngOnInit() {
    // Watch for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.authUser = user;
        this.displayName = user.displayName || '';
        this.photoURL = user.photoURL || '';
        this.email = user.email || '';
      } else {
        // No user signed in, redirect to login
        this.authUser = null;
        this.router.navigate(['/login']);
      }
    });

    // Subscribe to profile data updates (if you store in Firestore)
    this.authService.userData$.subscribe((profile) => {
      if (profile) {
        this.userData = profile;
      }
    });
  }

  toggleDeleteConfirm() {
    this.confirmDelete = !this.confirmDelete;
  }

  get userEmail(): string {
    return this.email || this.authUser?.email || '';
  }

  get userPhoto(): string {
    return (
      this.photoPreview ||
      this.photoURL ||
      this.authUser?.photoURL ||
      'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoFile = input.files[0];

      // Show instant preview
      const reader = new FileReader();
      reader.onload = e => this.photoPreview = e.target?.result as string;
      reader.readAsDataURL(this.photoFile);
    }
  }

  async changePassword() {
    if (!this.authUser) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = '❌ Passwords do not match.';
      return;
    }

    if (!this.currentPassword) {
      this.errorMessage = '❌ Please enter your current password.';
      return;
    }

    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        this.authUser.email!,
        this.currentPassword
      );
      await reauthenticateWithCredential(this.authUser, credential);

      // Now update the password
      await this.authService.updatePassword(this.authUser, this.newPassword);

      this.successMessage = '✅ Password updated successfully!';
      this.newPassword = '';
      this.confirmPassword = '';
      this.currentPassword = '';
      this.showChangePassword = false;
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.code === 'auth/wrong-password') {
        this.errorMessage = '❌ Incorrect current password.';
      } else if (error.code === 'auth/requires-recent-login') {
        this.errorMessage = '⚠️ Please sign in again to change your password.';
      } else {
        this.errorMessage = error.message || '❌ Failed to update password.';
      }
    }
  }

  async confirmDeleteAccount() {
    if (!this.authUser) {
      this.deleteError = 'User not found.';
      return;
    }

    if (this.confirmEmail !== this.authUser.email) {
      this.deleteError = 'Email confirmation does not match.';
      return;
    }

    try {
      // Reauthenticate if needed
      const password = prompt('Please confirm your password before deleting account:');
      if (!password) {
        this.deleteError = 'Password confirmation is required.';
        return;
      }

      const credential = EmailAuthProvider.credential(this.authUser.email!, password);
      await reauthenticateWithCredential(this.authUser, credential);

      // Optionally delete from Firestore
      const userDocRef = doc(this.firestore, 'users', this.authUser.uid);
      await deleteDoc(userDocRef).catch(() => {
        console.warn('No Firestore document to delete.');
      });

      // Delete from Firebase Auth
      await deleteUser(this.authUser);

      this.deleteSuccess = '✅ Account deleted successfully.';
      this.deleteError = '';
      // Optionally redirect
      this.router.navigate(['/register']);
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.code === 'auth/requires-recent-login') {
        this.deleteError = 'Please reauthenticate before deleting account.';
      } else {
        this.deleteError = error.message || 'Failed to delete account.';
      }
    }
  }

  async saveChanges() {
    if (!this.authUser) return;

    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Update display name + photo
      await this.authService.updateProfile(this.authUser, this.displayName, this.photoFile);

      // Update password if valid and matches
      if (this.newPassword && this.newPassword === this.confirmPassword) {
        await this.authService.updatePassword(this.authUser, this.newPassword);
      } else if (this.newPassword || this.confirmPassword) {
        this.errorMessage = '❌ Passwords do not match or are invalid.';
        return;
      }

      this.photoFile = undefined;
      this.photoPreview = null;

      this.successMessage = '✅ Profile updated successfully!';
      this.router.navigate(['/dashboard']);

    } catch (err: any) {
      this.errorMessage = err.message;
      console.error('Update failed:', err);
    }
  }

  async deleteAccount() {
    if (!this.authUser) return;

    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Delete user from Firebase Auth + Firestore
      await this.authService.deleteUser(this.authUser);

      this.successMessage = '✅ Your account has been permanently deleted.';

      // Log out and redirect to login/home
      await this.authService.logout();
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      console.error('Delete account error:', error);
      this.errorMessage = '❌ Failed to delete account. Please reauthenticate and try again.';
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

}
