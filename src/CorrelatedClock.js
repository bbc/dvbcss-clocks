/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var inherits = require('inherits');
var ClockBase = require('./ClockBase');
var Correlation = require('./Correlation');

var WeakMap = require('weak-map');
var PRIVATE = new WeakMap();


/**
 * @exports CorrelatedClock
 * @class CorrelatedClock
 * @extends ClockBase
 *
 * @classdesc
 * Clock based on a parent clock using a {@link Correlation}.
 * It is a subclass of {@link ClockBase}.
 *
 * <p>The correlation determines how the time of this clock is calculated from
 * the time of the parent clock.
 * The correlation represents a point where a given time of the parent equates
 * to a given time of this clock (the child clock).
 *
 * <p>In effect, the combination of all these factors can be though of as defining
 * a striaght line equation with the parent clock's time on the X-axis and this
 * clock's time on the Y-axis. The line passes through the point of correlation
 * and the slope is dictated by the tick rates of both clocks and the speed of
 * this clock.
 *
 * Speed and tick rate are then taken into account to extrapolate from that
 * point.
 *
 *
 *
 *
 * @constructor
 * @override
 * @param {ClockBase} parent The parent for this clock.
 * @param {object} [options] Options for this clock
 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
 * @param {Number} [options.speed] The speed for this clock.
 * @param {Correlation|object|Number[]} [options.correlation] Correlation for this clock as either as a Correlation object, or as an object with properties corresponding to the properties of a correlation, or as an array of values. See examples below
 * @default tickRate: 1000, speed: 1.0, correlation: Correlation(0,0,0,0)
 *
 * @example
 * root = new DateNowClock();
 *
 * // tickRate = 1000, correlation = (0,0)
 * c1 = new CorrelatedClock(root);
 *
 * // tickRate = 25, speed=2.0, correlation = (0,0)
 * c1 = new CorrelatedClock(root, {tickRate:25, speed:2.0});
 *
 * // tickRate = 1000, correlation = (10,500)
 * c2 = new CorrelatedClock(root, { correlation: new Correlation(10,500) });
 * c2 = new CorrelatedClock(root, { correlation: [10,500] });
 * c2 = new CorrelatedClock(root, { correlation: {parentTime:10,childTime:500} });
 */
var CorrelatedClock = function(parent, options) {
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

    if (options && (typeof options.speed !== "undefined")) {
        priv.speed = options.speed;
    } else {
        priv.speed = 1.0;
    }

    priv.parent = parent;

    if (options && (typeof options.correlation !== "undefined")) {
        priv.corr = new Correlation(options.correlation);
    } else {
        priv.corr = new Correlation(0,0,0,0);
    }

    priv.parentHandlers = {
        "change" : function(causeClock) {
            this.emit("change", this);
        }.bind(this),
        "available" : function(causeClock) {
            // propagate only if it has an effect. If this clock is unavailable anyway, then there is no effect.
            if (this.getAvailabilityFlag()) {
                this.emit("available", this);
            }
        }.bind(this),
        "unavailable" : function(causeClock) {
            // propagate only if it has an effect. If this clock is unavailable anyway, then there is no effect.
            if (this.getAvailabilityFlag()) {
                this.emit("unavailable", this);
            }
        }.bind(this)
    };

    priv.parent = null;
    this.setParent(parent);
};

inherits(CorrelatedClock, ClockBase);

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.now = function() {
    var priv = PRIVATE.get(this);
    var corr = priv.corr;

    return corr.childTime + (priv.parent.now() - corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
};

/**
 * @returns {String} A human readable summary of this clock object, including its [id]{@link CorrelatedClock#id} and its current properties
 * @example
 * > c=new CorrelatedClock(parent);
 * > c.toString()
 * 'CorrelatedClock(clock_0, {tickRate:1000, speed:1, correlation:[object Object]}) [clock_1]'
 */
CorrelatedClock.prototype.toString = function() {
    var priv = PRIVATE.get(this);
    var p;
    if (priv.parent) {
        p = priv.parent.id;
    } else {
        p = "<<no-parent>>";
    }
    return "CorrelatedClock("+p+", {tickRate:"+priv.freq+", speed:"+priv.speed+", correlation:"+priv.corr+"}) ["+this.id+"]";
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.getSpeed = function() {
    return PRIVATE.get(this).speed;
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.setSpeed = function(newSpeed) {
    var priv = PRIVATE.get(this);
    if (priv.speed != newSpeed) {
        priv.speed = newSpeed;
        this.emit("change", this);
    }
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.getTickRate = function() {
    return PRIVATE.get(this).freq;
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.setTickRate = function(newTickRate) {
    var priv = PRIVATE.get(this);

    if (priv.freq != newTickRate) {
        priv.freq = newTickRate;
        this.emit("change", this);
    }
};

CorrelatedClock.prototype.rebaseCorrelationAt = function(t) {
    var priv = PRIVATE.get(this);

    priv.corr = priv.corr.butWith({
        parentTime: this.toParentTime(t),
        childTime: t,
        initialError: this._errorAtTime(t)
    });
};

/**
 * @var {Correlation} correlation The correlation used by this clock to define its relationship to its parent.
 *
 * <p>Read this property to obtain the correlation currently being used.
 *
 * <p>Change the correlation by setting this property to a new one. Either assign a {@link Correlation} object, or an object containing
 * keys representing the properties of the correlation, or an Array containing the values for the correlation.
 *
 * <p>The underlying implementation fo this property uses the
 * [getCorrelation]{@link ClockBase#getCorrelation} and
 * [setCorrelation]{@link ClockBase#setCorrelation} methods.
 *
 * @memberof CorrelatedClock
 * @instance
 *
 * @example
 * clock = new CorrelatedClock(parentClock);
 * clock.correlation = new Correlation(1,2);
 * clock.correlation = [1,2];
 * clock.correlation = { parentTime:1, childTime:2 };
 * clock.correlation = clock.correlation.butWith({initialError:0.5, errorGrowthRate:0.1});
 */
Object.defineProperty(CorrelatedClock.prototype, "correlation", {
    get: function()  { return this.getCorrelation(); },
    set: function(v) { return this.setCorrelation(v); }
});

/**
 * Retrieve the correlation for this clock.
 * @returns {Correlation} correlation The correlation for this clock
 */
CorrelatedClock.prototype.getCorrelation = function() {
    return PRIVATE.get(this).corr;
};

/**
 * Set/change the correlation for this clock.
 * @param {Correlation} newCorrelation The new correlation for this clock
 */
CorrelatedClock.prototype.setCorrelation = function(newCorrelation) {
    PRIVATE.get(this).corr = new Correlation(newCorrelation);
    this.emit("change", this);
};

/**
 * Set/change the correlation and speed for this clock as a single operation.
 *
 * <p>Using this method instead of setting both separately only generates a single
 * "change" event notification.
 *
 * @param {Correlation} newCorrelation The new correlation for this clock
 * @param {Number} newSpeed The new speed for this clock
 */
CorrelatedClock.prototype.setCorrelationAndSpeed = function(newCorrelation, newSpeed) {
    var priv = PRIVATE.get(this);

    priv.corr = newCorrelation;
    priv.speed = newSpeed;
    this.emit("change",this);
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.calcWhen = function(t) {
    var priv = PRIVATE.get(this);

    return priv.parent.calcWhen(this.toParentTime(t));
};

/**
 * Convert time value of this clock to the equivalent time of its parent.
 *
 * <p>If this clock's speed is zero (meaning that it is paused) then if <tt>t</tt>
 * does not equal the current time of this clock, then <tt>NaN</tt> will be returned.
 * This is because there is no equivalent time of the parent clock.
 *
 * @param {Number} t Time value of this clock
 * @returns {Number} corresponding time of the parent clock or <tt>NaN</tt> if not possible when clock speed is zero.
 * @abstract
 */
CorrelatedClock.prototype.toParentTime = function(t) {
    var priv = PRIVATE.get(this);

    if (priv.speed === 0) {
        return (t === priv.corr.childTime) ? priv.corr.parentTime : NaN;
    } else {
        return priv.corr.parentTime + (t - priv.corr.childTime) * priv.parent.getTickRate() / priv.freq / priv.speed;
    }
};

/**
 * @inheritdoc
 */
ClockBase.prototype.fromParentTime = function(t) {
    var priv = PRIVATE.get(this);
    return priv.corr.childTime + (t - priv.corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.getParent = function() {
    return PRIVATE.get(this).parent;
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype.setParent = function(newParent) {
    var priv = PRIVATE.get(this);
    var event;

    if (priv.parent != newParent) {
        if (priv.parent) {
            for(event in priv.parentHandlers) {
                priv.parent.removeListener(event, priv.parentHandlers[event]);
            }
        }

        priv.parent = newParent;

        if (priv.parent) {
            for(event in priv.parentHandlers) {
                priv.parent.on(event, priv.parentHandlers[event]);
            }
        }

        this.emit("change", this);
    }
};

/**
 * Calculate the potential for difference in tick values of this clock if a
 * different correlation and speed were to be used.
 *
 * Changes where the new time would become greater return positive values.
 *
 * <p>If the new speed is different, even slightly, then this means that the
 * ticks reported by this clock will eventually differ by infinity,
 * and so the returned value will equal ±infinity. If the speed is unchanged
 * then the returned value reflects the difference between old and new correlations.
 *
 * @param {Correlation} newCorrelation A new correlation
 * @param {Number} newSpeed A new speed
 * @returns {Number} The potential difference in units of seconds. If speeds
 * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt> or <tt>Number.NEGATIVE_INFINITY</tt>
 */
CorrelatedClock.prototype.quantifySignedChange = function(newCorrelation, newSpeed) {
    var priv = PRIVATE.get(this);
    newCorrelation = new Correlation(newCorrelation);

    if (newSpeed != priv.speed) {
        return (newSpeed > priv.speed) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else {
        var nx = newCorrelation.parentTime;
        var nt = newCorrelation.childTime;
        if (newSpeed !== 0) {
            var ox = this.toParentTime(nt);
            return (nx-ox) / priv.parent.getTickRate();
        } else {
            var ot = this.fromParentTime(nx);
            return (nt-ot) / priv.freq;
        }
    }
};

/**
 * Calculate the absolute value of the potential for difference in tick values of this
 * clock if a different correlation and speed were to be used.
 *
 * <p>If the new speed is different, even slightly, then this means that the
 * ticks reported by this clock will eventually differ by infinity,
 * and so the returned value will equal +infinity. If the speed is unchanged
 * then the returned value reflects the difference between old and new correlations.
 *
 * @param {Correlation} newCorrelation A new correlation
 * @param {Number} newSpeed A new speed
 * @returns {Number} The potential difference in units of seconds. If speeds
 * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
 */
CorrelatedClock.prototype.quantifyChange = function(newCorrelation, newSpeed) {
    return Math.abs(this.quantifySignedChange(newCorrelation, newSpeed));
};

/**
 * Returns True if the potential for difference in tick values of this clock
 * (using a new correlation and speed) exceeds a specified threshold.
 *
 * <p>This is implemented by applying a threshold to the output of
 * [quantifyChange()]{@link CorrelatedClock#quantifyChange}.
 *
 * @param {Correlation} newCorrelation A new correlation
 * @param {Number} newSpeed A new speed
 * @returns {Boolean} True if the potential difference can/will eventually exceed the threshold.
 */
CorrelatedClock.prototype.isChangeSignificant = function(newCorrelation, newSpeed, thresholdSecs) {
    var delta = this.quantifyChange(newCorrelation, newSpeed);
    return delta > thresholdSecs;
};

/**
 * @inheritdoc
 */
CorrelatedClock.prototype._errorAtTime = function(t) {
    var priv = PRIVATE.get(this);

    var pt = this.toParentTime(t);
    var deltaSecs = Math.abs(pt - priv.corr.parentTime) / priv.parent.getTickRate();
    return priv.corr.initialError + deltaSecs * priv.corr.errorGrowthRate;
};

module.exports = CorrelatedClock;
