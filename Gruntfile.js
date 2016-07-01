/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/


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
          'clocks' :
            ['./main.js']
        },
        output: {
          path: __dirname + "/dist",
          filename: "[name].js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'clocks',
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
          chunkFilename: "chunk-[name]-[chunkhash].js"
        },
        module: {
          loaders: []
        },
        resolve: {
          root: [ __dirname + "/tests/specs", __dirname + "/tests/util",  __dirname+"/build/lib" ]
        }
      }
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
      }
    }
    
  }); 


  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  

  // default do nothing
  grunt.registerTask('default', ['build', 'watch']);
  
  grunt.registerTask('test', ['build', 'clean:tests', 'webpack:specs', 'jasmine']);
  grunt.registerTask('build', ['clean:dist', 'clean:build', 'copy:src', 'webpack:lib']);
  
};
