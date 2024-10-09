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
 *  LOGGING_INTERVAL: number({ optional: true }),
 * });
 * ```
 *
 * The validators take the following parameters:
 * - `defaultValue` - The default value for the environment variable
 * - `optional` - If the environment variable is optional
 *
 * if optional is set to true, the value can be undefined.
 * @module safe-env
 */

/**
 * The common parameters for the validators
 */
export type ValidatorParams<
  T extends string | number | boolean | URL,
> = {
  defaultValue?: T;
  optional?: boolean;
};

type InferValidatorType<
  T extends string | number | boolean | URL,
  O extends ValidatorParams<T>,
> = undefined extends O["defaultValue"]
  ? O["optional"] extends true ? T | undefined : T
  : T;

const makeValidator = <
  T extends string | number | boolean | URL,
  const O extends ValidatorParams<T>,
>(
  validationOptions: ValidatorParams<T> | undefined,
  valueParser: (value: string | undefined) => T,
  value: string | undefined,
): InferValidatorType<T, O> => {
  if (value === undefined) {
    if (validationOptions?.defaultValue) {
      return validationOptions.defaultValue;
    }
    if (validationOptions?.optional) {
      return value as unknown as T;
    }
  }
  return valueParser(value);
};

/**
 * This function can be used to validate environment variables that are numbers
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a number
 */
export const number = <T extends ValidatorParams<number>>(
  validationOptions?: T,
) =>
(value: string | undefined): InferValidatorType<number, T> => {
  return makeValidator(validationOptions, (v) => {
    if (isNaN(Number(v))) {
      throw new Error(`Expected a number, but got ${v}`);
    }
    return Number(v);
  }, value);
};

/**
 * This function can be used to validate environment variables that are strings
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a string
 */
export const string =
  <const T extends ValidatorParams<string>>(validationOptions?: T) =>
  (value: string | undefined): InferValidatorType<string, T> => {
    return makeValidator(validationOptions, (v) => {
      if (v === undefined) {
        throw new Error(`Expected a string, but got ${value}`);
      }
      return v;
    }, value);
  };

/**
 * This function can be used to validate environment variables that are URLs
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a URL
 */
export const url =
  <const T extends ValidatorParams<URL>>(validationOptions?: T) =>
  (value: string | undefined): InferValidatorType<URL, T> => {
    return makeValidator(validationOptions, (v) => {
      try {
        if (v === undefined) {
          throw new Error(`Expected a URL, but got ${value}`);
        }
        return new URL(v);
      } catch {
        throw new Error(`Expected a URL, but got ${value}`);
      }
    }, value);
  };

/**
 * This function can be used to validate environment variables that are booleans
 * @param validationOptions an object with the default value for the environment variable
 * @returns the value of the environment variable as a boolean
 */
export const boolean =
  <const T extends ValidatorParams<boolean>>(validationOptions?: T) =>
  (
    value: string | undefined,
  ): InferValidatorType<boolean, T> => {
    return makeValidator(validationOptions, (v) => {
      return v === "true";
    }, value);
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
  [K in keyof T]: ReturnType<T[K]>;
} {
  const errors: string[] = [];
  const validatedEnv = Object.entries(env).reduce((acc, [key, validator]) => {
    const value = Deno.env.get(key);

    if (typeof validator !== "function") {
      throw new Error(`Invalid validator for ${key}`);
    }
    try {
      return { ...acc, [key]: validator(value) };
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }
      errors.push(`🚨 [safe-env]: Error with env var ${key}: ${e.message}`);
      return acc;
    }
  }, {}) as {
    [K in keyof T]: ReturnType<T[K]>;
  };
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
  return validatedEnv;
}
