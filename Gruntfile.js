module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'src/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},

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
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-typescript');

	// Default task(s).
	grunt.registerTask('default', ['typescript']);

};