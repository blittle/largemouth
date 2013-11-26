module.exports = function(largemouth) {
	largemouth.events['someEvent'] = function(req, socket) {
		console.log('hi', req);
	}

	largemouth.rules = {
		".write": false,
		".read": true
	}
}
