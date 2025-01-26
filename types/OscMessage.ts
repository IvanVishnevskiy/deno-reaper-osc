interface OscMessageBase {
  hasTimetag: boolean;
  timeTag?: bigint;
  address: string;
  type?: OscMessageType; // Make type optional here
  data?: string | number | boolean | bigint | string[]; // Allow undefined for data
}

// **Corrected: Include "c" in OscMessageType**
export type OscMessageType = "f" | "i" | "b" | "s" | "c";

// Define specific message types based on the 'type' property
export type OscMessageFloat = OscMessageBase & {
  type: "f";
  data: number;
};

export type OscMessageInt = OscMessageBase & {
  type: "i";
  data: number;
};

export type OscMessageBoolean = OscMessageBase & {
  type: "b";
  data: boolean;
};

export type OscMessageString = OscMessageBase & {
  type: "s";
  data: string;
};

// OscMessageBlob can be used for cases when you need to specify type 'c' for a char
export type OscMessageBlob = OscMessageBase & {
  type: "c";
  data: string;
};

export type OscMessage =
  | OscMessageFloat
  | OscMessageInt
  | OscMessageBoolean
  | OscMessageString
  | OscMessageBlob
  | OscMessageBase; // For messages without arguments
