var path = path || require('path');
var fs = fs || require('fs');
const shell = require('shelljs');
const chalk = require('chalk');
var execSync = require('child_process').execSync;
var prompt = require('prompt-sync')();
var _fs = process.platform.indexOf('win32') >= 0 ? '\\' : '/';

function do_copy(file) {    
    if (fs.existsSync(absolutePath + path.basename(file))) {
        fs.unlinkSync(absolutePath + path.basename(file));
    }
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

console.log(chalk.white.bold('statiPUSH') + ' updater');

if (promptYN('Do you want to update statiPUSH?') != 'Y') {
    exit();
}

if (fs.existsSync("./statiPUSH/")) {  
    console.log(chalk.bold('Cloning statiPUSH'));
    shell.exec('git clone https://github.com/jmoleiro/statiPUSH');
} else {
    console.log(chalk.bold('Updating statiPUSH'));
    execSync('git pull origin master --rebase', { cwd: './statiPUSH/', stdio: 'inherit', encoding: 'utf8' })
}

let absolutePath = path.resolve('./') + _fs;
let source = './statiPUSH/src/';

do_copy(source + 'push_update.bat');
do_copy(source + 'push_update.sh');
do_copy(source + 'push.bat');
do_copy(source + 'push.sh');

absolutePath = absolutePath + 'push' + _fs;
source = './statiPUSH/src/push/';
do_copy(source + 'package.json');
do_copy(source + 'push_update.js');
do_copy(source + 'push.js');
do_copy(source + 'push.s3.js');

console.log(chalk.green('Update complete!'));