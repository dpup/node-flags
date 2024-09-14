import assert from "node:assert";
import { test } from "node:test";

import * as flags from "../src/flags";

flags.setExitOnError(false);

test("testGlobalFlagsObject", (t) => {
  flags.defineString("one", "111");
  flags.defineString("two", "222");
  assert.deepEqual(global.GLOBAL_FLAGS, flags.FLAGS);
});

test("testStringFlagParsing", (t) => {
  flags.reset();
  flags.defineString("one", "111");
  flags.defineString("two", "222");
  flags.defineString("three", "333");
  flags.parse(["--one", "uno", "--two=dos"]);

  assert.strictEqual("uno", flags.get("one"));
  assert.strictEqual("dos", flags.get("two"));
  assert.strictEqual("333", flags.get("three"));

  assert.ok(flags.FLAGS.one.isSet === true);
  assert.ok(flags.FLAGS.two.isSet === true);
  assert.ok(flags.FLAGS.three.isSet === false);
});

test("testStringFlagParsing_noValue", (t) => {
  flags.reset();
  flags.defineString("one", "111");
  assert.throws(() => {
    flags.parse(["--one"]);
  });
});

test("testStringFlagParsingWithSpaces", (t) => {
  flags.reset();
  flags.defineString("one", "111");
  flags.defineString("two", "222");
  flags.parse(["--one", "aaa", "--two", "bbb"]);
  assert.strictEqual("aaa", flags.get("one"));
  assert.strictEqual("bbb", flags.get("two"));
});

test("testIntegerFlagParsing", (t) => {
  flags.reset();
  flags.defineInteger("one", 11);
  flags.defineInteger("two", 22);
  flags.parse(["--one=111"]);
  assert.strictEqual(111, flags.get("one"));
  assert.strictEqual(22, flags.get("two"));
});

test("testIntegerFlagParsing_stringInput", (t) => {
  flags.reset();
  flags.defineInteger("one", 11);
  assert.throws(() => {
    flags.parse(["--one=xxx"]);
  });
});

test("testIntegerFlagParsing_nonIntInput", (t) => {
  flags.reset();
  flags.defineInteger("one", 11);
  assert.throws(() => {
    flags.parse(["--one=1.123"]);
  });
});

test("testNumberFlagParsing", (t) => {
  flags.reset();
  flags.defineNumber("one", 1.1);
  flags.defineNumber("two", 2.2);
  flags.parse(["--one=1.234"]);
  assert.strictEqual(1.234, flags.get("one"));
  assert.strictEqual(2.2, flags.get("two"));
});

test("testNumberFlagParsing_stringInput", (t) => {
  flags.reset();
  flags.defineNumber("one", 1.1);
  assert.throws(() => {
    flags.parse(["--one=xxx"]);
  });
});

test("testBooleanFlagParsing", (t) => {
  flags.reset();
  flags.defineBoolean("a");
  flags.defineBoolean("b", false);
  flags.defineBoolean("c").setDefault(false);
  flags.defineBoolean("d", false);
  flags.defineBoolean("e").setDefault(true);
  flags.defineBoolean("f", true);
  flags.defineBoolean("g", true);
  flags.defineBoolean("h", true);
  flags.defineBoolean("i");
  flags.parse([
    "--a",
    "--b=true",
    "--c=t",
    "--d=1",
    "--noe",
    "--f=false",
    "--g=0",
    "--h=f",
  ]);
  assert.strictEqual(true, flags.get("a"), 'flags.get("a")');
  assert.strictEqual(true, flags.get("b"), 'flags.get("b")');
  assert.strictEqual(true, flags.get("c"), 'flags.get("c")');
  assert.strictEqual(true, flags.get("d"), 'flags.get("d")');
  assert.strictEqual(false, flags.get("e"), 'flags.get("e")');
  assert.strictEqual(false, flags.get("f"), 'flags.get("f")');
  assert.strictEqual(false, flags.get("g"), 'flags.get("g")');
  assert.strictEqual(false, flags.get("h"), 'flags.get("h")');
  assert.strictEqual(false, flags.get("i"), 'flags.get("i")');
});

test("testBooleanFlagParsing_badInput", (t) => {
  flags.reset();
  flags.defineBoolean("a", false);
  assert.throws(() => {
    flags.parse(["--a=xxx"]);
  });
});

test("testStringListFlagParsing", (t) => {
  flags.reset();
  flags.defineStringList("one", []);
  flags.parse(["--one=a,b,c,d"]);
  assert.deepEqual(["a", "b", "c", "d"], flags.get("one"));
});

test("testMultiStringFlagParsing", (t) => {
  flags.reset();
  flags.defineMultiString("one", []);
  flags.parse(["--one=a", "--one=b", "--one=c", "--one=d"]);
  assert.deepEqual(["a", "b", "c", "d"], flags.get("one"));
});

test("testUnrecognizedFlags", (t) => {
  flags.reset();
  assert.throws(() => {
    flags.parse(["--one"]);
  });
});

test("testDuplicateFlags", (t) => {
  flags.reset();
  flags.defineString("one", "");
  assert.throws(() => {
    flags.defineString("one", "");
  });
});

test("testThrowIfDefineAfterParse", (t) => {
  flags.reset();
  flags.parse([]);
  assert.throws(() => {
    flags.defineString("one", "");
  });
});

test("testValidators", (t) => {
  function setUp() {
    flags.reset();
    flags.defineString("one").setValidator(function (inp) {
      if (inp && !inp.startsWith("xxx")) throw Error("Bad Input");
      return false;
    });
  }
  setUp();
  flags.parse(["--one=xxxyyy"]);
  setUp();
  assert.throws(() => {
    flags.parse(["--one=yyyxxx"]);
  });
});

test("testBreakFlag", (t) => {
  flags.reset();
  flags.defineString("one", "");
  flags.defineString("two", "");
  let rv = flags.parse(["--one=2", "--two=3", "--", "something", "else"]);
  assert.deepEqual(["something", "else"], rv);
});

test("testBreakFlag_nothingElse", (t) => {
  flags.reset();
  flags.defineString("one", "");
  flags.defineString("two", "");
  let rv = flags.parse(["--one=2", "--two=3", "--"]);
  assert.deepEqual([], rv);
});

test("testReturnValue", (t) => {
  flags.reset();
  flags.defineString("one", "");
  flags.defineString("two", "");
  let rv = flags.parse(["--one=2", "--two=3"]);
  assert.deepEqual([], rv);
});

test("testIsSet", (t) => {
  flags.reset();
  flags.defineInteger("one", 1);
  flags.defineInteger("two", 2);
  flags.parse(["--one=11"]);
  assert.strictEqual(true, flags.isSet("one"));
  assert.strictEqual(false, flags.isSet("two"));
});

test("testIsRequired", (t) => {
  flags.reset();
  flags.defineInteger("one", 1).setRequired(true);
  flags.defineInteger("two", 2);
  assert.throws(() => {
    flags.parse(["--two=11"]);
  });
});
