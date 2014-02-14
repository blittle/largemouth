///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>
import _ = require('lodash');

var RULE_KEYS = {
	READ: ".read",
	WRITE: ".write",
	VALIDATE: ".validate"
};

class RuleEngine {

	private config: any;

	/**
	 * Build a new RuleEngine which will parse and return permissions for
	 * various paths inside the configuration. If a configuration is not found
	 * for a path, the closest parent permissions will be used instead.
	 * @param config
	 */
	constructor(config: any) {
        var defaults: any = {
            ".read": true,
            ".write": true
        };

		this.config = _.extend(defaults, config);
	}

	private getRuleDefinition(path: string): any {
		if(!path) return this.config;
		if(path[0] === '/') path = path.substring(1);

		var config = this.config;
		var paths = path.split('/');

		// Use _.find() so we can short circuit once
		// we found the desired rule definition
		_.find(paths, (path, i): any => {
			if(!config[path]) return true;
			config = config[path];
		});

		return config;
	}

	/**
	 * Given the permission configuration, can a value be written at the given path?
	 *
	 * @param path - a string representing the path to the data to change
	 * @returns boolean
	 */
	canWrite(path: string): boolean {
		return this.getRuleDefinition(path)[RULE_KEYS.WRITE];
	}

	/**
	 * Given the permission configuration, can a value be read at the given path?
	 * @param path - a string representing the path to the data to read
	 * @returns boolean
	 */
	canRead(path: string): boolean {
		return this.getRuleDefinition(path)[RULE_KEYS.READ];
	}

	/**
	 * Given the permission configuration, is the value to be written valid?
	 * @param path - a string representing the path to the data to change
	 * @param any - the actual data being validated
	 * @returns boolean
	 */
	validate(path: string, data: any): boolean {
		return true;
	}
}

export = RuleEngine;