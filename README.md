# Deno Safe Env

Deno Safe Env is a utility for securely managing environment variables in Deno applications.

## Features

- Securely load environment variables
- Type-safe access to environment variables
- Easy integration with Deno projects

## Installation

To install Deno Safe Env, use the following command:

```sh
deno add jsr:@safe-env/safe-env
```

## Usage

Import the module and use it to load and access environment variables:

```typescript
import { number, string, url, boolean } from "@safe-env/safe-env";

Deno.env.set("URL", "http://some.host");

const env = safeEnv({
  PORT: number({ defaultValue: 3000 }),
  HOST: string({ defaultValue: "localhost" }),
  URL: url({ defaultValue: new URL("http://localhost:3000") }),
  ENABLE_LOGGING: boolean(),
});

console.log(env.PORT); // 3000
console.log(env.HOST); // localhost
console.log(env.URL.href); // http://some.host/
console.log(env.ENABLE_LOGGING); // false
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
