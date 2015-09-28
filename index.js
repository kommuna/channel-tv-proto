var apiKey = '[YOUR API KEY]';

function startSlideshow() {
}

$(document).ready(function() {
  $.getJSON("http://api.flickr.com/services/feeds/groups_pool.gne?id=675729@N22&lang=en-us&format=json", function(data) {
  $.each(data.items, function(i,item) {
    $("<img/>")
	  .attr("u", "image")
	  .attr("src", item.media.m)
	  .attr("title", item.media.title)
	  .appendTo("#images")
      .wrap("<div></div>");
  });
  startSlideshow();
});
});