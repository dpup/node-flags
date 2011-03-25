
// TODO: Support
// --flagfile
// --help

var util = require('util');

var FLAGS = exports.FLAGS = {};


exports.defineString = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new Flag(name, defaultValue, opt_description, opt_validator));
};


exports.defineBoolean = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new BooleanFlag(name, defaultValue, opt_description, opt_validator));
};


exports.defineInteger = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new IntegerFlag(name, defaultValue, opt_description, opt_validator));
};


exports.defineNumber = function(name, defaultValue, opt_description, opt_validator) {
  addFlag(name, new NumberFlag(name, defaultValue, opt_description, opt_validator));
};


//exports.defineStringList = define.bind(null, stringListConverter);

//exports.defineMultiString = define.bind(null, multiStringConverter);


exports.help = function() {
  console.log(util.inspect(FLAGS));
};


/**
 * Parses process.argv for flags.  Idempotent if called multiple times.
 */
exports.parse = function(opt_args) {
  var args = opt_args || process.argv.slice(2);
  if (arguments.callee.wasCalled) return;
  
  var parsedFlags = {};
  
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    
    console.log(i + ': ' + arg);
    
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
    
  arguments.callee.wasCalled = true;
};


function throwFlagParseError(args, i, msg) {
  // Show a nice error message with the offending arg underlined.
  throw Error('FLAG PARSING ERROR: ' + msg + '\n  ' +
      args.join(' ') + '\n  ' +
      new Array(args.slice(0, i).join(' ').length + 2).join(' ') +
      new Array(args[i].length + 1).join('^') + '\n');
}


function addFlag(name, flag) {
  if (FLAGS[name]) throw Error('Flag already defined: "' + flag + '"')
  FLAGS[name] = flag;
}


function numConverter(inp) {
  if (isNaN(inp)) {
    throw Error('Invalid Number flag "' + inp + '"');
  }
  return Number(inp);
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
  inp = inp.toLowerCase();
  if (inp === null || inp === '1' || inp === 'true' || inp == 't') {
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
