# Pure JS clocks library

**Work in progress. Code not yet tested at all**.

## Getting started

    $ npm install
    $ grunt
    
Resulting library is placed in `dist/clocks.js`

## Simple example

    var DateNowClock    = require("clocks").DateNowClock;
    var Correlation     = require("clocks").Correlation;
    var CorrelatedClock = require("clocks").CorrelatedClock;
    
    var sysClock = new clocks.DateNowClock({tickRate:1000000000, maxFreqErrorPpm:50});
    var wallClock = new clocks.CorrelatedClock({tickRate:1000000000});
    
    console.log("Wall clock time = "+wallClock.now());
    
    # reset wall clock to zero now

    wallClock.setCorrelation(new Correlation(sysClock.now(), 0));
    console.log("Wall clock time = "+wallClock.now());
    


## Authors

Matt Hammond (BBC R&D)

(c) 2016 British Broadcasting Corporation

