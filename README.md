Fourier Transform - Evolutionary Art
======================================

It's very easy to generate random images by generating thousands of random pixels, but this results in images that aren't very aesthetically pleasing. Art revolves around patterns, and using randomness in the spatial domain removes the possibility of patterns occuring!

The question is, how do you generate a random image that still contains attractive patterns? I've been playing around with Fourier transforms recently, and after reading about all the cool properties of the "frequency domain", I wondered how randomness there would translate back into space.

If a totally random collection of high and low frequency sinusoids are inverse Fourier transformed back into an image, then the result is a bunch of noise, per usual. But if you instead only include low frequency sinusoids, then a clear fluid like pattern results. This web app generates random images through this process, and evolves them with a genetic algorithm. You as the user select which of a few random images is your favorite, and it's used as the seed for subsequent generations. Repeat enough, and you'll get a decently attractive image.

The demo only shows black and white images, but this project already contains the functionality for multi-color pictures. Each picture is defined by a configurable number of channels (just 1 in the black and white case), the results of which are used to compute each pixel's color. You specify how the channels interact to create an RGB array.