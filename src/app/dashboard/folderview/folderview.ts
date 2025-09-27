import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-folderview',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './folderview.html',
  styleUrl: './folderview.css'
})
export class Folderview {
  private afs = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  folderId: string | null = null;
  entries: any[] = [];
  total = 0;
  isTodayFolder = false;

  newEntry = {
    name: '',
    amount: 0,
    note: ''
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.folderId = params.get('id');
      console.log('DEBUG: folderId from route =', this.folderId);

      if (this.folderId) {
        this.checkIfToday(this.folderId);
        this.loadEntries();
      }
    });
  }

  checkIfToday(folderId: string) {
    const todayId = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    this.isTodayFolder = folderId === todayId;
    console.log('DEBUG: isTodayFolder =', this.isTodayFolder);
  }

  loadEntries() {
    const user = this.auth.currentUser;
    if (!user || !this.folderId) {
      console.error('❌ Missing user or folderId');
      return;
    }

    console.log(`DEBUG: Loading entries for user=${user.uid}, folder=${this.folderId}`);

    const entriesRef = collection(this.afs, `users/${user.uid}/folders/${this.folderId}/entries`);

    collectionData(entriesRef, { idField: 'id' }).subscribe({
      next: (entries: any[]) => {
        console.log('DEBUG: entries received =', entries);
        this.entries = entries;
        this.total = entries.reduce((sum, e) => sum + (+e.amount || 0), 0);
      },
      error: (err) => console.error('🔥 Error loading entries:', err)
    });
  }

  async addEntry() {
    const user = this.auth.currentUser;
    if (!user || !this.folderId) return;

    const id = Date.now().toString();
    const entryRef = doc(this.afs, `users/${user.uid}/folders/${this.folderId}/entries/${id}`);

    await setDoc(entryRef, { ...this.newEntry });
    this.newEntry = { name: '', amount: 0, note: '' };
  }

  async deleteEntry(id: string) {
    const user = this.auth.currentUser;
    if (!user || !this.folderId) return;

    const entryRef = doc(this.afs, `users/${user.uid}/folders/${this.folderId}/entries/${id}`);
    await deleteDoc(entryRef);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

}
