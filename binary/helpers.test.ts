import { Buffer } from "node:buffer";
import { assertEquals } from "jsr:@std/assert";
import {
  booleanToBytesWithPadding,
  charToBytesWithPadding,
  floatToBytesWithPadding,
  intToBytesWithPadding,
  stringToBytesWithPadding,
} from "./helpers.ts";

Deno.test("stringToBytesWithPadding", () => {
  assertEquals(
    stringToBytesWithPadding("test"),
    new Uint8Array([116, 101, 115, 116, 0, 0, 0, 0])
  );
  assertEquals(
    stringToBytesWithPadding("test1"),
    new Uint8Array([116, 101, 115, 116, 49, 0, 0, 0])
  );
  assertEquals(stringToBytesWithPadding(""), new Uint8Array([0, 0, 0, 0]));
  assertEquals(
    stringToBytesWithPadding("longer string test"),
    new Uint8Array([
      108, 111, 110, 103, 101, 114, 32, 115, 116, 114, 105, 110, 103, 32, 116,
      101, 115, 116, 0, 0,
    ])
  );
});

Deno.test("intToBytesWithPadding", () => {
  assertEquals(intToBytesWithPadding(1), Buffer.from([0, 0, 0, 1]));
  assertEquals(intToBytesWithPadding(0), Buffer.from([0, 0, 0, 0]));
  assertEquals(intToBytesWithPadding(-1), Buffer.from([255, 255, 255, 255]));
  assertEquals(intToBytesWithPadding(256), Buffer.from([0, 0, 1, 0]));
});

Deno.test("floatToBytesWithPadding", () => {
  assertEquals(
    floatToBytesWithPadding(1.0),
    Buffer.from([0x3f, 0x80, 0x00, 0x00])
  );
  assertEquals(
    floatToBytesWithPadding(0.0),
    Buffer.from([0x00, 0x00, 0x00, 0x00])
  );
  assertEquals(
    floatToBytesWithPadding(-1.0),
    Buffer.from([0xbf, 0x80, 0x00, 0x00])
  );
  assertEquals(
    floatToBytesWithPadding(2.5),
    Buffer.from([0x40, 0x20, 0x00, 0x00])
  );
});

Deno.test("booleanToBytesWithPadding", () => {
  assertEquals(booleanToBytesWithPadding(true), Buffer.from([1, 0, 0, 0]));
  assertEquals(booleanToBytesWithPadding(false), Buffer.from([0, 0, 0, 0]));
});

Deno.test("charToBytesWithPadding", () => {
  assertEquals(charToBytesWithPadding("a"), Buffer.from([0x61, 0, 0, 0]));
  assertEquals(charToBytesWithPadding("A"), Buffer.from([0x41, 0, 0, 0]));
  assertEquals(charToBytesWithPadding("1"), Buffer.from([0x31, 0, 0, 0]));
  assertEquals(charToBytesWithPadding("."), Buffer.from([0x2e, 0, 0, 0]));
});
