module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		typescript: {
			base: {
				src: ['src/**/*.ts', 'bin/*.ts'],
				options: {
					module: 'commonjs', //or commonjs
					target: 'es5', //or es3
					sourcemap: true,
					fullSourceMapPath: true
				}
			}
		},

		jasmine_node: {
		    // specNameMatcher: "*.js", // load only specs containing specNameMatcher
		    // projectRoot: ".",
		    requirejs: false,
		    forceExit: true
		}
	});

	grunt.loadNpmTasks('grunt-jasmine-node');
	grunt.loadNpmTasks('grunt-typescript');

	// Default task(s).
	grunt.registerTask('default', ['typescript']);
	grunt.registerTask('test', ['typescript', 'jasmine_node']);

};