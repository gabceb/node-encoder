module.exports = function(){
  var settings = {};

  switch(process.env.NODE_ENV)
  {
  	case 'production':
		settings = {
  			s3_key: 'PRODUCTION_S3_KEY',
  			s3_secret: 'PRODUCTION_S3_SECRET',
  			s3_bucket: 'PRODUCTION_BUCKET'
  		};
  		break;
    case 'development':
    	settings = {
  			s3_key: 'DEVELOPMENT_S3_KEY',
  			s3_secret: 'DEVELOPMENT_S3_SECRET',
  			s3_bucket: 'DEVELOPMENT_BUCKET'
  		};
  		break;
  	default:
  		throw "Environment not defined on config.js file";
  }

  return settings;
}