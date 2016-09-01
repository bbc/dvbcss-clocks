/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var CorrelatedClock = require("CorrelatedClock");
var DateNowClock = require("DateNowClock");
var Correlation = require("Correlation");

describe("CorrelatedClock", function() {
	it("exists", function() {
		expect(CorrelatedClock).toBeDefined()
	});

    it("takes a parent clock as an argument", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root);
        expect(cc.parent).toBe(root);
    });
    
    it("defaults to a speed of 1.0, tick rate of 1kHz and Correlation(0,0,0,0)", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root);
        expect(cc.tickRate).toBe(1000);
        expect(cc.speed).toBe(1);
        expect(cc.correlation).toEqual(new Correlation(0,0,0,0));
    });
    
    it("can be configured with alternative speed, tick rate and correlation at creation", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root, {
            speed: 2,
            tickRate: 5000,
            correlation: new Correlation(1,2,3,4)
        });
        expect(cc.tickRate).toBe(5000);
        expect(cc.speed).toBe(2);
        expect(cc.correlation).toEqual(new Correlation(1,2,3,4));
    });
    
    
    it("ticks at the specified rate and speed", function() {
        var datenow = spyOn(Date,"now");

        var root = new DateNowClock({tickRate:1000000});
        datenow.and.returnValue(5020.8*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(0,300)
        });
        expect(c.now()).toBe(5020.8*1000 + 300);
        
        datenow.and.returnValue((5020.8+22.7)*1000);
        expect(c.now()).toBe((5020.8+22.7)*1000 + 300);
    });
    
    it("adjusts if the correlation is changed", function() {
        var datenow = spyOn(Date,"now");

        var root = new DateNowClock({tickRate:1000000});
        datenow.and.returnValue(5020.8*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(0,300)
        });
		console.log(c.correlation.parentTime, c.correlation.childTime, c.correlation.initialError, c.correlation.errorGrowthRate);
        expect(c.now()).toBe(5020.8*1000 + 300);
        
        c.correlation = new Correlation(50000, 320);
		console.log(c.correlation.parentTime, c.correlation.childTime, c.correlation.initialError, c.correlation.errorGrowthRate);
        expect(c.correlation).toEqual(new Correlation(50000, 320));
        expect(c.now()).toBe(((5020.8*1000000) - 50000) / 1000 + 320);
    });
    
    it("emits a 'change' event when the correlation, speed or tick rate are changed", function() {
        var root = new DateNowClock();
        var c = new CorrelatedClock(root);
        
        var callback = jasmine.createSpy("callback");
        c.on("change", callback);
        
        expect(callback).not.toHaveBeenCalled();
        
        c.correlation = new Correlation(1,2);
        expect(callback).toHaveBeenCalledWith(c);
        callback.calls.reset();

        c.speed = 5.0;
        expect(callback).toHaveBeenCalledWith(c);
        callback.calls.reset();

        c.tickRate = 999;
        expect(callback).toHaveBeenCalledWith(c);
        callback.calls.reset();

    });
    
    it("emits a 'change' event in response to its parent emitting a 'change' event", function() {
        var root = new DateNowClock();
        var c = new CorrelatedClock(root);
        var cc = new CorrelatedClock(c);
        
        var callback0 = jasmine.createSpy("callback0");
        var callback1 = jasmine.createSpy("callback1");
        var callback2 = jasmine.createSpy("callback2");
        root.on("change", callback0);
        c.on("change", callback1);
        cc.on("change", callback2);
        
        root.emit("change",root);
        expect(callback0).toHaveBeenCalledWith(root);
        expect(callback1).toHaveBeenCalledWith(c);
        expect(callback2).toHaveBeenCalledWith(cc);
        callback0.calls.reset();
        callback1.calls.reset();
        callback2.calls.reset();
        
        c.emit("change",c);
        expect(callback0).not.toHaveBeenCalled();
        expect(callback1).toHaveBeenCalledWith(c);
        expect(callback2).toHaveBeenCalledWith(cc);
        callback0.calls.reset();
        callback1.calls.reset();
        callback2.calls.reset();
        
        cc.emit("change",cc);
        expect(callback0).not.toHaveBeenCalled();
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledWith(cc);
        callback0.calls.reset();
        callback1.calls.reset();
        callback2.calls.reset();
    });

    it("can rebase by recalculating the correlation to align with a particular time", function() {
        var root = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(root,{
            tickRate:1000,
            correlation:new Correlation(50,300)
        });
        
        c.rebaseCorrelationAt(400);
        expect(c.correlation).toEqual(new Correlation(150,400));
    });
    
    it("can convert a time to that of its parent", function() {
        var datenow = spyOn(Date,"now");

        var root = new DateNowClock({tickRate:2000000});
        datenow.and.returnValue(1000*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(50,300)
        });
        
        expect(c.toParentTime(400)).toEqual(50 + (400-300)*2000);
        
    })
    
    it("can convert a time from that of its parent", function() {
        var datenow = spyOn(Date,"now");

        var root = new DateNowClock({tickRate:2000000});
        datenow.and.returnValue(1000*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(50,300)
        });
        
        expect(c.fromParentTime(50 + (400-300)*2000)).toEqual(400);
        
    });
    
    it("can return its parent", function() {
        var root = new DateNowClock();
        var c = new CorrelatedClock(root);
        expect(c.parent).toBe(root);
    });
    
    it("can return the root clock", function() {
        var root = new DateNowClock();
        var b = new CorrelatedClock(root);
        var c = new CorrelatedClock(b);
        var d = new CorrelatedClock(c);
        
        expect(root.getRoot()).toBe(root);        
        expect(b.getRoot()).toBe(root);        
        expect(c.getRoot()).toBe(root);        
        expect(d.getRoot()).toBe(root);        
    });
    
    it("can set correlation and speed atomically", function() {
        var root = new DateNowClock();
        var b = new CorrelatedClock(root);

        var callback0 = jasmine.createSpy("callback0");
        b.on("change",callback0);
        
        expect(callback0).not.toHaveBeenCalled();
        
        b.setCorrelationAndSpeed(new Correlation(5,6), 2.6);
        
        expect(callback0.calls.count()).toEqual(1);
    });
    
    it("can quantify the change resulting from a change of correlation or speed", function() {
        var root = new DateNowClock({tickRate:1000000});
        var b = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(0,0),
            speed: 1.0
        });

        expect(b.quantifyChange(new Correlation(0,0), 1.01)).toEqual(Number.POSITIVE_INFINITY);
        
        b.speed = 0.0;
        expect(b.quantifyChange(new Correlation(0, 5), 0.0)).toEqual(0.005);
    });
	
	it("Can set correlation during construction using an array of values or an object with keys", function() {
		var root = new DateNowClock();

		var c = new CorrelatedClock(root, {correlation:[1,2,3,4]});
		expect(c.correlation).toEqual(new Correlation(1,2,3,4));
		
		c = new CorrelatedClock(root, {correlation:{parentTime:5, childTime:6, initialError:7, errorGrowthRate:8}});
		expect(c.correlation).toEqual(new Correlation(5,6,7,8));
	});

	it("Can set correlation using an array of values or an object with keys", function() {
		var root = new DateNowClock();
		var c = new CorrelatedClock(root);
		
		c.correlation = [1,2,3,4];
		expect(c.correlation).toEqual(new Correlation(1,2,3,4));
		
		c.correlation = {parentTime:5, childTime:6, initialError:7, errorGrowthRate:8};
		expect(c.correlation).toEqual(new Correlation(5,6,7,8));
	});
});



describe("CorrelatedClock - setTimeout, clearTimeout", function() {
    
    beforeEach(function() {
        jasmine.clock().install();
    });
    
    afterEach(function() {
        jasmine.clock().uninstall();
    });
    
    it("Can schedule a timeout callback with arguments", function() {
        var dateNowSpy = spyOn(Date, 'now');
        var callback = jasmine.createSpy("tc");
        
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.and.returnValue(500);
        c.setTimeout(callback, 1000, "hello");
        
        dateNowSpy.and.returnValue(500+999);
        jasmine.clock().tick(999);
        expect(callback).not.toHaveBeenCalled();
        
        dateNowSpy.and.returnValue(500+1000);
        jasmine.clock().tick(1);
        expect(callback).toHaveBeenCalledWith("hello");
    });
    
    it("A change of correlation to delay a timer works",function() {
        var dateNowSpy = spyOn(Date, 'now');
        var callback = jasmine.createSpy("tc");
        
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.and.returnValue(500);
        c.setTimeout(callback, 1000, "hello");

        dateNowSpy.and.returnValue(500+999);
        jasmine.clock().tick(999);
        expect(callback).not.toHaveBeenCalled();

        c.setCorrelation(new Correlation(0,50));
        dateNowSpy.and.returnValue(500+1049);
        jasmine.clock().tick(50);
        expect(callback).not.toHaveBeenCalled();

        dateNowSpy.and.returnValue(500+1050);
        jasmine.clock().tick(1);
        expect(callback).toHaveBeenCalledWith("hello");
    });

    it("A change of correlation to advance a timer works", function() {
        var dateNowSpy = spyOn(Date, 'now');
        var callback = jasmine.createSpy("tc");
        
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.and.returnValue(500);
        c.setTimeout(callback, 1000, "hello");

        dateNowSpy.and.returnValue(500+999);
        jasmine.clock().tick(999);
        expect(callback).not.toHaveBeenCalled();

        c.setCorrelation(new Correlation(0,102));
        jasmine.clock().tick(0);
        expect(callback).toHaveBeenCalledWith("hello");
        
    });

	it("reports the same dispersion as its parent when the correlation specifies zero error contribution", function() {
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,0)});
		expect(c.dispersionAtTime(10)).toEqual(dnc.dispersionAtTime(10));
		expect(c.dispersionAtTime(20)).toEqual(dnc.dispersionAtTime(20));		
	});
	
	it("reports a greater dispersion than its parent when the correlation specified non zero error contribution, and it does so for times on both sides of the correlation (before and after the point of correlation)", function() {
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0, 0, 0.5, 0.1)});
		expect(c.dispersionAtTime(10)).toEqual(dnc.dispersionAtTime(10) + 0.5 + 0.1*10/1000);
		expect(c.dispersionAtTime(20)).toEqual(dnc.dispersionAtTime(20) + 0.5 + 0.1*20/1000);
		expect(c.dispersionAtTime(-10)).toEqual(dnc.dispersionAtTime(-10) + 0.5 + 0.1*10/1000);
	});

});

