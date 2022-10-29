import { firestore } from 'firebase-admin';
import { CredentialRecord } from '../../webAuthn/types/CredentialRecord';

export type SignUpSession = {
  challenge: string
  name: string
  email: string
  tempID: string
  expires: firestore.Timestamp
}

export type AuthCeremonyBookmark = {
  challenge: string
  expires: firestore.Timestamp
}

export type User = {
  email: string
  name: string
  credential: CredentialRecord
}

export enum DBCollections {
  users = 'users',
  authCeremonies = 'authCeremonies',
  signUpSessions = 'signUpSessions'
}

export const typeConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T
})