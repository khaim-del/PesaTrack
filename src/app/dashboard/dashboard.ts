import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Auth, signOut, user, User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {
  private afs = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  /** Firebase Auth user */
  authUser: User | null = null;

  /** Firestore profile data */
  userData: any;

  folders: any[] = [];
  folderTotals: { [key: string]: number } = {};
  folderOpen = false;
  searchQuery = '';
  settingsOpen = false;

  ngOnInit() {
    // 🔹 Reactively update profile from AuthService
    this.authService.userData$.subscribe((profile) => {
      if (profile) {
        this.userData = profile;
      }
    });

    // 🔹 Listen to logged-in user
    user(this.auth).subscribe(async (u) => {
      if (u) {
        this.authUser = u;

        // Load Firestore profile
        const userDocRef = doc(this.afs, `users/${u.uid}`);
        const snap = await getDoc(userDocRef);
        this.userData = snap.exists()
          ? snap.data()
          : { name: u.displayName, email: u.email, photoURL: u.photoURL };

        this.loadFolders();
      }
    });

    // Track current route (settings/folders open)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.folderOpen = this.router.url.includes('/dashboard/folder');
        this.settingsOpen = this.router.url.includes('/dashboard/settings');
      });
  }

  /** ✅ Getters for profile */
  get userName(): string {
    return this.userData?.name || 
    this.authUser?.displayName || 
    'Anonymous';
  }

  get userPhoto(): string {
    return (
      this.userData?.photoURL ||
      this.authUser?.photoURL ||
      'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    );
  }

  get userEmail(): string {
    return this.userData?.email || this.authUser?.email || '';
  }

  /** 🔹 Load user folders */
  loadFolders() {
    if (!this.authUser) return;

    const foldersRef = collection(this.afs, `users/${this.authUser.uid}/folders`);

    collectionData(foldersRef, { idField: 'id' })
      .pipe(
        map((folders) =>
          folders.map((f: any) => ({
            id: f.id,
            created: f.created ? new Date(f.created.seconds * 1000) : null,
          }))
        )
      )
      .subscribe({
        next: (folders) => {
          this.folders = folders;
          this.getFolderTotals();
        },
        error: (err) => console.error('🔥 Firestore error in loadFolders:', err),
      });
  }

  /** 🔹 Create new folder for today */
  createFolder() {
    if (!this.authUser) return;

    const dateStr = this.todayFolderName;
    const folderRef = doc(this.afs, `users/${this.authUser.uid}/folders/${dateStr}`);

    setDoc(folderRef, { created: new Date() }).then(() => {
      this.router.navigate(['/dashboard/folder', dateStr]);
    });
  }

  /** 🔹 Calculate totals per folder */
  getFolderTotals() {
    if (!this.authUser) return;

    for (let folder of this.folders) {
      const entriesRef = collection(
        this.afs,
        `users/${this.authUser.uid}/folders/${folder.id}/entries`
      );

      collectionData(entriesRef).subscribe({
        next: (entries: any[]) => {
          this.folderTotals[folder.id] = entries.reduce(
            (sum, entry) => sum + (+entry.amount || 0),
            0
          );
        },
        error: (err) =>
          console.error(`🔥 Firestore error in getFolderTotals for ${folder.id}:`, err),
      });
    }
  }

  /** 🔹 Helper: today’s folder name */
  get todayFolderName(): string {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /** 🔹 Filter + sort folders */
  get filteredFolders() {
    return this.folders
      .filter((folder) =>
        folder.id.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = a.created ? new Date(a.created).getTime() : 0;
        const dateB = b.created ? new Date(b.created).getTime() : 0;
        return dateB - dateA;
      });
  }

  get isTfc(): boolean {
    return this.folders.some((folder) => folder.id === this.todayFolderName);
  }

  /** Navigation */
  goToSettings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
  }

}
