/****************************************************************************
 * Copyright 2017 British Broadcasting Corporation
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*****************************************************************************/

var ClockBase = require("./ClockBase");
var DateNowClock = require("./DateNowClock");
var CorrelatedClock = require("./CorrelatedClock");
var Correlation = require("./Correlation");
var OffsetClock = require("./OffsetClock");

/**
 * @module dvbcss-clocks
 *
 * @description
 * The dvbcss-clocks library consists of this module containing the clock classes:
 *
 * <ul>
 *   <li> dvbcss-clocks.{@link ClockBase} - base class for all clock implementations.
 *   <li> cdvbcss-locks.{@link DateNowClock} - a root clock based on <tt>Date.now()</tt>
 *   <li> dvbcss-clocks.{@link CorrelatedClock} - a clock based on a parent using a correlation.
 *   <li> dvbcss-clocks.{@link Correlation} - a correlation.
 *   <li> dvbcss-clocks.{@link OffsetClock} - a clock that applies a fixed offset to enable compensating for rendering latency.
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
    Correlation: Correlation,
    /**
     * a clock that applies a fixed offset to enable compensating for rendering latency.
     * @see OffsetClock
     */
    OffsetClock: OffsetClock
};
