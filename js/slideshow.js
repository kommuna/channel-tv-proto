// http://aboutcode.net/2013/01/09/load-images-with-jquery-deferred.html
$.loadImage = function(url) {
  // Define a "worker" function that should eventually resolve or reject the deferred object.
  var loadImage = function(deferred) {
    var image = new Image();
     
    // Set up event handlers to know when the image has loaded
    // or fails to load due to an error or abort.
    image.onload = loaded;
    image.onerror = errored; // URL returns 404, etc
    image.onabort = errored; // IE may call this if user clicks "Stop"
     
    // Setting the src property begins loading the image.
    image.src = url;
     
    function loaded() {
      unbindEvents();
      // Calling resolve means the image loaded sucessfully and is ready to use.
      deferred.resolve(image);
    }
    function errored() {
      unbindEvents();
      // Calling reject means we failed to load the image (e.g. 404, server offline, etc).
      deferred.reject(image);
    }
    function unbindEvents() {
      // Ensures the event callbacks only get called once.
      image.onload = null;
      image.onerror = null;
      image.onabort = null;
    }
  };
   
  // Create the deferred object that will contain the loaded image.
  // We don't want callers to have access to the resolve() and reject() methods, 
  // so convert to "read-only" by calling `promise()`.
  return $.Deferred(loadImage).promise();
};

var Slideshow = function($root) {
    this.$root = $root;
    this.imagePromises = [];
    this.index = 0;
    this.duration = 3000;
    this.lifetime = 5000;
    this.showTitles = false;
    this.paused = false;
    this.onWelcome = function(img, duration, next) {
        $(img).transition({opacity:1}, duration, next);
    };
    this.onTransition = function(img, duration, next) {
        $(img).transition({opacity:1}, duration, next);
    };
    this.onImageDismissed = function(img) { $(img).remove(); }
    this.currentEffect = null;
};

Slideshow.prototype.createImage = function(img) {
    return $(img).css({ width: img.width, height: img.height });
};

Slideshow.prototype.promiseFor = function(index) {
    return $.loadImage(imageData[index]);
};

Slideshow.prototype.start = function(imageData) {
    this.data = imageData;
    var promises = this.imagePromises;
    $.each(imageData, function(i, data) {
        promises[i] = $.loadImage(data.src);
    });
    this.$root.show();
    this.index = 0;
    this.imageCount = imageData.length;
    var self = this;
    this.$root.queue(function(next) {
        self.imagePromises[0].done(function(img) {
            var $img = self.createImage(img);
            self.activeImage = $img;
            self.onWelcome && self.onWelcome(img, self.duration, function() {
                self.delay(self.lifetime, function() { self.showNext(); });
                next();
            });
        });
    });
};

Slideshow.prototype.delay = function(duration, callback) {
    this.currentEffect = new Object();
    this.currentEffect.effect = callback;
    this.currentEffect.timeout = setTimeout(this.currentEffect.effect, duration);
    this.currentEffect.started = new Date().getTime();
};

// invoke callback when slideshow is idle (not moving, eg showing static picture).
Slideshow.prototype.invokeWhenIdle = function(callback) {
    var busy = this.currentEffect != null;
    if (busy) {
        clearTimeout(this.currentEffect.timeout);
    }
    callback();
    if (busy) {
        var remaining = Math.floor((new Date().getTime() - this.currentEffect.started)/1000);
        if (remaining > 0) {
            this.currentEffect.timeout = setTimeout(this.currentEffect.effect, remaining);
        }
    }
};

Slideshow.prototype.showNext = function() {
    // current image is supposed to be loaded. load next
    this.currentEffect = null;
    var prevIndex = this.index;
    this.index++;
    if (this.index >= this.imageCount) {
        this.index = 0;
    }
    var self = this;
    $.when(this.imagePromises[prevIndex], this.imagePromises[this.index]).done(function(img1, img2) {
        self.onTransition && self.onTransition(img1, img2, self.duration, function() {
            self.activeImage = self.createImage(img2);
            self.delay(self.lifetime, function() { self.showNext(); });
        });
    });
};

Slideshow.prototype.toggle = function() {
    if (this.paused) {
        this.resume();
    } else {
        this.pause();
    }
}

Slideshow.prototype.pause = function() {
    this.activeImage && this.activeImage.pause();
    this.onPause && this.onPause();
}

Slideshow.prototype.resume = function() {
    this.activeImage && this.activeImage.resume();
    this.onResume && this.onResume();
}

Slideshow.prototype.bind = function(event, handler) {
    this.$root.on(event, handler);
}
