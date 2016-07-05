/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var WeakMap = require('weakmap');
var PRIVATE = new WeakMap();



var Correlation = function(parentTimeOrObject, childTime, initialError, errorGrowthRate) {
    PRIVATE.set(this, {});
    
    var priv = PRIVATE.get(this);
    
    if (Array.isArray(parentTimeOrObject)) {
        var parentTime = parentTimeOrObject[0];
        var childTime = parentTimeOrObject[1];
        var initialError = parentTimeOrObject[2];
        var errorGrowthRate = parentTimeOrObject[3];
    } else if (typeof parentTimeOrObject === "object") {
        var parentTime = parentTimeOrObject.parentTime;
        var childTime = parentTimeOrObject.childTime;
        var initialError = parentTimeOrObject.initialError;
        var errorGrowthRate = parentTimeOrObject.errorGrowthRate;
    } else {
        var parentTime = parentTimeOrObject;
    }
    
    priv.parentTime = (typeof parentTime !== "undefined") ? parentTime : 0;
    priv.childTime  = (typeof childTime !== "undefined")  ? childTime  : 0;

    priv.initialError    = (typeof initialError !== "undefined")    ? initialError    : 0;
    priv.errorGrowthRate = (typeof errorGrowthRate !== "undefined") ? errorGrowthRate : 0;
};

Correlation.prototype.butWith = function(changes) {
    var priv = PRIVATE.get(this);

    if (typeof changes === "undefined") {
        return this;
    } else {
        var p = changes.parentTime;
        var c = changes.childTime;
        var i = changes.initialError;
        var g = changes.errorGrowthRate;
        
        if (typeof p === "undefined") { p = priv.parentTime; }
        if (typeof c === "undefined") { c = priv.childTime; }
        if (typeof i === "undefined") { i = priv.initialError; }
        if (typeof g === "undefined") { g = priv.errorGrowthRate; }

        return new Correlation(p,c,i,g);
    }
};

Object.defineProperty(Correlation.prototype, "parentTime", {
    get: function()  { return PRIVATE.get(this).parentTime; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

Object.defineProperty(Correlation.prototype, "childTime", {
    get: function()  { return PRIVATE.get(this).childTime; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

Object.defineProperty(Correlation.prototype, "initialError", {
    get: function()  { return PRIVATE.get(this).initialError; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

Object.defineProperty(Correlation.prototype, "errorGrowthRate", {
    get: function()  { return PRIVATE.get(this).errorGrowthRate; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

Correlation.prototype.equals = function(obj) {
    var priv = PRIVATE.get(this);
    return priv.parentTime === obj.parentTime &&
        priv.childTime === obj.childTime &&
        priv.initialError === obj.initialError &&
        priv.errorGrowthRate === obj.errorGrowthRate;
};


module.exports = Correlation;
