// This method creates new html node with the information provided
function create_node(element_type, attribute_map, innerHTML) {
  var node = document.createElement(element_type)
  for(key in attribute_map)
  {
    node[key] = attribute_map[key] 
  }
  return node
}

// This method created the date node which will be appended to page.
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

// This method gets the time difference from html content which needs to be published.
function get_video_time_diff(video_payload)
{
  var autoplay_video, video_info_spans, published_date_diff, video_time, video_title, video_info_with_date, video_author
  var video_prefix, video_time_index, video_title_index
  if (video_payload.nodeName == "YTD-COMPACT-AUTOPLAY-RENDERER" || video_payload.nodeName == "YTD-COMPACT-RADIO-RENDERER") {
    autoplay_video = 1
  }
  else {
    // video_payload.nodeName = YTD-COMPACT-VIDEO-RENDERER
    autoplay_video = 0
  }

  // gets the video span info
  video_info_span = video_payload.children[autoplay_video].querySelectorAll('#video-title.ytd-compact-video-renderer')[0]
  // gets the video time info
  video_time_span = video_payload.children[autoplay_video].querySelectorAll('.ytd-thumbnail-overlay-time-status-renderer')[0]
  // gets the video time
  video_time = video_time_span.getAttribute('aria-label')
  // gets video title
  video_title = video_info_span.getAttribute('title')
  // gets the video info with date
  video_info_with_date = video_info_span.getAttribute('aria-label')
  // gets the video author
  video_author = video_payload.children[autoplay_video].getElementsByTagName('yt-formatted-string')[0].innerHTML
  // gets the video author
  video_prefix = video_title + " by " + video_author

  video_title_index = video_info_with_date.indexOf(video_prefix) + video_prefix.length
  video_time_index = video_info_with_date.indexOf(video_time)

  // published date is between title + author + published_date + time, so getting it from there. 
  published_date_diff = video_info_with_date.substring(video_title_index, video_time_index).trim(' ')
  // console.log("details: " + video_title + " --> " + video_info_with_date + " --> " + video_author + " --> " + published_date_diff)
  return published_date_diff
}

// This method displays the date in the page.
function display_date(video_payload) {
  var published_date_diff = get_video_time_diff(video_payload)
  var date_node = create_date_node(published_date_diff)
  if (video_payload.nodeName == "YTD-COMPACT-AUTOPLAY-RENDERER" || video_payload.nodeName == "YTD-COMPACT-RADIO-RENDERER") {
    autoplay_video = 1
  }
  else {
    autoplay_video = 0
  }
  // this stores the list of nodes which whill contain date
  var node_list_with_date = video_payload.children[autoplay_video].querySelectorAll('#metadata-line.ytd-video-meta-block')
  // this contains the div with date, views and author
  var div_with_date = video_payload.children[autoplay_video].getElementsByTagName('ytd-video-meta-block')[0].children[0]
  if (node_list_with_date.length < 2)
  {
    // if date is not present then append.
    div_with_date.appendChild(date_node)
  } 
  else if (node_list_with_date.length == 2)
  {
    // if date is already present then it should be replaced.
    var prev_child = div_with_date.children[2]
    if (prev_child.firstElementChild.innerText != published_date_diff)
    {
      div_with_date.removeChild(prev_child)
      div_with_date.appendChild(date_node)
    }
  }
}

// This method defins a long running task which ends when the node count >= 25. This is done to ensure all the nodes are covered.
function run_main_and_mutation(all_mutation) {
  // This stores if the node already been considered to add date or not and will be processed accordingly.
  var node_with_date_map = {}
  // id 'items' contains the list of all related videos
  var checkExist = setInterval(function() {
   if (document.querySelectorAll('#items.style-scope.ytd-watch-next-secondary-results-renderer')) {
      // hack: clear interval when sidebar videos are more than 25. This is based on assumption that sidebar can have max of 40 videos.
      if(Object.keys(node_with_date_map).length >= 25) {
        clearInterval(checkExist)
      }
      prev_node_date_map = main(node_with_date_map)
   }
  }, 3000); // check every 300ms
}

// Main method which updates the nodes which have already been covered with map. It also renders the date.
function main(node_with_date_map) {
  try {
      var video_payload, node_name
      var sidebar_section = document.querySelectorAll('#items.style-scope.ytd-watch-next-secondary-results-renderer')[0]
      // length of total video tabs on side-bar (without show more)
      var len = sidebar_section.children.length
      for(var video_index=0; video_index<len; video_index++)
      { 
        if(node_with_date_map[video_index]) {
          // continue if node has the date.
          continue
        }
        video_payload = sidebar_section.children[video_index]
        node_name = video_payload.nodeName
        if(node_name === "YTD-COMPACT-PLAYLIST-RENDERER" || video_payload.nodeName == "YTD-COMPACT-RADIO-RENDERER")
          {
            // this defines it is a playlist
            continue
          }
          try
          {
            display_date(video_payload)
            // node map will only be updated when date has been displayed.
            node_with_date_map[video_index] = true
          }
          catch (err)
          {
            console.log("[Youtube++]: Error in display date for video index ", video_index, err)
            continue
          }
      }
    }
    catch (err)
    {
      console.log("[Youtube++]: Error main for video index ", video_index, err)
    }
    return node_with_date_map
}

// This will run when there url changes
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  run_main_and_mutation(true)
});

