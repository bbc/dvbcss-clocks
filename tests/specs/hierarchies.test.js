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

describe("For hierarchies of clocks", function() {
    
    it("when toOtherClockTime() is called, an error is thrown if the two clocks are not part of the same hierarchy (and therefore have no common ancestor)", function() {
        
        var a = new DateNowClock({tickRate:1000000});
        var b = new DateNowClock({tickRate:1000000});
        var a1 = new CorrelatedClock(a, {tickRate:1000,correlation:new Correlation(0,0)});
        var b1 = new CorrelatedClock(b, {tickRate:1000,correlation:new Correlation(0,0)});
        var a2 = new CorrelatedClock(a1, {tickRate:1000,correlation:new Correlation(0,0)});
        var b2 = new CorrelatedClock(b1, {tickRate:1000,correlation:new Correlation(0,0)});
        
        expect(function() { a.toOtherClockTime(b, 5)}).toThrow();
        expect(function() { a.toOtherClockTime(b1, 5)}).toThrow();
        expect(function() { a.toOtherClockTime(b2, 5)}).toThrow();

        expect(function() { a1.toOtherClockTime(b, 5)}).toThrow();
        expect(function() { a1.toOtherClockTime(b1, 5)}).toThrow();
        expect(function() { a1.toOtherClockTime(b2, 5)}).toThrow();

        expect(function() { a2.toOtherClockTime(b, 5)}).toThrow();
        expect(function() { a2.toOtherClockTime(b1, 5)}).toThrow();
        expect(function() { a2.toOtherClockTime(b2, 5)}).toThrow();

        expect(function() { b.toOtherClockTime(a, 5)}).toThrow();
        expect(function() { b.toOtherClockTime(a1, 5)}).toThrow();
        expect(function() { b.toOtherClockTime(a2, 5)}).toThrow();

        expect(function() { b1.toOtherClockTime(a, 5)}).toThrow();
        expect(function() { b1.toOtherClockTime(a1, 5)}).toThrow();
        expect(function() { b1.toOtherClockTime(a2, 5)}).toThrow();

        expect(function() { b2.toOtherClockTime(a, 5)}).toThrow();
        expect(function() { b2.toOtherClockTime(a1, 5)}).toThrow();
        expect(function() { b2.toOtherClockTime(a2, 5)}).toThrow();
    });
    
    it("toOtherClockTime() can be used to convert to the parent's time", function() {
        var a = new DateNowClock({tickRate:1000000});
        var a1 = new CorrelatedClock(a, {tickRate:100,correlation:new Correlation(50,0)});
        var a2 = new CorrelatedClock(a1, {tickRate:78,correlation:new Correlation(38,999)});

        expect(a1.toOtherClockTime(a, 500)).toEqual(a1.toParentTime(500));
        expect(a2.toOtherClockTime(a1, 500)).toEqual(a2.toParentTime(500));
    });
    
    it("toOtherClockTime() can be used to convert to a parent's parent's time", function() {
        var a = new DateNowClock({tickRate:1000000});
        var a1 = new CorrelatedClock(a, {tickRate:100,correlation:new Correlation(50,0)});
        var a2 = new CorrelatedClock(a1, {tickRate:78,correlation:new Correlation(28,999)});

        expect(a2.toOtherClockTime(a, 500)).toEqual(
            a1.toParentTime(a2.toParentTime(500))
        );
    });
    
    it("toOtherClockTime() can be used to convert between ancestors in a linear hierarchy", function() {
        var a = new DateNowClock({tickRate:1000000});
        var a1 = new CorrelatedClock(a, {tickRate:100,correlation:new Correlation(50,0)});
        var a2 = new CorrelatedClock(a1, {tickRate:78,correlation:new Correlation(28,999)});
        var a3 = new CorrelatedClock(a2, {tickRate:178,correlation:new Correlation(5,1003)});
        var a4 = new CorrelatedClock(a3, {tickRate:28,correlation:new Correlation(17,9)});
        
        expect(a3.toOtherClockTime(a1, 500)).toEqual(
            a2.toParentTime(a3.toParentTime(500))
        );
    });
    
    it("toOtherClockTime() can be used to convert between clocks on different branches", function() {
        var a = new DateNowClock({tickRate:1000000});
        var a1 = new CorrelatedClock(a, {tickRate:100,correlation:new Correlation(50,0)});
        var a2 = new CorrelatedClock(a1, {tickRate:78,correlation:new Correlation(28,999)});
        var a3 = new CorrelatedClock(a2, {tickRate:178,correlation:new Correlation(5,1003)});
        var a4 = new CorrelatedClock(a3, {tickRate:28,correlation:new Correlation(17,9)});
        var b3 = new CorrelatedClock(a2, {tickRate:1000,correlation:new Correlation(10,20)});
        var b4 = new CorrelatedClock(b3, {tickRate:2000,correlation:new Correlation(15,90)});
        
        var v = a4.toParentTime(500);
        v = a3.toParentTime(v);
        v = b3.fromParentTime(v);
        v = b4.fromParentTime(v);
        
        expect(a4.toOtherClockTime(b4,500)).toEqual(v);
    });
    
    it("a change of speed propagates through the hierarchy and is reflected in getEffectiveSpeed()", function() {
        var datenow = spyOn(Date,"now");
        datenow.and.returnValue(5000);

        var a = new DateNowClock({tickRate:1000});
        var a1 = new CorrelatedClock(a, {tickRate:1000,correlation:new Correlation(50,0)});
        var a2 = new CorrelatedClock(a1, {tickRate:100,correlation:new Correlation(28,999)});
        var a3 = new CorrelatedClock(a2, {tickRate:50,correlation:new Correlation(5,1003)});
        var a4 = new CorrelatedClock(a3, {tickRate:25,correlation:new Correlation(1000,9)});
        var b3 = new CorrelatedClock(a2, {tickRate:1000,correlation:new Correlation(500,20)});
        var b4 = new CorrelatedClock(b3, {tickRate:2000,correlation:new Correlation(15,90)});
        
        var at1  = a.now();
        var a1t1 = a1.now();
        var a2t1 = a2.now();
        var a3t1 = a3.now();
        var a4t1 = a4.now();
        var b3t1 = b3.now();
        var b4t1 = b4.now();
        
        a3.speed = 0.5;
        a4.speed = 0.2;
        
        expect(a.getEffectiveSpeed()).toEqual(1.0);
        expect(a1.getEffectiveSpeed()).toEqual(1.0);
        expect(a2.getEffectiveSpeed()).toEqual(1.0);
        expect(a3.getEffectiveSpeed()).toEqual(0.5);
        expect(a4.getEffectiveSpeed()).toEqual(0.1);
        
        a3.speed = 0;
        a4.speed = 1.0;
        
        expect(a.getEffectiveSpeed()).toEqual(1.0);
        expect(a1.getEffectiveSpeed()).toEqual(1.0);
        expect(a2.getEffectiveSpeed()).toEqual(1.0);
        expect(a3.getEffectiveSpeed()).toEqual(0.0);
        expect(a4.getEffectiveSpeed()).toEqual(0.0);
        
        datenow.and.returnValue(6000);
        
        var at2  = a.now();
        var a1t2 = a1.now();
        var a2t2 = a2.now();
        var a3t2 = a3.now();
        var a4t2 = a4.now();
        var b3t2 = b3.now();
        var b4t2 = b4.now();
        
        expect(at2).toBeCloseTo(at1 + 1000, 5);
        expect(a1t2).toBeCloseTo(a1t1 + 1000, 5);
        expect(a2t2).toBeCloseTo(a2t1 + 100, 5);
        expect(a3t2).toBeCloseTo(1003, 5);
        expect(a4t2).toBeCloseTo(10.5, 5);
        expect(b3t2).toBeCloseTo(b3t1 + 1000, 5);
        expect(b4t2).toBeCloseTo(b4t1 + 2000, 5);
    });
    
    it("propagates availability throuhg a hierarchy", function() {
        var a = new DateNowClock();
        var b = new CorrelatedClock(a);
        var c = new CorrelatedClock(b);
        var d = new CorrelatedClock(c);
        
        var aa = jasmine.createSpy("aa");
        var ab = jasmine.createSpy("ab");
        var ac = jasmine.createSpy("ac");
        var ad = jasmine.createSpy("ad");
        
        var ca = jasmine.createSpy("ca");
        var cb = jasmine.createSpy("cb");
        var cc = jasmine.createSpy("cc");
        var cd = jasmine.createSpy("cd");
        
        var ua = jasmine.createSpy("ua");
        var ub = jasmine.createSpy("ub");
        var uc = jasmine.createSpy("uc");
        var ud = jasmine.createSpy("ud");
        
        a.on("available", aa);
        a.on("unavailable", ua);
        a.on("change", ca);
        
        b.on("available", ab);
        b.on("unavailable", ub);
        b.on("change", cb);
        
        c.on("available", ac);
        c.on("unavailable", uc);
        c.on("change", cc);
        
        d.on("available", ad);
        d.on("unavailable", ud);
        d.on("change", cd);
        
        expect(a.isAvailable()).toBeTruthy();
        expect(b.isAvailable()).toBeTruthy();
        expect(c.isAvailable()).toBeTruthy();
        expect(d.isAvailable()).toBeTruthy();

        c.availabilityFlag = false;
        expect(a.isAvailable()).toBeTruthy();
        expect(b.isAvailable()).toBeTruthy();
        expect(c.isAvailable()).toBeFalsy();
        expect(d.isAvailable()).toBeFalsy();
        [aa,ua,ca,ab,ub,cb,ac,ad].forEach(function(callback) {
             expect(callback).not.toHaveBeenCalled();
         });
        [uc,cc,ud,cd].forEach(function(callback) {
             expect(callback).toHaveBeenCalled();
             callback.calls.reset();
         });
         
         d.availabilityFlag = false;
        [aa,ua,ca,ab,ub,cb,ac,uc,cc,ad,ud,cd].forEach(function(callback) {
             expect(callback).not.toHaveBeenCalled();
         });
         
         c.availabilityFlag = true;
        [aa,ua,ca,ab,ub,cb,uc,ad,ud].forEach(function(callback) {
             expect(callback).not.toHaveBeenCalled();
         });
        [ac,cc,cd].forEach(function(callback) {
             expect(callback).toHaveBeenCalled();
             callback.calls.reset();
         });
         
    });
    
    it("can calculate a difference between two clocks using clockDiff() method", function() {
        var datenow = spyOn(Date,"now");
        
        datenow.and.returnValue(1000);
        
        var a = new DateNowClock({tickRate:1000000});
        var b = new CorrelatedClock(a, {tickRate:1000, correlation:new Correlation(0,0)});
        var c = new CorrelatedClock(b, {tickRate:2000, correlation:new Correlation(0,0)});
        var d = new CorrelatedClock(c, {tickRate:3000, correlation:new Correlation(0,0)});
        var e = new CorrelatedClock(d, {tickRate:1000, correlation:new Correlation(5,0)});
        
        expect(b.clockDiff(c)).toEqual(Number.POSITIVE_INFINITY);
        expect(b.clockDiff(d)).toEqual(Number.POSITIVE_INFINITY);
        expect(b.clockDiff(e)).toBeCloseTo(0.001666667, 6);
        
        datenow.and.returnValue(1000 + 10000000*1000);
        
        expect(b.clockDiff(c)).toEqual(Number.POSITIVE_INFINITY);
        expect(b.clockDiff(d)).toEqual(Number.POSITIVE_INFINITY);
        expect(b.clockDiff(e)).toBeCloseTo(0.001666667, 6);

        c.tickRate = 1000;
        expect(b.clockDiff(c)).toEqual(0);
        
        c.speed = 1.01;
        expect(b.clockDiff(c)).toEqual(Number.POSITIVE_INFINITY);
    });
});
