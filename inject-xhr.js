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

        window.postMessage({
          source: "xhr-interceptor",
          payload: {
            method: this._method,
            url: this._url,
            body: parsed
          }
        }, "*");

        console.log("拦截到XHR并发送给content.js:", parsed);
      } catch (e) {
        console.warn("解析body失败:", e);
      }
    }

    return originalSend.apply(this, arguments);
  };
})();
