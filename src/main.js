/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var ClockBase = require("ClockBase");
var DateNowClock = require("DateNowClock");
var CorrelatedClock = require("CorrelatedClock");
var Correlation = require("Correlation");

/**
 * @module clocks
 *
 * @description
 * The clocks library consists of this module containing the clock classes:
 *
 * <ul>
 *   <li> clocks.{@link ClockBase} - base class for all clock implementations.
 *   <li> clocks.{@link DateNowClock} - a root clock based on <tt>Date.now()</tt>
 *   <li> clocks.{@link CorrelatedClock} - a clock based on a parent using a correlation.
 *   <li> clocks.{@link Correlation} - a correlation.
 * </ul>
 *
 * <p>Clock can be built into hierarchies, where one clock is the root, and other
 * clocks use it as their parent, and others use those as their parents etc.
 *
 * <p>Clocks raise events, and listen to events from their parents:
 * <ul>
 *   <li> {@link event:change} ... when any change occurs to a clock, or it is affected by a change of its parents.
 *   <li> {@link event:available} ... when aa clock becomes flagged available
 *   <li> {@link event:unavailable} ... when aa clock becomes flagged unavailable
 * </ul>
 */
module.exports = {
    /**
     * base class for all clock implementations
     * @see ClockBase
     */
    ClockBase: ClockBase,
    /**
     * a root clock based on <tt>Date.now()</tt>
     * @see DateNowClock
     */
    DateNowClock: DateNowClock,
    /**
     * a clock based on a parent using a correlation.
     * @see CorrelatedClock
     */
    CorrelatedClock: CorrelatedClock,
    /**
     * a correlation.
     * @see Correlation
     */
    Correlation: Correlation
};
