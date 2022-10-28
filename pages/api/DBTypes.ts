export type SignUpSession = {
  challenge: string
  name: string
  tempID: string
}

export type User = {
  email: string
}

export const typeConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T
})