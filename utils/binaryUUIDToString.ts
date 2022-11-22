const binaryUUIDToString = (uuid: Buffer): string => {
  const uuidString = uuid.toString('hex');
  return `${uuidString.slice(0, 8)}-${uuidString.slice(8, 12)}-${uuidString.slice(12, 16)}-${uuidString.slice(16, 20)}-${uuidString.slice(20)}`;
}

export default binaryUUIDToString;