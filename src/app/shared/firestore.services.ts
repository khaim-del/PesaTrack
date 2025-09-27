import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface List {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private getCurrentDateFormatted(): string {
    const date = new Date();
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }); // e.g., '2 Jan 2025'
  }

  async addEntry(name: string, amount: number, note: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const dateListId = this.getCurrentDateFormatted();

    // Ensure the "folder" (date doc) exists
    const listDocRef = doc(this.firestore, `${user.uid}/${dateListId}`);
    await setDoc(listDocRef, { createdAt: new Date() }, { merge: true });

    // Add entry inside the subcollection
    const entriesRef = collection(this.firestore, `${user.uid}/${dateListId}/entries`);
    await addDoc(entriesRef, {
      name,
      amount,
      note,
      date: new Date(),
    });
  }

  getListNames(): Observable<string[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const listsRef = collection(this.firestore, user.uid);
    return collectionData(listsRef, { idField: 'id' }).pipe(
      map((lists: any[]) => lists.map((list) => list.id))
    );
  }

  getEntries(listId: string): Observable<any[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const entriesRef = collection(this.firestore, `${user.uid}/${listId}/entries`);
    const q = query(entriesRef, orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' });
  }
}
