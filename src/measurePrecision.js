var measurePrecision = function(timeFunc, sampleSize) {
    var diffs = [];
    while (diffs.length < sampleSize) {
        var a = timeFunc();
        var b = timeFunc();
        if (a<b) {
            diffs.push(b-a);
        }
    }
    return Math.min.apply(this, diffs);
};

module.exports = measurePrecision;
