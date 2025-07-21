

// 扩展按钮点击事件
chrome.action.onClicked.addListener((tab) => {
  // 向当前活动的标签页发送 TOGGLE_IFRAME 消息
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_IFRAME" });
});



