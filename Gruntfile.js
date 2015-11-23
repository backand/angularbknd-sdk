module.exports = function (grunt) {
   // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        today: grunt.template.today('yyyy-mm-dd'),
        uglify: {
            options: {
                banner: '/*\n* Angular SDK to use with backand \n* @version <%= pkg.version %> - <%= today %>\n* @link https://www.backand.com \n* @author Itay Herskovits \n* @license MIT License, http://www.opensource.org/licenses/MIT\n */\n'
            },
            js: {
                src: 'dist/<%= pkg.name %>.debug.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }

        },
        concat: {
            options: {
                banner: '/*\n* Angular SDK to use with backand \n* @version <%= pkg.version %> - <%= today %>\n* @link https://www.backand.com \n* @author Itay Herskovits \n* @license MIT License, http://www.opensource.org/licenses/MIT\n */\n'
            },

            js: {
                options: {
                    banner: '(function () {\n',
                    footer: '})();\n',
                    separator: ';'
                },
                src: [
                    'src/utils/*.js',
                    'src/globals.js',
                    'src/backand.js',
                    'src/*.js',
                    'src/*/*.js'
                ],
                dest: 'dist/<%= pkg.name %>.debug.js'
            }
        },

        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false
                }
            }
        }

    });


    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');


    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify', 'watch']);

};