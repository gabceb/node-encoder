dev:
	supervisor server.js

production:
	NODE_ENV=production node server.js

.PHONY: test server
