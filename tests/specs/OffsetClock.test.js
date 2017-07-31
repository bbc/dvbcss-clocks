/****************************************************************************
 * Copyright 2016 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var OffsetClock = require("OffsetClock");
var CorrelatedClock = require("CorrelatedClock");
var DateNowClock = require("DateNowClock");

describe("OffsetClock", function() {
    
    it("exists", function() {
        expect(OffsetClock).toBeDefined();
    });
    
    it("takes a parent clock as an argument", function() {
        var root = new DateNowClock();
        var oc = new OffsetClock(root);
        expect(oc.parent).toBe(root);
    });
    
    it("defaults to an offset of zero", function() {
        var root = new DateNowClock();
        var oc = new OffsetClock(root);
        expect(oc.offset).toBe(0);
    });
    
    it("can be configured with an offset at creation by specifying an 'offset' property of the 2nd argument.", function() {
        var root = new DateNowClock();
        var oc = new OffsetClock(root, {"offset":75});
        expect(oc.offset).toBe(75);
    });
    
    it("has speed 1 and cannot be changed", function() {
        var root = new DateNowClock();
        var oc = new OffsetClock(root, {"offset":75});
        expect(oc.speed).toEqual(1);
        expect(oc.getSpeed()).toEqual(1);
        
        expect(function() { oc.speed = 5; }).toThrow();
        expect(oc.speed).toEqual(1);
        expect(oc.getSpeed()).toEqual(1);
        
        expect(function() { oc.setSpeed(5); }).toThrow();
        expect(oc.speed).toEqual(1);
        expect(oc.getSpeed()).toEqual(1);
    });
    
    it("has tick rate of the parent and cannot be changed", function() {
        var root = new DateNowClock();
        var oc = new OffsetClock(root, {"offset":75});
        expect(oc.tickRate).toEqual(root.tickRate);
        expect(oc.getTickRate()).toEqual(root.tickRate);

        expect(function() { oc.tickRate = 5; }).toThrow();
        expect(oc.tickRate).toEqual(root.tickRate);
        expect(oc.getTickRate()).toEqual(root.tickRate);

        expect(function() { oc.setTickRate(5); }).toThrow();
        expect(oc.tickRate).toEqual(root.tickRate);
        expect(oc.getTickRate()).toEqual(root.tickRate);        
    });
    
    it("still has speed 1 even if parent speed is not 1", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root, {tickrate:1000});
        var oc = new OffsetClock(cc, {offset:50});
        
        cc.speed = 5;
        expect(oc.speed).toEqual(1);
    });
    
    describe("offset behaviour is expected to work as follows:", function() {

        var root = new DateNowClock();
        var parent = new CorrelatedClock(root, {tickRate:1000});
        var altParent = new CorrelatedClock(root, {tickRate:50});
        
        beforeEach(function() {
            jasmine.clock().install();
            jasmine.clock().mockDate();
            parent.speed = 1;
        });
        
        afterEach(function() {
            jasmine.clock().uninstall();
        });
        
        it("correctly applies the offset when effectivespeed of parent is 1", function() {
            var OC_AHEAD_BY=50;

            var oc = new OffsetClock(parent, {"offset":OC_AHEAD_BY});
            parent.speed = 1;
            
            var t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            jasmine.clock().tick(OC_AHEAD_BY);
            var t2 = parent.now();
            expect(t).toEqual(t2);
        });
        
        it("correctly applies the offset (by scaling it to nothing) when effective speed of parent is 0", function() {
            var OC_AHEAD_BY=98;

            var oc = new OffsetClock(parent, {"offset":OC_AHEAD_BY});
            parent.speed = 0;
            
            var t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            jasmine.clock().tick(OC_AHEAD_BY);
            var t2 = parent.now();
            expect(t).toEqual(t2);
        });

        it("correctly applies the offset (by scaling it proportional to teh speed) when effective speed of parent is > 1", function() {
            var OC_AHEAD_BY=20;

            var oc = new OffsetClock(parent, {"offset":OC_AHEAD_BY});
            parent.speed = 2.7;
            
            var t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            jasmine.clock().tick(OC_AHEAD_BY);
            var t2 = parent.now();
            expect(t).toBeCloseTo(t2);
        });
        
        it("correctly applies no offset if set to zero", function() {
            var oc = new OffsetClock(parent, {"offset":0});
            expect(oc.now()).toEqual(parent.now());
        });
        
        it("will allow the offset to be changed", function() {
            var oc = new OffsetClock(parent, {"offset":40});
            expect(oc.now()).toEqual(parent.now() + 40);
            oc.offset = 65;
            expect(oc.now()).toEqual(parent.now() + 65);
        });
        
        it("will still correctly apply the offset if the parent is changed", function() {
            var oc = new OffsetClock(parent, {"offset":40});
            expect(oc.getParent()).toEqual(parent);
            expect(oc.now()).toEqual(parent.now() + 40);
            oc.setParent(altParent);
            expect(oc.getParent()).toEqual(altParent);
            expect(oc.now()).toEqual(altParent.now() + 2);
        });
        
        it("causes a notification if the parent is changed", function() {
            var oc = new OffsetClock(parent, {"offset":40});
            var dep = jasmine.createSpy('onchange');
            oc.on("change", dep);
            expect(dep).not.toHaveBeenCalled();
            oc.setParent(altParent);
            expect(dep).toHaveBeenCalledWith(oc);
        });
        
        it("correctly applies the offset if it is negative", function() {
            var OC_BEHIND_BY = 50;
            
            var oc = new OffsetClock(parent, {"offset":OC_BEHIND_BY});
            parent.speed = 1;
            
            var t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            jasmine.clock().tick(OC_BEHIND_BY);
            var t2 = parent.now();
            expect(t).toBeCloseTo(t2);
        });

        it("correctly converts to root time", function() {
            var OC_AHEAD_BY = 124;
            var oc = new OffsetClock(parent, {offset:OC_AHEAD_BY});
            var t = 1285.2;
            var rt = oc.toRootTime(t);
            var rt2 = parent.toRootTime(t);
            expect(rt + OC_AHEAD_BY/1000*root.tickRate).toEqual(rt2);
        });
        
        it("correctly converts from root time", function() {
            var OC_AHEAD_BY = 124;
            var oc = new OffsetClock(parent, {offset:OC_AHEAD_BY});
            var rt = 22849128;
            var t = oc.fromRootTime(rt);
            var t2 = parent.fromRootTime(rt + OC_AHEAD_BY/1000*root.tickRate);
            expect(t).toEqual(t2);
        });
        
    });
    
});