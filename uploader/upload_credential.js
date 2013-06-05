var SECRET_KEY = 'INSERT_SECRET_KEY_HERE';

var crypto = require('crypto');

exports.create = function(key){
	return crypto.createHash('md5').update(SECRET_KEY + key).digest('hex');
}

exports.isValid = function(securityHash, key){
	return exports.create(key) == securityHash;
}