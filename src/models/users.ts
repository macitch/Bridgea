//FirestoreUser is the interface for the user object in Firestore
export interface FirestoreUser {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  workspaceName?: string;
  [key: string]: any;
}