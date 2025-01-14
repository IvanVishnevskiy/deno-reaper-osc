import { Buffer } from "node:buffer";
import { assertEquals } from "jsr:@std/assert";
import {
  formFloatMessage,
  formIntMessage,
  formStringMessage,
} from "./messages.ts";

Deno.test("formFloatMessage", () => {
  const path = "/test/float";
  const value = 3.14;
  const message = formFloatMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/float\0"),
    ...Buffer.from(",f\0\0"),
    ...Buffer.from(new Float32Array([value]).buffer).reverse(),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formFloatMessage with longer path", () => {
  const path = "/test/longer/path";
  const value = 1.23;
  const message = formFloatMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/longer/path\0\0\0"),
    ...Buffer.from(",f\0\0"),
    ...Buffer.from(new Float32Array([value]).buffer).reverse(),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formIntMessage", () => {
  const path = "/test/int";
  const value = 12345;
  const message = formIntMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/int\0\0\0"),
    ...Buffer.from(",i\0\0"),
    ...Buffer.from(new Int32Array([value]).buffer).reverse(),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formIntMessage with longer path", () => {
  const path = "/test/longer/path";
  const value = 67890;
  const message = formIntMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/longer/path\0\0\0"),
    ...Buffer.from(",i\0\0"),
    ...Buffer.from(new Int32Array([value]).buffer).reverse(),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formStringMessage", () => {
  const path = "/test/string";
  const value = "Hello, world!";
  const message = formStringMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/string\0\0\0\0"),
    ...Buffer.from(",s\0\0"),
    ...Buffer.from("Hello, world!\0\0\0"),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formStringMessage with longer path", () => {
  const path = "/test/longer/path";
  const value = "Testing...";
  const message = formStringMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/longer/path\0\0\0"),
    ...Buffer.from(",s\0\0"),
    ...Buffer.from("Testing...\0\0"),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formStringMessage with empty string", () => {
  const path = "/test/empty";
  const value = "";
  const message = formStringMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/empty\0"),
    ...Buffer.from(",s\0\0"),
    ...Buffer.from("\0\0\0\0"),
  ]);
  assertEquals(message, expectedBuffer);
});

Deno.test("formStringMessage with multibyte characters", () => {
  const path = "/test/multibyte";
  const value = "你好世界";
  const message = formStringMessage(path, value);
  assertEquals(message.length % 4, 0);
  const expectedBuffer = Buffer.from([
    ...Buffer.from("/test/multibyte\0"),
    ...Buffer.from(",s\0\0"),
    ...Buffer.from("你好世界\0\0\0\0"),
  ]);
  assertEquals(message, expectedBuffer);
});
