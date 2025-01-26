// TODO: look into using dgram/buffer from Deno
import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import type { ReaperOscInstance } from "./types/ReaperOscInstance.ts";
import type { OscMessage } from "./types/OscMessage.ts";
import EventEmitter from "node:events";

import {
  formFloatMessage,
  formIntMessage,
  formStringMessage,
} from "./binary/messages.ts";
import {
  booleanToBytesWithPadding,
  charToBytesWithPadding,
} from "./binary/helpers.ts";
import { startsWith as bytesStartsWith } from "@std/bytes";

const BUNDLE_ARR = Buffer.from("#bundle");

/**
 * Parses an OSC value from a buffer.
 * @param msg The buffer to parse.
 * @param offset The offset to start parsing from.
 * @returns The parsed value and the new offset.
 */
const parseValue = (
  msg: Buffer,
  offset: number = 0,
): [{ type: string; data: unknown }, number] => {
  let i = offset;
  let value = 0;
  if (msg[i] === 44) {
    i++;
  }
  const type = String.fromCharCode(msg[i]);
  i = Math.ceil((i + 1) / 4) * 4;
  if (type === "f") {
    value = msg.readFloatBE(i);
    return [{
      type: "f",
      data: value,
    }, i + 4];
  }
  if (type === "i") {
    value = msg.readInt32BE(i);
    return [{
      type: "i",
      data: value,
    }, i + 4];
  }
  if (type === "b") {
    const value = msg[i] === 1 ? true : false;
    return [{
      type: "b",
      data: value,
    }, Math.ceil(i / 4) * 4];
  }
  if (type === "s") {
    let str = "";
    while (msg[i] !== 0) {
      str += String.fromCharCode(msg[i]);
      i++;
    }
    return [{
      type: "s",
      data: str,
    }, Math.ceil(i / 4) * 4];
  }
  throw new Error(`Invalid type ${type}`);
};

/**
 * Checks if a buffer is an OSC bundle.
 * @param msg The buffer to check.
 * @returns True if the buffer is an OSC bundle, false otherwise.
 */
const findIsBundle = (msg: Buffer) => {
  return bytesStartsWith(msg, BUNDLE_ARR);
};

/**
 * Parses an OSC message from a buffer.
 * @param message The buffer to parse.
 * @param offset The offset to start parsing from.
 * @returns The parsed message and the new offset.
 */
const parseMessage = (
  message: Buffer,
  offset: number = 0,
): [OscMessage, number] => {
  let i = offset;
  let addressString = "";

  // Parse address
  while (message[i] !== 0) {
    addressString += String.fromCharCode(message[i]);
    i++;
  }
  i++; // Skip null terminator
  i = Math.ceil(i / 4) * 4; // Align to 4-byte boundary

  // Initialize with OscMessageBase (no type or data yet)
  let parsedMessage: OscMessage = {
    address: addressString,
    hasTimetag: false,
    timeTag: undefined,
  };

  if (i >= message.length) {
    return [parsedMessage, i]; // Handle messages without arguments
  }

  if (message[i] !== 44) {
    console.error(
      "Invalid OSC message: Missing comma separator",
      message[i],
    );
    return [parsedMessage, i]; // Return OscMessageBase if parsing fails
  }
  i++;

  let data: { type: string; data: unknown };
  [data, i] = parseValue(message, i);

  // Update parsedMessage based on the parsed type and data
  switch (data.type) {
    case "f":
      parsedMessage = {
        ...parsedMessage,
        type: "f",
        data: data.data as number, // Now safe to cast
      };
      break;
    case "i":
      parsedMessage = {
        ...parsedMessage,
        type: "i",
        data: data.data as number,
      };
      break;
    case "b":
      parsedMessage = {
        ...parsedMessage,
        type: "b",
        data: data.data as boolean,
      };
      break;
    case "s":
      parsedMessage = {
        ...parsedMessage,
        type: "s",
        data: data.data as string,
      };
      break;
    case "c":
      parsedMessage = {
        ...parsedMessage,
        type: "c",
        data: data.data as string,
      };
      break;
  }

  return [parsedMessage, i];
};

/**
 * Parses an OSC bundle from a buffer.
 * @param msg The buffer to parse.
 * @param offset The offset to start parsing from.
 * @returns The parsed messages and the new offset.
 */
const parseBundle = (
  msg: Buffer,
  offset: number = 0,
): [OscMessage[], number] => {
  let hasTimetag = false;
  let i = offset;

  // Extract timetag
  const timeTagBuffer = msg.subarray(i, i + 8);
  i += 8;
  const timeTag = timeTagBuffer.readBigInt64BE();
  if (timeTag !== 1n) { // Check for immediate flag (1)
    hasTimetag = true;
  }

  const messages: OscMessage[] = [];

  while (i < msg.length) {
    const messageSize = msg.readInt32BE(i);
    if (i + 4 + messageSize > msg.length) {
      throw new Error("Invalid bundle: message size exceeds remaining buffer");
    }
    const messageBuffer = msg.subarray(i + 4, i + 4 + messageSize);
    i += 4 + messageSize;

    const isBundledMessage = findIsBundle(messageBuffer);
    if (isBundledMessage) {
      const [nestedMessages] = parseBundle(messageBuffer, 8); // Recursion for nested bundles
      messages.push(...nestedMessages);
    } else {
      const [message] = parseMessage(messageBuffer, 0);
      message.hasTimetag = hasTimetag;
      message.timeTag = hasTimetag ? timeTag : undefined;
      messages.push(message);
    }
  }

  return [messages, i];
};

/**
 * Parses an OSC message or bundle from a buffer.
 * @param msg The buffer to parse.
 * @returns The parsed messages.
 */
const parseOSCMessage = (msg: Buffer): OscMessage[] | undefined => {
  if (msg.length === 0) {
    console.error("Empty OSC message received");
    return;
  }

  const isBundle = findIsBundle(msg);

  if (isBundle) {
    if (msg.length < 16) {
      console.error("Message too short to be a valid OSC bundle");
      return;
    }
    const [messages] = parseBundle(msg, 8);
    return messages;
  } else {
    const [message] = parseMessage(msg, 0);
    return [message];
  }
};

/**
 * Reaper OSC client implementation.
 */
class Reaper extends EventEmitter implements ReaperOscInstance {
  protected port: number | null = null;
  protected localPort: number | null = null;
  protected client: dgram.Socket | null = null;
  protected crashHandler?: () => void;

  /**
   * Creates a new Reaper instance.
   * @param options - The Reaper options.
   */
  constructor(
    { localPort = 8778, port = 8777 } = {},
    crashHandler?: () => void,
  ) {
    super();
    this.port = port;
    this.localPort = localPort;
    this.crashHandler = crashHandler;
  }

  /**
   * Destroys the Reaper instance.
   */
  protected destroy: () => void = () => {
    this.client?.close();
    this.client = null;
    this.port = null;
    this.localPort = null;
  };

  /**
   * Connects to the Reaper instance.
   */
  public connect: () => Promise<void> = async () => {
    if (!this.localPort) {
      throw new Error("localPort is required");
    }
    const client: dgram.Socket = dgram.createSocket("udp4");
    this.client = client;
    client.bind(this.localPort);

    client.on("error", (err: Error) => {
      this.destroy();
      const { crashHandler } = this;
      if (crashHandler && typeof crashHandler === "function") crashHandler();
      else throw err;
    });

    client.on("message", (msg: Buffer) => {
      const parsedMessages = parseOSCMessage(msg);
      if (parsedMessages) {
        for (const message of parsedMessages) {
          this.emit("message", message);
        }
      }
    });

    await new Promise((resolve) => {
      client.on("listening", () => {
        this.emit("connected");
        resolve(client);
      });
    });
  };

  /**
   * Forms a OSC message.
   * @param path - The OSC path.
   * @param type - The OSC type.
   */
  public formMessage: {
    (path: string, type: "f", arg: number): Buffer;
    (path: string, type: "i", arg: number): Buffer;
    (path: string, type: "b", arg: boolean): Buffer;
    (path: string, type: "c", arg: string): Buffer;
    (path: string, type: "s", arg: string): Buffer;
    (
      path: string,
      type: "f" | "i" | "b" | "c" | "s",
      arg: number | string | boolean,
    ): Buffer;
  } = (
    path: string,
    type: "f" | "i" | "b" | "c" | "s",
    arg: number | string | boolean,
  ): Buffer => {
    if (type === "f") return formFloatMessage(path, arg as number);
    if (type === "i") return formIntMessage(path, arg as number);
    if (type === "b") return booleanToBytesWithPadding(arg as boolean);
    if (type === "c") return charToBytesWithPadding(arg as string);
    if (type === "s") return formStringMessage(path, arg as string);
    throw new Error(`Invalid type ${type}`);
  };

  /**
   * Sends a OSC message.
   * @param msg - The OSC message.
   */
  public send: (msg: Buffer) => Promise<void> = async (msg: Buffer) => {
    const { client, port } = this;
    if (!client) throw new Error("client is not connected");
    if (!port) throw new Error("client port is not set");

    await new Promise((resolve) =>
      client.send(msg, port, "127.0.0.1", resolve)
    );
  };
}

export { Reaper };
