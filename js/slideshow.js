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
    this.transitionOn = {opacity: 1};
    this.transitionOff = {opacity: 0};
    this.onImageReady = null;
    this.onImageDismissed = function(img) { $(img).remove(); }
};

Slideshow.prototype.createImage = function(img) {
    return $(img).css({ width: img.width, height: img.height });
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
    this.imagePromises[0].done(function(img) {
        self.onStartShowImage && self.onStartShowImage(self.data[self.index]);
        var $img = self.createImage(img);
        self.onImageReady && self.onImageReady(img);
        self.activeImage = $img;
        self.transitionOn(img, self.duration, function() {
            self.onShowImage && self.onShowImage(self.data[self.index]);
        });
    });
    setTimeout(function() { self.showNext(); }, self.lifetime);
};

Slideshow.prototype.showNext = function() {
    // current image is supposed to be loaded. load next
    var prevIndex = this.index;
    this.index++;
    if (this.index >= this.imageCount) {
        this.index = 0;
    }
    var self = this;
    $.when(this.imagePromises[prevIndex], this.imagePromises[this.index]).done(function(img1, img2) {
        self.onStartHideImage && self.onStartHideImage(self.data[self.prevIndex]);
        self.transitionOff(img1, self.duration, function() {
          self.onStartShowImage && self.onStartShowImage(self.data[self.index]);
          var aImg = self.createImage(img2);
          self.onImageReady && self.onImageReady(img2);
          self.activeImage = aImg;
          self.transitionOn(img2, self.duration, function() {
            self.onImageDismissed && self.onImageDismissed(img1);
            if (self.onShowImage) {
              self.onShowImage(self.data[self.index]);
            }
            setTimeout(function() { self.showNext(); }, self.lifetime);
          });
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
