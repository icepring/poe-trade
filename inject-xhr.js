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
        window.dispatchEvent(
          new CustomEvent("xhr-body", { detail: { method: this._method, url: this._url, body: parsed } })
        );
      } catch (error){
        console.log("拦截到XHR请求失败：", error);
      }
    }
    return originalSend.apply(this, arguments);
  };
})();
