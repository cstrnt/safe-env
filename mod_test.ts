import { assertEquals } from "@std/assert";
import { boolean, number, safeEnv, string, url } from "./mod.ts";

const originalEnv = Deno.env.toObject();

const resetEnv = () => {
  const currentEnv = Deno.env.toObject();
  for (const key in currentEnv) {
    Deno.env.delete(key);
  }
  for (const key in originalEnv) {
    Deno.env.set(key, originalEnv[key]);
  }
};

Deno.test("the safeEnv function", async (t) => {
  await t.step("works in the happy path", () => {
    Deno.env.set("isEnabled", "true");
    const env = safeEnv({
      PORT: number({ defaultValue: 3000 }),
      HOST: string({ defaultValue: "localhost" }),
      URL: url({ defaultValue: new URL("http://localhost:3000") }),
      isEnabled: boolean(),
    });

    assertEquals(env.isEnabled, true);
    assertEquals(env.HOST, "localhost");
    assertEquals(env.PORT, 3000);
    assertEquals(env.URL.href, "http://localhost:3000/");
  });

  await t.step("throws when the value is invalid", () => {
    Deno.env.set("PORT", "not-a-number");
    try {
      safeEnv({
        PORT: number(),
      });
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }
      assertEquals(e.message, "Expected a number, but got not-a-number");
    }
  });

  resetEnv();

  await t.step("uses the default value when the value is undefined", () => {
    const env = safeEnv({
      PORT: number({ defaultValue: 3000 }),
    });

    assertEquals(env.PORT, 3000);
  });

  await t.step("it works with urls", () => {
    Deno.env.set("URL", "http://localhost:3000");
    const env = safeEnv({
      URL: url(),
    });
    assertEquals(env.URL.href, "http://localhost:3000/");
  });

  resetEnv();
});
