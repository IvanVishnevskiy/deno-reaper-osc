import { Buffer } from "node:buffer";
import {
  stringToBytesWithPadding,
  floatToBytesWithPadding,
  intToBytesWithPadding,
} from "./helpers.ts";

/**
 * Forms an OSC message for a float value.
 * @param path - The OSC path.
 * @param arg - The float argument.
 */
const formFloatMessage = (path: string, arg: number): Buffer => {
  const pathPart = stringToBytesWithPadding(path);
  const typePart = stringToBytesWithPadding(`,f`); // 'f' indicates float type
  const oscBuffer = Buffer.concat([
    pathPart,
    typePart,
    floatToBytesWithPadding(arg),
  ]);
  // Add padding to ensure the message length is a multiple of 4
  const paddingLength = (4 - (oscBuffer.length % 4)) % 4;
  const padding = Buffer.alloc(paddingLength);
  return Buffer.concat([oscBuffer, padding]);
};

/**
 * Forms an OSC message for a int value.
 * @param path - The OSC path.
 * @param arg - The int argument.
 */
const formIntMessage = (path: string, arg: number): Buffer => {
  const pathPart = stringToBytesWithPadding(path);
  const typePart = stringToBytesWithPadding(`,i`); // 'i' indicates int type
  const oscBuffer = Buffer.concat([
    pathPart,
    typePart,
    intToBytesWithPadding(arg),
  ]);
  const paddingLength = (4 - (oscBuffer.length % 4)) % 4;
  const padding = Buffer.alloc(paddingLength);
  return Buffer.concat([oscBuffer, padding]);
};
/**
 * Forms a OSC message for a string value.
 * @param path - The OSC path.
 * @param arg - The string argument.
 */
const formStringMessage = (path: string, arg: string): Buffer => {
  const pathPart = stringToBytesWithPadding(path);
  const typePart = stringToBytesWithPadding(`,s`); // 's' indicates string type
  const argPart = stringToBytesWithPadding(arg);
  const oscBuffer = Buffer.concat([pathPart, typePart, argPart]);
  const paddingLength = (4 - (oscBuffer.length % 4)) % 4;
  const padding = Buffer.alloc(paddingLength);
  return Buffer.concat([oscBuffer, padding]);
};

export { formFloatMessage, formIntMessage, formStringMessage };
