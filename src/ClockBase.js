/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var EventEmitter = require("events");
var inherits = require('inherits');

var WeakMap = require('weakmap');
var PRIVATE = new WeakMap();

var nextIdNum = 0;
var nextTimeoutHandle = 0;


/**
 * @exports ClockBase
 * @class ClockBase
 *
 * @classdesc
 * Base class for clock implementations
 *
 * <p>This is the base class on which other clocks are implemented. It provides
 * the basic framework of properties, getter and setters for common properties
 * such as availability, speed, tick rate and parents, and provides the basic
 * events framework, some standard helper methods for time conversion between clocks, comparisons
 * between clocks and calculating disperison (error/uncertainty).
 * 
 * <p>Clock implementations should inherit from this class and implement some
 * or all of the following method stubs:
 * <ul>
 *   <li> [now()]{@link ClockBase#now}
 *   <li> [calcWhen()]{@link ClockBase#calcWhen}
 *   <li> [getTickRate()]{@link ClockBase#getTickRate}
 *   <li> [setTickRate()]{@link ClockBase#setTickRate}
 *   <li> [getSpeed()]{@link ClockBase#getSpeed}
 *   <li> [setSpeed()]{@link ClockBase#setSpeed}
 *   <li> [getParent()]{@link ClockBase#getParent}
 *   <li> [setParent()]{@link ClockBase#setParent}
 *   <li> [toParentTime()]{@link ClockBase#toParentTime}
 *   <li> [fromParentTime()]{@link ClockBase#fromParentTime}
 *   <li> [_errorAtTime()]{@link ClockBase#_errorAtTime}
 * </ul>
 *
 * @constructor
 * @abstract
 */
var ClockBase = function() {
    EventEmitter.call(this);
    
    PRIVATE.set(this, {});
    var priv = PRIVATE.get(this);

    this._availability = true;
    this.id = "clock_"+nextIdNum;
    nextIdNum = nextIdNum+1;
    
    priv.timerHandles = {};
    this.on('change', this._rescheduleTimers.bind(this));
};

inherits(ClockBase, EventEmitter);

/**
 * @returns the current time value of this clock in units of ticks of the clock.
 * @abstract
 */
ClockBase.prototype.now = function() {
    throw "Unimplemented";
};

/**
 * @var {Number} speed The speed at which this clock is running.
 * 1.0 = normal. 0.0 = pause. negative values mean it ticks in reverse.
 *
 * <p>The underlying implementation of this property uses the
 * [getSpeed]{@link ClockBase#getSpeed} and
 * [setSpeed]{@link ClockBase#setSpeed} methods.
 * @default 1.0
 * @memberof ClockBase
 * @instance
 */
Object.defineProperty(ClockBase.prototype, "speed", {
    get: function() { return this.getSpeed(); },
    set: function(v) { return this.setSpeed(v); },
})

/**
 * @var {Number} tickRate The rate of this clock (in ticks per second).
 *
 * <p>The underlying implementation of this property uses the
 * [getTickRate]{@link ClockBase#getTickRate} and
 * [setTickRate]{@link ClockBase#setTickRate} methods.
 *
 * @memberof ClockBase
 * @instance
 */
Object.defineProperty(ClockBase.prototype, "tickRate", {
    get: function() { return this.getTickRate(); },
    set: function(v) { return this.setTickRate(v); },
})

/**
 * @var {ClockBase} parent The parent of this clock, or <tt>null</tt> if it has no parent.
 *
 * <p>The underlying implementation of this property uses the
 * [getParent]{@link ClockBase#getParent} and
 * [setParent]{@link ClockBase#setParent} methods.
 *
 * @memberof ClockBase
 * @instance
 */
Object.defineProperty(ClockBase.prototype, "parent", {
    get: function() { return this.getParent(); },
    set: function(v) { return this.setParent(v); },
})

/**
 * @var {Boolean} availabilityFlag The availability flag for this clock.
 *
 * <p>This is only the flag for this clock. Its availability may also be affected
 * by the flags on its parents. To determine true availability, call the
 * [isAvailable]{@link ClockBase#isAvailable} method.
 *
 * <p>The underlying implementation of this property uses the
 * [getAvailabilityFlag]{@link ClockBase#getAvailabilityFlag} and
 * [setAvailabilityFlag]{@link ClockBase#setAvailabilityFlag} methods.
 *
* @default true
 * @memberof ClockBase
 * @instance
 */
Object.defineProperty(ClockBase.prototype, "availabilityFlag", {
    get: function() { return this.getAvailabilityFlag(); },
    set: function(v) { return this.setAvailabilityFlag(v); },
})

/**
 * Returns the current speed of this clock.
 * @returns {Number} Speed of this clock.
 * @abstract
 */
ClockBase.prototype.getSpeed = function() {
    return 1.0;
};

/**
 * Sets the current speed of this clock, or throws an exception if this is not possible
 * @param {Number} newSpeed The new speed for this clock.
 * @abstract
 */
ClockBase.prototype.setSpeed = function(newSpeed) {
    throw "Unimplemented";
};

/**
 * Calculates the effective speed of this clock, taking into account the effects
 * of the speed settings for all of its parents.
 * @returns {Number} the effective speed.
 */
ClockBase.prototype.getEffectiveSpeed = function() {
    var s = 1.0;
    var clock = this;
    while (clock !== null) {
        s = s * clock.getSpeed();
        clock = clock.getParent();
    }
    return s;
};

/**
 * Returns the current tick rate of this clock.
 * @returns {Number} Tick rate in ticks/second.
 * @abstract
 */
ClockBase.prototype.getTickRate = function() {
    throw "Unimplemented";
};

/**
 * Sets the current tick rate of this clock, or throws an exception if this is not possible.
 * @param {Number} newRate New tick rate in ticks/second.
 * @abstract
 */
ClockBase.prototype.setTickRate = function(newRate) {
    throw "Unimplemented";
};

/**
 * Return the current time of this clock but converted to units of nanoseconds, instead of the normal units of the tick rate.
 * @returns {Number} current time of this clock in nanoseconds.
 */
ClockBase.prototype.getNanos = function() {
    return this.now() * 1000000000 / this.getTickRate();
};

/**
 * Convert a timevalue from nanoseconds to the units of this clock, given its current [tickRate]{@link ClockBase#tickRate}
 * @param {Number} time in nanoseconds.
 * @returns {Number} the supplied time converted to units of its tick rate.
 */
ClockBase.prototype.fromNanos = function(nanos) {
    return nanos * this.getTickRate() / 1000000000;
};

/**
 * Is this clock currently available? Given its availability flag and the availability of its parents.
 * @returns {Boolean} True if this clock is available, and all its parents are available; otherwise false.
 */
ClockBase.prototype.isAvailable = function() {
    var parent = this.getParent();
    return this._availability && (!parent || parent.isAvailable());
};

/**
 * Sets the availability flag for this clock.
 * 
 * <p>This is only the flag for this clock. Its availability may also be affected
 * by the flags on its parents. To determine true availability, call the
 * [isAvailable]{@link ClockBase#isAvailable} method.
 *
 * @param {Boolean} availability The availability flag for this clock
 */
ClockBase.prototype.setAvailabilityFlag = function(availability) {
    var isChange = (this._availability && !availability) || (!(this._availability) && availability);
    var parent = this.getParent();
    if (parent) {
        isChange = isChange && parent.isAvailable();
    }
    
    this._availability = availability;
    
    if (isChange) {
        if (availability) {
            this.emit("available", this);
        } else {
            this.emit("unavailable", this);
        }
        this.emit("change", this);
    }
};

/**
 * Returns the availability flag for this clock (without taking into account whether its parents are available).
 * 
 * <p>This is only the flag for this clock. Its availability may also be affected
 * by the flags on its parents. To determine true availability, call the
 * [isAvailable]{@link ClockBase#isAvailable} method.
 *
 * @returns {Boolean} The availability flag of this clock
 */
ClockBase.prototype.getAvailabilityFlag = function() {
    return this._availability;
};

/**
 * Convert a time value for this clock into a time value corresponding to teh underlying system time source being used by the root clock.
 *
 * <p>For example: if this clock is part of a hierarchy, where the root clock of the hierarchy is a [DateNowClock]{@link DateNowClock} then
 * this method converts the supplied time to be in the same units as <tt>Date.now()</tt>.
 *
 * @param {Number} ticksWhen Time value of this clock.
 * @return {Number} The corresponding time value in the units of the underlying system clock that is being used by the root clock
 * @abstract
 */
ClockBase.prototype.calcWhen = function(ticksWhen) {
    throw "Unimplemented";
};

/**
 * Return the root clock for the hierarchy that this clock is part of.
 *
 * <p>If this clock is the root clock (it has no parent), then it will return itself.
 * 
 * @return {ClockBase} The root clock of the hierarchy
 */
ClockBase.prototype.getRoot = function() {
    var p = this;
    var p2 = p.getParent();
    while (p2) {
        p=p2;
        p2=p.getParent();
    }
    return p;
};

/**
 * Convert a time for the root clock to a time for this clock.
 * @param {Number} t A time value of the root clock.
 * @returns {Number} The corresponding time value for this clock.
 */
ClockBase.prototype.fromRootTime = function(t) {
    var p = this.getParent();
    if (!p) {
        return t;
    } else {
        var x = p.fromRootTime(t);
        return this.fromParentTime(x);
    }
};

/**
 * Convert a time for this clock to a time for the root clock.
 * @param {Number} t A time value for this clock.
 * @returns {Number} The corresponding time value of the root clock.
 */
ClockBase.prototype.toRootTime = function(t) {
    var p = this.getParent();
    if (!p) {
        return t;
    } else {
        var x = this.toParentTime(t);
        return p.toRootTime(x);
    }
};

/**
 * Convert a time value for this clock to a time value for any other clock in the same hierarchy as this one.
 * @param {ClockBase} otherClock The clock to convert the value value to.
 * @param {Number} t Time value of this clock.
 * @returns {Number} The corresponding time value for the specified <tt>otherClock</tt>
 * @throws if this clock is not part of the same hierarchy as the other clock.
 */
ClockBase.prototype.toOtherClockTime = function(otherClock, t) {
    var selfAncestry = this.getAncestry();
    var otherAncestry = otherClock.getAncestry();
    var clock;
    
    var common = false;
    while (selfAncestry.length && otherAncestry.length && selfAncestry[selfAncestry.length-1] === otherAncestry[otherAncestry.length-1]) {
        selfAncestry.pop();
        otherAncestry.pop();
        common=true;
    }
    
    if (!common) {
        throw "No common ancestor clock.";
    }
    
    selfAncestry.forEach(function(clock) {
        t = clock.toParentTime(t);
    });
    
    otherAncestry.reverse();
    
    otherAncestry.forEach(function(clock) {
        t = clock.fromParentTime(t);
    });
    
    return t;
};

/**
 * Get an array of the clocks that are the parents and ancestors of this clock.
 * @returns {ClockBase[]} an array starting with this clock and ending with the root clock.
 */
ClockBase.prototype.getAncestry = function() {
    var ancestry = [this];
    var c = this;
    while (c) {
        var p = c.getParent();
        if (p) {
            ancestry.push(p);
        }
        c=p;
    }
    return ancestry;
};

/**
 * Convert time value of this clock to the equivalent time of its parent.
 * @param {Number} t Time value of this clock
 * @returns {Number} corresponding time of the parent clock.
 * @abstract
 */
ClockBase.prototype.toParentTime = function(t) {
    throw "Unimplemented";
};

/**
 * Convert time value of this clock's parent to the equivalent time of this clock.
 * @param {Number} t Time value of this clock's parent
 * @returns {Number} corresponding time of this clock.
 * @abstract
 */
ClockBase.prototype.fromParentTime = function(t) {
    throw "Unimplemented";
};

/**
 * Returns the parent of this clock, or <tt>null</tt> if it has no parent.
 * @returns {ClockBase} parent clock, or <tt>null</tt>
 * @abstract
 */
ClockBase.prototype.getParent = function() {
    throw "Unimplemented";
};

/**
 * Set/change the parent of this clock.
 * @param {ClockBase} parent clock, or <tt>null</tt>
 * @throws if it is not allowed to set this clock's parent.
 * @abstract
 */
ClockBase.prototype.setParent = function(newParent) {
    throw "Unimplemented";
};

/**
 * Calculate the potential for difference between this clock and another clock.
 * @param {ClockBase} otherClock The clock to compare with.
 * @returns {Number} The potential difference in units of seconds. If effective speeds or tick rates differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
 *
 * If the clocks differ in effective speed or tick rate, even slightly, then
 * this means that the clocks will eventually diverge to infinity, and so the
 * returned difference will equal +infinity.
 *
 * If the clocks do not differ in effective speed or tick rate, then there will
 * be a constant time difference between them. This is what is returned.
 */
ClockBase.prototype.clockDiff = function(otherClock) {
    var thisSpeed = this.getEffectiveSpeed();
    var otherSpeed = otherClock.getEffectiveSpeed();
    
    if (thisSpeed !== otherSpeed) {
        return Number.POSITIVE_INFINITY;
    } else if (this.getTickRate() !== otherClock.getTickRate()) {
        return Number.POSITIVE_INFINITY;
    } else {
        var root = this.getRoot();
        var t = root.now();
        var t1 = this.fromRootTime(t);
        var t2 = otherClock.fromRootTime(t);
        return Math.abs(t1-t2) / this.getTickRate();
    }
};

/**
 * Calculates the dispersion (maximum error bounds) at the specified clock time.
 * This takes into account the contribution to error of this clock and its ancestors.
 * @param {Number} t The time position of this clock for which the dispersion is to be calculated.
 * @returns {Number} Dispersion (in seconds) at the specified clock time.
 */
 ClockBase.prototype.dispersionAtTime = function(t) {
    var disp = this._errorAtTime(t);
    
    var p = this.getParent();
    if (p) {
        var pt = this.toParentTime(t);
        disp += p.dispersionAtTime(pt);
    }
    
    return disp;
};

/**
 * Calculates the error/uncertainty contribution of this clock at a given time position.
 * 
 * <p>It is not intended that this function is called directly. Instead, call
 * [dispersionAtTime()]{@link ClockBase.dispersionAtTime} which uses this function
 * as part of calculating the total dispersion.
 *
 * @param {Number} t A time position of this clock 
 * @returns {Number} the potential for error (in seconds) arising from this clock
 * at a given time of this clock. Does not include the contribution of
 * any parent clocks.
 *
 * @abstract
 */
ClockBase.prototype._errorAtTime = function(t) {
    throw "Unimplemented";
};

/**
 * Retrieve the maximium frequency error (in ppm) of the root clock in the hierarchy. 
 *
 * <p>This method contains an implementation for non-root clocks only. It must
 * be overriden for root clock implementations.
 *
 * @returns {Number} The maximum frequency error of the root clock (in parts per million)
 * @abstract
 */
ClockBase.prototype.getRootMaxFreqError = function() {
    var root = this.getRoot();
    if (root === this) {
        throw "Unimplemented";
    } else {
        return root.getRootMaxFreqError();
    }
};


/**
 * A callback that is called when using [setTimeout]{@link ClockBase#setTimeout} or [setTimeoutAbs][@link ClockBase#setTimeoutAbs].
 *
 * @callback setTimeoutCallback
 * @param {...*} args The parameters that were passed when the callback was scheduled.
 * @this The {@link ClockBase} object that the timer was scheduled with.
 */

/**
 * Request a timeout callback when the time of this clock passes the current time plus
 * the number of specified ticks.
 * @param {setTimeoutCallback} func  The function to callback
 * @param {Number} ticks  The callback is triggered when the clock passes (reaches or jumps past) this number of ticks beyond the current time.
 * @param {...*} args Other arguments are passed to the callback
 * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
 */
ClockBase.prototype.setTimeout = function(func, ticks) {
	arguments[1] = arguments[1] + this.now()
	return this.setTimeoutAbs.apply(this, arguments)
}

/**
 * Request a timeout callback when the time of this clock passes the specified time.
 * @param {setTimeoutCallBack} func  The function to callback
 * @param {Number} when  The callback is triggered when the clock passes (reaches or jumps past) this time.
 * @param {...*} args Other arguments are passed to the callback
 * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
 */
ClockBase.prototype.setTimeoutAbs = function(func, when) {
    var priv = PRIVATE.get(this);
    
	var self = this;
	var handle = self.id + ":timeout-" + nextTimeoutHandle++;
	var root = self.getRoot();

	if (root == null) {
		root = self;
	}

    // remove first two args
    var args = new Array(arguments.length-2);
    for(var i=2; i<arguments.length; i++) {
        args[i-2] = arguments[i];
    }

	var callback = function() {
		delete priv.timerHandles[handle];
		func.apply(self, args);
	}
;
	var numRootTicks = self.toRootTime(when) - root.now()
	var millis = numRootTicks * (1000 / root.getTickRate());
	var realHandle = setTimeout(callback, millis);

	priv.timerHandles[handle] = { realHandle:realHandle, when:when, callback:callback };

	return handle;
}


ClockBase.prototype._rescheduleTimers = function() {
	// clock timing has changed, we need to re-schedule all timers
    var priv = PRIVATE.get(this);

	var root = this.getRoot();

	for(var handle in priv.timerHandles) {
		if (priv.timerHandles.hasOwnProperty(handle)) {
			var d = priv.timerHandles[handle];

			// clear existing timer
			clearTimeout(d.realHandle);

			// re-calculate when this timer is due and re-schedule
			var numRootTicks = this.toRootTime(d.when) - root.now();
			var millis = numRootTicks * (1000 / root.getTickRate());
			d.realHandle = setTimeout(d.callback, Math.max(0,millis));
		}
	}
}

/**
 * Clear (cancel) a timer that was scheduled using [setTimeout]{@link ClockBase#setTimeout} or [setTimeoutAbs][@link ClockBase#setTimeoutAbs].
 *
 * @param handle - The handle for the previously scheduled callback.
 *
 * If the handle does not represent a callback that was scheduled against this clock, then this method returns without doing anything.
 */
ClockBase.prototype.clearTimeout = function(handle) {
    var priv = PRIVATE.get(this);

	var d = priv.timerHandles[handle]
	if (d !== undefined) {
		clearTimeout(d.realHandle)
		delete priv.timerHandles[handle]
	}
}




module.exports = ClockBase;
