/**
 * @fileoverview Basic example of flag usage.
 *
 * Try:
 *   node example.js --name='Dan Pupius' --age=31 --height=1.85 \
 *     --pets=Ada,Oscar --hobby=triathlon --hobby=photography
 *
 * @author dan@pupi.us (Daniel Pupius)
 */

var flags = require('flags');

flags.defineString('name', 'Billy Noone', 'Your name');
flags.defineInteger('age', 21, 'Your age in whole years');
flags.defineNumber('height', 1.80, 'Your height in meters');
flags.defineStringList('pets', [], 'Comma separated list of your pets');
flags.defineMultiString('hobby', [], 'A hobby');

flags.parse();

// ====

var info = [];
info.push('Name : ' + flags.get('name'));
info.push('Age : ' + flags.get('age'));
info.push('Height : ' + flags.get('height') + '"');
info.push('Pets : ' + flags.get('pets').join(', '));
info.push('Hobbies : \n  ' + flags.get('hobby').join('\n  '));

console.log(info.join('\n'));

console.log('\nHelp Text:');
flags.help();