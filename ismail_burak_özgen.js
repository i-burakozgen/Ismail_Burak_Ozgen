var config = {
  apiUrl: "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json",
  carouselTitle: "Beğenebileceğinizi düşündüklerimiz",
  localStorageKeys: {
    favorites: "ebebek_favorites",
    products: "ebebek_products",
  },
};

function startCarousel() {
  if (!checkIfHomepage()) {
    console.log("Ana sayfada değil, carousel gösterilmeyecek");
    return;
  }

  getProducts(
    function (products) {
      console.log("Ürünler alındı:", products.length + " ürün yüklendi");
      var placeToAdd = findPlaceToAddCarousel();
     
      makeCarousel(products, placeToAdd);
    },
    function (error) {
      console.error("Ürünler yüklenirken hata oluştu:", error);
    }
  );
}

function checkIfHomepage() {
  try {
    var isEbebek = window.location.hostname.includes("e-bebek.com");
    var isHome = window.location.pathname === "/";
    return isEbebek && isHome;
  } catch (e) {
    console.error("ana sayfa hata", e);
    return false;
  }
}

function getProducts(success, error) {
  try {
    var savedProducts = localStorage.getItem(config.localStorageKeys.products);
    if (savedProducts) {
      success(JSON.parse(savedProducts));
      return;
    }
    fetch(config.apiUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("ürünler getirilrken hata");
        }
        return response.json();
      })
      .then(function (products) {
        localStorage.setItem(config.localStorageKeys.products, JSON.stringify(products));
        success(products);
      })
      .catch(function (err) {
        console.error("ürünler getirilrken hata:", err);
        error(err);
      });
  } catch (e) {
    console.error("ürünler getirilrken hata:", e);
    error(e);
  }
}

function findPlaceToAddCarousel() {
  var element = document.querySelector(".hero.banner");
  if (element) {
    return element;
  }
  console.error("Banner bulunamadı");
  return null;
}

function makeCarousel(products, placeToAdd) {
  var carouselBox = document.createElement("div");
  carouselBox.className = "ebebek-custom-carousel";

  var header = document.createElement("div");
  header.className = "carousel-header";
  header.innerHTML = `<h2 class="title-primary">${config.carouselTitle}</h2>`;
  carouselBox.appendChild(header);

  var carouselContainer = document.createElement("div");
  carouselContainer.className = "carousel-container";

  var prevBtn = document.createElement("button");
  prevBtn.className = "swiper-prev";
  prevBtn.setAttribute("aria-label", "previous");
  carouselContainer.appendChild(prevBtn);

  var carouselWrapper = document.createElement("div");
  carouselWrapper.className = "carousel-wrapper";

  var scrollArea = document.createElement("div");
  scrollArea.className = "product-scroll-area";

  var favorites = JSON.parse(localStorage.getItem(config.localStorageKeys.favorites)) || [];
  products.forEach((product) => {
    var productCard = createProductCard(product, favorites.includes(product.id));
    scrollArea.appendChild(productCard);
  });

  carouselWrapper.appendChild(scrollArea);
  carouselContainer.appendChild(carouselWrapper);

  var nextBtn = document.createElement("button");
  nextBtn.className = "swiper-next";
  nextBtn.setAttribute("aria-label", "next");
  carouselContainer.appendChild(nextBtn);

  carouselBox.appendChild(carouselContainer);
  placeToAdd.parentNode.insertBefore(carouselBox, placeToAdd.nextSibling);

  addCarouselStyles();
  setupCarouselButtons(scrollArea);
  setupFavoriteButtons();
}

function createProductCard(product, isFavorite) {
  var card = document.createElement("div");
  card.className = "product-card";

  var picLink = document.createElement("a");
  picLink.href = product.url;
  picLink.target = "_blank";
  picLink.className = "product-link";

  var pic = document.createElement("img");
  pic.src = product.img;
  pic.alt = product.name;
  pic.className = "product-pic";
  picLink.appendChild(pic);

  var favBtn = document.createElement("button");
  favBtn.className = "fav-btn " + (isFavorite ? "is-favorite" : "");
  favBtn.innerHTML = "❤";
  favBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleFav(product.id, favBtn);
  });

  var info = document.createElement("div");
  info.className = "product-info";

  var brand = document.createElement("div");
  brand.className = "brand-name";
  brand.textContent = product.brand;

  var name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.name;

  var prices = document.createElement("div");
  prices.className = "price-box";

  if (product.original_price !== product.price) {
    var oldPrice = document.createElement("span");
    oldPrice.className = "old-price";
    oldPrice.textContent = product.original_price.toFixed(2) + " TL";

    var discount = Math.round((1 - product.price / product.original_price) * 100);
    var discountTag = document.createElement("span");
    discountTag.className = "discount-tag";
    discountTag.textContent = "%" + discount;

    prices.appendChild(oldPrice);
    prices.appendChild(discountTag);
  }

  var currentPrice = document.createElement("span");
  currentPrice.className = "current-price";
  currentPrice.textContent = product.price.toFixed(2) + " TL";
  prices.appendChild(currentPrice);

  info.appendChild(brand);
  info.appendChild(name);
  info.appendChild(prices);
  card.appendChild(picLink);
  card.appendChild(favBtn);
  card.appendChild(info);

  card.addEventListener("click", function (e) {
    if (!e.target.closest(".fav-btn")) {
      window.open(product.url, "_blank");
    }
  });

  return card;
}

function toggleFav(productId, button) {
  var favorites = JSON.parse(localStorage.getItem(config.localStorageKeys.favorites)) || [];
  var favIndex = favorites.indexOf(productId);

  if (favIndex === -1) {
    favorites.push(productId);
    button.classList.add("is-favorite");
  } else {
    favorites.splice(favIndex, 1);
    button.classList.remove("is-favorite");
  }
  localStorage.setItem(config.localStorageKeys.favorites, JSON.stringify(favorites));
}

function setupCarouselButtons(scrollArea) {
  var prevBtn = document.querySelector(".swiper-prev");
  var nextBtn = document.querySelector(".swiper-next");

  if (!prevBtn || !nextBtn || !scrollArea) {
    console.error("Carousel öğeleri bulunamadı");
    return;
  }

  var scrollAmount = 300;
  var maxScroll = scrollArea.scrollWidth - scrollArea.clientWidth;

  function updateButtonStates() {
    var currentScroll = scrollArea.scrollLeft;
    prevBtn.disabled = currentScroll <= 0;
    nextBtn.disabled = currentScroll >= maxScroll;
    prevBtn.style.opacity = currentScroll <= 0 ? "0.5" : "1";
    nextBtn.style.opacity = currentScroll >= maxScroll ? "0.5" : "1";
  }

  prevBtn.addEventListener("click", function () {
    scrollArea.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    setTimeout(updateButtonStates, 300);
  });

  nextBtn.addEventListener("click", function () {
    scrollArea.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateButtonStates, 300);
  });

  scrollArea.addEventListener("scroll", updateButtonStates);
  updateButtonStates();
}

function setupFavoriteButtons() {
  document.addEventListener("click", function (e) {
    var favBtn = e.target.closest(".fav-btn");
    if (favBtn) {
      e.preventDefault();
      e.stopPropagation();
      var productId = favBtn.getAttribute("data-product-id");
      toggleFav(productId, favBtn);
    }
  });
}

function addCarouselStyles() {
  var styleTag = document.createElement("style");
  styleTag.textContent = `
    .ebebek-custom-carousel {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: Arial, sans-serif;
    }
    .carousel-header {
      margin-bottom: 20px;
    }
    .title-primary {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      background-color: #fef6eb;
      color: #f28e00;
      text-align: left;
      padding: 25px 67px;
      border-top-left-radius: 35px;
      border-top-right-radius: 35px;
    }
    .carousel-container {
      display: flex;
      align-items: center;
      position: relative;
    }
    .carousel-wrapper {
      flex: 1;
      overflow: hidden;
    }
    .product-scroll-area {
      display: flex;
      overflow-x: auto;
      gap: 15px;
      padding: 10px 5px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .product-scroll-area::-webkit-scrollbar {
      display: none;
    }
    .product-card {
      flex: 0 0 280px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #f0f0f0;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    }
    .product-card:hover {
      border: 2px solid #ff6b00;
      transform: translateY(-3px);
    }
    .product-pic {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }
    .fav-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      color: #ccc;
      z-index: 2;
    }
    .fav-btn:hover {
      color: #ff6b00;
    }
    .fav-btn.is-favorite {
      color: #ff6b00;
    }
    .product-info {
      padding: 12px;
    }
    .brand-name {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .product-name {
      font-size: 14px;
      color: #333;
      font-weight: 500;
      margin: 8px 0;
      overflow: hidden;
      line-height: 1.4;
      height: 40px;
    }
    .price-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .old-price {
      text-decoration: line-through;
      color: #999;
      font-size: 12px;
    }
    .current-price {
      font-weight: bold;
      color: #ff6b00;
      font-size: 16px;
    }
    .discount-tag {
      background: #ff6b00;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .swiper-prev,
    .swiper-next {
      width: 40px;
      height: 40px;
      background: white;
      border-radius: 50%;
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin: 0 5px;
      transition: all 0.3s ease;
    }
    .swiper-prev:hover,
    .swiper-next:hover {
      background: #fef6eb;
    }
    .swiper-prev:disabled,
    .swiper-next:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .swiper-prev::before,
    .swiper-next::before {
      content: "";
      display: block;
      width: 10px;
      height: 10px;
      border-left: 2px solid #333;
      border-bottom: 2px solid #333;
    }
    .swiper-prev::before {
      transform: rotate(45deg);
      margin-left: 4px;
    }
    .swiper-next::before {
      transform: rotate(-135deg);
      margin-right: 4px;
    }
    @media (max-width: 768px) {
      .product-card {
        flex: 0 0 240px;
      }
      .product-pic {
        height: 160px;
      }
    }
    @media (max-width: 480px) {
      .product-card {
        flex: 0 0 200px;
      }
      .title-primary {
        font-size: 20px;
      }
      .product-pic {
        height: 140px;
      }
    }
  `;
  document.head.appendChild(styleTag);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCarousel);
} else {
  startCarousel();
}