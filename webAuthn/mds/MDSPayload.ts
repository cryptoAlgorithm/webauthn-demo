// MDS payload types

export type MDSPayload = {
  legalHeader?: string
  no: number
  nextUpdate: string
  entries: MetadataBLOBPayloadEntry[]

}

export type MetadataBLOBPayloadEntry = {
  aaid?: string
  aaguid?: string     // must be set for fido2
  attestationCertificateKeyIdentifiers?: string[]
  metadataStatement?: MetadataStatement
  biometricStatusReport?: BiometricStatusReports[]
  statusReports: StatusReports[]
  timeOfLastStatusChange: string
  rogueListURL?: string
  rogueListHash?: string
}

export type MetadataStatement = {
  legalHeader?: string
  aaid?: string
  aaguid?: string     // must be set for fido2
  attestationCertificateKeyIdentifiers?: string[]
  description: string
  alternativeDescriptions?: AlternativeDescriptions[]
  authenticatorVersion: number
  protocolFamily: string  // uaf, u2f, fido2
  schema: number
  upv: Version[]  // CTAP 2.0 - major:1, minor:0; CTAP 2.1 - major:1, minor:1
  authenticationAlgorithms: string[]
  publicKeyAlgAndEncodings: string[]
  attestationTypes: string[]
  userVerificationDetails: VerificationMethodANDCombinations[]
  keyProtection: string[]
  isKeyRestricted?: boolean
  isFreshUserVerificationRequired?: boolean
  matcherProtection: string[]
  cryptoStrength?: number
  attachmentHint?: string[]
  tcDisplay: string[]
  tcDisplayContentType?: string
  tcDisplayPNGCharacteristics?: DisplayPNGCharacteristicsDescriptor[]
  attestationRootCertificates: string[]   // base64 DER PKIX
  ecdaaTrustAnchors?: EcdaaTrustAnchor[]
  icon?: string
  supportedExtensions?: ExtensionDescriptor[]
  authenticatorGetInfo?: AuthenticatorGetInfo
}

export type AlternativeDescriptions = {
  [lang: string]: string
}

export type Version = {
  [ver: string]: number
}

export type VerificationMethodANDCombinations = {
  userVerificationMethod?: string
  caDesc?: {
    base: number
    minLength: number
    maxRetries?: number
    blockSlowdown?: number
  }
  baDesc?: {
    selfAttestedFRR?: number
    selfAttestedFAR?: number
    maxTemplates?: number
    maxRetries?: number
    blockSlowdown?: number
  }
  paDesc?: {
    minComplexity: number
    maxRetries?: number
    blockSlowdown?: number
  }
}

export type DisplayPNGCharacteristicsDescriptor = {
  width: number
  height: number
  bitDepth: number
  colorType: number
  compression: number
  filter: number
  interlace: number
  plte: {
    r: number
    g: number
    b: number
  }[]
}

export type EcdaaTrustAnchor = {
  X: string
  Y: string
  c: string
  sx: string
  sy: string
  G1Curve: string
}

export type ExtensionDescriptor = {
  id: string
  tag?: number
  data?: string
  fail_if_unknown: boolean
}

export type AuthenticatorGetInfo = {
  versions?: string[]
  extensions?: string[]
  aaguid?: string
  options?: {
    plat?: boolean
    rk?: boolean
    clientPin?: boolean
    up?: boolean
    uv?: boolean
    uvToken?: boolean
    config?: boolean
  }
  maxMsgSize?: number
  pinUvAuthProtocols?: number[]
  maxCredentialCountInList?: number
  maxCredentialIdLength?: number
  transport?: string[]
  algorithms?: {
    type: string
    alg: number
  }[]
  maxAuthenticatorConfigLength?: number
  defaultCredProtect?: number
  firmwareVersion?: number
}

export type BiometricStatusReports = {
  certLevel: number
  modality: string
  effectiveDate?: string
  certificationDescriptor?: string
  certificateNumber?: string
  certificationPolicyVersion?: string
  certificationRequirementsVersion?: string
}

export type StatusReports = {
  status: AuthenticatorStatus
  effectiveDate?: string
  authenticatorVersion?: number
  certificate?: string
  url?: string
  certificationDescriptor?: string
  certificateNumber?: string
  certificationPolicyVersion?: string
  certificationRequirementsVersion?: string
}

export type AuthenticatorStatus =
  'NOT_FIDO_CERTIFIED' |
  'FIDO_CERTIFIED' |
  'USER_VERIFICATION_BYPASS' |
  'ATTESTATION_KEY_COMPROMISE' |
  'USER_KEY_REMOTE_COMPROMISE' |
  'USER_KEY_PHYSICAL_COMPROMISE' |
  'UPDATE_AVAILABLE' |
  'REVOKED' |
  'SELF_ASSERTION_SUBMITTED' |
  'FIDO_CERTIFIED_L1' |
  'FIDO_CERTIFIED_L1plus' |
  'FIDO_CERTIFIED_L2' |
  'FIDO_CERTIFIED_L2plus' |
  'FIDO_CERTIFIED_L3' |
  'FIDO_CERTIFIED_L3plus'

