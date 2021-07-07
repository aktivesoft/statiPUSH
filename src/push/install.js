var path = path || require('path');
var fs = fs || require('fs');
const chalk = require('chalk');
const { exit } = require('process');
var prompt = require('prompt-sync')();
let cleanUpPath = require("clean-up-path");
var _fs = process.platform.indexOf('win32') >= 0 ? '\\' : '/';

/* Functions */

var ensureDirectoryExistence = function(filePath) {
    var _dirname = path.dirname(filePath);
    if (fs.existsSync(_dirname)) {
      // console.log('exists' + _dirname);
      return true;
    }
    ensureDirectoryExistence(_dirname);
    fs.mkdirSync(_dirname);
};

function do_copy(file) {    
    try {
        fs.copyFileSync(file, absolutePath + path.basename(file), fs.constants.COPYFILE_EXCL);        
    } catch (error) {
        console.log('Skipping '+path.basename(file))
    }
}

function promptYN(label) {
    let _continue = true;
    while (_continue) {
        let opt = prompt(label + ' [Y/N] ').toUpperCase();
        if (opt == 'N') {
            _continue = false;
            return opt;
        }
        if (opt == 'Y') {
            _continue = false;
            return opt;
        }
        if ((opt != 'Y') && (opt != 'N')) {
            console.log(chalk.bold.red("Invalid option."));
        }        
    }    
}

console.log(chalk.white.bold('statiPUSH') + ' installer');

if (promptYN('Do you want to install statiPUSH?') != 'Y') {
    exit();
}

let _folder = prompt('Please choose the folder to install: ');
if ((_folder == '') || (_folder == './') || (_folder == '.')|| (_folder.substr(0, 2) == './')) {
    console.log(chalk.red('Cannot install statiPUSH on current folder.'));
    exit();
}

if (_folder.substr(0, 2) == '..') {
    _folder = '../../' + _folder;
}

console.log(chalk.red('Installing...'));

let absolutePath = path.resolve(_folder);
absolutePath = absolutePath + _fs;
ensureDirectoryExistence(absolutePath + '*');
do_copy('../push_update.bat');
do_copy('../push_update.sh');
do_copy('../push.bat');
do_copy('../push.sh');
do_copy('../push.json');

//Push folder
absolutePath = path.resolve(_folder + '/push/');
absolutePath = absolutePath + _fs;
ensureDirectoryExistence(absolutePath + '*');
do_copy('./package.json');
do_copy('./push_update.js');
do_copy('./push.js');
do_copy('./push.s3.js');


console.log(chalk.green('Install complete'));