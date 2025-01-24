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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
