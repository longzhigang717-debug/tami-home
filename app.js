(function () {
  var productGrid = document.getElementById("productGrid");
  var collectionGrid = document.getElementById("collectionGrid");
  var productDetail = document.getElementById("productDetail");

  if (!productGrid && !collectionGrid && !productDetail) {
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
  var dataUrl = "assets/data/products.json";
  var selectorEnabled = productGrid && searchInput && categoryFilter && resultCount;

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

  function productCategory(product) {
    return product.category || product.collection || "";
  }

  function storyText(product) {
    if (!product.story) {
      return product.description || product.desc || "";
    }

    if (typeof product.story === "string") {
      return product.story;
    }

    return [
      product.story.materialSource,
      product.story.designLanguage,
      product.story.spatialValue
    ].filter(Boolean).join(" ");
  }

  function productImageFile(product) {
    var image = product.image || product.img || product.id;

    if (!image) {
      return "";
    }

    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(image)) {
      return image;
    }

    return image + ".jpg";
  }

  function imagePath(product) {
    var file = productImageFile(product);

    if (!file) {
      return "";
    }

    if (/^assets\//.test(file) || /^https?:\/\//.test(file)) {
      return file;
    }

    return "assets/images/products/" + file;
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
    meta.textContent = product.collection || productCategory(product);

    var title = document.createElement("strong");
    title.textContent = product.name;

    var idRule = document.createElement("span");
    idRule.className = "product-id-rule";
    idRule.textContent = [product.wood, product.structure, product.surface].filter(Boolean).join(" · ") || decodeProductId(product.id) || "材料信息";

    var desc = document.createElement("span");
    desc.className = "product-desc";
    desc.textContent = [product.style, product.space || product.scene].filter(Boolean).join(" · ");

    imageWrap.appendChild(img);
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(idRule);
    body.appendChild(desc);
    card.appendChild(imageWrap);
    card.appendChild(body);
    card.addEventListener("click", function () {
      if (modal) {
        openModal(product);
      }
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
        productCategory(product),
        product.collection,
        product.wood,
        product.structure,
        product.surface,
        product.color,
        product.style,
        storyText(product),
        product.space || product.scene,
        product.finish
      ].join(" ");
      var matchesQuery = normalizeText(searchableText).indexOf(query) !== -1;
      var matchesCategory = category === "all" || productCategory(product) === category;
      return matchesQuery && matchesCategory;
    });
  }

  function renderCategories() {
    var currentValue = categoryFilter.value || "all";
    var categories = scopedProducts()
      .map(function (product) {
        return productCategory(product);
      })
      .filter(function (category, index, list) {
        return category && list.indexOf(category) === index;
      })
      .sort();

    categoryFilter.innerHTML = '<option value="all">全部系列</option>';
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
      productGrid.innerHTML = '<p class="empty-state">暂未找到匹配的材料作品，请尝试更换系列或关键词。</p>';
    }

    resultCount.textContent = "呈现 " + filteredProducts.length + " 款材料";
  }

  function collectionCard(product, index) {
    var card = document.createElement("a");
    card.className = "collection-case-card";
    card.href = "product-detail.html?id=" + encodeURIComponent(product.id);
    card.setAttribute("aria-label", "查看 " + product.name + " 产品详情");

    var imageWrap = document.createElement("span");
    imageWrap.className = "collection-case-image";

    var img = document.createElement("img");
    img.src = imagePath(product);
    img.alt = product.name;
    img.loading = "lazy";
    img.addEventListener("error", function () {
      handleImageError(img, product);
    });

    var body = document.createElement("span");
    body.className = "collection-case-body";

    var number = document.createElement("span");
    number.className = "collection-case-number";
    number.textContent = String(index + 1).padStart(2, "0");

    var meta = document.createElement("span");
    meta.className = "product-meta";
    meta.textContent = product.wood;

    var title = document.createElement("strong");
    title.textContent = product.name;

    var desc = document.createElement("span");
    desc.className = "product-desc";
    desc.textContent = product.story && product.story.designLanguage ? product.story.designLanguage : storyText(product);

    var link = document.createElement("span");
    link.className = "collection-case-link";
    link.textContent = "进入产品详情 →";

    imageWrap.appendChild(img);
    body.appendChild(number);
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(link);
    card.appendChild(imageWrap);
    card.appendChild(body);
    return card;
  }

  function renderCollections() {
    if (!collectionGrid) {
      return;
    }

    collectionGrid.innerHTML = "";
    products.forEach(function (product, index) {
      collectionGrid.appendChild(collectionCard(product, index));
    });
  }

  function productById(id) {
    return products.filter(function (product) {
      return product.id === id;
    })[0];
  }

  function setText(id, text) {
    var element = document.getElementById(id);

    if (element) {
      element.textContent = text || "以产品资料为准";
    }
  }

  function renderDetail() {
    if (!productDetail) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var requestedId = params.get("id");
    var product = productById(requestedId) || products[0];

    if (!product) {
      productDetail.innerHTML = '<section class="empty-state">暂未找到对应产品。</section>';
      return;
    }

    var story = typeof product.story === "object" && product.story ? product.story : {};
    var image = document.getElementById("detailImage");

    document.title = product.name + " | 他米 TAMI";
    setText("detailCollection", product.collection);
    setText("detailName", product.name);
    setText("detailIntro", [product.wood, product.structure, product.surface, product.color].filter(Boolean).join(" · "));
    setText("detailMaterialSource", story.materialSource || storyText(product));
    setText("detailDesignLanguage", story.designLanguage || product.style);
    setText("detailSpatialValue", story.spatialValue || product.space);
    setText("detailId", product.id);
    setText("detailWood", product.wood);
    setText("detailStructure", product.structure);
    setText("detailSize", product.size);
    setText("detailSurface", product.surface);
    setText("detailColor", product.color);
    setText("detailSpace", product.space);
    setText("detailStyle", product.style);

    if (image) {
      image.src = imagePath(product);
      image.alt = product.name;
      image.addEventListener("error", function () {
        handleImageError(image, product);
      });
    }
  }

  function openModal(product) {
    modalImage.src = imagePath(product);
    modalImage.alt = product.name;
    modalImage.onerror = function () {
      modalImage.removeAttribute("src");
      modalImage.alt = product.name + " 图片待上传";
    };
    modalMeta.textContent = product.collection || productCategory(product);
    modalTitle.textContent = product.name;
    modalDesc.textContent = storyText(product);
    modalId.textContent = product.id;
    modalIdRule.textContent = product.structure || decodeProductId(product.id) || "以产品资料为准";
    modalBrand.textContent = "TAMI 他米";
    modalCategory.textContent = product.collection || product.category;
    modalScene.textContent = product.space || product.scene || "可按项目需求配置";
    modalFinish.textContent = product.surface || product.finish || "以实物样板为准";
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
      throw new Error("产品资料格式暂不可用");
    }

    return items.filter(function (product) {
      return product.id && product.name && product.collection && product.wood && (product.image || product.img) && storyText(product);
    });
  }

  fetch(dataUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("产品资料暂未加载");
      }
      return response.json();
    })
    .then(function (data) {
      products = validateProducts(data);
      renderCollections();
      renderDetail();

      if (selectorEnabled) {
        renderCategories();
        renderProducts();
      }
    })
    .catch(function (error) {
      if (productGrid) {
        productGrid.innerHTML = '<p class="empty-state">产品资料暂未加载，请稍后再试。</p>';
      }

      if (collectionGrid) {
        collectionGrid.innerHTML = '<p class="empty-state">产品资料暂未加载，请稍后再试。</p>';
      }

      if (resultCount) {
        resultCount.textContent = error.message;
      }
    });

  if (selectorEnabled) {
    searchInput.addEventListener("input", renderProducts);
    categoryFilter.addEventListener("change", renderProducts);
  }

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target.matches("[data-close-modal]")) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (modal && event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
})();
