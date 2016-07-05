# Pure JS clocks library

An implementation of software "clock" objects in JS. Very similar to that
done for [pydvbcss](https://github.com/bbc/pydvbcss).

## Getting started

    $ npm install
    $ grunt
    
Resulting library is placed in `dist/clocks.js`

## Documentation

JSDoc documentation can be built:

    $ grunt jsdoc

Documentation is generated and output as HTML into the `doc` subfolder.
    
## Unit tests

Unit tests are written using the jasmine unit test framework.

    $ grunt test

## Simple example

    var DateNowClock    = require("clocks").DateNowClock;
    var Correlation     = require("clocks").Correlation;
    var CorrelatedClock = require("clocks").CorrelatedClock;
    
    var sysClock = new clocks.DateNowClock({tickRate:1000000000, maxFreqErrorPpm:50});
    var wallClock = new clocks.CorrelatedClock({tickRate:1000000000});
    
    console.log("Wall clock time = "+wallClock.now());
    
    # reset wall clock to zero now

    wallClock.correlation = new Correlation(sysClock.now(), 0);
    console.log("Wall clock time = "+wallClock.now());
    


## Authors

Matt Hammond (BBC R&D)

(c) 2016 British Broadcasting Corporation

