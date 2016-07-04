/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var DateNowClock = require("DateNowClock");

describe("DateNowClock", function() {
	it("exists", function() {
		expect(DateNowClock).toBeDefined()
	});

    it("can be created with no arguments, defaulting to 1kHz tickrate", function() {
        var dnc = new DateNowClock();
        expect(dnc.getTickRate()).toBe(1000);
    });
    
    it("can be created with an object argument with a tickRate property", function() {
        var dnc = new DateNowClock({tickRate:5000});
        expect(dnc.getTickRate()).toBe(5000);
    });
    
    it("reflects Date.now() scaled to the clock tickrate when now() is called", function() {
        var dnc = new DateNowClock({tickRate:1000000});
        var dateNowSpy = spyOn(Date, 'now');
        
        dateNowSpy.and.returnValue(5001000);
        expect(dnc.now()).toBe(5001000000);
        
        dateNowSpy.and.returnValue(6001000);
        expect(dnc.now()).toBe(6001000000);
    });
    
    it("can calculate the underlying Date.now() time from a clock time", function() {
        var dnc = new DateNowClock({tickRate:1000000});
        
        expect(dnc.calcWhen(5000)).toBe(5);
    });
    
    it("throws an error when asked to convert to parent time", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(function() { dnc.toParentTime(5000) }).toThrow();
    });
    
    it("throws an error when asked to convert from parent time", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(function() { dnc.fromParentTime(5000) }).toThrow();      
    });
    
    it("returns null when getParent() is called", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(dnc.getParent()).toBeNull();
    });
    
    it("is available", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(dnc.isAvailable()).toBeTruthy();
    });
    
    it("throws an error if you try to set availability to false", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(function() { dnc.setAvailability(false); }).toThrow();
    });
    
    it("returns itself when getRoot() is called", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(dnc.getRoot()).toEqual(dnc);
    });
    
    it("returns only itself in an ancestry list", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(dnc.getAncestry()).toEqual([dnc]);
    });
    
    it("returns the time unchanged when converting to/from root time", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(dnc.toRootTime(12345)).toBe(12345);
        expect(dnc.fromRootTime(54321)).toBe(54321);
    });
    
    it("returns a constant dispersion value irrespective of the time", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        var now = dnc.now();
        var d1 = dnc.dispersionAtTime(now);
        var d2 = dnc.dispersionAtTime(now+1000*dnc.getTickRate());
        expect(d1).toEqual(d2);
    });
    
    it("should have dispersion of less than 5 ms", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        var now = dnc.now();
        var d1 = dnc.dispersionAtTime(now);
        expect(d1).toBeLessThan(0.005);
    });
    
});
