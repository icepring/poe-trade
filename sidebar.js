const menu = document.getElementById("menu");
const addRootBtn = document.getElementById("add-root");
const saveBtn = document.getElementById("save-btn");

let interceptConditions = [];  // 用于存储拦截器的条件（二维数组）
let pendingRequests = {};      // 用于暂存拦截到的XHR请求

// 用于生成唯一标识符
function generateId(parentIndex, childIndex) {
  return `${parentIndex}-${childIndex}`;  // 使用二维数组的索引来生成唯一标识符
}

function createMenuItem(label = "新菜单", isChild = false, condition = {}, parentIndex = -1, childIndex = -1) {
  const li = document.createElement("li");
  if (isChild) li.classList.add("child");

  const div = document.createElement("div");
  div.className = "menu-item";

  const input = document.createElement("input");
  input.value = label;

  const addBtn = document.createElement("button");
  addBtn.textContent = "＋";
  if (isChild) {
    addBtn.textContent = "🔍";
    addBtn.onclick = () => {
      // todo: 打开与二级菜单相关的条件设置
      alert('点击了条件设置按钮');
    };
  } else {
    addBtn.onclick = () => {
      const { child, p, c } = createMenuItem("子菜单", true, {}, parentIndex, interceptConditions[parentIndex]?.length || 0);
      li.appendChild(child);
      interceptConditions[parentIndex] = interceptConditions[parentIndex] || [];
      interceptConditions[parentIndex].push({});  // 初始化该子菜单的条件
    };
  }

  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑";
  delBtn.onclick = () => {
    // 删除对应的条件数据
    if (isChild) {
      // 删除二级菜单数据
      interceptConditions[parentIndex].splice(childIndex, 1);
    } else {
      // 删除一级菜单数据
      interceptConditions.splice(parentIndex, 1);
    }

    // 更新 localStorage
    localStorage.setItem("interceptConditions", JSON.stringify(interceptConditions));
    li.remove(); // 删除DOM元素
    alert(`菜单项已删除，并从保存的数据中移除！`);
  };

  // 为二级菜单添加一个保存按钮
  const saveChildBtn = document.createElement("button");
  saveChildBtn.textContent = "保存";
  saveChildBtn.onclick = () => {
    const id = generateId(parentIndex, childIndex);  // 生成唯一的标识符
    interceptConditions[parentIndex][childIndex] = pendingRequests;  // 将暂存的请求条件保存到当前菜单

    // 保存到localStorage
    localStorage.setItem("interceptConditions", JSON.stringify(interceptConditions));
    alert(`ID: ${id} 条件已保存！`);
  };

  div.appendChild(input);
  div.appendChild(addBtn);
  div.appendChild(delBtn);
  if (isChild) div.appendChild(saveChildBtn);  // 仅二级菜单添加保存按钮
  li.appendChild(div);

  return { li, parentIndex, childIndex };
}

addRootBtn.onclick = () => {
  const { li, parentIndex, childIndex } = createMenuItem();
  menu.appendChild(li);
  interceptConditions.push([]);  // 初始化根菜单的条件
};

saveBtn.onclick = () => {
  save();
};

// 保存菜单和条件
function save() {
  const extract = (ul) => {
    return [...ul.children].map((li, parentIndex) => {
      const input = li.querySelector("input");
      const childUl = li.querySelector("ul");
      const children = [...li.children]
        .filter(child => child.tagName === "LI")
        .map((child, childIndex) => extract({ children: [child] }, parentIndex, childIndex))
        .flat();

      return { name: input.value, children };
    });
  };

  const data = extract(menu);
  localStorage.setItem("sidebarData", JSON.stringify(data));

  // 保存拦截条件
  localStorage.setItem("interceptConditions", JSON.stringify(interceptConditions));

  alert("已保存！");
};

// 加载本地存储的菜单和条件
function load() {
  const data = JSON.parse(localStorage.getItem("sidebarData") || "[]");
  interceptConditions = JSON.parse(localStorage.getItem("interceptConditions") || "[]");

  const render = (items, parent, parentIndex) => {
    items.forEach((item, childIndex) => {
      const { li, p, c } = createMenuItem(item.name, parent !== menu, interceptConditions[parentIndex]?.[childIndex] || {}, parentIndex, childIndex);
      parent.appendChild(li);
      if (item.children?.length) {
        render(item.children, li, parentIndex);
      }
    });
  };

  render(data, menu, 0);
}

load();

// 监听拦截到的XHR请求并暂存到 pendingRequests
window.addEventListener("xhr-body", e => {
  const detail = e.detail;
  console.log("拦截到XHR请求：", detail);
  pendingRequests = {
    method: detail.method,
    url: detail.url,
    body: detail.body,
  };

  // 将拦截到的请求暂存到 pendingRequests 中
  alert(`拦截到请求：\n方法: ${detail.method}\nURL: ${detail.url}`);
});
