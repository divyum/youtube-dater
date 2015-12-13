function find_date(xhr) {
  var start = xhr.responseText.indexOf('watch-time-text')
  var end = xhr.responseText.indexOf('</strong', start)
  var published_date = xhr.responseText.substring(start+"watch-time-text".length+2, end)
  return published_date
}

function make_node(date) {
  var node = document.createElement("span");
  node.className = "stat view-count"
  var textnode = document.createTextNode(date);
  node.appendChild(textnode)
  return node
}

function loadURL(url, pos, append_aft) {
  var date, node;
  var xhr=new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if(xhr.status == 200 && xhr.readyState == 4){
      date = find_date(xhr);
      node = make_node(date);
      append_aft.appendChild(node)
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}

function main(tag) {
  if(tag == 'watch-related')
  {
    sidebar_section = document.getElementById(tag)
  }
  else
  {
    sidebar_section = document.getElementsByClassName(tag)[0]
  }

  len = sidebar_section.children.length
  for(var i=0; i<len; i++)
  {
    var url, append_aft
    if(tag == 'watch-related')
    {
      playlist = sidebar_section.children[i].className.indexOf('compact-video')
      if(playlist == -1)
      {
        continue
      }
    }

    el_before_date = sidebar_section.children[i].children[0].children[0].children
    has_date_pub = el_before_date[el_before_date.length-1].innerHTML.indexOf('Published')
    has_date_up = el_before_date[el_before_date.length-1].innerHTML.indexOf('Uploaded')

    if(has_date_pub >= 0 || has_date_up >=0 )
    {
      continue
    }

    if(tag == 'watch-related')
    {
      url = sidebar_section.children[i].children[0].children[0].getAttribute('href')
      append_aft = sidebar_section.children[i].children[0].children[0]
    }
    else
    {
      url = sidebar_section.children[i].children[0].children[0].children[0].getAttribute('href')
      append_aft = sidebar_section.children[i].children[0].children[0].children[0]
    }
    loadURL(url, i, append_aft)
  }
}

var prev = window.location.href
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.data.url != prev && request.data.url.indexOf('watch') > -1 ){
      // console.log("URL CHANGED: " + request.data.url);
      setTimeout(function(){ 
        main('watch-related')
        main('watch-sidebar-body')
      }, 2000);
      prev = window.location.href
      console.log("new prev = " + prev)
    }
    sendResponse("gotcha");
});

if(window.location.href.indexOf('watch') > -1){
main('watch-related')
main('watch-sidebar-body')
}
