import type { Buffer } from "node:buffer";

interface ReaperOscInstance {
  /**
   * Establishes a connection to the Reaper OSC server
   * @throws Error if localPort is not set
   */
  connect(): Promise<void>;

  /**
   * Forms an OSC message with the given parameters
   * @param path - OSC address path
   * @param type - Argument type (currently only supports float)
   * @param arg - Numeric argument value
   * @returns Buffer containing the formatted OSC message
   *
   * @example
   * // this code will bypass track 1 fx 1
   * const message = reaper.formMessage('/track/1/fx/1/bypass', 'f', 1);
   */
  formMessage(path: string, type: string, arg: number): Buffer;

  /**
   * Sends an OSC message to the Reaper server
   * @param msg - The message to send
   * @throws Error if client is not connected or port is not set
   */
  send(msg: string): Promise<void>;
}

export type { ReaperOscInstance };
