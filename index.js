var apiKey = '[YOUR API KEY]';

$.getJSON("http://api.flickr.com/services/feeds/groups_pool.gne?id=675729@N22&lang=en-us&format=json&jsoncallback=?", function(data){
  $.each(data.items, function(i,item){
    $("<img/>").attr("u", "image").attr("src", item.media.m).appendTo("#images")
      .wrap("<div></div>");
  });
});
