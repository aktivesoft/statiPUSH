var path = path || require('path');
var fs = fs || require('fs');
const chalk = require('chalk');
const AWS = require('aws-sdk');
var config = require('../push.json');
var mime = require('mime-types');
var _fs = process.platform.indexOf('win32') >= 0 ? '\\' : '/';
var _ofs = _fs == '/' ? '\\' : '/';

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

let filesC = 0;
let filesUerr = false;
//Upload a file into AWS S3
const uploadFile = (fileName, file_ups) => {
    filesC++;
    mime_type = mime.lookup(fileName);
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);
    
    // Setting up S3 upload parameters
    const params = {
        Bucket: _bucket,
        Key: file_ups, // File name you want to save as in S3
        Body: fileContent,
        ContentType: mime_type,
        CacheControl: 'max-age=86400',
        ACL: 'public-read'
    };
    console.log(chalk.blueBright("Uploading file ") + chalk.bold(file_ups) + chalk.blueBright(" to S3"));        
    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        filesC--;
        if (err) {            
            console.log(chalk.bold.red("ERROR"));    
            console.log(err);
            filesUerr = true;
        } else {
            console.log(`File uploaded successfully. ${data.Location}`);
        }
    });    

};

_bucket = config.s3_mode.bucket;

const s3 = new AWS.S3({
    profile: config.s3_mode.profile
});

console.log(chalk.blueBright('Uploading files to S3'));
_files = walkSync(config.output, []);
_files.forEach(function(_file) {
    _remote = _file.replaceAll(config.output, '').replaceAll('\\', '/');
    // console.log(_remote);
    if (_bucket != '') {
        uploadFile(_file, _remote);
    }
});

while(filesC > 0) {
    require('deasync').sleep(100);
}    

if (config.mode == 'cloudfront_s3') {
    //Cloudfront 
    var params = {
        DistributionId: config.s3_mode.distribution, /* required */
        InvalidationBatch: { /* required */
          CallerReference: Date.now().toString(), /* required */
          Paths: { /* required */
            Quantity: '1', /* required */
            Items: [
              '/*',
              /* more items */
            ]
          }
        }
      };
      var cloudfront = new AWS.CloudFront();
      cloudfront.createInvalidation(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     {
            console.log(chalk.blueBright('Created CloudFront Invalidation'));
            console.log(data);
        }
      });    
}