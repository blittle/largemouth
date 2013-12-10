module.exports = function(largemouth) {
	largemouth.events['someEvent'] = function(req, socket) {
		console.log('hi', req);
	};

	largemouth.rules = {
		".write": true,
		".read": true,
		"users": {
			".write": true,
			".read": true,
			"lukas": {
				".write": false
			}
		}
	};

	largemouth.auth = function(handshakeData, callback) {
		console.log('token', handshakeData.query.token);
		callback(null, (handshakeData.query.token == 'doggies') );
	};
}
