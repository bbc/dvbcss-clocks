/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var PRIVATE = new WeakMap();



var Correlation = function(parentTime, childTime, initialError, errorGrowthRate) {
    PRIVATE.set(this, {});
    
    var priv = PRIVATE.get(this);
    
    priv.parentTime = (parentTime) ? parentTime : 0;
    priv.childTime  = (childTime)  ? childTime  : 0;

    priv.initialError    = (initialError)    ? initialError    : 0;
    priv.errorGrowthRate = (errorGrowthRate) ? errorGrowthRate : 0;
};

Correlation.prototype.butWith = function(changes) {
    var priv = PRIVATE.get(this);
    var name;

    var p = priv.parentTime;
    var c = priv.childTime;
    var i = priv.initialError;
    var g = priv.errorGrowthRate;
    
    for(name in changes) {
        if (changes.hasOwnProperty(name)) {
            switch (name) {
                case "parentTime":
                    p = changes[name];
                    break;
                case "childTime":
                    c = changes[name];
                    break;
                case "initialError":
                    i = changes[name];
                    break;
                case "errorGrowthRate":
                    g = changes[name];
                    break;
                default:
                    throw "Unrecognised change '"+name+"'";
            }
        }
    }
    return new Correlation(p,c,i,g);
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
