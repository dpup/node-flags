// Define interfaces for our flag types
interface IFlag<T> {
  name: string;
  defaultValue: T;
  description?: string;
  currentValue: T | null;
  validator?: (input: T | null) => boolean;
  isSecret: boolean;
  isSet: boolean;
  setDefault(defaultValue: T): this;
  setDescription(description: string): this;
  setValidator(validator: (input: T | null) => boolean): this;
  setSecret(isSecret: boolean): this;
  set(input: T): void;
  get(): T | null;
  parseInput(inp: string): T | null;
  toHelpString(): string;
}

// Define the global flags object
declare global {
  var GLOBAL_FLAGS: { [key: string]: IFlag<any> };
}

if (typeof global.GLOBAL_FLAGS === "undefined") {
  global.GLOBAL_FLAGS = {};
}

const FLAGS: { [key: string]: IFlag<any> } = global.GLOBAL_FLAGS;

/**
 * An object containing a map of flag objects.  If different modules are
 * importing different versions of the library we want them to use the same
 * FLAGS object.  This does mean that the flags library needs to be backwards
 * compatible.
 */
export { FLAGS };

let exitOnError = true;

let usageInfo =
  "Usage: node " + (process.argv[1] || "").split("/").pop() + " [options]";

/**
 * If true, then the process will be nicely exit on a parse error.  If false,
 * an Error will be thrown.  Set to false in tests.
 */
export function setExitOnError(value: boolean) {
  exitOnError = value;
}

/**
 * Allows an app to add extra usage information that will be shown in the help
 * message, above the flags.
 */
export function setUsageInfo(value: string) {
  usageInfo = value;
}

/**
 * Defines a string flag.  e.g. --servername=bob
 */
export function defineString(
  name: string,
  defaultValue?: string,
  description?: string
): IFlag<string> {
  return addFlag(name, new StringFlag(name, defaultValue, description));
}

/**
 * Defines a boolean flag.   e.g. --turnonlights
 */
export function defineBoolean(
  name: string,
  defaultValue?: boolean,
  description?: string
): IFlag<boolean> {
  return addFlag(name, new BooleanFlag(name, defaultValue, description));
}

/**
 * Defines an integer flag.  e.g.  --age=12
 */
export function defineInteger(
  name: string,
  defaultValue?: number,
  description?: string
): IFlag<number> {
  return addFlag(name, new IntegerFlag(name, defaultValue, description));
}

/**
 * Defines a number flag.  e.g. --number=1.345
 */
export function defineNumber(
  name: string,
  defaultValue?: number,
  description?: string
): IFlag<number> {
  return addFlag(name, new NumberFlag(name, defaultValue, description));
}

/**
 * Defines a string list flag.  e.g. --animal=frog,bat,chicken
 */
export function defineStringList(
  name: string,
  defaultValue?: string[],
  description?: string
): IFlag<string[]> {
  return addFlag(name, new StringListFlag(name, defaultValue, description));
}

/**
 * Defines a multi string flag.  e.g. --allowedip=127.0.0.1 --allowedip=127.0.0.2
 */
export function defineMultiString(
  name: string,
  defaultValue?: string[],
  description?: string
): IFlag<string[]> {
  return addFlag(name, new MultiStringFlag(name, defaultValue, description));
}

/**
 * Dumps the help text to the console.
 */
export function help(): void {
  if (usageInfo) {
    console.log(usageInfo + "\n");
  }
  console.log("Options:");
  for (const flag in FLAGS) {
    if (!FLAGS[flag].isSecret) {
      console.log(FLAGS[flag].toHelpString());
    }
  }
}

/**
 * Resets the flag values.
 */
export function reset(): void {
  parseCalled = false;
  Object.keys(FLAGS).forEach((key) => delete FLAGS[key]);
  registerInternalFlags();
}

/**
 * Gets the current value of the given flag.
 */
export function get(name: string): unknown {
  if (!FLAGS[name]) throw Error('Unknown flag "' + name + '"');
  return FLAGS[name].get();
}

/**
 * Gets whether or not the flag was set.
 */
export function isSet(name: string): boolean {
  if (!FLAGS[name]) throw Error('Unknown flag "' + name + '"');
  return FLAGS[name].isSet;
}

/**
 * Parses process.argv for flags.  Idempotent if called multiple times.
 */
export function parse(
  args: string[] = process.argv.slice(2),
  ignoreUnrecognized?: boolean
): string[] {
  if (parseCalled) return [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg == "--") {
      return args.slice(i + 1);
    } else if (arg.startsWith("--")) {
      let flag = arg.slice(2);
      let value: string | null = null;
      if (flag.indexOf("=") > -1) {
        const parts = flag.split("=");
        flag = parts[0];
        value = parts.slice(1).join("=");
      }

      if (value == null && args[i + 1] && !args[i + 1].startsWith("--")) {
        args[i] = args[i] + " " + args[i + 1];
        value = args[i + 1];
        args.splice(i + 1, 1);
      }

      if (!FLAGS[flag] && value == null && flag.startsWith("no")) {
        flag = flag.slice(2);
        value = "0";
      }

      if (FLAGS[flag]) {
        try {
          FLAGS[flag].set(value);
        } catch (e) {
          throwFlagParseError(args, i, (e as Error).message);
        }
      } else if (!ignoreUnrecognized) {
        throwFlagParseError(args, i, 'Unrecognized flag name "' + arg + '"');
      }
    } else {
      throwFlagParseError(args, i, 'Invalid argument "' + arg + '"');
    }
  }

  parseCalled = true;

  if (FLAGS.help.get()) {
    help();
    process.exit(0);
  }

  return [];
}

// Private helpers
let parseCalled = false;

function throwFlagParseError(args: string[], i: number, msg: string): void {
  const errorMsg =
    "FLAG PARSING ERROR: " +
    msg +
    "\n  " +
    args.join(" ") +
    "\n " +
    new Array(args.slice(0, i).join(" ").length + 2).join(" ") +
    new Array(args[i].length + 1).join("^");

  if (exitOnError) {
    console.error(errorMsg);
    process.exit(1);
  } else {
    throw Error(errorMsg);
  }
}

function addFlag<T>(name: string, flag: IFlag<T>): IFlag<T> {
  if (parseCalled) throw Error("Can not register new flags after parse()");
  if (FLAGS[name]) throw Error('Flag already defined: "' + name + '"');
  FLAGS[name] = flag;
  return flag;
}

function wrapText(text: string, maxLen: number): string {
  const lines = text.split("\n");
  const out: string[] = [];
  lines.forEach((line) => {
    const maxLenx = maxLen + (out.length == 0 ? 4 : 0);
    if (line.length < maxLenx) {
      out.push(line);
    } else {
      const current = wrapLine(line, " ", maxLenx, out);
      if (current != "") {
        out.push(current);
      }
    }
  });
  return out.join("\n    ");
}

function wrapLine(
  line: string,
  delimiter: string,
  maxLen: number,
  out: string[]
): string {
  const parts = line.split(delimiter);
  let current = "";
  parts.forEach((part) => {
    const next = current + part + delimiter;
    if (next.length > maxLen) {
      out.push(current);
      current = part + delimiter;
    } else {
      current = next;
    }
  });
  return current;
}

class Flag<T> implements IFlag<T> {
  name: string;
  defaultValue: T;
  description?: string;
  currentValue: T | null;
  validator?: (input: T | null) => boolean;
  isSecret: boolean;
  isSet: boolean;

  constructor(name: string, defaultValue: T, description?: string) {
    this.name = name;
    this.defaultValue = defaultValue;
    this.description = description;
    this.currentValue = null;
    this.isSecret = false;
    this.isSet = false;
  }

  // Set a default value.
  setDefault(defaultValue: T): this {
    this.defaultValue = defaultValue;
    return this;
  }

  /** Set a description for use in the help message. */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  /** Set a custom validator. */
  setValidator(validator: (input: T | null) => boolean): this {
    this.validator = validator;
    return this;
  }

  /** Hide this flag from the help message. */
  setSecret(isSecret: boolean): this {
    this.isSecret = isSecret;
    return this;
  }

  set(input: T | string): void {
    if (this.isSet) {
      throw Error("Flag already set");
    }
    if (typeof input === "string") {
      this.currentValue = this.parseInput(input);
    } else if (input === null) {
      this.currentValue = this.parseInput(null);
    } else {
      this.currentValue = input;
    }
    if (this.validator) this.validator(this.currentValue);
    this.isSet = true;
  }

  get(): T | null {
    return this.isSet ? this.currentValue : this.defaultValue;
  }

  parseInput(_inp: string | null): T | null {
    throw Error("Not implemented");
  }

  toHelpString(): string {
    return (
      wrapText("  --" + this.name + ": " + this.description, 70) +
      "\n" +
      "    (default: " +
      JSON.stringify(this.defaultValue) +
      ")"
    );
  }
}

class BooleanFlag extends Flag<boolean> implements IFlag<boolean> {
  constructor(name: string, defaultValue?: boolean, description?: string) {
    super(name, defaultValue ?? false, description);
  }

  parseInput(inp: string | null): boolean {
    if (inp === null) {
      // Empty flag value means true for a boolean flag.
      return true;
    }
    inp = inp.toLowerCase();
    if (inp === "1" || inp === "true" || inp == "t") {
      return true;
    } else if (inp === "0" || inp === "false" || inp == "f") {
      return false;
    } else {
      throw Error('Invalid Boolean flag "' + inp + '"');
    }
  }

  get(): boolean {
    return !!super.get();
  }

  toHelpString(): string {
    return (
      wrapText("  --[no]" + this.name + ": " + this.description, 70) +
      "\n" +
      "    (default: " +
      JSON.stringify(this.defaultValue) +
      ")"
    );
  }
}

class IntegerFlag extends Flag<number> implements IFlag<number> {
  constructor(name: string, defaultValue?: number, description?: string) {
    super(name, defaultValue ?? 0, description);
  }

  parseInput(inp: string): number {
    if (isNaN(Number(inp)) || parseInt(inp, 10) !== Number(inp)) {
      throw Error('Invalid Integer flag "' + inp + '"');
    }
    return Number(inp);
  }

  toHelpString(): string {
    return super.toHelpString() + "\n    (an integer)";
  }
}

class NumberFlag extends Flag<number> implements IFlag<number> {
  constructor(name: string, defaultValue?: number, description?: string) {
    super(name, defaultValue ?? 0, description);
  }

  parseInput(inp: string | null): number {
    if (isNaN(Number(inp))) {
      throw Error('Invalid Number flag "' + inp + '"');
    }
    return Number(inp);
  }

  toHelpString(): string {
    return super.toHelpString() + "\n    (a number)";
  }
}

class StringFlag extends Flag<string> implements IFlag<string> {
  constructor(name: string, defaultValue?: string, description?: string) {
    super(name, defaultValue ?? "", description);
  }

  parseInput(inp: string | null): string {
    if (inp === null) {
      throw Error('Invalid String flag "' + inp + '"');
    }
    return inp;
  }

  toHelpString(): string {
    return super.toHelpString() + "\n    (a string)";
  }
}

class StringListFlag extends Flag<string[]> implements IFlag<string[]> {
  constructor(name: string, defaultValue?: string[], description?: string) {
    super(name, defaultValue ?? [], description);
  }

  parseInput(inp: string | null): string[] {
    if (inp === null) return [];
    else return inp.split(",");
  }
}

class MultiStringFlag extends Flag<string[]> implements IFlag<string[]> {
  constructor(name: string, defaultValue?: string[], description?: string) {
    super(name, defaultValue ?? [], description);
  }

  set(input: string[]): void {
    if (this.validator) this.validator(input);
    if (!this.currentValue) this.currentValue = [];
    this.currentValue.push(...input);
    this.isSet = true;
  }
}

// Internal flags
function registerInternalFlags(): void {
  defineBoolean("help").setDescription("Shows this help text.").setSecret(true);
  // TODO: --flagsfile
}

registerInternalFlags();
