import { Buffer } from "node:buffer";

/**
 * Serializes a string to a Uint8Array, padding it to a multiple of 4 bytes.
 * @param str - The string to convert.
 * @returns a Uing8Array
 */
const stringToBytesWithPadding = (str: string) => {
  if (typeof str !== "string") throw new Error("str must be a string");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const paddedBytes = new Uint8Array((bytes.length + 4) & ~0b11 || 4); // round up to the nearest multiple of 4 or if it's already a multiple of 4 adds 4 empty bytes
  paddedBytes.set(bytes);
  return paddedBytes;
};
/**
 * Serializes an integer to a Uint8Array, padding it to a multiple of 4 bytes.
 * @param int - The integer to convert.
 * @returns a Uing8Array
 */
const intToBytesWithPadding = (int: number): Buffer => {
  if (typeof int !== "number") throw new Error("int must be a number");
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(int, 0);
  return buffer;
};

/**
 * Serializes a float to a Uint8Array, padding it to a multiple of 4 bytes.
 * @param float The float to convert
 * @returns a Uing8Array
 */
const floatToBytesWithPadding = (float: number): Buffer => {
  if (typeof float !== "number") throw new Error("float must be a number");
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(float, 0);
  return buffer;
};

/**
 * Serializes a boolean to a Uint8Array, padding it to a multiple of 4 bytes.
 * @param bool The boolean to serialize
 * @returns a Uing8Array
 */
const booleanToBytesWithPadding = (bool: boolean): Buffer => {
  if (typeof bool !== "boolean") throw new Error("bool must be a boolean");
  const buffer = Buffer.alloc(4); // Allocate 4 bytes
  buffer.writeUInt8(bool ? 1 : 0, 0); // Write boolean value to the first byte
  return buffer;
};

/**
 * Serializes a char to a UInt8Array, padding it to a multiple of 4 bytes.
 * @param char
 * @returns
 */
const charToBytesWithPadding = (char: string): Buffer => {
  if (typeof char !== "string") throw new Error("char must be a string");
  const buffer = Buffer.alloc(4); // Allocate 4 bytes
  buffer.writeUInt8(char.charCodeAt(0), 0); // Write character code to the first byte
  return buffer;
};

const bytesToString = (bytes: Uint8Array) => {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

export {
  booleanToBytesWithPadding,
  bytesToString,
  charToBytesWithPadding,
  floatToBytesWithPadding,
  intToBytesWithPadding,
  stringToBytesWithPadding,
};
