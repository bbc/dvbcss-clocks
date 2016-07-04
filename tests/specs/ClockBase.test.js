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

describe("ClockBase", function() {
	it("exists", function() {
		expect(ClockBase).toBeDefined();
	});
    
    
    /**
        most other code cannot be tested here because it relies on
        methods that wil be implemented in subclasses
    **/
});

