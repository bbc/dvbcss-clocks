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
var ClockBase = require('ClockBase');
var Correlation = require('Correlation');

var WeakMap = require('weakmap');
var PRIVATE = new WeakMap();



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

CorrelatedClock.prototype.now = function() {
    var priv = PRIVATE.get(this);
    var corr = priv.corr;
    
    return corr.childTime + (priv.parent.now() - corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
};

CorrelatedClock.prototype.toString = function() {
    var priv = PRIVATE.get(this);
    if (priv.parent) {
        var p = priv.parent.id;
    } else {
        var p = "<<no-parent>>";
    }
    return "CorrelatedClock("+p+", {tickRate:"+priv.freq+", speed:"+priv.speed+", correlation:"+priv.corr+"}) ["+this.id+"]"
};

CorrelatedClock.prototype.getSpeed = function() {
    return PRIVATE.get(this).speed;
};

CorrelatedClock.prototype.setSpeed = function(newSpeed) {
    var priv = PRIVATE.get(this);
    if (priv.speed != newSpeed) {
        priv.speed = newSpeed;
        this.emit("change", this);
    }
};

CorrelatedClock.prototype.getTickRate = function() {
    return PRIVATE.get(this).freq;
};

CorrelatedClock.prototype.setTickRate = function(newTickRate) {
    var priv = PRIVATE.get(this);
    
    if (priv.freq != newTickRate) {
        priv.freq = newTickRate;
        this.emit("change", this);
    };
};

CorrelatedClock.prototype.rebaseCorrelationAt = function(t) {
    var priv = PRIVATE.get(this);

    priv.corr = priv.corr.butWith({
        parentTime: this.toParentTime(t),
        childTime: t,
        initialError: this._errorAtTime(t)
    });
};

Object.defineProperty(CorrelatedClock.prototype, "correlation", {
    get: function()  { return this.getCorrelation(); },
    set: function(v) { return this.setCorrelation(v); }
});


CorrelatedClock.prototype.getCorrelation = function() {
    return PRIVATE.get(this).corr;
};

CorrelatedClock.prototype.setCorrelation = function(newCorrelation) {
    PRIVATE.get(this).corr = new Correlation(newCorrelation);
    this.emit("change", this);
};

CorrelatedClock.prototype.setCorrelationAndSpeed = function(newCorrelation, newSpeed) {
    var priv = PRIVATE.get(this);
    
    priv.corr = newCorrelation;
    priv.speed = newSpeed;
    this.emit("change",this);
};

CorrelatedClock.prototype.calcWhen = function(t) {
    var priv = PRIVATE.get(this);
    
    if (priv.speed == 0) {
        var refTime = priv.corr.parentTime;
    } else {
        var refTime = priv.corr.parentTime + (t - priv.corr.childTime) * priv.parent.getTickRate() / priv.freq / priv.speed;
    }
    return priv.parent.calcWhen(refTime);
};

CorrelatedClock.prototype.toParentTime = function(t) {
    var priv = PRIVATE.get(this);
    
    if (priv.speed == 0) {
        return priv.corr.parentTime;
    } else {
        return priv.corr.parentTime + (t - priv.corr.childTime) * priv.parent.getTickRate() / priv.freq / priv.speed;
    }
};

ClockBase.prototype.fromParentTime = function(t) {
    var priv = PRIVATE.get(this);
    return priv.corr.childTime + (t - priv.corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
};

CorrelatedClock.prototype.getParent = function() {
    return PRIVATE.get(this).parent;
};

CorrelatedClock.prototype.setParent = function(newParent) {
    var priv = PRIVATE.get(this);
    
    if (priv.parent != newParent) {
        if (priv.parent) {
            for(event in priv.parentHandlers) {
                priv.parent.off(event, priv.parentHandlers[event]);
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

CorrelatedClock.prototype.quantifyChange = function(newCorrelation, newSpeed) {
    var priv = PRIVATE.get(this);
    var newCorrelation = new Correlation(newCorrelation);

    if (newSpeed != priv.speed) {
        return Number.POSITIVE_INFINITY;
    } else {
        var nx = newCorrelation.parentTime;
        var nt = newCorrelation.childTime;
        if (newSpeed != 0) {
            var ox = this.toParentTime(nt);
            return Math.abs(nx-ox) / priv.parent.getTickRate();
        } else {
            var ot = this.fromParentTime(nx);
            return Math.abs(nt-ot) / priv.freq;
        }
    }
};

CorrelatedClock.prototype.isChangeSignificant = function(newCorrelation, newSpeed, thresholdSecs) {
    var delta = this.quantifyChange(newCorrelation, newSpeed);
    return delta > thresholdSecs;
};

CorrelatedClock.prototype._errorAtTime = function(t) {
    var priv = PRIVATE.get(this);

    var pt = this.toParentTime(t);
    var deltaSecs = (pt - priv.corr.parentTime) / priv.parent.getTickRate();
    return priv.corr.initialError + deltaSecs * priv.corr.errorGrowthRate;
};

module.exports = CorrelatedClock;
