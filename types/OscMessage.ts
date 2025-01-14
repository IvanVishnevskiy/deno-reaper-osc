type OscMessage = {
  hasTimetag: boolean;
  timeTag?: bigint;
  type: "f" | "i" | "b" | "c" | "s";
};

export type { OscMessage };
