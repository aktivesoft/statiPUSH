# statiPUSH

Static Website Push utility. This utility allow you to push static websites on the following destinations:

- Uploading files using **FTP**
- Uploading files using **SSH** for file transfer
- **S3 Bucket**
- **CloudFront** Distribution from S3 Bucket. On this case, it will create an invalidation request for you.

## Features 

- Optional automatic minify CSS/JS/HTML files
- Optional LESS & SASS processing
- Can easily integrate Jamstack builders using the build commands

## Usage

**To install the tool on your project**, first clone the repository and execute the **install** tool from command line. You will be promted to write the project path. After press enter, the statiPUSH files will be copied on your project folder.

**To run the utlity**, simply run the **push** command from the root from command line on your project folder. 

## Configuration

After instaling the tool on your project, first you need to edit the **push.json** file.

- **source** is the folder where your source code files are located. If you are using a Jamstack builder, the output folder from that tool will be the source for statiPUSH.
- **output** is where the build files will be located. It's a temporal folder where the files will be processed before the upload process. This folder and his contents are ereased every time you ruin this tool. 
- **mode** indicates the push mode. There are 4 different values: *s3*, *cloudfront_s3*, *ftp* and *scp*
- **build** here you can indicate the build commans that the tool should invoke. You can indicate as much as you need.
- **css_process** indicates if LESS nd SASS files will be processed. Values can be 1 to enable and 0 to disable.
- **minify** indicates if the tool needs to minify HTML, CSS and JS files or not. Values can be 1 to enable and 0 to disable.
- **exclude** indicate the file paths and extensions that will not be uploaded.
- **s3_mode** indicate the S3 options.
- **ftp_mode** indicates the FTP options
- **scp_mode** indicates the SSH options

## S3 Options

When you are using the **s3** and **cloudfront_s3** modes, the tool load the configuration from this section. The values expected are:

- **bucket** is the S3 Bucket name where the files re going to be uploaded
- **profile** is the AWS profile defined using the *aws configure* command
- **distribution** is the Cloudfront distribution ID that you are using. Used only on mode **cloudfront_s3** 

## FTP Options

- **host** is the FTP server ip address or host 
- **port** is the port used by the FTP server
- **user** is the user on the server
- **password** is the password to connect. If it's not encrypted, it will be encrypted by the tool after the first run.
- **path** the remote folder on the server, for example */var/www/html*

## SCP/SSH Options

- **host** is the server ip address or host 
- **user** is the user on the server
- **keyfile** is the private key file needed to connect to the server. Will be located on the **.ssh** folder on your user home directory.
- **path** the remote folder on the server, for example */var/www/html*

