const menu = document.getElementById("menu");
const addRootBtn = document.getElementById("add-root");
const saveBtn = document.getElementById("save-btn");

let interceptConditions = {};  // 用于存储拦截器的条件（以时间戳为键）
let pendingRequests = {};      // 用于暂存拦截到的XHR请求
let items = {};                // 用于暂存响应数据

// 创建菜单项（根或子）
function createMenuItem(label = "新菜单", isChild = false, condition = {}, timestamp = null) {
  const li = document.createElement("li");
  const menuId = timestamp || Date.now().toString();
  li.dataset.menuId = menuId;
  if (isChild) li.classList.add("child");

  const div = document.createElement("div");
  div.className = "menu-item";
  div.dataset.timestamp = menuId;

  const input = document.createElement("input");
  input.value = label;

  const addBtn = document.createElement("button");
  addBtn.textContent = isChild ? "🔍" : "＋";
  addBtn.onclick = () => {
    if (isChild) {
      const current = interceptConditions[menuId];
      if (!current || !current.body?.query) {
        alert("当前项未设置有效条件！");
        return;
      }
      const queryString = encodeURIComponent(JSON.stringify(current.body));
      const jumpUrl = `https://poe.game.qq.com/trade/search?q=${queryString}`;
      window.open(jumpUrl, '_blank');
    } else {
      let name = "子菜单";
      if (Object.keys(items).length !== 0) {
        items = JSON.parse(items);
        name = `${items.result[0].item.typeLine}-${items.result[0].item.name}`;
      }
      const { li: childLi } = createMenuItem(name, true, {}, menuId);
      li.appendChild(childLi);

      interceptConditions[menuId] = interceptConditions[menuId] || [];
      interceptConditions[menuId].push({});
    }
  };

  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑";
  delBtn.onclick = () => {
    const id = li.dataset.menuId;
    delete interceptConditions[id];
    localStorage.setItem("interceptConditions", JSON.stringify(interceptConditions));
    li.remove();
    alert(`菜单项已删除，并从保存的数据中移除！`);
  };

  const saveChildBtn = document.createElement("button");
  saveChildBtn.textContent = "💾";
  saveChildBtn.onclick = () => {
    interceptConditions[menuId] = pendingRequests;
    localStorage.setItem("interceptConditions", JSON.stringify(interceptConditions));
    alert(`ID: ${menuId} 条件已保存！`);
  };

  div.appendChild(input);
  div.appendChild(addBtn);
  if (isChild) div.appendChild(saveChildBtn);
  div.appendChild(delBtn);
  li.appendChild(div);

  return { li, menuId };
}

// 添加根菜单项
addRootBtn.onclick = () => {
  const { li, menuId } = createMenuItem();
  menu.appendChild(li);
  interceptConditions[menuId] = [];  // 初始化条件
};

// 保存配置（序列化输出）
saveBtn.onclick = () => {
  validateInterceptConditionsStructure();
  save();
};

// 保存菜单和条件
function save() {
  function extract(ul) {
    return [...ul.children].map(li => {
      const input = li.querySelector("input");
      const children = [...li.children]
        .filter(child => child.tagName === "LI")
        .map(childLi => extract({ children: [childLi] }))
        .flat();

      return {
        name: input?.value || "未命名",
        timestamp: li.dataset.menuId,
        children
      };
    });
  }
  console.log("当前的 interceptConditions:", interceptConditions);
  const data = extract(menu);
  localStorage.setItem("sidebarData", JSON.stringify(data));
  localStorage.setItem("interceptConditions", JSON.stringify(interceptConditions));
  
  
  let  test =	localStorage.getItem("interceptConditions");
  let tym = JSON.parse(localStorage.getItem("interceptConditions") || "{}");

  alert("已保存！");
}

// 校验结构，确保拦截条件有效
function validateInterceptConditionsStructure() {
  const allMenuItems = menu.querySelectorAll("li[data-menu-id]");
  allMenuItems.forEach(li => {
    const id = li.dataset.menuId;
    if (!interceptConditions[id]) interceptConditions[id] = [];
  });
}

// 加载本地存储的菜单和条件
function load() {
  let  test =	localStorage.getItem("interceptConditions");
  const savedData = JSON.parse(localStorage.getItem("sidebarData") || "[]");
  interceptConditions = JSON.parse(localStorage.getItem("interceptConditions") || "{}");

  const render = (items, parent) => {
    items.forEach(item => {
      const menuId = item.timestamp || Date.now().toString();
      const { li } = createMenuItem(item.name, parent !== menu, interceptConditions[menuId] || {}, menuId);

      parent.appendChild(li);

      // 如果有子菜单，则递归渲染子菜单
      if (item.children?.length) {
        render(item.children, li);
      }
    });
  };

  render(savedData, menu);
}

// 校验加载的数据结构
function validateLoadedDataStructure() {
  const allMenuItems = menu.querySelectorAll("li[data-menu-id]");
  allMenuItems.forEach(li => {
    const id = li.dataset.menuId;
    if (!interceptConditions[id]) interceptConditions[id] = [];
  });
}

validateLoadedDataStructure();
load();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "interceptXhr") {
    console.log("sidebar 收到 xhr 数据:", message.data);
    if (message.stage === "beforeSend") {
      pendingRequests = {
        method: message.data.method,
        url: message.data.url,
        body: message.data.body,
      };
      items = {};
    } else if (message.stage === "onLoad") {
      items = message.data.response;
    }
  }
});
