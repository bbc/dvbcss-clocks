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

var nextIdNum = 0;


var ClockBase = function() {
    EventEmitter.call(this);
    
    this._availability = true;
    this.id = "clock_"+nextIdNum;
    nextIdNum = nextIdNum+1;
};

inherits(ClockBase, EventEmitter);

ClockBase.prototype.now = function() {
    throw "Unimplemented";
};

ClockBase.prototype.getSpeed = function() {
    return 1.0;
};

ClockBase.prototype.setSpeed = function(newSpeed) {
    throw "Unimplemented";
};

ClockBase.prototype.getEffectiveSpeed = function() {
    var s = 1.0;
    var clock = this;
    while (clock !== null) {
        s = s * clock.getSpeed();
        clock = clock.getParent();
    }
    return s;
};

ClockBase.prototype.getTickRate = function() {
    throw "Unimplemented";
};

ClockBase.prototype.setTickRate = function(newRate) {
    throw "Unimplemented";
};

ClockBase.prototype.getNanos = function() {
    return this.now() * 1000000000 / this.getTickRate();
};

ClockBase.prototype.fromNanos = function(nanos) {
    return nanos * this.getTickRate() / 1000000000;
};

ClockBase.prototype.isAvailable = function() {
    var parent = this.getParent();
    return this._availability && (!parent || parent.isAvailable());
};

ClockBase.prototype.setAvailability = function(availability) {
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

ClockBase.prototype.getAvailabilityFlag = function() {
    return this._availability;
};

ClockBase.prototype.calcWhen = function(ticksWhen) {
    throw "Unimplemented";
};

ClockBase.prototype.getRoot = function() {
    var p = this;
    var p2 = p.getParent();
    while (p2) {
        p=p2;
        p2=p.getParent();
    }
    return p;
};

ClockBase.prototype.fromRootTime = function(t) {
    var p = this.getParent();
    if (!p) {
        return t;
    } else {
        var x = p.fromRootTime(t);
        return this.fromParentTime(x);
    }
};

ClockBase.prototype.toRootTime = function(t) {
    var p = this.getParent();
    if (!p) {
        return t;
    } else {
        var x = this.toParentTime(t);
        return p.toRootTime(x);
    }
};

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

ClockBase.prototype.toParentTime = function(t) {
    throw "Unimplemented";
};

ClockBase.prototype.fromParentTime = function(t) {
    throw "Unimplemented";
};

ClockBase.prototype.getParent = function() {
    throw "Unimplemented";
};

ClockBase.prototype.clockDiff = function(otherClock) {
    var thisSpeed = this.getEffectiveSpeed();
    var otherSpeed = otherClock.getEffectiveSpeed();
    
    if (thisSpeed !== otherSpeed) {
        return Number.POSITIVE_INFINITY;
    } else if (this.getTickrate() !== other.getTickRate()) {
        return Number.POSITIVE_INFINITY;
    } else {
        var root = this.getRoot();
        var t = root.now();
        var t1 = this.fromRootTime(t);
        var t2 = otherClock.fromRootTime(t);
        return Math.abs(t1-t2) / this.getTickRate();
    }
};

ClockBase.prototype.dispersionAtTime = function(t) {
    var disp = this._errorAtTime(t);
    
    var p = this.getParent();
    if (p) {
        var pt = this.toParentTime(t);
        disp += p.dispersionAtTime(pt);
    }
    
    return disp;
};

ClockBase.prototype._errorAtTime = function(t) {
    throw "Unimplemented";
};

ClockBase.getRootMaxFreqError = function() {
    var root = this.getRoot();
    if (root === this) {
        throw "Unimplemented";
    } else {
        return root.getRootMaxFreqError();
    }
};

module.exports = ClockBase;
