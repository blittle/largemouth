var RuleEngine = require('../src/RuleEngine');

describe('In Memory DB', function () {
	var ruleEngine;

	beforeEach(function () {
		ruleEngine = new RuleEngine();
	});

	afterEach(function() {
	});

	it('Should default to all rights', function() {
		expect(ruleEngine.canWrite('some/random/path')).toBeTruthy();
		expect(ruleEngine.canWrite('/some/other/random/path')).toBeTruthy();

		expect(ruleEngine.canRead('some/random/path')).toBeTruthy();
		expect(ruleEngine.canRead('/some/other/random/path')).toBeTruthy();
	});

	it('Should correctly resolve permissions for the root', function() {
		ruleEngine = new RuleEngine({
			".read": false,
			".write": false
		});

		expect(ruleEngine.canRead('/')).toBeFalsy();
		expect(ruleEngine.canRead('')).toBeFalsy();

		expect(ruleEngine.canWrite('/')).toBeFalsy();
		expect(ruleEngine.canWrite('')).toBeFalsy();
	});

	it('Should correctly resolve permissions for children that don\'t have defined permissions', function() {
		ruleEngine = new RuleEngine({
			".read": false,
			".write": false
		});

		expect(ruleEngine.canRead('/my/path/down')).toBeFalsy();
		expect(ruleEngine.canRead('my/path/down')).toBeFalsy();

		expect(ruleEngine.canWrite('/way/truth/life')).toBeFalsy();
		expect(ruleEngine.canWrite('way/truth/life')).toBeFalsy();
	});

	it('Should correctly resolve permissions for children 1', function() {
		ruleEngine = new RuleEngine({
			".read": false,
			".write": false,
			'chats': {
				".read": true,
				".write": false,
				"name": {
					".read": true,
					".write": true
				}
			}
		});

		expect(ruleEngine.canRead('')).toBeFalsy();
		expect(ruleEngine.canWrite('')).toBeFalsy();

		expect(ruleEngine.canRead('chats')).toBeTruthy();
		expect(ruleEngine.canWrite('chats')).toBeFalsy();

		expect(ruleEngine.canRead('chats/name')).toBeTruthy();
		expect(ruleEngine.canWrite('chats/name')).toBeTruthy();
	});

	it('Should correctly resolve permissions for children 2', function() {
		ruleEngine = new RuleEngine({
			'chats': {
				".read": true,
				"name": {
					".read": true,
					".write": true
				}
			}
		});

		expect(ruleEngine.canRead('')).toBeTruthy();
		expect(ruleEngine.canWrite('')).toBeTruthy();

		expect(ruleEngine.canRead('chats')).toBeTruthy();
		expect(ruleEngine.canWrite('chats')).toBeFalsy();

		expect(ruleEngine.canRead('chats/name')).toBeTruthy();
		expect(ruleEngine.canWrite('chats/name')).toBeTruthy();
	});
});