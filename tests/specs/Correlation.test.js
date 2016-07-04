/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var Correlation = require("Correlation");

describe("Correlation", function() {
	it("exists", function() {
		expect(Correlation).toBeDefined()
	});
    
	it("takes two arguments that set the parentTime and childTime properties, and the initialError and errorGrowthRate default to zero.", function() {
		var c = new Correlation(50,76);
		expect(c.parentTime).toBe(50);
		expect(c.childTime).toBe(76);
		expect(c.initialError).toBe(0);
		expect(c.errorGrowthRate).toBe(0);
	});
	
	it("takes four arguments that set the parentTime, childTime, initialError and errorGrowthRate properties.", function() {
		var c = new Correlation(50,76,7,1.2);
		expect(c.parentTime).toBe(50);
		expect(c.childTime).toBe(76);
		expect(c.initialError).toBe(7);
		expect(c.errorGrowthRate).toBe(1.2);
	});
	
	it("is immutable. parentTime, childTime, initialError and errorGrowthRate properties can be read but not set", function() {
		var c = new Correlation(1,2,3,4);
		
		expect(function() { c.parentTime=10;}).toThrow();
		expect(function() { c.childTime=10;}).toThrow();
		expect(function() { c.initialError=10;}).toThrow();
		expect(function() { c.errorGrowthRate=10;}).toThrow();
	});
	
	it("can be compared for by-value equality using the equals() method", function() {
		expect(new Correlation(1,2,3,4).equals(new Correlation(1,2,3,4))).toBeTruthy();
		expect(new Correlation(1,2,0,0).equals(new Correlation(1,2))).toBeTruthy();
		expect(new Correlation(1,2).equals(new Correlation(1,2,0,0))).toBeTruthy();
		expect(new Correlation(1,2).equals(new Correlation(1,2,0,0))).toBeTruthy();

		expect(new Correlation(1,2,3,4).equals(new Correlation(1,2))).toBeFalsy();
		expect(new Correlation(1,2).equals(new Correlation(1,2,3,4))).toBeFalsy();
	});
	
	it("can build new variants of itself with altered values for parentTime, childTime, initialError and errorGrowthRate via the butWith() method by passing an object with them set as properties", function() {
		var c = new Correlation(1,2,3,4);
		
		var c2 = c.butWith();
		expect(c).toEqual(c2);
		
		var c3 = c.butWith({parentTime:7});
		expect(c3).toEqual(new Correlation(7,2,3,4));
		
		var c4 = c.butWith({childTime:99});
		expect(c4).toEqual(new Correlation(1,99,3,4));

		var c5 = c.butWith({initialError:888});
		expect(c5).toEqual(new Correlation(1,2,888,4));

		var c6 = c.butWith({errorGrowthRate:1000});
		expect(c6).toEqual(new Correlation(1,2,3,1000));
	});
	
	it("will throw an error if butWith() is called with a property in the provided object that is not one of parentTime, childTime, initialError and errorGrowthRate", function() {
		expect(function() { new Correlation(1,2).butWith({flurble:5}) }).toThrow();
	});
	
	
});
	
