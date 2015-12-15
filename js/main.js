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

function show_more_mutation() {
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if ( mutation.type == 'childList' ) {
        if (mutation.addedNodes.length > 1) {
          main('watch-more-related')
        }
      }
    });
  });
  var show_more = document.getElementById('watch-more-related')
  var observerConfig = {childList: true}
  observer.observe(show_more, observerConfig);
}

function run_main_and_mutation(all_mutation) {
  main('watch-related')
  main('watch-sidebar-body')
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
          if(mutation.addedNodes[i].innerHTML.indexOf("watch-related") > -1)
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
  if(tag == 'watch-related' || tag == 'watch-more-related')
  {
    sidebar_section = document.getElementById(tag)
    len = document.querySelectorAll('#' + tag + '>li').length
  }
  else
  {
    if(document.getElementsByClassName(tag).length > 1){
      sidebar_section = document.getElementsByClassName(tag)[0]
      len = sidebar_section.children.length
    }
    else
      return
  }

  for(var i=0; i<len; i++)
  {
    var url, append_aft
    if(tag == 'watch-related' || tag == 'watch-more-related')
    {
      playlist = sidebar_section.children[i].className.indexOf('compact-video')
      if(playlist == -1)
      {
        continue
      }
    }

    if(tag == 'watch-related' || tag == 'watch-more-related')
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
  var curr = request.data.url
  if (request.data.url != prev && prev.indexOf('watch') == -1 && request.data.url.indexOf('watch') > -1 ){
    console.log("URL CHANGED: " + request.data.url);
    setTimeout(function(){
      run_main_and_mutation(true)
    }, 2000);
    prev = curr
    console.log("new prev = " + prev)
  }
  sendResponse("gotcha");
});

if(window.location.href.indexOf('watch') > -1){
run_main_and_mutation(true)
}
