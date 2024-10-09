/**
 * Safe Env is a library that allows you to safely access environment variables in Deno.
 * It provides a set of validators for the most common types of environment variables
 * and a function to safely access them.
 *
 * Calling `safeEnv` with an object that has the keys and validators for the environment variables
 * returns a typesafe object with the values from the environment.
 *
 * All values will be validated and if they are not valid, an error will be thrown.
 *
 * @example Standard usage
 * ```ts
 * import { safeEnv, string, number } from "@safe-env/safe-env";
 *
 * const env = safeEnv({
 *  PORT: number({ defaultValue: 3000 }),
 *  HOST: string({ defaultValue: "localhost" }),
 * });
 *
 * console.log(env.PORT) // 3000
 * console.log(env.HOST) // "localhost"
 * ```
 *
 * ### Validators
 *
 * Safe Env provides a set of validators for the most common types of environment variables:
 *
 * - `number` - Validates that the environment variable is a number
 * - `string` - Validates that the environment variable is a string
 * - `url` - Validates that the environment variable is a URL
 * - `boolean` - Validates that the environment variable is a boolean
 *
 * All those can be imported from the library and used to validate the environment variables.
 * They all share the same signature and can receive an object with the default value for the environment variable.
 *
 * @example Using the validators
 * ```ts
 * import { number, string, url, boolean } from "@safe-env/safe-env";
 *
 * const env = safeEnv({
 *  PORT: number({ defaultValue: 3000 }),
 *  HOST: string({ defaultValue: "localhost" }),
 *  URL: url({ defaultValue: new URL("http://localhost:3000") }),
 *  ENABLE_LOGGING: boolean(),
 * });
 *
 * @module safe-env
 */

/**
 * The common parameters for the validators
 */
export type ValidatorParams<
  T extends string | number | boolean | URL,
> = {
  defaultValue?: T;
};

/**
 * This function can be used to validate environment variables that are numbers
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a number
 */
export const number =
  (validationOptions?: ValidatorParams<number>) =>
  (value: string | undefined): number => {
    if (validationOptions?.defaultValue && value === undefined) {
      return validationOptions.defaultValue;
    }
    if (isNaN(Number(value))) {
      throw new Error(`Expected a number, but got ${value}`);
    }
    return Number(value);
  };

/**
 * This function can be used to validate environment variables that are strings
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a string
 */
export const string =
  (validationOptions?: ValidatorParams<string>) =>
  (value: string | undefined): string => {
    if (validationOptions?.defaultValue && value === undefined) {
      return validationOptions.defaultValue;
    }
    if (value === undefined) {
      throw new Error(`Expected a string, but got ${value}`);
    }
    return value;
  };

/**
 * This function can be used to validate environment variables that are URLs
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a URL
 */
export const url =
  (validationOptions?: ValidatorParams<URL>) =>
  (value: string | undefined): URL => {
    if (validationOptions?.defaultValue && value === undefined) {
      return validationOptions.defaultValue;
    }
    try {
      if (value === undefined) {
        throw new Error(`Expected a URL, but got ${value}`);
      }
      return new URL(value);
    } catch {
      throw new Error(`Expected a URL, but got ${value}`);
    }
  };

/**
 * This function can be used to validate environment variables that are booleans
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a boolean
 */
export const boolean = (validationOptions?: ValidatorParams<boolean>) =>
(
  value: string | undefined,
): boolean => {
  if (validationOptions?.defaultValue && value === undefined) {
    return validationOptions.defaultValue;
  }
  return value === "true";
};

/**
 * This function takes an object with the keys and validators for the environment variables
 * and returns a typesafe object with the values from the environment
 * @param env an object with the keys and validators for the environment variables
 * @returns a typesafe object with the values from the environment
 */
export function safeEnv<
  const T extends Record<
    string,
    ReturnType<typeof number | typeof string | typeof url | typeof boolean>
  >,
>(
  env: T,
): {
  [K in keyof T]: T[K] extends ReturnType<typeof number> ? number
    : T[K] extends ReturnType<typeof string> ? string
    : T[K] extends ReturnType<typeof url> ? URL
    : T[K] extends ReturnType<typeof boolean> ? boolean
    : never;
} {
  return Object.entries(env).reduce((acc, [key, validator]) => {
    const value = Deno.env.get(key);

    if (typeof validator !== "function") {
      throw new Error(`Invalid validator for ${key}`);
    }
    return { ...acc, [key]: validator(value) };
  }, {}) as {
    [K in keyof T]: T[K] extends ReturnType<typeof number> ? number
      : T[K] extends ReturnType<typeof string> ? string
      : T[K] extends ReturnType<typeof url> ? URL
      : T[K] extends ReturnType<typeof boolean> ? boolean
      : never;
  };
}
