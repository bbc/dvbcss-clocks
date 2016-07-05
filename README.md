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

Here is a quick walkthrough. First we import the modules:

    var DateNowClock    = require("clocks").DateNowClock;
    var Correlation     = require("clocks").Correlation;
    var CorrelatedClock = require("clocks").CorrelatedClock;

Now we create a simple hierarchy with one clock at the root and another one
based on it via a correlation:
    
    var sysClock = new clocks.DateNowClock({tickRate:1000000000, maxFreqErrorPpm:50});
    var wallClock = new clocks.CorrelatedClock({tickRate:1000000000});
    
    console.log("Wall clock time = "+wallClock.now());
    
Lets listen for events:

    wallClock.on("change", function() { console.log("Wallclock is notifying of a change")});
    wallClock.on("available", function() { console.log("Wallclock has become available")});
    wallClock.on("unavailable", function() { console.log("Wallclock has become unavailable")});

Lets change the correlation (this will generate a `change` event) so the wallClock is now at zero:

    # reset wall clock to zero now

    wallClock.correlation = new Correlation(sysClock.now(), 0);
    console.log("Wall clock time = "+wallClock.now());

Lets also make some other changes (this will generate a `change` event and availability change events):
    
    wallClock.speed = 2.0

    wallClock.availabilityFlag = false;
    wallClock.availabilityFlag = true;
    
Lets schedule some timer callbacks:

    # schedule a timer callback at wallclock time 123583693762
    wallClock.setAtTime(function() { console.log("Called at scheduled time of wallclock")}, 123583693762);
    
    # schedule a timer 1 second from now, then cancel it
    var handle = wallClock.setTimeout(function() { console.log("Called after timeout")}, 1000000000);
    wallClock.clearTimeout(handle);

There are many other methods not covered here. See the documentation.

## Authors

Matt Hammond (BBC R&D)

(c) 2016 British Broadcasting Corporation

