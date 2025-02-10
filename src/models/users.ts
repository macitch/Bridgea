export interface FirestoreUser {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  [key: string]: any;
}