(function () {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method;
    this._url = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (body) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;

        // 发送前的拦截
        window.postMessage({
          source: "xhr-interceptor",
          stage: "beforeSend",
          payload: {
            method: this._method,
            url: this._url,
            body: parsed
          }
        }, "*");

        console.log("拦截到XHR发送:", parsed);
      } catch (e) {
        console.warn("解析body失败:", e);
      }
    }

    // 添加请求完成后的监听
    this.addEventListener("load", () => {
      try {
        window.postMessage({
          source: "xhr-interceptor",
          stage: "onLoad",
          payload: {
            method: this._method,
            url: this._url,
            response: this.responseText,
            status: this.status
          }
        }, "*");

        console.log("XHR 请求完成:", this.responseText);
      } catch (e) {
        console.warn("处理load事件失败:", e);
      }
    });

    return originalSend.apply(this, arguments);
  };
})();
