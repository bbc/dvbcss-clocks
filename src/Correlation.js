/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var WeakMap = require('weak-map');
var PRIVATE = new WeakMap();


/**
 * @exports Correlation
 * @class Correlation
 *
 * @classdesc
 * This is an immutable object representing a correlation.
 * It also can represent associated error/uncertaint information.
 * 
 * <p>The point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}) represents a relationship between
 * a parent clock and a child clock - by saying that the parent clock
 * is at point [parentTime]{@link Correlation#parentTime} when the child clock is at point [childTime]{@link Correlation#childTime}.
 *
 * <p>Error information is represented as an [initialError]{@link Correlation#initialError} amount and a
 * [errorGrowthRate]{@link Correlation#errorGrowthRate}. The initial amount of error represents the amount
 * of uncertainty at the point of the correlation; and the growth rate represents
 * how much uncertainty increases by as you move further away from the point
 * of correlation. Both are in units of seconds, and seconds per second, of
 * the child clock. By default these are set to zero, so there is assumed to
 * be no error.
 *
 * <p>The properties of the correlation can be read:
 * <pre class="prettyprint"><code>
 * corr = new Correlation(10, 20, 0.5, 0.1);
 * p = corr.parentTime;
 * t = corr.childTime;
 * i = corr.initialError;
 * g = corr.errorGrowthRate;
 * </code></pre>
 *
 * <p>However the object is immutable. The properties cannot be set. Instead use
 * the butWith() method to create a new correlation "but with" some properties
 * changed:
 * <pre class="prettyprint"><code>
 * corr = new Correlation(10, 20, 0.5, 0.1);
 * corr2= corr.butWith({parentTime: 11, childTime:19})
 * </code></pre>
 *
 * @constructor
 * @param {Number|object|Number[]} parentTimeOrObject - The parent time, or the whole correlation expressed as an object, or an array with the arguments in this order.
 * @param {Number} [parentTimeOrObject.parentTime] The parent time
 * @param {Number} [parentTimeOrObject.childTime] The child time.
 * @param {Number} [parentTimeOrObject.initialError] The initial error (in seconds)
 * @param {Number} [parentTimeOrObject.errorGrowthRate] The error growth rate (in seconds per second.)
 * @param {Number} [childTime] The child time.
 * @param {Number} [initialError] The initial error (in seconds)
 * @param {Number} [errorGrowthRate] The error growth rate (in seconds per second.)
 *
 * @example
 * // parentTime = 10, childTime=20, initialError=0, errorGrowthRate=0
 * c = new Correlation(10, 20);
 * @example
 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
 * c = new Correlation(10, 20, 0.5, 0.1);
 * @example
 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
 * c = new Correlation([10, 20, 0.5, 0.1])
 * @example
 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
 * c = new Correlation({parentTime:10, childTime:20, initialError:0.5, errorGrowthRate:0.1])
 */
var Correlation = function(parentTimeOrObject, childTime, initialError, errorGrowthRate) {
    PRIVATE.set(this, {});
    
    var priv = PRIVATE.get(this);
    
    var parentTime;
    
    if (Array.isArray(parentTimeOrObject)) {
        parentTime = parentTimeOrObject[0];
        childTime = parentTimeOrObject[1];
        initialError = parentTimeOrObject[2];
        errorGrowthRate = parentTimeOrObject[3];
    } else if (typeof parentTimeOrObject === "object") {
        parentTime = parentTimeOrObject.parentTime;
        childTime = parentTimeOrObject.childTime;
        initialError = parentTimeOrObject.initialError;
        errorGrowthRate = parentTimeOrObject.errorGrowthRate;
    } else {
        parentTime = parentTimeOrObject;
    }
    
    priv.parentTime = (typeof parentTime !== "undefined") ? parentTime : 0;
    priv.childTime  = (typeof childTime !== "undefined")  ? childTime  : 0;

    priv.initialError    = (typeof initialError !== "undefined")    ? initialError    : 0;
    priv.errorGrowthRate = (typeof errorGrowthRate !== "undefined") ? errorGrowthRate : 0;
};

/**
 * Build a new correlation object, but with the properties changed listed as
 * named properties of the object passed.
 *
 * @param {object} changes An object where the property names and values represent the properties of the correlation to be changed.
 * @param {Number} [changes.parentTime] The parent time
 * @param {Number} [changes.childTime] The child time.
 * @param {Number} [changes.initialError] The initial error (in seconds)
 * @param {Number} [changes.errorGrowthRate] The error growth rate (in seconds per second.)
 *
 * @returns {Correlation} new Correlation object that is the same as this one, but with the specified changes.
 *
 * @example
 * var corr = new Correlation(1,2);
 * var corr2 = corr.butWith({parentTime:5});
 * console.log(corr.parentTime, corr.childTime); // 5 2
 */
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

/**
 * @var {Number} parentTime Parent Time. Along with the [childTime]{@link Correlation#childTime} it defines the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
 * @memberof Correlation
 * @instance
 */

Object.defineProperty(Correlation.prototype, "parentTime", {
    get: function()  { return PRIVATE.get(this).parentTime; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

/**
 * @var {Number} childTime Child Time. Along with the [parentTime]{@link Correlation#parentTime} it defines the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
 * @memberof Correlation
 * @instance
 */

Object.defineProperty(Correlation.prototype, "childTime", {
    get: function()  { return PRIVATE.get(this).childTime; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

/**
 * @var {Number} initialError The intial amount of error/uncertainly (in seconds) at the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
 * @memberof Correlation
 * @instance
 */

Object.defineProperty(Correlation.prototype, "initialError", {
    get: function()  { return PRIVATE.get(this).initialError; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

/**
 * @var {Number} errorGrowthRate The amonut by which error/uncertainly will grown (in seconds) for every second of child clock time away from the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
 * @memberof Correlation
 * @instance
 */

Object.defineProperty(Correlation.prototype, "errorGrowthRate", {
    get: function()  { return PRIVATE.get(this).errorGrowthRate; },
    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
});

/**
 * Compare this correlation with another to check if they are the same.
 * @param {Correlation} obj - another correlation to compare with.
 * @returns {boolean} True if this correlation represents the same correlation and error/uncertainty as the one provided.
 */
Correlation.prototype.equals = function(obj) {
    var priv = PRIVATE.get(this);
    return priv.parentTime === obj.parentTime &&
        priv.childTime === obj.childTime &&
        priv.initialError === obj.initialError &&
        priv.errorGrowthRate === obj.errorGrowthRate;
};


module.exports = Correlation;
