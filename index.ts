// TODO: look into using dgram/buffer from Deno
import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import type { ReaperOscInstance } from "./types/ReaperOscInstance.ts";

const stringToBytesWithPadding = (str: string) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const paddedBytes = new Uint8Array((bytes.length + 4) & ~0b11 || 4); // round up to the nearest multiple of 4 or if it's already a multiple of 4 adds 4 empty bytes
  paddedBytes.set(bytes);
  return paddedBytes;
};

class Reaper implements ReaperOscInstance {
  protected port: number | null = null;
  protected localPort: number | null = null;
  protected client: dgram.Socket | null = null;
  protected crashHandler?: () => void;
  constructor(
    { localPort = 8778, port = 8777 } = {},
    crashHandler?: () => void,
  ) {
    this.port = port;
    this.localPort = localPort;
    this.crashHandler = crashHandler;
  }

  protected destroy = () => {
    this.client?.close();
    this.client = null;
    this.port = null;
    this.localPort = null;
  };

  public connect = async () => {
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
    await new Promise((resolve) => {
      client.on("listening", () => resolve(client));
    });
  };

  public formMessage = (path: string, type: string, arg: number) => {
    const pathPart = stringToBytesWithPadding(path);
    const typePart = stringToBytesWithPadding(`,${type}`);
    // TODO: right now only float is supported. Add support for other types
    const argPart = new Uint8Array(4);
    const foo = Buffer.alloc(4);
    foo.writeFloatBE(arg, 0);
    argPart.set([0]);
    const padding = [];
    for (
      let i = 0;
      i < 4 - ((pathPart.length + typePart.length + argPart.length) % 4);
      i++
    ) {
      padding.push(0);
    }
    const oscBuffer = Buffer.concat([pathPart, typePart, foo]);
    return oscBuffer;
  };

  public send = async (msg: string) => {
    const { client, port } = this;
    if (!client) throw new Error("client is not connected");
    if (!port) throw new Error("client port is not set");

    await new Promise((resolve) =>
      client.send(msg, port, "127.0.0.1", resolve)
    );
  };
}

export { Reaper };
