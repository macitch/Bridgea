export interface FirestoreUser {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  workspaceName?: string;
  [key: string]: any;
}