/****************************************************************************
 * Copyright 2017 British Broadcasting Corporation
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*****************************************************************************/


module.exports = function(grunt) {

  grunt.initConfig({
  
    clean: {
      dist: "dist",
      build: "build",
      tests: "build/tests",
    },
    
    copy: {
      src: { expand: true, cwd: 'src/', src: ['**'], dest: 'build/lib/' },
    },
      
    webpack: {
      lib: {
        context: __dirname + "/build/lib",
        entry: {
          'dvbcss-clocks' :
            ['./main.js']
        },
        output: {
          path: __dirname + "/dist",
          filename: "[name].js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'dvbcss-clocks',
          libraryTarget: 'umd'
        },
        module: {
          loaders: []
        },
        resolve: { root: __dirname + "/build/lib" },
      },
      
      specs: {
        context: __dirname + "/tests",
        entry: {
          "tests" : "./main.js"
        },
        output: {
          path: __dirname + "/build/tests/",
          filename: "specs.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          sourceMapFilename: "[file].map",
        },
        module: {
          loaders: []
        },
        resolve: {
          root: [ __dirname + "/tests/specs", __dirname + "/tests/util",  __dirname+"/src" ]
        },
        devtool: [
          "source-map"
        ],
      },
    },
    
    jasmine: {
      tests: {
        src: [],  // not needed because each test uses require() to load what it is testing
        options: {
          specs: "build/tests/specs.js",
          outfile: "build/tests/_specRunner.html",
          summary: true,
          keepRunner: true
        }
      }
    },
    
    watch: {
      scripts: {
        files: ['src/**/*.js', 'tests/**/*.test.js', 'Gruntfile.js'],
        tasks: ['default'],
        options: {
          interrupt: true,
          event: 'all'
        }
      },
      tests: {
        files: ['src/**/*.js', 'tests/**/*.test.js', 'Gruntfile.js'],
        tasks: ['test'],
        options: {
          interrupt: true,
          event: 'all'
        }
      },
    },
    
    jsdoc : {
        dist : {
            src: ['README.md', 'package.json', 'src/*.js', 'test/*.js'],
            options: {
                destination: 'doc'
            }
        }
    }

  }); 


  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  // default do nothing
  grunt.registerTask('default', ['build', 'watch']);
  
  grunt.registerTask('test', ['build', 'clean:tests', 'webpack:specs', 'jasmine:tests']);
  grunt.registerTask('test-watch', ['test', 'watch:tests']);
  grunt.registerTask('build', ['clean:dist', 'clean:build', 'copy:src', 'webpack:lib']);
  
};
