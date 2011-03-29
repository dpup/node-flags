/**
 * @fileoverview Flag parsing library for node.js.  See ../README.md for info.
 *
 * @author dan@pupi.us (Daniel Pupius)
 */

var util = require('util');


/**
 * An object containing a map of flag objects.
 * @type {!Object}
 */
var FLAGS = exports.FLAGS = {};


/**
 * If true, then the process will be nicely exit on a parse error.  If false,
 * an Error will be thrown.  Set to false in tests.
 * @type {boolean}
 */
exports.exitOnError = true;


/**
 * Allows an app to add extra usage information that will be shown in the help
 * message, above the flags.
 * @type {string}
 */
exports.usageInfo = 'Usage: node ' +
    process.argv[1].split('/').pop() + ' [options]';


/**
 * Defines a string flag.  e.g. --servername=bob
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {string} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 * @param {boolean} opt_secret Whether the flag is 'secret' and should not be
 *     shown in the help text.
 */
exports.defineString = function(
    name, defaultValue, opt_description, opt_validator, opt_secret) {
  addFlag(name, new Flag
      (name, defaultValue, opt_description, opt_validator, opt_secret));
};


/**
 * Defines a boolean flag.   e.g. --turnonlights
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {boolean} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 * @param {boolean} opt_secret Whether the flag is 'secret' and should not be
 *     shown in the help text.
 */
exports.defineBoolean = function(
    name, defaultValue, opt_description, opt_validator, opt_secret) {
  addFlag(name, new BooleanFlag(
      name, defaultValue, opt_description, opt_validator, opt_secret));
};


/**
 * Defines an integer flag.  e.g.  --age=12
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {number} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 * @param {boolean} opt_secret Whether the flag is 'secret' and should not be
 *     shown in the help text.
 */
exports.defineInteger = function(
    name, defaultValue, opt_description, opt_validator, opt_secret) {
  addFlag(name, new IntegerFlag(
      name, defaultValue, opt_description, opt_validator, opt_secret));
};


/**
 * Defines a number flag.  e.g. --number=1.345
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {number} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 * @param {boolean} opt_secret Whether the flag is 'secret' and should not be
 *     shown in the help text.
 */
exports.defineNumber = function(
    name, defaultValue, opt_description, opt_validator, opt_secret) {
  addFlag(name, new NumberFlag(
      name, defaultValue, opt_description, opt_validator, opt_secret));
};


/**
 * Defines a string list flag.  e.g. --anmial=frog,bat,chicken 
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {!Array.<string>} defaultValue The default value, should the flag not
 *     be explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 * @param {boolean} opt_secret Whether the flag is 'secret' and should not be
 *     shown in the help text.
 */
exports.defineStringList = function(
    name, defaultValue, opt_description, opt_validator, opt_secret) {
  addFlag(name, new StringListFlag(
      name, defaultValue, opt_description, opt_validator, opt_secret));
};


/**
 * Defines a multi string flag.  e.g. --allowedip=127.0.0.1 --allowedip=127.0.0.2
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {!Array.<string>} defaultValue The default value, should the flag not
 *     be explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 * @param {boolean} opt_secret Whether the flag is 'secret' and should not be
 *     shown in the help text.
 */
exports.defineMultiString = function(
    name, defaultValue, opt_description, opt_validator, opt_secret) {
  addFlag(name, new MultiStringFlag(
      name, defaultValue, opt_description, opt_validator, opt_secret));
};


/**
 * Dumps the help text to the console.
 */
exports.help = function() {
  if (exports.usageInfo) {
    console.log(exports.usageInfo + '\n');
  }
  console.log('Options:');
  for (var flag in FLAGS) {
    if (!FLAGS[flag].isSecret) {
      console.log(FLAGS[flag].toHelpString());
    }
  }
};


/**
 * Resets the flag values.
 */
exports.reset = function() {
  parseCalled = false;
  FLAGS = exports.FLAGS = {};
  registerInternalFlags();
};


/**
 * Gets the current value of the given flag.
 * @param {string} name The flag name.
 * @return {*}
 */
exports.get = function(name) {
  if (!FLAGS[name]) throw Error('Unknown flag "' + name + '"');
  return FLAGS[name].get(name);
};


/**
 * Parses process.argv for flags.  Idempotent if called multiple times.
 * @param {Array.<string>=} opt_args Optional arguments array to use instead of
 *     process.argv.
 */
exports.parse = function(opt_args) {
  var args = opt_args || process.argv.slice(2);
  if (parseCalled) return;
  
  var parsedFlags = {};
  var lastflag = null;
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    
    // Terminate any flag processing
    if (arg == '--') {
      break;
    
    // Handle a typical long form flag --foo or --foo=bar.
    } else if (arg.substr(0, 2) == '--') {
      var flag = arg.substr(2);
      var value = null;
      if (flag.indexOf('=') > -1) {
        var parts = flag.split('=');
        flag = parts[0];
        value = parts.slice(1).join('=');
      }
      
      // Hacky munging of the args to handle space separated flags.
      if (value == null && args[i + 1] && args[i + 1].substr(0, 2) != '--') {
        args[i] = args[i] + ' ' + args[i + 1];
        value = args[i + 1];
        args.splice(i + 1, 1);
      }
      
      // Special case boolean flags of the form '--noflagname'.
      if (!FLAGS[flag] && value == null && flag.substr(0, 2) == 'no') {
        flag = flag.substr(2);
        value = '0';
      }
      
      if (FLAGS[flag]) {
        try {
          FLAGS[flag].set(value);
        } catch (e) {
          throwFlagParseError(args, i, e.message);
        }
      } else {
        throwFlagParseError(args, i, 'Unrecognized flag name "' + arg + '"');
      }
    
    // For now we only handle simple flags like --foo=bar, so fail out.
    } else {
      throwFlagParseError(args, i, 'Invalid argument "' + arg + '"');
    }
  }
  
  parseCalled = true;
  
  // Intercept the --help flag.
  if (FLAGS.help.get()) {
    exports.help();
    process.exit(0);
  }
  
  if (i != args.length) {
    return args.slice(i + 1);
  } else {
    return [];
  }
};


// Private helpers
//==================

var parseCalled = false;


function throwFlagParseError(args, i, msg) {
  // Show a nice error message with the offending arg underlined.
  var msg = 'FLAG PARSING ERROR: ' + msg + '\n  ' +
      args.join(' ') + '\n ' +
      new Array(args.slice(0, i).join(' ').length + 2).join(' ') +
      new Array(args[i].length + 1).join('^');

  if (exports.exitOnError) {
    console.log(msg);
    process.exit(1);
  } else {
    throw Error(msg);
  }  
}


function addFlag(name, flag) {
  if (parseCalled) throw Error('Can not register new flags after parse()');
  if (FLAGS[name]) throw Error('Flag already defined: "' + flag + '"')
  FLAGS[name] = flag;
}


function wrapText(text, maxLen) {
  var lines = text.split('\n');
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    // Adjust the maxLength for to take into account the lack of indent on the
    // first line.
    var maxLenx = maxLen + (out.length == 0 ? 4 : 0);
    var line = lines[i];
    if (line.length < maxLenx) {
      // Line doesn't exceed length so just push it.
      out.push(line)
    } else {
      // Wrap the line on spaces.
      // TODO : Would be nice to split URLs and long phrases that have no
      // natural spaces.
      var current = wrapLine(line, ' ', maxLenx, out);
      if (current != '') {
        out.push(current);
      }
    }
  }
  return out.join('\n    ');
}


function wrapLine(line, delimiter, maxLen, out) {
  var parts = line.split(delimiter);
  var current = '';
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    var next = current + part + delimiter; 
    if (next.length > maxLen) {
      out.push(current);
      current = part + delimiter;
    } else {
      current = next;
    }
  }
  return current;
}


/**
 * @constructor
 */
function Flag(name, defaultValue, description, validator, isSecret) {
  this.name = name;
  this.defaultValue = defaultValue;
  this.description = description;
  this.validator = validator;
  this.currentValue = null;
  this.isSet = false;
  this.isSecret = !!isSecret;
}


Flag.prototype.set = function(input) {
  if (this.isSet) {
    throw Error('Flag already set');
  }
  if (this.validator) this.validator.call(null, input);
  this.currentValue = this.parseInput(input);
  this.isSet = true;
};


Flag.prototype.get = function() {
  return this.isSet ? this.currentValue : this.defaultValue;
};


Flag.prototype.parseInput = function(inp) {
  return inp;
};


Flag.prototype.toHelpString = function() {
  return wrapText('  --' + this.name + ': ' + this.description, 70) + '\n' +
      '    (default: ' + JSON.stringify(this.defaultValue) + ')';
};


/**
 * @constructor
 */
function BooleanFlag() {
  BooleanFlag.super_.apply(this, arguments);
}
util.inherits(BooleanFlag, Flag);


BooleanFlag.prototype.parseInput = function(inp) {
  if (inp === null) {
    return true;
  }
  inp = inp.toLowerCase();
  if (inp === '1' || inp === 'true' || inp == 't') {
    return true;
  } else if (inp === '0' || inp === 'false' || inp == 'f') {
    return false;
  } else {
    throw Error('Invalid Boolean flag "' + inp + '"')
  }
};


BooleanFlag.prototype.toHelpString = function() {
  return wrapText('  --[no]' + this.name + ': ' + this.description, 70) + '\n' +
      '    (default: ' + JSON.stringify(this.defaultValue) + ')';
};



/**
 * @constructor
 */
function IntegerFlag() {
  IntegerFlag.super_.apply(this, arguments);
}
util.inherits(IntegerFlag, Flag);


IntegerFlag.prototype.parseInput = function(inp) {
  if (isNaN(inp) || parseInt(inp, 10) !== Number(inp)) {
    throw Error('Invalid Integer flag "' + inp + '"');
  }
  return Number(inp);
};


IntegerFlag.prototype.toHelpString = function() {
  return IntegerFlag.super_.prototype.toHelpString.call(this) +
      '\n    (an integer)';
};


/**
 * @constructor
 */
function NumberFlag() {
  NumberFlag.super_.apply(this, arguments);
}
util.inherits(NumberFlag, Flag);


NumberFlag.prototype.parseInput = function(inp) {
  if (isNaN(inp)) {
    throw Error('Invalid Number flag "' + inp + '"');
  }
  return Number(inp);
};


NumberFlag.prototype.toHelpString = function() {
  return NumberFlag.super_.prototype.toHelpString.call(this) +
      '\n    (a number)';
};



/**
 * @constructor
 */
function StringListFlag() {
  StringListFlag.super_.apply(this, arguments);
}
util.inherits(StringListFlag, Flag);


StringListFlag.prototype.parseInput = function(inp) {
  return inp.split(',');
};



/**
 * @constructor
 */
function MultiStringFlag() {
  MultiStringFlag.super_.apply(this, arguments);
  this.currentValue = [];
}
util.inherits(MultiStringFlag, Flag);


MultiStringFlag.prototype.set = function(input) {
  if (this.validator) this.validator.call(null, input);
  this.currentValue.push(input);
  this.isSet = true;
};



// Internal flags
//=================

function registerInternalFlags() {
  exports.defineBoolean('help', false, 'Shows this help text.', null, true);
  // TODO: --flagsfile  
}

registerInternalFlags();
