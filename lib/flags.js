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
 * Defines a string flag.  e.g. --servername=bob
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {string} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 */
exports.defineString = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new Flag(name, defaultValue, opt_description, opt_validator));
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
 */
exports.defineBoolean = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new BooleanFlag(name, defaultValue, opt_description, opt_validator));
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
 */
exports.defineInteger = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new IntegerFlag(name, defaultValue, opt_description, opt_validator));
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
 */
exports.defineNumber = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new NumberFlag(name, defaultValue, opt_description, opt_validator));
};


/**
 * Defines a string list flag.  e.g. --anmial=frog,bat,chicken 
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {!Array.<string>} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 */
exports.defineStringList = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new StringListFlag(name, defaultValue, opt_description, opt_validator));
};


/**
 * Defines a multi string flag.  e.g. --allowedip=127.0.0.1 --allowedip=127.0.0.2
 * @param {string} name The flag name, should be [a-zA-Z0-9]+.
 * @param {!Array.<string>} defaultValue The default value, should the flag not be
 *     explicitly specified.
 * @param {string=} opt_description Optional description to use in help text.
 * @param {function(string)=} opt_validator Optional validator function that
 *     will be called when parsing flags.  Should throw if the input is not
 *     valid.
 */
exports.defineMultiString = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new MultiStringFlag(name, defaultValue, opt_description, opt_validator));
};


/**
 * Dumps the help text to the console.
 */
exports.help = function() {
  // TODO: make this suck less and automatically hook up to --help
  for (var flag in FLAGS) {
    console.log('--' + flag + ' : ' + FLAGS[flag].description);
  }
};


/**
 * Resets the flag values.
 */
exports.reset = function() {
  parseCalled = false;
  FLAGS = exports.FLAGS = {};
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
      if (value == null && args[i + 1].substr(0, 2) != '--') {
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
  throw Error('FLAG PARSING ERROR: ' + msg + '\n  ' +
      args.join(' ') + '\n  ' +
      new Array(args.slice(0, i).join(' ').length + 2).join(' ') +
      new Array(args[i].length + 1).join('^') + '\n');
}


function addFlag(name, flag) {
  if (parseCalled) throw Error('Can not register new flags after parse()');
  if (FLAGS[name]) throw Error('Flag already defined: "' + flag + '"')
  FLAGS[name] = flag;
}



/**
 * @constructor
 */
function Flag(name, defaultValue, description, validator) {
  this.name = name;
  this.defaultValue = defaultValue;
  this.description = description;
  this.validator = validator;
  this.currentValue = null;
  this.isSet = false;
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



/**
 * @constructor
 */
function BooleanFlag(flag, defaultValue, converter, description, validator) {
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



/**
 * @constructor
 */
function IntegerFlag(flag, defaultValue, converter, description, validator) {
  IntegerFlag.super_.apply(this, arguments);
}
util.inherits(IntegerFlag, Flag);


IntegerFlag.prototype.parseInput = function(inp) {
  if (isNaN(inp) || parseInt(inp, 10) !== Number(inp)) {
    throw Error('Invalid Integer flag "' + inp + '"');
  }
  return Number(inp);
};



/**
 * @constructor
 */
function NumberFlag(flag, defaultValue, converter, description, validator) {
  NumberFlag.super_.apply(this, arguments);
}
util.inherits(NumberFlag, Flag);


NumberFlag.prototype.parseInput = function(inp) {
  if (isNaN(inp)) {
    throw Error('Invalid Number flag "' + inp + '"');
  }
  return Number(inp);
};



/**
 * @constructor
 */
function StringListFlag(flag, defaultValue, converter, description, validator) {
  StringListFlag.super_.apply(this, arguments);
}
util.inherits(StringListFlag, Flag);


StringListFlag.prototype.parseInput = function(inp) {
  return inp.split(',');
};



/**
 * @constructor
 */
function MultiStringFlag(flag, defaultValue, converter, description, validator) {
  MultiStringFlag.super_.apply(this, arguments);
  this.currentValue = [];
}
util.inherits(MultiStringFlag, Flag);


MultiStringFlag.prototype.set = function(input) {
  if (this.validator) this.validator.call(null, input);
  this.currentValue.push(input);
  this.isSet = true;
};
