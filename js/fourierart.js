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
var dims = [256, 256];
var radius = 5;
var maxMagnitude = 2*1000*1000;
var mutRate = 0.05;

/*************
 * constants */

/*********************
 * working variables */
var canvas, ctx;
var h_hats;
var $h, h_;

/******************
 * work functions */
function initFourierArt() {
    //event listeners
    $s('#random-pic-btn').addEventListener('click', function() {
        //generate random Fourier weightings
        h_hats = [];
        var N = dims[1], M = dims[0];
        for (var n = 0; n < N; n++) {
            for (var m = 0; m < M; m++) {
                var dist2 = Math.pow(n-N/2, 2)+Math.pow(m-M/2, 2);
                if (dist2 < radius*radius) {
                    h_hats.push(getRandFourierCoeff());
                } else {
                    h_hats.push(new Complex(0, 0));
                }
            }
        }

        //store the Fourier weights in a nice function
        $h = function(n, m) {
            if (arguments.length === 0) return h_hats;

            var idx = n*dims[0] + m;
            return h_hats[idx];
        };

        reconstructFromTransform();
    });

    $s('#morph-btn').addEventListener('click', function() {
        if (!$h()) {
            return alert('Generate an image first.');
        }

        var N = dims[1], M = dims[0];
        for (var n = 0; n < N; n++) {
            for (var m = 0; m < M; m++) {
                var dist2 = Math.pow(n-N/2, 2)+Math.pow(m-M/2, 2);
                if (dist2 < radius*radius && Math.random() < mutRate) {
                    var idx = n*M + m;
                    h_hats[idx] = getRandFourierCoeff();
                }
            }
        }

        reconstructFromTransform();
    });



    //initialize working variables
    canvas = $s('#canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    ctx = canvas.getContext('2d');
    h_hats = [];
    $h = h_ = function() { return false; };
}

function reconstructFromTransform() {
    //invert the artificial Fourier transform
    var h_primes = [];
    invFFT(h_primes, $h());

    //store them in a nice function to match the math
    h_ = function(n, m) {
        if (arguments.length === 0) return h_primes;

        var idx = n*dims[0] + m;
        var val = round(h_primes[idx], 2);
        return Math.max(0, Math.min(255, val));
    };

    //draw the pixels
    var currImageData = ctx.getImageData(0, 0, dims[0], dims[1]);
    for (var n = 0; n < dims[1]; n++) {
        for (var m = 0; m < dims[0]; m++) {
            var idxInPixels = 4*(dims[0]*n + m);
            currImageData.data[idxInPixels+3] = 255; //full alpha
            for (var c = 0; c < 3; c++) { //RGB are the same, lol c++
                currImageData.data[idxInPixels+c] = h_(n, m);
            }
        }
    }
    ctx.putImageData(currImageData, 0, 0);
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
function getRandFourierCoeff() {
    var r = maxMagnitude*Math.random();
    var theta = 2*Math.PI*Math.random();
    return new Complex(r*Math.cos(theta), r*Math.sin(theta));
}

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

/***********
 * objects */
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