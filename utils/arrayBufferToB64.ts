/**
 * Convert an ArrayBuffer into a base64-encoded string
 * Adopted from https://stackoverflow.com/a/9458996/
 * @param buffer ArrayBuffer to encode to base64
 * @return base64 representation of the buffer
 */
const arrayBufferToB64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  new Uint8Array(buffer).forEach(v => binary += String.fromCharCode(v))
  return window.btoa(binary);
}

export default arrayBufferToB64