function create_node(element_type, attribute_map, innerHTML) {
  var node = document.createElement(element_type)
  for(key in attribute_map)
  {
    node[key] = attribute_map[key] 
  }
  return node
}

function create_date_node(published_date_diff) {
  var span = create_node("span", {"className": "style-scope ytd-video-meta-block",
                              "innerHTML": published_date_diff})
  var div = create_node("div", {"id": "metadata-line", 
                            "className": "style-scope ytd-video-meta-block"})
  var template = create_node("template", {"is": "dom-repeat",
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
    video_info_span = video_payload.children[autoplay_video].querySelectorAll('#video-title.ytd-compact-video-renderer')[0]
    video_time_span = video_payload.children[autoplay_video].querySelectorAll('.ytd-thumbnail-overlay-time-status-renderer')[0]
    published_date_diff = "error"
    video_time = video_time_span.getAttribute('aria-label')
    video_title = video_info_span.getAttribute('title')
    video_info_with_date = video_info_span.getAttribute('aria-label')
    video_author = video_payload.children[autoplay_video].getElementsByTagName('yt-formatted-string')[0].innerHTML
    video_prefix = video_title + " by " + video_author
    video_title_index = video_info_with_date.indexOf(video_prefix) + video_prefix.length
    video_time_index = video_info_with_date.indexOf(video_time)
    published_date_diff = video_info_with_date.substring(video_title_index, video_time_index).trim(' ')
  return published_date_diff
}

function display_date(video_payload) {
  var published_date_diff = get_video_time_diff(video_payload)
  console.log("published_date_diff -> ", published_date_diff)
  var date_node = create_date_node(published_date_diff)
  if (video_payload.nodeName == "YTD-COMPACT-AUTOPLAY-RENDERER" || video_payload.nodeName == "YTD-COMPACT-RADIO-RENDERER")
    autoplay_video = 1
  else
    autoplay_video = 0
  var contains_date = video_payload.children[autoplay_video].querySelectorAll('#metadata-line.ytd-video-meta-block')
  var pre_node_path = video_payload.children[autoplay_video].getElementsByTagName('ytd-video-meta-block')[0].children[0]
  if (contains_date.length < 2)
  {
    pre_node_path.appendChild(date_node)
  } 
  else if (contains_date.length == 2)
  {
    var prev_child = pre_node_path.children[2]
    if (prev_child.firstElementChild.innerText != published_date_diff)
    {
      pre_node_path.removeChild(prev_child)
      pre_node_path.appendChild(date_node)
    }
  }
}

function show_more_mutation() {
  var show_more = document.getElementById('items')
  var observerConfig = {childList: true}  
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if ( mutation.type == 'childList' ) {
          main('items');
      }
    });
  });

  observer.observe(show_more, observerConfig);
  
}

function run_main_and_mutation(all_mutation) {
  // id 'items' contains the list of all related videos 
  main('items')
  show_more_mutation()
  if(all_mutation)
  {
    watch_related_mutation()
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
    // var sidebar_section = document.getElementById(tag)
    var sidebar_section = document.querySelectorAll('#items.ytd-watch-next-secondary-results-renderer')[0]
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
          try
          {
            display_date(video_payload)
          }
          catch (err)
          {
            continue
          }
      }
    }
    catch (err)
    {
      console.log("Error for video index ", err)
    }
}

var prev = window.location.href
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var curr = request.data.url
  if (request.data.url != prev && prev.indexOf('watch') == -1 && request.data.url.indexOf('watch') > -1 ){
    console.log("URL CHANGED: " + request.data.url);
    setTimeout(function () {
      run_main_and_mutation(true)  
    }, 3000)
    prev = curr
    console.log("new prev = " + prev)
  }
});

if(window.location.href.indexOf('watch') > -1){
  run_main_and_mutation(true)
}
