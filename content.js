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
  }else if (message.type === "xhrBodyData") {
    const { method, url, body } = message;
    console.log("接收到来自背景页的XHR请求数据：", method, url, body);

    // 创建 iframe 并向其发送消息
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("iframe.html"); // 你的 iframe 页面
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    document.body.appendChild(iframe);

    // 向 iframe 发送请求数据
    iframe.onload = () => {
      iframe.contentWindow.postMessage({ method, url, body }, "*");
    };
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
  
  
	// 监听页面发送过来的postMessage
	window.addEventListener("message", (event) => {
	  if (event.source !== window || !event.data || event.data.source !== "xhr-interceptor") return;

	  chrome.runtime.sendMessage({
		type: "interceptXhr",
		stage:event.data.stage,
		data: event.data.payload
	  });
	  const firstName = document.querySelector('.itemName');
		const firstType = document.querySelector('.itemName.typeLine');
	});

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
