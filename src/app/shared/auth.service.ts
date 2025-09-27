import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  signOut
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@angular/fire/storage';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  userData$ = new BehaviorSubject<any>(null);

  constructor() {}

  /** 🔹 Register new user */
  async register(
    email: string,
    password: string,
    name: string,
    photoFile?: File
  ): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;

    // Upload photo if provided
    let photoURL = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    if (photoFile) {
      const filePath = `profile_images/${user.uid}/${photoFile.name}`;
      const storageRef = ref(this.storage, filePath);
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
    }

    // Update Firebase Auth profile
    await firebaseUpdateProfile(user, {
      displayName: name,
      photoURL
    });

    // Create Firestore document
    await setDoc(doc(this.firestore, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      photoURL,
      createdAt: new Date()
    });

    // Emit user data
    this.userData$.next({ displayName: name, email, photoURL });

    return userCredential;
  }

  /** 🔹 Login user and get Firestore profile */
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = userCredential.user.uid;

    // Try get Firestore data
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    const profile = snap.exists()
      ? snap.data()
      : {
          name: userCredential.user.displayName,
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL
        };

    this.userData$.next(profile);
    return { authUser: userCredential.user, profile };
  }

  /** 🔹 Update Profile */
  async updateProfile(user: User, name: string, photoFile?: File): Promise<void> {
    let photoURL = user.photoURL || null;

    if (photoFile) {
      const filePath = `profile_images/${user.uid}/${photoFile.name}`;
      const storageRef = ref(this.storage, filePath);
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
    }

    await firebaseUpdateProfile(user, { displayName: name, photoURL });

    const userRef = doc(this.firestore, 'users', user.uid);
    await updateDoc(userRef, { name, photoURL });

    this.userData$.next({
      ...this.userData$.value,
      name,
      photoURL
    });
  }

  /** 🔹 Update Password */
  async updatePassword(user: User, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    await firebaseUpdatePassword(user, newPassword);
  }

  /** 🔹 Delete User */
  async deleteUser(user: User): Promise<void> {
    const userRef = doc(this.firestore, 'users', user.uid);
    await deleteDoc(userRef);
    await firebaseDeleteUser(user);
  }

  /** 🔹 Logout */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
