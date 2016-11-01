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
        methods that wil be implemented in subclasses. But we can check the
		properties:
    **/
	
	it("calls through to get/set methods when tickRate, speed, availabilityFlag, parent properties are gotten or set", function() {
		var c = new ClockBase();
		var spy;
		var _;
		
		spy = spyOn(c, "getTickRate");
		_ = c.tickRate;
		expect(spy).toHaveBeenCalled();
		
		spy = spyOn(c, "getSpeed");
		_ = c.speed;
		expect(spy).toHaveBeenCalled();
		
		spy = spyOn(c, "getAvailabilityFlag");
		_ = c.availabilityFlag;
		expect(spy).toHaveBeenCalled();
		
		spy = spyOn(c, "getParent");
		_ = c.parent;
		expect(spy).toHaveBeenCalled();
		
		spy = spyOn(c,"setTickRate");
		c.tickRate = 5;
		expect(spy).toHaveBeenCalledWith(5);

		spy = spyOn(c,"setSpeed");
		c.speed = 2;
		expect(spy).toHaveBeenCalledWith(2);

		spy = spyOn(c,"setAvailabilityFlag");
		c.availabilityFlag = false;
		expect(spy).toHaveBeenCalledWith(false);

		spy = spyOn(c,"setParent");
		c.parent = "hello";
		expect(spy).toHaveBeenCalledWith("hello");

	});
});

