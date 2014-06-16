/*******************\
| Fourier Transform |
|  Evolutionary Art |
| @author Anthony   |
| @version 0.1      |
| @date 2014/06/15  |
| @edit 2014/06/15  |
\*******************/

/**********
 * config */
var numcellsx = 3;
var numcellsy = 2;
var cellDim = 128;
var dims = [cellDim*numcellsx, cellDim*numcellsy];

/*************
 * constants */

/*********************
 * working variables */
var canvas, ctx;
var pop;

/******************
 * work functions */
function initFourierArt() {
    //initialize working variables
    canvas = $s('#canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    ctx = canvas.getContext('2d');

    pop = [new FTBeing(cellDim)];
    for (var ai = 1; ai < numcellsx*numcellsy; ai++) {
        pop.push(pop[0].mutate());
    }
    
    updateCanvas(pop);
}

function updateCanvas(generators) {
    var ai = 0;
    var asyncLoopYCells = function(callback) {
        //outer loop work
        var bi = 0;
        var asyncLoopXCells = function(callback) {
            //inner loop work
            var which = ai*numcellsx + bi;
            generators[which].draw(ctx, bi*cellDim, ai*cellDim);
            bi += 1;
            setTimeout(function() { callback(true); }, 6); 
        };
        asyncLoop(numcellsx,
            function(loop) {
                asyncLoopXCells(function(keepGoing) {
                    if (keepGoing) loop.next();
                    else loop.break();
                })
            }, 
            function() { //inner loop finished
                ai += 1;
                setTimeout(function() { callback(true); }, 6); //call outer
            }
        );
    };
    asyncLoop(numcellsy,
        function(loop) {
            asyncLoopYCells(function(keepGoing) {
                if (keepGoing) loop.next();
                else loop.break();
            })
        },
        function() { //outer loop finished
            //
        }
    );
}

function invFFT(sig, transform) {
    rec_invFFT(sig, 0, transform, 0, transform.length, 1);
    for (var ai = 0; ai < sig.length; ai++) {
        sig[ai] = sig[ai].real/sig.length;
    }
}

function rec_invFFT(sig, start, transform, offset, N, s) {
    if (N === 1) {
        sig[start] = transform[offset];
    } else {
        rec_invFFT(sig, start, transform, offset, N/2, 2*s);
        rec_invFFT(sig, start+N/2, transform, offset+s, N/2, 2*s);
        for (var k = 0; k < N/2; k++) {
            var twiddle = cisExp(2*Math.PI*k/N);
            var t = sig[start+k];
            sig[start+k] = t.plus(twiddle.times(sig[start+k+N/2]));
            sig[start+k+N/2] = t.minus(twiddle.times(sig[start+k+N/2]));
        }
    }
}

/********************
 * helper functions */
function cisExp(x) { //e^ix = cos x + i*sin x
    return new Complex(Math.cos(x), Math.sin(x));
}

function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
}

function getRandInt(low, high) { //output is in [low, high)
    return Math.floor(low + Math.random()*(high-low));
}

function round(n, places) {
    var mult = Math.pow(10, places);
    return Math.round(mult*n)/mult;
}

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) return;
            if (index < iterations) {
                index += 1;
                func(loop);
            } else {
                done = true;
                if (callback) callback();
            }
        },
        iteration: function() {
            return index - 1;
        },
        break: function() {
            done = true;
            if (callback) callback();
        }
    };
    loop.next();
    return loop;
}

/***********
 * objects */
function FTBeing(dim, precomp_h_hats) {
    this.N = dim, this.M = dim;
    this.r = 4;
    this.maxMag = 1000*1000;
    this.mutRate = 0.05;

    //generate random Fourier weightings
    this.h_hats = [];
    if (arguments.length < 2) {
        for (var n = 0; n < this.N; n++) {
            for (var m = 0; m < this.M; m++) {
                var dist2 = Math.pow(n-this.N/2, 2);
                    dist2 += Math.pow(m-this.M/2, 2);
                if (dist2 < this.r*this.r) {
                    var h_hat = this.getRandFourierCoeff(Math.sqrt(dist2));
                    this.h_hats.push(h_hat);
                } else {
                    this.h_hats.push(new Complex(0, 0));
                }
            }
        }
    } else {
        this.h_hats = precomp_h_hats;
    }

    //the h primes will be computed when they're needed
    this.h_ = function() { return false; };
}
FTBeing.prototype.getRandFourierCoeff = function(d) {
    var f = d === 0 ? this.r : this.r/d;
    var radius = f*this.maxMag*Math.random();
    var theta = 2*Math.PI*Math.random();
    var ret = new Complex(radius*Math.cos(theta), radius*Math.sin(theta));
    return ret;
};
FTBeing.prototype.computeHPrimes = function() {
    var h_primes = [];
    invFFT(h_primes, this.h_hats);

    //store them in a nice function to match the math
    this.h_ = function(n, m) {
        if (arguments.length === 0) return h_primes;

        var idx = n*this.M + m;
        var val = round(h_primes[idx], 2);
        return Math.max(0, Math.min(255, val));
    };
};
FTBeing.prototype.mutate = function() {
    var new_h_hats = [];
    //change the Fourier coefficients
    for (var n = 0; n < this.N; n++) {
        for (var m = 0; m < this.M; m++) {
            var dist2 = Math.pow(n-this.N/2, 2)+Math.pow(m-this.M/2, 2);
            var idx = n*this.M + m;
            if (dist2 < this.r*this.r && Math.random() < this.mutRate) {
                var new_h_hat = this.getRandFourierCoeff(Math.sqrt(dist2));
                new_h_hats.push(new_h_hat);
            } else {
                new_h_hats.push(this.h_hats[idx]);
            }
        }
    }
    return new FTBeing(this.N, new_h_hats); //N and M should be the same
};
FTBeing.prototype.draw = function(context, x, y) { //(x,y) is the top left corner
    if (!this.h_()) this.computeHPrimes();

    var cw = context.canvas.width, ch = context.canvas.height;
    var currImageData = context.getImageData(0, 0, cw, ch);
    for (var n = 0; n < this.N; n++) {
        for (var m = 0; m < this.M; m++) {
            var idx = 4*(cw*(n+y) + (m+x));
            currImageData.data[idx+3] = 255; //full alpha
            for (var c = 0; c < 3; c++) { //RGB are the same, lol c++
                currImageData.data[idx+c] = this.h_(n, m);
            }
        }
    }
    context.putImageData(currImageData, 0, 0);
}

function Complex(re, im) {
    this.real = re;
    this.imag = im;
}
Complex.prototype.magnitude2 = function() {
    return this.real*this.real + this.imag*this.imag;
};
Complex.prototype.magnitude = function() {
    return Math.sqrt(this.magnitude2());
};
Complex.prototype.plus = function(z) {
    return new Complex(this.real+z.real, this.imag+z.imag);
};
Complex.prototype.minus = function(z) {
    return new Complex(this.real-z.real, this.imag-z.imag);
};
Complex.prototype.times = function(z) {
    if (typeof z === 'object') { //complex multiplication
        var rePart = this.real*z.real - this.imag*z.imag;
        var imPart = this.real*z.imag + this.imag*z.real;
        return new Complex(rePart, imPart);
    } else { //scalar multiplication
        return new Complex(z*this.real, z*this.imag);
    }
};

window.addEventListener('load', initFourierArt);