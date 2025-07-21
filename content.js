let sidebarVisible = false;
let sidebarIframe = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "TOGGLE_IFRAME") {
    if (sidebarVisible) {
      sidebarIframe.remove();
      sidebarIframe = null;
	  document.body.style.marginRight = "0px"; 
    } else {
      injectSidebar();
	  document.body.style.marginRight = "280px"; 
    }
    sidebarVisible = !sidebarVisible;
  }
});

function injectSidebar() {
  const injectScript = (src) => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL(src);
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  };
  injectScript("inject-xhr.js");

  sidebarIframe = document.createElement("iframe");
  sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
  sidebarIframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 280px;
    height: 100%;
    border: none;
    z-index: 9999;
  `;
  document.body.appendChild(sidebarIframe);
}
