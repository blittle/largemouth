module.exports = function(largemouth) {
	largemouth.events['someEvent'] = function(req, socket) {
		console.log('hi', req);
	}

	largemouth.rules = {
		".write": true,
		".read": true,
		"users": {
			".write": true,
			".read": true,
			"tearsa": {
				".write": false
			}
		}
	}
}
