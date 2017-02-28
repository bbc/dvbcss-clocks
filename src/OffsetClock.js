/****************************************************************************
 * Copyright 2016 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/
 
var inherits = require('inherits');
var ClockBase = require('./ClockBase');

var WeakMap = require('weak-map');
var PRIVATE = new WeakMap();


/**
 * @exports OffsetClock
 * @class OffsetClock
 * @extends ClockBase
 *
 * @classdesc
 * A clock that applies an offset such that reading it is the same as
 * reading its parent, but as if the current time is slightly offset by an
 * amount ahead (+ve offset) or behind (-ve offset). 
 * It is a subclass of {@link ClockBase}.
 * 
 * <p><tt>OffsetClock</tt> inherits the tick rate of its parent. Its speed is
 * always 1. It takes the effective speed into account when applying the offset,
 * so it should always represent the same amount of time according to the root
 * clock. In practice this means it will be a constant offset amount of real-world
 * time.
 * 
 * <p>This can be used to compensate for rendering delays. If it takes N seconds
 * to render some content and display it, then a positive offset of N seconds
 * will mean that the rendering code thinks time is N seconds ahead of where
 * it is. It will then render the correct content that is needed to be displayed
 * in N seconds time.
 * 
 * <p>For example: A correlated clock (the "media clock") represents the time
 * position a video player needs to currently be at.
 * 
 * <p>The video player has a 40 milisecond (0.040 second) delay between when it renders a frame and the light being emitted by the display. We therefore need the
 * video player to render 40 milliseconds in advance of when the frame is
 * to be displayed. An :class:`OffsetClock` is used to offset time in this
 * way and is passed to the video player:
 * 
 * <pre class="prettyprint"><code>
 * mediaClock = new CorrelatedClock(...);
 *     
 * PLAYER_DELAY_SECS = 40;
 * oClock = new OffsetClock(mediaClock, {offset:PLAYER_DELAY_SECS});
 *     
 * videoPlayer.syncToClock(oClock);
 * </code></pre>
 *     
 * <p>If needed, the offset can be altered at runtime, by setting the :data:`offset`
 * property. For example, perhaps it needs to be changed to a 50 millisecond offset:
 * 
 * <pre class="prettyprint"><code>
 * oClock.offset = 50;
 * </code></pre>
 * 
 * <p>Both positive and negative offsets can be used. 
 */
var OffsetClock = function(parent, options) {
    ClockBase.call(this);
    
    PRIVATE.set(this, {});
    var priv = PRIVATE.get(this);

    if (options && (typeof options.offset !== "undefined")) {
        if (typeof options.offset === "number") {
            priv.offset = options.offset;
        } else {
            throw "'offset' option must be a number (in milliseconds)";
        }
    } else {
        priv.offset = 0;
    }
    
    priv.parent = parent;
    
    priv.parentHandlers = {
        "change" : function(causeClock) {
            this.emit("change", this);
        }.bind(this),
        "available" : this.notifyAvailabilityChange.bind(this),
        "unavailable" : this.notifyAvailabilityChange.bind(this),
    };

    priv.parent = null;
    this.setParent(parent);    
};

inherits(OffsetClock, ClockBase);

/**
 * @inheritdoc
 */
OffsetClock.prototype.now = function() {
    var priv = PRIVATE.get(this);
    
    return priv.parent.now() + priv.offset * this.getEffectiveSpeed() * priv.parent.tickRate / 1000;
};

/**
 * @returns {String} A human readable summary of this clock object, including its current properties
 * @example
 * > c=new Offset(parent, {offset:20});
 * > c.toString()
 * 'OffsetClock(clock_0, {offset:20}) [clock_1]'
 */
OffsetClock.prototype.toString = function() {
    var priv = PRIVATE.get(this);
    var p;
    if (priv.parent) {
        p = priv.parent.id;
    } else {
        p = "<<no-parent>>";
    }
    return "OffsetClock("+p+", {offset:"+priv.offset+"}) ["+this.id+"]";
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.getSpeed = function() {
    return 1;
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.setSpeed = function(newSpeed) {
    throw "Cannot change the speed of this clock.";
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.getTickRate = function() {
    return PRIVATE.get(this).parent.tickRate;
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.setTickRate = function(newTickRate) {
    throw "Cannot change the tick rate of this clock.";
};

/**
 * @var {Number} offset The amount by which this clock should be in advance, in milliseconds in terms of elapsed root clock time.
 *
 * <p>The underlying implementation of this property uses the
 * [getOffset]{@link OffsetClock#getOffset} and
 * [setOffset]{@link OffsetClock#setOffset} methods.
 * @default 1.0
 * @memberof OffsetClock
 * @instance
 * @fires change
 */
Object.defineProperty(OffsetClock.prototype, "offset", {
    get: function() { return this.getOffset(); },
    set: function(millis) { return this.setOffset(millis); },
});

/**
 * Read the number of milliseconds by which this clock is ahead (the offset).
 *
 * The offset is in terms of elapsed root clock time, not elapsed time of
 * the parent.
 *
 * @return {Number} The number of milliseconds by which this clock is ahead.
 */
OffsetClock.prototype.getOffset = function() {
    return PRIVATE.get(this).offset;
};

/**
 * Change the number of milliseconds by which this clock is ahead (the offset)
 *
 * The offset is in terms of elapsed root clock time, not elapsed time of
 * the parent.
 *
 * @param {Number} millis The number of milliseconds by which this clock is ahead.
 */
OffsetClock.prototype.setOffset = function(millis) {
    var priv = PRIVATE.get(this);
    var changed = millis != priv.offset;
    priv.offset = millis;
    if (changed) {
        this.emit("change", this);
    }
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.calcWhen = function(t) {
    var priv = PRIVATE.get(this);
    
    var tt = t + priv.offset * this.getEffectiveSpeed() * priv.parent.tickRate / 1000;
    return priv.parent.calcWhen(this.toParentTime(tt));
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.getParent = function() {
    return PRIVATE.get(this).parent;
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.setParent = function(newParent) {
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
 * @inheritdoc
 */
OffsetClock.prototype.toParentTime = function(t) {
    var priv = PRIVATE.get(this);
    return t - priv.offset * this.getEffectiveSpeed() * this.tickRate / 1000;
};

/**
 * @inheritdoc
 */
OffsetClock.prototype.fromParentTime = function(t) {
    var priv = PRIVATE.get(this);
    return t + priv.offset * this.getEffectiveSpeed() * this.tickRate / 1000;
};

module.exports = OffsetClock;
