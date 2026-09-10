/* ==========================================================================
   Yoode - Build Your Uniform (Detail / Build Page)
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- AOS ---------- */
  if (window.AOS) {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      offset: 80,
      once: true,
      disable: function () {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }
    });
  }

  var refresh = function () { if (window.AOS) AOS.refresh(); };

  /* ---------- Accordion panels ---------- */
  document.querySelectorAll("[data-panel-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.closest("[data-panel]");
      if (!panel) return;

      var willOpen = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
      window.setTimeout(refresh, 480);
    });
  });

  /* ---------- Option selection + price ---------- */
  var BASE_PRICE = 200;
  var priceValue = document.getElementById("priceValue");

  var updatePrice = function () {
    var total = BASE_PRICE;

    document.querySelectorAll(".opt-card.is-active").forEach(function (card) {
      total += parseInt(card.dataset.price, 10) || 0;
    });

    if (!priceValue) return;

    var from = parseInt(priceValue.textContent, 10) || total;
    if (from === total) return;

    // count up / down to the new total
    var start = performance.now();
    var duration = 380;

    var step = function (now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      priceValue.textContent = Math.round(from + (total - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  document.querySelectorAll("[data-group]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var card = e.target.closest(".opt-card");
      if (!card || card.classList.contains("is-active")) return;

      group.querySelectorAll(".opt-card").forEach(function (c) {
        c.classList.remove("is-active");
      });

      card.classList.add("is-active");
      updatePrice();
    });
  });

  updatePrice();

  /* ---------- Selection summary helper ---------- */
  var getSelection = function () {
    var out = {};
    document.querySelectorAll("[data-group]").forEach(function (group) {
      var active = group.querySelector(".opt-card.is-active");
      out[group.dataset.group] = active ? active.dataset.name : null;
    });
    return out;
  };

  /* ---------- Save / Place order ---------- */
  var flash = function (btn, text) {
    var original = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    window.setTimeout(function () {
      btn.textContent = original;
      btn.disabled = false;
    }, 1600);
  };

  var saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      console.log("Saved configuration:", getSelection(), "Price:", priceValue && priceValue.textContent);
      flash(saveBtn, "Saved");
    });
  }

  var orderBtn = document.getElementById("orderBtn");
  if (orderBtn) {
    orderBtn.addEventListener("click", function () {
      console.log("Order placed:", getSelection(), "Price:", priceValue && priceValue.textContent);
      flash(orderBtn, "Order Placed");
    });
  }

  /* ==========================================================================
     Image carousel
     ========================================================================== */
  var gallery = document.getElementById("gallery");
  var track = document.getElementById("galleryTrack");
  var dotsWrap = document.getElementById("galleryDots");
  var slides = track ? Array.prototype.slice.call(track.children) : [];
  var index = 0;

  /* ---------- Lightbox refs ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbCaption = document.getElementById("lightboxCaption");
  var lbCurrent = document.getElementById("lightboxCurrent");
  var lbTotal = document.getElementById("lightboxTotal");
  var lbThumbs = document.getElementById("lightboxThumbs");
  var lbPrev = document.getElementById("lightboxPrev");
  var lbNext = document.getElementById("lightboxNext");
  var lastFocused = null;

  if (gallery && slides.length) {
    var galleryPrev = document.getElementById("galleryPrev");
    var galleryNext = document.getElementById("galleryNext");

    /* build dots */
    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "gallery-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Go to image " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    var goTo = function (next) {
      index = Math.max(0, Math.min(next, slides.length - 1));
      track.style.transform = "translateX(" + -index * 100 + "%)";

      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", String(i === index));
      });

      slides.forEach(function (s, i) {
        // keep off-screen slides out of the tab order
        s.tabIndex = i === index ? 0 : -1;
        s.setAttribute("aria-hidden", String(i !== index));
      });

      galleryPrev.disabled = index === 0;
      galleryNext.disabled = index === slides.length - 1;
    };

    galleryPrev.addEventListener("click", function () { goTo(index - 1); });
    galleryNext.addEventListener("click", function () { goTo(index + 1); });

    /* click a slide -> open the modal on that image */
    slides.forEach(function (slide, i) {
      slide.addEventListener("click", function () { openLightbox(i); });
    });

    /* keyboard arrows while the carousel has focus */
    gallery.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    });

    /* touch swipe */
    var startX = 0;
    var startY = 0;
    var swiping = false;

    gallery.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    gallery.addEventListener("touchend", function (e) {
      if (!swiping) return;
      swiping = false;

      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;

      // only treat it as a swipe if it is mostly horizontal
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? index + 1 : index - 1);
      }
    }, { passive: true });

    goTo(0);

    /* ======================================================================
       Lightbox
       ====================================================================== */
    var lbIndex = 0;

    var images = slides.map(function (slide) {
      var img = slide.querySelector("img");
      return {
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || "",
        caption: img.dataset.caption || img.getAttribute("alt") || ""
      };
    });

    if (lbTotal) lbTotal.textContent = String(images.length);

    /* build lightbox thumbnails */
    images.forEach(function (item, i) {
      var t = document.createElement("button");
      t.type = "button";
      t.className = "lightbox-thumb";
      t.setAttribute("aria-label", "Show image " + (i + 1));
      t.innerHTML = '<img src="' + item.src + '" alt="" />';
      t.addEventListener("click", function () { showImage(i); });
      lbThumbs.appendChild(t);
    });

    var thumbs = Array.prototype.slice.call(lbThumbs.children);

    var showImage = function (next) {
      lbIndex = (next + images.length) % images.length;
      var item = images[lbIndex];

      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCaption.textContent = item.caption;
      lbCurrent.textContent = String(lbIndex + 1);

      thumbs.forEach(function (t, i) {
        t.classList.toggle("is-active", i === lbIndex);
      });
    };

    var openLightbox = function (i) {
      lastFocused = document.activeElement;
      showImage(i);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lb-open");
      document.getElementById("lightboxClose").focus();
    };

    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lb-open");

      // put the carousel back in sync with whatever was last viewed
      goTo(lbIndex);
      if (lastFocused) lastFocused.focus();
    };

    lbPrev.addEventListener("click", function () { showImage(lbIndex - 1); });
    lbNext.addEventListener("click", function () { showImage(lbIndex + 1); });

    lightbox.querySelectorAll("[data-lb-close]").forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showImage(lbIndex - 1);
      if (e.key === "ArrowRight") showImage(lbIndex + 1);

      // keep focus inside the modal
      if (e.key === "Tab") {
        var focusable = lightbox.querySelectorAll("button");
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* swipe inside the modal too */
    var lbStartX = 0;
    lightbox.addEventListener("touchstart", function (e) {
      lbStartX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - lbStartX;
      if (Math.abs(dx) > 45) showImage(dx < 0 ? lbIndex + 1 : lbIndex - 1);
    }, { passive: true });
  }

  /* ---------- Keep AOS positions correct after images load ---------- */
  window.addEventListener("load", refresh);
})();
