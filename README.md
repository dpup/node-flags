# Node-Flags

A flexible and easy-to-use command-line flag parsing library for Node.js applications.

[![npm version](https://badge.fury.io/js/flg.svg)](https://badge.fury.io/js/flg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Define flags across multiple files
- Support for various data types (string, boolean, integer, number, string list, multi-string)
- Easy-to-use API for defining and accessing flags
- Customizable flag validation
- Built-in help text generation

## Installation

Install using your favorite package manager:

```bash
npm install flg
# or
yarn add flg
# or
pnpm add flg
```

> ⚠️ _**Important Notice**_: This npm package was formerly known as `flags` and has been renamed to `flg`. Starting from version `3.0.0`, all updates will be published under this new package name.
>
> Migrate from `flags` to `flg` at your convenience to ensure you receive upcoming releases and avoid the deprecation notice of the previous name.
>
> _See [below](#package-name-update) for details and migration steps._

## Usage

Here's a quick example of how to use Node-Flags:

```javascript
import * as flags from "flg";

// Define flags
flags.defineString("name", "Anonymous", "Your name");
flags.defineInteger("age", 21, "Your age in years");
flags.defineNumber("height", 1.8, "Your height in meters");
flags.defineStringList("pets", [], "List of your pets");
flags.defineMultiString("hobby", [], "Your hobbies");

// Parse command-line arguments
flags.parse();

// Access flag values
const info = [
  `Name: ${flags.get("name")}`,
  `Age: ${flags.get("age")}`,
  `Height: ${flags.get("height")}m`,
  `Pets: ${flags.get("pets").join(", ")}`,
  `Hobbies:\n  ${flags.get("hobby").join("\n  ")}`,
];

console.log(info.join("\n"));
```

Run your script with flags:

```bash
node example.js --name="John Doe" --age=30 --height=1.75 --pets=dog,cat --hobby=reading --hobby=gaming
```

## Defining Flags

Node-Flags provides several methods to define flags:

- `defineString(name, defaultValue, description)`
- `defineBoolean(name, defaultValue, description)`
- `defineInteger(name, defaultValue, description)`
- `defineNumber(name, defaultValue, description)`
- `defineStringList(name, defaultValue, description)`
- `defineMultiString(name, defaultValue, description)`

Each method returns a `Flag` object that allows further configuration:

```javascript
flags
  .defineString("api-key")
  .setDefault("your-default-key")
  .setDescription("API key for authentication")
  .setValidator((value) => {
    if (value.length < 10) {
      throw new Error("API key must be at least 10 characters long");
    }
  })
  .setSecret(true);
```

## Passing Flags

- Use double dashes for flag names: `--flagname`
- Separate values with an equal sign or space: `--flagname=value` or `--flagname value`
- Quote complex string values: `--message="Hello, World!"`
- Use `--` to separate flags from additional arguments: `--flag1 value1 -- arg1 arg2`

## Querying Flag Values

Access flag values using `flags.get(flagName)` or `flags.FLAGS.flagName.get()`.

Flag objects also provide properties like `name`, `defaultValue`, `currentValue`, and `isSet`.

## Help Text

Node-Flags automatically generates help text. Access it by running your script with the `--help` flag.

## Testing

For testing, you can pass predefined arguments to `flags.parse()`:

```javascript
flags.parse(["--flag1", "--noflag2", "--flag3=value"]);
```

Reset flags between test cases:

```javascript
flags.reset();
```

## Package name update

The original release of `flags` version `0.2.2` has been republished as `flg` version `3.0.0`. This change was made to ensure consistency and avoid potential naming conflicts.

All existing releases under the original `flags` name are still intact, so existing applications will not break.

Migrate to `flg` to ensure you receive future releases.

#### Migration Guide

To upgrade your project to use the new `flg` package:

1. Uninstall the old `flags` package:

   ```bash
    npm uninstall flags
   ```

2. Install the new `flg` package:

   ```bash
    npm install flg
   ```

3. Update all references in your code from `flags` to `flg`:

   ```js
   // before
   import * as flags from "flags";

   // after
   import * as flags from "flg";
   ```

#### Versioning

The new versioning starts from `3.0.0` to reflect the continuity of the `flags` package while aligning with semantic versioning best practices.

#### Release history

| Version                                                    | Date                     |
| ---------------------------------------------------------- | ------------------------ |
| [flg@3.0.0](https://www.npmjs.com/package/flg/v/3.0.0)     | _New name going forward_ |
| [flags@0.2.2](https://www.npmjs.com/package/flags/v/0.2.2) | 2024-09-16T17:32:20.498Z |
| [flags@0.2.1](https://www.npmjs.com/package/flags/v/0.2.1) | 2024-09-14T00:38:28.225Z |
| [flags@0.2.0](https://www.npmjs.com/package/flags/v/0.2.0) | 2024-09-13T23:04:51.567Z |
| [flags@0.1.3](https://www.npmjs.com/package/flags/v/0.1.3) | 2015-02-27T02:29:55.285Z |
| [flags@0.1.2](https://www.npmjs.com/package/flags/v/0.1.2) | 2014-04-18T01:55:57.093Z |
| [flags@0.1.1](https://www.npmjs.com/package/flags/v/0.1.1) | 2011-11-02T19:53:15.783Z |
| [flags@0.1.0](https://www.npmjs.com/package/flags/v/0.1.0) | 2011-04-04T14:58:55.383Z |

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
