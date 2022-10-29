import { firestore } from 'firebase-admin';
import { CredentialRecord } from '../../webAuthn/validateRegistration';

export type SignUpSession = {
  challenge: string
  name: string
  tempID: string,
  expires: firestore.Timestamp
}

export type User = {
  email: string
  credential: CredentialRecord
}

export const typeConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T
})