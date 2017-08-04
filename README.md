# JS objects to create hierarchies of clocks or timelines

[![Build status](https://travis-ci.org/bbc/dvbcss-clocks.svg?branch=master)](https://travis-ci.org/bbc/dvbcss-clocks)
[![API Doc](https://doclets.io/bbc/dvbcss-clocks/master.svg)](https://doclets.io/bbc/dvbcss-clocks/master)

**dvbcss-clocks** is a Javascript library of classes for representing clocks
and timelines and their relationships to each other. It can be used in event
driven real-time applications to drive and track the progress of time, such
as synchronised companion screen applications based on 
[DVB CSS](http://www.etsi.org/standards-search?search=103+286&page=1&title=1&keywords=1&ed=1&sortby=1)
or [HbbTV 2](http://hbbtv.org/resource-library/). 

This library is very similar to the clock objects in [pydvbcss](https://github.com/bbc/pydvbcss) and uses the same concepts and
overall model. There is a direct 1-to-1 correspondence of most classes and methods
between the two.

<img src="https://2immerse.eu/wp-content/uploads/2016/04/2-IMM_150x50.png" align="left"/><em>This project was originally developed as part of the <a href="https://2immerse.eu/">2-IMMERSE</a> project, co-funded by the European Commission’s <a hef="http://ec.europa.eu/programmes/horizon2020/">Horizon 2020</a> Research Programme</em>


## Getting started

### Use in your own project

Install via npm:

    $ npm install --save dvbcss-clocks

Or download or clone this repository and build:

    $ cd dvbcss-clocks 
    $ npm install
    

### Documentation

The full docs for the library [can be read online here](https://doclets.io/bbc/dvbcss-clocks/master/overview).

To build the docs yourself:

    $ grunt jsdoc

### Unit tests

Unit tests are written using the jasmine unit test framework.

    $ grunt test

## Quick overview

In this library, objects represent clocks that can be chained together into a
hierarchy and used to represent how one sense of time relates to another - e.g.
how a timeline for media playback relates to real world time.

First we import the modules:

    var CLOCKS = require("dvbcss-clocks")
    var DateNowClock    = CLOCKS.DateNowClock;
    var Correlation     = CLOCKS.Correlation;
    var CorrelatedClock = CLOCKS.CorrelatedClock;

A `DateNowClock` can be used as the root of the hierarchy and is a simple wrapper
around system time derived from `Date.now()`.

    var rootClock = new DateNowClock({tickRate:1000, maxFreqErrorPpm:50});

We can query the time position of this clock at any time:

    console.log(rootClock.now())

A hierarchy can then be built up using `CorrelatedClock` objects where a `correlation`
describes the relationship between that clock and its parent. For example, we
will create a "wall clock" that is derived from the system clock:

    var corr = new Correlation(5000, 0)
    var wallClock = new CorrelatedClock(rootClock, {
        tickRate: 50,
        correlation: corr
    })

This units for this clock are 50 ticks/second, and the correlation
means that when its parent clock (`rootClock`) is at time position 5000,
then this clock should be at time position 0.

If we query the position of this clock, we'll see that it is calculated from
its parent by extrapolating from that point of correlation and converting to
the different tick rate units. For example, executing this command several times:

    console.log(rootClock.now(), wallClock.now())

Can give results like this:

    > 5000, 0
    > 5200, 10
    > 5215, 10.75
    
Next we'll add another clock into the chain that is derived from the "wall clock"
and we will imagine it represents the timeline of a video player that is due to
start playing from time zero right now:

    var videoTimeline = new CorrelatedClock(wallClock, {
        tickRate: 25,
        correlation: new Correlation(wallClock.now(), 0)
    })
    
Lets listen for events:

    videoTimeline.on("change", function() { console.log("Video timeline is notifying of a change")});
    videoTimeline.on("available", function() { console.log("Video timeline has become available")});
    videoTimeline.on("unavailable", function() { console.log("Video timeline has become unavailable")});

Lets change the wall clock correlation. This will generate a `change` event on all clocks
that are descendents (as well as itself):

    # reset wall clock to zero now

    wallClock.correlation = new Correlation(rootClock.now(), 0);
    console.log("Wall clock time = "+wallClock.now());

Lets also make some other changes (this will generate a `change` event and availability change events):
    
    wallClock.speed = 2.0   // double the speed!

    wallClock.availabilityFlag = false;
    wallClock.availabilityFlag = true;
    
Lets schedule some timer callbacks:

    # schedule a timer callback so we know to stop the video at frame 500
    videoTimeline.setAtTime(function() { console.log("Time to stop video")}, 500);
    
Even if we make more changes to correlations this timer callback will only fire
when the video timeline reaches (or jumps past) time position 500.

There are many other methods not covered here. See the documentation.

Clocks can be built up into arbitrarily complex hierarchies and these can be reconfigured dynamically. There
are helper methods to provide easy conversion of time values between clocks. There are also ways to annotate
clocks with quantified uncertainty bounds (dispersions) and have these tracked by their descendants.


## Licence and Authors

All code and documentation is licensed by the original author and contributors under the Apache License v2.0:

* [British Broadcasting Corporation](http://www.bbc.co.uk/rd) (original author)
* [British Telecommunications (BT) PLC](http://www.bt.com/)

See AUTHORS file for a full list of individuals and organisations that have
contributed to this code.
.

## Contributing

If you wish to contribute to this project, please get in touch with the authors.


