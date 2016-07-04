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
    
    it("has speed 1.0", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(dnc.getSpeed()).toBe(1);
    });
    
    it("throws an error if you try to set speed", function() {
        var dnc = new DateNowClock({tickRate:1000000});

        expect(function() { dnc.setSpeed(1.5); }).toThrow();
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

describe("DateNowClock - setTimeout, clearTimeout", function() {
    
    beforeEach(function() {
        jasmine.clock().install();
    });
    
    afterEach(function() {
        jasmine.clock().uninstall();
    });
    
    it("Can schedule a timeout callback with arguments", function() {
        var dateNowSpy = spyOn(Date, 'now');
        var callback = jasmine.createSpy("tc");
        
        var dnc = new DateNowClock();

        dateNowSpy.and.returnValue(500);
        dnc.setTimeout(callback, 1000, "hello");
        
        dateNowSpy.and.returnValue(500+999);
        jasmine.clock().tick(999);
        expect(callback).not.toHaveBeenCalled();
        
        dateNowSpy.and.returnValue(500+1000);
        jasmine.clock().tick(1);
        expect(callback).toHaveBeenCalledWith("hello");
    });

    it("Can schedule a timeout callback with arguments then clear it", function() {
        var dateNowSpy = spyOn(Date, 'now');
        var callback1 = jasmine.createSpy("tc1");
        var callback2 = jasmine.createSpy("tc2");
        
        var dnc = new DateNowClock();

        dateNowSpy.and.returnValue(500);
        var handle1 = dnc.setTimeout(callback1, 1000, "hello");
        var handle2 = dnc.setTimeout(callback2, 1500, "goodbye");
        
        dateNowSpy.and.returnValue(500+999);
        jasmine.clock().tick(999);
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        dnc.clearTimeout(handle1);
        
        dateNowSpy.and.returnValue(500+1499);
        jasmine.clock().tick(500);
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();

        dateNowSpy.and.returnValue(500+1500);
        jasmine.clock().tick(1);
        expect(callback2).toHaveBeenCalledWith("goodbye");
    });

    it("Does not fail or affect existing timers if non-existent one is cleared", function() {
        var dateNowSpy = spyOn(Date, 'now');
        var callback1 = jasmine.createSpy("tc1");
        var callback2 = jasmine.createSpy("tc2");
        
        var dnc = new DateNowClock();

        dateNowSpy.and.returnValue(500);
        var handle1 = dnc.setTimeout(callback1, 1000, "hello");
        var handle2 = dnc.setTimeout(callback2, 1500, "goodbye");
        
        dateNowSpy.and.returnValue(500+999);
        jasmine.clock().tick(999);
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        
        dnc.clearTimeout(handle1+"flurble"+handle2);
        
        dateNowSpy.and.returnValue(500+1500);
        jasmine.clock().tick(501);
        expect(callback1).toHaveBeenCalledWith("hello");
        expect(callback2).toHaveBeenCalledWith("goodbye");
    });


});
