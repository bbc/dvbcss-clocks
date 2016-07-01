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

module.exports = {
    _ClockBase: ClockBase,
    DateNowClock: DateNowClock,
    CorrelatedClock: CorrelatedClock,
    Correlation: Correlation
};
