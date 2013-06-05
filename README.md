# Node-encoder

## Node webserver used to encode comments from wave to mp3 and upload it to S3

### Requirements:

- All NPM packages
- Sox library with mp3 support. Read below for instructions on Ubuntu machines.
- S3 key, secret and bucket for uploading the files to S3 on config.js
- Secret key on uploader/upload_credential.js

### Installing Sox with MP3 support (verified on Ubuntu)

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

### Running server

- Install supervisor `npm install -g supervisor`
- supervisor server.js

### Running server in production

- export NODE_ENV=production
- supervisor server.js