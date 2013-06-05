# Node-encoder

#### Node server to encode audio files from WAV to MP3 using SOX and upload them to S3

## Requirements:

- All NPM packages
- Sox library with mp3 support. Read below for instructions on Ubuntu machines.
- S3 key, secret and bucket for uploading the files to S3 on config.js
- Secret key on uploader/upload_credential.js
- Capistrano gem if deploying using Capistrano

## Audio recording on the browser

Node-encoder was created to work with this version of [jRecorder](https://github.com/gabceb/jRecorder) and it assumes it receives a request with the WAV file as the POST data. To change the way node-encoder receives the WAV data change the authorizedUpload function.

## Generating a security hash

Node-encoder uses a security hash to make sure it received a legitimate request. If you need change the key that is used just change the values on the isValidCredential method.

This approached was taken from the [Node-upload-progress project](https://github.com/phstc/node-upload-progress). To generate the token with the security hash on Ruby use the code below or refer to the [Uploader-rails project](https://github.com/phstc/uploader_rails).

```ruby
def security_hash key
    Digest::MD5.hexdigest SECRET_KEY + key
end
```

## Building Sox with MP3 support:

#### Using Chef:

- Use the [sox_mp3-cookbook](https://github.com/gabceb/sox_mp3-cookbook) cookbook

#### Building Sox with MP3 support (verified on Ubuntu machines):

First install some build tools:

- sudo apt-get install build-essential fakeroot dpkg-dev devscripts

Install the build dependencies for SoX as well as the new one of libmp3lame-dev:

- sudo apt-get build-dep sox
- sudo apt-get install libmp3lame-dev
- cd /usr/src && mkdir build && cd build

Download source:

- apt-get source sox
- cd sox-14.3.2

Remove the option that blocks mp3 encoding, add libmp3lame-dev to the build depends, remove the warning about mp3 writing, rebuild the packages, install them and finally clean the source:

- sed -i 's/--without-lame //' debian/rules
- sed -i 's/libmagic-dev, /libmagic-dev, libmp3lame-dev, /' debian/control
- sed -i 's/Write support not available yet.//' debian/control
- fakeroot debian/rules binary
- sudo dpkg -i ../*.deb
- fakeroot debian/rules clean

Instructions were copied from this [forum entry](http://ubuntuforums.org/showthread.php?t=1576848&p=9859875#post9859875)

## Running server

- Install supervisor `npm install -g supervisor`
- supervisor server.js

## Deploy using Capistrano

#### Vagrant

- Refer to the [Vagrant Getting Started](http://docs.vagrantup.com/v2/getting-started/index.html) for instructions on how to create a vagrant box
- SSH to the box and build sox with mp3 support manuall using the instructions above or using the Chef cookbook
- run `cap vagrant deploy`

#### Production

- Provision a box using Ubuntu 12.04
- Enter the box details on config/production.rb
- Build sox with mp3 support manuall using the instructions above or using the Chef cookbook
- Run `cap production deploy`
