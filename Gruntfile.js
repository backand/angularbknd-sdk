module.exports = function (grunt) {
   // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        today: grunt.template.today('yyyy-mm-dd'),
        uglify: {
            options: {
                banner: '/*\n* Angular SDK to use with backand \n* @version <%= pkg.version %> - <%= today %>\n* @link https://backand.com \n* @author Itay Herskovits \n* @license MIT License, http://www.opensource.org/licenses/MIT\n */\n'
            },
            js: {
                src: 'dist/<%= pkg.name %>.debug.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }

        },


        concat: {
            options: {
                banner: '/*\n* Angular SDK to use with backand \n* @version <%= pkg.version %> - <%= today %>\n* @link https://backand.com \n* @author Itay Herskovits \n* @license MIT License, http://www.opensource.org/licenses/MIT\n */\n'
            },

            js: {
                options: {
                    separator: ';'
                },
                src: [
                'src/backand.js',
                ],
                dest: 'dist/<%= pkg.name %>.debug.js'
            }
        }

    });


    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');


    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);

};