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
var measurePrecision = require('measurePrecision');

var WeakMap = require('weakmap');
var PRIVATE = new WeakMap();

var DATENOW_PRECISION = measurePrecision(Date.now.bind(Date), 100) / 1000;

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
        priv.maxFreqErrorPpm = 500;
    }
    
    priv.precision = DATENOW_PRECISION;
};

inherits(DateNowClock, ClockBase);

DateNowClock.prototype.now = function() {
    return Date.now() / 1000 * PRIVATE.get(this).freq;
};

DateNowClock.prototype.getTickRate = function() {
    return PRIVATE.get(this).freq;
};

DateNowClock.prototype.calcWhen = function(t) {
    return t / PRIVATE.get(this).freq * 1000;
};

DateNowClock.prototype.toString = function() {
    var priv = PRIVATE.get(this);
    return "DateNowClock({tickRate:"+priv.freq+", maxFreqErrorPpm:"+priv.maxFreqErrorPpm+"}) ["+this.id+"]";
};

DateNowClock.prototype.toParentTime = function(t) {
    throw "Clock has no parent.";
};

DateNowClock.prototype.fromParentTime = function(t) {
    throw "Clock has no parent.";
};

DateNowClock.prototype.getParent = function() {
    return null;
};

DateNowClock.prototype.setAvailability = function(availability) {
    throw "Cannot change availability of this clock.";
};

DateNowClock.prototype._errorAtTime = function(t) {
    return PRIVATE.get(this).precision;
};

DateNowClock.prototype.getRootMaxFreqError = function() {
    return PRIVATE.get(this).maxFreqErrorPpm;
};

module.exports = DateNowClock;
