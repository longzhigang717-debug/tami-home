(function () {
  var productGrid = document.getElementById("productGrid");

  if (!productGrid) {
    return;
  }

  var searchInput = document.getElementById("searchInput");
  var categoryFilter = document.getElementById("categoryFilter");
  var resultCount = document.getElementById("resultCount");
  var modal = document.getElementById("productModal");
  var modalImage = document.getElementById("modalImage");
  var modalMeta = document.getElementById("modalMeta");
  var modalTitle = document.getElementById("modalTitle");
  var modalDesc = document.getElementById("modalDesc");
  var modalId = document.getElementById("modalId");
  var modalIdRule = document.getElementById("modalIdRule");
  var modalBrand = document.getElementById("modalBrand");
  var modalCategory = document.getElementById("modalCategory");
  var modalScene = document.getElementById("modalScene");
  var modalFinish = document.getElementById("modalFinish");
  var brandScope = document.body.dataset.brand || "";
  var products = [];

  var typeCodes = {
    S: "实木",
    M: "多层实木",
    P: "3层实木",
    L: "强化地板"
  };

  var woodCodes = {
    1: "橡木",
    2: "胡桃",
    3: "柚木",
    4: "枫木"
  };

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function imagePath(product) {
    return "assets/images/" + product.img + ".jpg";
  }

  function decodeProductId(id) {
    var normalizedId = String(id || "").trim().toUpperCase();
    var match = normalizedId.match(/^([SMPL])([1-4])(\d{3})$/);

    if (!match) {
      return "";
    }

    return typeCodes[match[1]] + " · " + woodCodes[match[2]] + " · " + match[3];
  }

  function createFallback(product) {
    var fallback = document.createElement("div");
    fallback.className = "image-fallback";
    fallback.setAttribute("aria-label", product.name + " 图片待上传");
    fallback.innerHTML = "<span>" + product.id + "</span><strong>" + product.name + "</strong>";
    return fallback;
  }

  function handleImageError(img, product) {
    var parent = img.parentElement;
    if (!parent || parent.querySelector(".image-fallback")) {
      return;
    }
    img.remove();
    parent.appendChild(createFallback(product));
  }

  function productCard(product) {
    var card = document.createElement("button");
    card.className = "product-card";
    card.type = "button";
    card.setAttribute("aria-label", "查看 " + product.name + " 详情");

    var imageWrap = document.createElement("span");
    imageWrap.className = "product-image-wrap";

    var img = document.createElement("img");
    img.src = imagePath(product);
    img.alt = product.name;
    img.loading = "lazy";
    img.addEventListener("error", function () {
      handleImageError(img, product);
    });

    var body = document.createElement("span");
    body.className = "product-card-body";

    var meta = document.createElement("span");
    meta.className = "product-meta";
    meta.textContent = product.id + " · " + product.brand + " · " + product.category;

    var title = document.createElement("strong");
    title.textContent = product.name;

    var idRule = document.createElement("span");
    idRule.className = "product-id-rule";
    idRule.textContent = decodeProductId(product.id) || "产品编号";

    var desc = document.createElement("span");
    desc.className = "product-desc";
    desc.textContent = [product.desc, product.scene].filter(Boolean).join(" · ");

    imageWrap.appendChild(img);
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(idRule);
    body.appendChild(desc);
    card.appendChild(imageWrap);
    card.appendChild(body);
    card.addEventListener("click", function () {
      openModal(product);
    });

    return card;
  }

  function scopedProducts() {
    if (!brandScope) {
      return products;
    }

    return products.filter(function (product) {
      return product.brand === brandScope;
    });
  }

  function activeProducts() {
    var query = normalizeText(searchInput.value);
    var category = categoryFilter.value;

    return scopedProducts().filter(function (product) {
      var searchableText = [
        product.id,
        product.name,
        product.category,
        product.desc,
        product.scene,
        product.finish
      ].join(" ");
      var matchesQuery = normalizeText(searchableText).indexOf(query) !== -1;
      var matchesCategory = category === "all" || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }

  function renderCategories() {
    var currentValue = categoryFilter.value || "all";
    var categories = scopedProducts()
      .map(function (product) {
        return product.category;
      })
      .filter(function (category, index, list) {
        return category && list.indexOf(category) === index;
      })
      .sort();

    categoryFilter.innerHTML = '<option value="all">全部分类</option>';
    categories.forEach(function (category) {
      var option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    categoryFilter.value = categories.indexOf(currentValue) === -1 ? "all" : currentValue;
  }

  function renderProducts() {
    var filteredProducts = activeProducts();
    productGrid.innerHTML = "";

    filteredProducts.forEach(function (product) {
      productGrid.appendChild(productCard(product));
    });

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = '<p class="empty-state">没有找到匹配产品，请调整关键词或分类。</p>';
    }

    resultCount.textContent = "共 " + filteredProducts.length + " 个产品";
  }

  function openModal(product) {
    modalImage.src = imagePath(product);
    modalImage.alt = product.name;
    modalImage.onerror = function () {
      modalImage.removeAttribute("src");
      modalImage.alt = product.name + " 图片待上传";
    };
    modalMeta.textContent = product.brand + " · " + product.category;
    modalTitle.textContent = product.name;
    modalDesc.textContent = product.desc;
    modalId.textContent = product.id;
    modalIdRule.textContent = decodeProductId(product.id) || "未匹配编码规则";
    modalBrand.textContent = product.brand;
    modalCategory.textContent = product.category;
    modalScene.textContent = product.scene || "可按项目需求配置";
    modalFinish.textContent = product.finish || "以实物样板为准";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalImage.onerror = null;
  }

  function validateProducts(items) {
    if (!Array.isArray(items)) {
      throw new Error("products.json 必须是数组格式");
    }

    return items.filter(function (product) {
      return product.id && product.name && product.brand && product.category && product.img && product.desc;
    });
  }

  fetch("products.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("products.json 读取失败");
      }
      return response.json();
    })
    .then(function (data) {
      products = validateProducts(data);
      renderCategories();
      renderProducts();
    })
    .catch(function (error) {
      productGrid.innerHTML = '<p class="empty-state">产品数据读取失败，请检查 products.json。</p>';
      resultCount.textContent = error.message;
    });

  searchInput.addEventListener("input", renderProducts);
  categoryFilter.addEventListener("change", renderProducts);

  modal.addEventListener("click", function (event) {
    if (event.target.matches("[data-close-modal]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
})();
