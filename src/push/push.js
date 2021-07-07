var path = path || require('path');
var fs = fs || require('fs');
var ftpDeploy = require("ftp-deploy");
var child_process = require('child_process');
var config = require('../push.json');
const chalk = require('chalk');
var sass = require("sass");
const htmlMinifier = require('@node-minify/html-minifier');
const uglifyJS = require('@node-minify/uglify-js');
const cleanCSS = require('@node-minify/clean-css');
var less = require('less');
const minify = require('@node-minify/core');
const { exit } = require('process');
const Cryptr = require('cryptr');
const homedir = require('os').homedir();
var prompt = require('prompt-sync')();
var _fs = process.platform.indexOf('win32') >= 0 ? '\\' : '/';
var _ofs = _fs == '/' ? '\\' : '/';
var info = require('./package.json')
var _home = homedir + _fs + ".sp"+_fs;

//Fix Source
config.source = '..' + _fs + config.source.replaceAll(_ofs, _fs);
config.output = '..' + _fs + config.output.replaceAll(_ofs, _fs);

//Functions
//Get a recursive list of files for a given folder
var walkSync = function(dir, filelist) {
    var path = path || require('path');
    var fs = fs || require('fs');
    var files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

//Delete folder an all of his contents
const deleteFolderRecursive = function(_path) {
    if (fs.existsSync(_path)) {
      fs.readdirSync(_path).forEach((file, index) => {
        const curPath = path.join(_path, file);
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(_path);
    }
};

//Check that the directory exists for a gine file name. Do nor inclue the folder path only, use a file path (including a ile name).
var ensureDirectoryExistence = function(filePath) {
    var _dirname = path.dirname(filePath);
    if (fs.existsSync(_dirname)) {
      // console.log('exists' + _dirname);
      return true;
    }
    ensureDirectoryExistence(_dirname);
    fs.mkdirSync(_dirname);
};

var encrypt = (text) => {
    const cryptr = new Cryptr(__key);
    return cryptr.encrypt(text);
};

var decrypt = (hash) => {    
    const cryptr = new Cryptr(__key);
    if (hash != '') {        
        return cryptr.decrypt(hash);
    }
    return -1;
};

//Detect if file is on the excluded list
var isExcluded = function(file) {
    return false;
}

//Compile Less files
var lessC = function(file) {
    let css = fs.readFileSync(file, 'utf8');
    // console.log(css);
    let _less_c =  false;
    let _result = '';
    less.render(css, {
        processImports: false
    }, function(error, output) {
        _less_c = true;
        if (!error) {
            _result = output;
        }
    });
    while(_less_c === false) {
        require('deasync').sleep(100);
    }    
    return _result;
}

var _ep = path.resolve('../');

_project = _ep.split(_fs).slice(-1)[0];

ensureDirectoryExistence(_home + "*");
console.log(chalk.white.bold('statiPUSH') + ' ' + info.version);

let __key = "";
if (!fs.existsSync(_home + _project + 'spush.key')) {
    //This key must be provided by project manager
    var correct = false;
    var _key = "";
    while (!correct) {
      console.log("You need to setup a encryption key ");
      _key = prompt('Enter the encryption key: ', {echo: '*'});
      const _vkey = prompt('Verify key: ', {echo: '*'});
      correct = _key == _vkey;
      if (!correct) {
        console.log("Key do not match");
      }
    }
    __key = _key;
    fs.writeFileSync(_home + _project + 'spush.key', _key);
    console.log("Key stored");
} else {
    __key = fs.readFileSync(_home + _project + 'spush.key', 'utf8');
}

if ((config.ftp_mode.password != "") && (config.ftp_mode.password.slice(-2) != '==')) {
    var oconfig = JSON.parse(fs.readFileSync('../push.json', 'utf8'))
    oconfig.ftp_mode.password = encrypt(oconfig.ftp_mode.password) + '==';
    fs.writeFileSync('../push.json', JSON.stringify(oconfig));
}

console.log(chalk.blue('Cleaning up build folder'));
deleteFolderRecursive(config.output);

console.log(chalk.blue('Running build processes'));
//Exec build comands
config.build.forEach(command => {
    var result = '';
    if (command.command != '') {
        child_process.execSync(command.command + ' ' + command.params, { stdio: 'inherit', encoding: 'utf8' })
    }    
});

let extcss = '|less|sass|scss|';
let extmin = '|htm|html|css|js|';

console.log('CSS Preprocess: ' + ((config.css_process == 1) ? chalk.bold.green('Enabled') : chalk.bold.red('Disabled')));
console.log('Data Minify: ' + ((config.minify == 1) ? chalk.bold.green('Enabled') : chalk.bold.red('Disabled')));

ensureDirectoryExistence(config.source + 'X');
ensureDirectoryExistence(config.output + 'X');

console.log(chalk.blue('Copying files'));
_files = walkSync(config.source, []);
_files.forEach(function(_file) {
    // console.log(_file);
    copied = false;
    let ext = path.extname(_file).replaceAll('.', '');

    ensureDirectoryExistence('.' + _fs + _file.replaceAll(config.source, config.output));

    if ((config.css_process == 1) && (extcss.indexOf('|'+ext+'|') >= 0)) {        
        //process and minify
        let _outfname = '.' + _fs + _file.replaceAll(ext, 'css');
        // console.log(_outfname);
        let outfname = _outfname.replaceAll(config.source, config.output);
        let _content = '';
        if (ext == 'less') {
            _content = lessC(_file).css;            
        } else {
            _content = sass.renderSync({
                file: _file 
            }).css.toString();
        }
        if (config.minify == 1) {
            if (_content != "") {
                // console.log(_content);
                fs.writeFileSync(_outfname, _content);
                minify( {
                    compressor: cleanCSS,
                    input: _outfname,
                    output: outfname,
                    callback: function(err, min) {
                        if (err) {
                            console.log(chalk.red('ERROR!'));
                            console.log(err);
                            exit;
                        } else {
                            // console.log(min);
                            // fs.writeFileSync(outfname, min);
                        }
                    }
                });           
                console.log('Compressed: ' + outfname);     
                copied = true;
                fs.unlinkSync(_outfname);
            } 
        } else {
            fs.writeFileSync(outfname, _content);
            copied = true;
        }
    } else {
        if ((config.minify == 1) && (extmin.indexOf(ext) >= 0)) {
            //Minify
            if (ext == 'css') {
                minify( {
                    compressor: cleanCSS,
                    input: '.' + _fs + _file,
                    output: '.' + _fs + _file.replaceAll(config.source, config.output),
                    callback: function(err, min) {
                        // console.log('End?');
                        if (err) {
                            console.log(chalk.red('ERROR!'));
                            console.log(err);
                            exit;
                        } else {
                            // console.log(min);
                            // fs.writeFileSync('.' + _fs + _file.replaceAll(config.source, config.output), min);
                        }                        
                    }
                });     
                console.log('Compressed: ' + '.' + _fs + _file.replaceAll(config.source, config.output));
                copied = true;               
            }
            if (ext == 'js') {
                minify( {
                    compressor: uglifyJS,
                    input: '.' + _fs + _file,
                    output: '.' + _fs + _file.replaceAll(config.source, config.output),
                    callback: function(err, min) {
                        if (err) {
                            console.log(chalk.red('ERROR!'));
                            console.log(err);
                            exit;
                        } else {
                            // console.log(min);
                            // fs.writeFileSync('.' + _fs + _file.replaceAll(config.source, config.output), min);
                        }
                    }
                });           
                console.log('Compressed: ' + '.' + _fs + _file.replaceAll(config.source, config.output));
                copied = true;                             
            }
            if ((ext == 'htm') || (ext == 'html')) {
                minify( {
                    compressor: htmlMinifier,
                    input: '.' + _fs + _file,
                    output: '.' + _fs + _file.replaceAll(config.source, config.output),
                    callback: function(err, min) {
                        if (err) {
                            console.log(chalk.red('ERROR!'));
                            console.log(err);
                            exit;
                        } else {
                            // console.log(min);
                            // fs.writeFileSync('.' + _fs + _file.replaceAll(config.source, config.output), min);
                        }
                    }
                });         
                console.log('Compressed: ' + '.' + _fs + _file.replaceAll(config.source, config.output));
                copied = true;           
            }            
        }
    }
    if (!copied) {        
        if (!isExcluded(_file)) {
            fs.copyFileSync('.' + _fs + _file, '.' + _fs + _file.replaceAll(config.source, config.output));
        }
    }
});


/* Push!*/
if ((config.mode == 's3') || (config.mode == 'cloudfront_s3')) {
    _params = "";
    //Push S3 will take care of the entire process
    child_process.execSync('node push.s3.js ' + _params, { stdio: 'inherit', encoding: 'utf8' });    
}
if (config.mode == 'ftp') {
    console.log(chalk.blueBright('Uploading files using FTP'));
    var ftpconfig = {
        host: config.ftp_mode.host,
        port: config.ftp_mode.port, 
        user: config.ftp_mode.user, 
        password: decrypt(config.ftp_mode.password.slice(0, -2)),
        // Password optional, prompted if none given
        localRoot: config.output,
        remoteRoot: config.ftp_mode.path,
        include: ["*", "**/*", ".*"],      // this would upload everything except dot files
        // include: ["*.php", "dist/*", ".*"],
        // e.g. exclude sourcemaps, and ALL files in node_modules (including dot files)
        // exclude: ["dist/**/*.map", "node_modules/**", "node_modules/**/.*", ".git/**"],
        // delete ALL existing files at destination before uploading, if true
        deleteRemote: false,
        // Passive mode is forced (EPSV command is not sent)
        forcePasv: true,
        // use sftp or ftp
        sftp: false
    };
    ftpDeploy.on("upload-error", function(data) {
      console.log(data.err); // data will also include filename, relativePath, and other goodies
    });    
    ftpDeploy
        .deploy(ftpconfig)
        .then(res => {
          console.log("Upload complete");
        })
        .catch(err => {
          console.log(chalk.red('Error during upload process'));
          console.log(err);
        });      
}
if (config.mode == 'scp') {
    console.log(chalk.blueBright('Uploading files using SCP'));
    let _server = config.scp_mode.host;
    if (_server.indexOf('@') === false) {
        _server = config.scp_mode.user + '@' + _server;
    }    
    var cmd = 'scp';
    var _cmd = cmd + ' -i "~/.ssh/' + config.scp_mode.keyfile + '" -r ' + config.output + '/* ' + _server + ':' + config.scp_mode.path;
    try {
        child_process.execSync(_cmd, { stdio: 'inherit', encoding: 'utf8' });      
    } catch (error) {
        console.log(chalk.red('Error during upload process'));
    }   
}


console.log(chalk.green('Process complete'));