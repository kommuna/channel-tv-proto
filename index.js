var apiKey = '8daacf6fbb35226a5bdf363fa8daa6fd';

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
};

Slideshow.prototype.createImage = function(img) {
	$img = $(img)
			.css({ opacity: 0, width: img.width, height: img.height });
	return $img;
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
		self.createImage(img)
	      .appendTo(self.$root)
		  .fadeTo(self.duration, 1);
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
		$(img1).fadeTo(self.duration, 0, function() {
		  $(img1).remove();
		  self.createImage(img2)
	        .appendTo(self.$root)
		    .fadeTo(self.duration, 1, function() { setTimeout(function() { self.showNext(); }, self.lifetime); });
		});
	});
};



var ss = null;

$(document).ready(function() {
  //$("#images").hide();
  ss = new Slideshow($("#images"));
  $.ajax("https://api.flickr.com/services/rest",
  {
	//data: { method: "flickr.photos.search", "api_key": apiKey, tags: "inspireme", format: "json", media: "photos", per_page: 50 },
	data: { method: "flickr.groups.pools.getPhotos", "api_key": apiKey, group_id: "23854677@N00", format: "json", per_page: 100 },
	type: "get",
    dataType: 'jsonp',
	jsonpCallback: 'jsonFlickrApi',
    success: function(data) {
      console.log(data);
	  var imageData = new Array();
      $.each(data.photos.photo, function(i,item) {
		var src = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_c.jpg";
		imageData[i] = { src: src, title: item.title };
      });
      ss.start(imageData);
    }
  });
});