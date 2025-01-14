// TODO: look into using dgram/buffer from Deno
import dgram from "node:dgram";
import type { Buffer } from "node:buffer";
import type { ReaperOscInstance } from "./types/ReaperOscInstance.ts";
import type { OscMessage } from "./types/OscMessage.ts";
import {
  formFloatMessage,
  formIntMessage,
  formStringMessage,
} from "./binary/messages.ts";
import {
  booleanToBytesWithPadding,
  bytesToString,
  charToBytesWithPadding,
} from "./binary/helpers.ts";

/**
 * Reaper OSC client implementation.
 */
class Reaper implements ReaperOscInstance {
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

    client.on("message", (msg) => {
      console.log(parseOSCMessage(msg));
    });

    await new Promise((resolve) => {
      client.on("listening", () => resolve(client));
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
