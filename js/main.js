function create_node(element_type, attribute_map, innerHTML) {
  node = document.createElement(element_type)
  for(key in attribute_map)
  {
    node[key] = attribute_map[key] 
  }
  return node
}

function create_date_node(published_date_diff) {
  span = create_node("span", {"className": "style-scope ytd-video-meta-block",
                              "innerHTML": published_date_diff})
  div = create_node("div", {"id": "metadata-line", 
                            "className": "style-scope ytd-video-meta-block"})
  template = create_node("template", {"is": "dom-repeat",
                                      "className": "style-scope ytd-video-meta-block",
                                      "innerHTML": "#document-fragment"})
  template.setAttribute("strip-whitespace", true)

  div.appendChild(span)
  div.appendChild(template)
  return div
}

function get_video_time_diff(video_payload)
{
    var autoplay_video, video_info_spans, published_date_diff, video_time, video_title, video_info_with_date, video_author
    var video_prefix, video_time_index, video_title_index
    if (video_payload.nodeName == "YTD-COMPACT-AUTOPLAY-RENDERER")
      autoplay_video = 1
    else
      autoplay_video = 0
    video_info_spans = video_payload.children[autoplay_video].getElementsByTagName('span')
    // console.log(video_info_spans)
    published_date_diff = "error"
    if (video_info_spans.length > 0) {
      video_time = video_info_spans[0].getAttribute('aria-label')
      // console.log("video-time", video_time)
      video_title = video_info_spans[1].getAttribute('title')
      // console.log("video_title", video_title)
      video_info_with_date = video_info_spans[1].getAttribute('aria-label')
      // console.log("video_info_with_date", video_info_with_date)
      video_author = video_payload.children[autoplay_video].getElementsByTagName('yt-formatted-string')[0].innerHTML
      // console.log("video_author", video_author)
      // if (video_time == null || video_title == null || video_info_with_date == null || video_author == null)
      //   {
      //     console.log("fucked up")
      //     main('index')
      //     return
      //   }
      video_prefix = video_title + " by " + video_author
      // console.log("video_prefix", video_prefix)
      video_title_index = video_info_with_date.indexOf(video_prefix) + video_prefix.length
      // console.log("video_title_index", video_title_index)
      video_time_index = video_info_with_date.indexOf(video_time)
      // console.log("video_time_index", video_time_index)
      published_date_diff = video_info_with_date.substring(video_title_index, video_time_index).trim(' ')
      // console.log("published_date_diff", published_date_diff)
    }
  return published_date_diff
}

function display_date(video_payload) {
  published_date_diff = get_video_time_diff(video_payload)
  date_node = create_date_node(published_date_diff)
  if (video_payload.nodeName == "YTD-COMPACT-AUTOPLAY-RENDERER")
    autoplay_video = 1
  else
    autoplay_video = 0
  pre_node_path = video_payload.children[autoplay_video].getElementsByTagName('ytd-video-meta-block')[0].children[0]
  if (pre_node_path.children.length < 3)
  {
    pre_node_path.appendChild(date_node)
  }  
}

function show_more_mutation() {
  var show_more = document.getElementById('items')
  var observerConfig = {childList: true}  
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if ( mutation.type == 'childList' ) {
          // console.log("running");
        if (mutation.addedNodes.length > 1)
        {
          for(i=3; i<10; i+=2)
          {
            try
              {
                  setTimeout(function() {
                    main('items');
                }, 1000*i)
              }
            catch (err)
              {
                continue
              }  
          }
        }
      }
    });
  });

  observer.observe(show_more, observerConfig);
  
}

function run_main_and_mutation(all_mutation) {
  // id 'items' contains the list of all related videos 
  setTimeout(function () {
    main('items')  
  }, 5000)
  setTimeout(function () {
    show_more_mutation()
  }, 5000)
  if(all_mutation)
  {
    setTimeout(function (){
      watch_related_mutation()
    }, 7000)
  }
}

function watch_related_mutation() {
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        if(mutation.addedNodes[i].innerHTML != undefined)
        {
          if(mutation.addedNodes[i].innerHTML.indexOf("items") > -1)
          {
            run_main_and_mutation(false)
          }
        }
      }
    })
  })
  var observerConfig = {childList: true, subtree: true, attributes: false, characterData: false}
  observer.observe(document.getElementById('content'), observerConfig)
}

function main(tag) {
  try {
    var video_payload, node_name
    var sidebar_section = document.getElementById(tag)
    // length of total video tabs on side-bar (without show more)
    var len = sidebar_section.children.length
      for(var video_index=0; video_index<len; video_index++)
      { 
        video_payload = sidebar_section.children[video_index]
        node_name = video_payload.nodeName
        if(node_name == "YTD-COMPACT-PLAYLIST-RENDERER")
          {
            // this defines it is a playlist
            continue
          }
          // console.log(video_index, "--->", video_payload)
          display_date(video_payload)
      }
    }
    catch (err)
    {
      console.log("Not yet ready ")
      setTimeout(function() {
          main('index')
      }, 5000);
      console.log("Error for video index ", err)
    }
}

function run()
{

}

var prev = window.location.href
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var curr = request.data.url
  if (request.data.url != prev && prev.indexOf('watch') == -1 && request.data.url.indexOf('watch') > -1 ){
    console.log("URL CHANGED: " + request.data.url);
    setTimeout(function () {
      run_main_and_mutation(false)  
    }, 5000)
    prev = curr
    console.log("new prev = " + prev)
  }
  // sendResponse("gotcha");
});

if(window.location.href.indexOf('watch') > -1){
  setTimeout(function(){
      run_main_and_mutation(true)
    }, 4000)
}
