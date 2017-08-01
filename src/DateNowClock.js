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

var inherits = require('inherits');
var ClockBase = require('./ClockBase');
var measurePrecision = require('./measurePrecision');

var WeakMap = require('weak-map');
var PRIVATE = new WeakMap();

var DATENOW_PRECISION = measurePrecision(Date.now.bind(Date), 100) / 1000;

/**
 * @exports DateNowClock
 * @class DateNowClock
 * @extends ClockBase
 *
 * @classdesc
 * Root clock based on <tt>Date.now()</tt>.
 * It is a subclass of {@link ClockBase}.
 *
 * <p>This clock can be used as the root of a hierarchy of clocks. It uses
 * <tt>Date.now()</tt> as its underlying system clock. However this clock can
 * be set to have its own tick rate, independent of <tt>Date.now()</tt>.
 *
 * <p>The precision of Date.now() is meausred when the module containing this
 * class is first imported. The dispersion reported by this clock will always
 * equal the measurement precision.
 *
 * @constructor
 * @override
 * @param {object} [options] Options for this clock
 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
 * @param {Number} [options.maxFreqErrorPpm] The maximum frequency error of the underlying clock (in ppm).
 * @default tickRate: 1000, maxFreqErrorPpm: 50
 *
 * @example
 * // milliseconds (default)
 * root = new DateNowClock({tickRate: 1000000000 }); 
 *
 * // nanoseconds
 * root = new DateNowClock({tickRate: 1000000000 });
 *
 * // nanoseconds, lower freq error than default
 * root = new DateNowClock({tickRate: 1000000000, maxFreqErrorPpm: 10 }); 
 *
 * @abstract
 */
var DateNowClock = function(options) {
    ClockBase.call(this);
    
    PRIVATE.set(this, {});
    var priv = PRIVATE.get(this);

    if (options && (typeof options.tickRate !== "undefined")) {
        if (options.tickRate <= 0) {
            throw "Cannot have tickrate of zero or less";
        }
        priv.freq = options.tickRate;
    } else {
        priv.freq = 1000;
    }

    if (options && (typeof options.maxFreqErrorPpm !== "undefined")) {
        priv.maxFreqErrorPpm = options.maxFreqErrorPpm;
    } else {
        priv.maxFreqErrorPpm = 50;
    }
    
    priv.precision = DATENOW_PRECISION;
};

inherits(DateNowClock, ClockBase);

/**
 * @inheritdoc
 */
DateNowClock.prototype.now = function() {
    return Date.now() / 1000 * PRIVATE.get(this).freq;
};

/**
 * @inheritdoc
 */
DateNowClock.prototype.getTickRate = function() {
    return PRIVATE.get(this).freq;
};

/**
 * @inheritdoc
 */
DateNowClock.prototype.calcWhen = function(t) {
    return t / PRIVATE.get(this).freq * 1000;
};

/**
 * @returns {String} A human readable summary of this clock object, including its [id]{@link DateNowClock#id} and its current properties
 * @example
 * > c=new DateNowClock();
 * > c.toString()
 * 'DateNowClock({tickRate:1000, maxFreqErrorPpm:50}) [clock_0]'
 */
DateNowClock.prototype.toString = function() {
    var priv = PRIVATE.get(this);
    return "DateNowClock({tickRate:"+priv.freq+", maxFreqErrorPpm:"+priv.maxFreqErrorPpm+"}) ["+this.id+"]";
};

/**
 * @inheritdoc
 */
DateNowClock.prototype.toParentTime = function(t) {
    throw "Clock has no parent.";
};

/**
 * @inheritdoc
 */
DateNowClock.prototype.fromParentTime = function(t) {
    throw "Clock has no parent.";
};

/**
 * @inheritdoc
 */
DateNowClock.prototype.getParent = function() {
    return null;
};

/**
 * The parent of this clock is always <tt>null</tt> and cannot be changed.
 * @throws because this clock cannot have a parent.
 */
DateNowClock.prototype.setParent = function(newParent) {
    throw "Cannot set a parent for this clock.";
};

/**
 * This clock is always available, and so its [availabilityFlag]{@link DateNowClock#availabilityFlag} cannot be changed.
 * @throws because this clock cannot have its availabilty changed.
 */
DateNowClock.prototype.setAvailabilityFlag = function(availability) {
    if (!availability) {
        throw "Cannot change availability of this clock.";
    }
};

/**
 * @inheritdoc
 */
DateNowClock.prototype._errorAtTime = function(t) {
    return PRIVATE.get(this).precision;
};

/**
 * @inheritdoc
 */
DateNowClock.prototype.getRootMaxFreqError = function() {
    return PRIVATE.get(this).maxFreqErrorPpm;
};

module.exports = DateNowClock;
