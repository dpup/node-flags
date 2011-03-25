
var flags = require('flags');

flags.defineString('str', 'hello');
flags.defineInteger('int', 20);
flags.defineNumber('num', 1.234);


flags.parse();

flags.help();