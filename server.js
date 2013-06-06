// Set the NODE_ENV to development if not defined
process.env.NODE_ENV = process.env.NODE_ENV || "development"

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var sox = require('sox');
var util = require('util');
var knox = require('knox');
var url = require('url');
var uploadCredential = require('./uploader/upload_credential');
var config = require('./config.js')();
var PORT = 8080;

app.listen(PORT);

function onCrossDomainHandler(req, res) {
  var xml = '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM' + 
            ' "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n';
      xml += '<allow-access-from domain="*" to-ports="*"/>\n';
      xml += '</cross-domain-policy>\n';
 
  req.setEncoding('utf8');
  res.writeHead( 200, {'Content-Type': 'text/xml'} );
  res.end( xml );  
}

// Useful function for New Relic or ELB health check
function onPing(req, res) {
  req.setEncoding('utf8');
  res.writeHead( 200, {'Content-Type': 'text/plain'} );
  res.end( "PONG" );
}

// Empty favicon request
function onFavicon(req, res) {
  req.setEncoding('utf8');
  res.writeHead(200, {'Content-Type': 'image/x-icon'} );
  res.end();
}

function handler(req, res){
	var method = req.method.toLowerCase();

	if(method == 'post')
	{
		console.log("Received POST request");

		req.query = url.parse(req.url, true).query;

		if (req.url.match(/^\/encode\?/))
		{
			console.log("Upload request received");

			destPath = req.query.path;

			uploadHandler(isValidCredential, authorizedUpload, unauthorizedUpload)(req, res);
			
			return;
		}
	}
	else if(method == 'get' && req.url.match(/\/crossdomain.xml/))
	{
		onCrossDomainHandler(req, res);
	}
	else if(method == 'get' && req.url.match(/\/ping/))
	{
		onPing(req, res);
	}
	else if(method == 'get' && req.url.match(/\/favicon.ico/))
	{
		onFavicon(req, res);
	}
	else
	{
		console.log("Well we are screwed. Dont know how to deal with this request. Returning 404");
		res.writeHead(404, {'Content-type': 'text/plain'});
		res.end("Page not found");
	}
}

// Handles calling the validator and the authorized and not unauthorized functions
function uploadHandler(credentialValidator, funcAuthorized, funcUnauthorized){
	return function(req, res){
		if(credentialValidator(req)){
			funcAuthorized(req, res);
		} else {
			funcUnauthorized(req, res);
		}
	}
}

// The actual function to encode and upload the files.
// TODO: Fix callback hell by using some promises npm packages
function authorizedUpload(req, res){
	var data = new Buffer('');
	
	req.on('data', function (chunk) {
        data = Buffer.concat([data, chunk]);
    });
    req.on('end', function () {
    	
    	original_file_name = destPath.substring(destPath.lastIndexOf("/") + 1, destPath.length);

    	fs_file_name = __dirname + '/public/uploaded_files/' + original_file_name;

    	fs.writeFile(fs_file_name + ".wav", data, function(err){
    		if (err) throw err;

    		convertToMp3(fs_file_name, function(){
				uploadToS3(fs_file_name + ".wav", destPath + ".wav", function(){
					uploadToS3(fs_file_name + ".mp3", destPath + ".mp3", function(){
						endRequest(req, res);
					});
				});
			});
    	});
	});

	currentSendSocketMessage = createSendSocketMessage(req.query.socketid);
}

function endRequest(req, res)
{
	currentSendSocketMessage('uploaded_file', "DONE!");
	
	cleanUpFile(fs_file_name);
	res.writeHead(200, {'Content-type': 'text/plain'});

	destUrlNoExtension = destUrl.substring(0, destUrl.lastIndexOf("."));

	response_object = { destination_no_extension : destUrlNoExtension };
	return res.end(JSON.stringify(response_object));
}

// Initializes the s3 client to upload the files to S3
var s3Client = knox.createClient({
	secure: false,
	key: config.s3_key,
	secret: config.s3_secret,
	bucket: config.s3_bucket
});

// Checks if the request is valid based on the security hash and the destination path received
function isValidCredential(req){
	return uploadCredential.isValid(req.query.security_hash, destPath);
}

function unauthorizedUpload(req, res){
	console.log("Unauthorized request received");

	createSendSocketMessage(req.query.socketid)('upload_error', 'invalid credential');
	res.writeHead(401, {'Content-type': 'text/plain'});
	res.end('invalid credential');
}

function createSendSocketMessage(socketid){
	return function(room, message){
		sendSocketMessage(socketid, room, message);
	}
}

function sendSocketMessage(socketid, room, message){
	io.sockets.socket(socketid).emit(room, message);
}

// Converts a WAV to MP3
function convertToMp3(wav_file_path, callback){
	console.log("Starting conversion from WAV to MP3 for " + wav_file_path);

	var job = sox.transcode(wav_file_path + ".wav", wav_file_path + ".mp3");

	job.on('end', callback);

	job.on('error', function(err){
		console.log("ERROR:" + util.inspect(err));
	});

	job.on('progress', function(amountDone, amountTotal){
		var newProgress = amountDone / amountTotal;

		currentSendSocketMessage('upload_percentage', newProgress);
	});

	job.start();
}

// Uploads a file to S3
function uploadToS3(file_path, s3_file_path, cb)
{
	console.log("Uploading to S3 file: " + file_path, "to: " + s3_file_path);

	headers = {'x-amz-acl': 'public-read'};
	s3Client.putFile(file_path, s3_file_path, headers, function(err, s3Response) {
	    if (err)
    	{
    		console.log("ERROR: " + util.inspect(err));
    		throw err;
    	}
	    
	    destUrl = s3Response.req.url;

	    cb();
	});
}

// Cleaning up after we are done encoding and uploading the files
function cleanUpFile(file_name)
{
	console.log("Cleaning up");
	
	deleteFile(file_name + ".wav");
	deleteFile(file_name + ".mp3");

	console.log("Done cleaning up");
}

function deleteFile(file_name){
	fs.unlink(file_name, function(err){
		if(err){
			console.log("An error ocurred while deleting the file: " + file_name);
			throw err;
		}
	});
}