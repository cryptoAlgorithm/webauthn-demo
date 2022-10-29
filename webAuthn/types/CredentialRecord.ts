export enum CredentialType {
  password = 'password',
  publicKey = 'public-key',
  federated = 'federated'
}

/**
 * A WebAuthn credential for storage
 */
export type CredentialRecord = {
  type: CredentialType
  credentialID: Buffer
  publicKeyBytes: Buffer
  signCount: number
  backupEligible: boolean
  backupState: boolean
}