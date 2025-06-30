document.addEventListener("DOMContentLoaded", function () {
  // Image Gallery Functionality
  const mainImage = document.querySelector(".single-product-main-image");
  const thumbnails = document.querySelectorAll(".single-product-thumbnail");
  const leftArrow = document.querySelector(".arrow-left");
  const rightArrow = document.querySelector(".arrow-right");

  if (mainImage && thumbnails.length) {
    const productImages = Array.from(thumbnails).map((thumb) => {
      return thumb.src.replace("_500x", "_500x");
    });

    let currentIndex = 0;

    function updateDisplay(index) {
      currentIndex = index;
      mainImage.src = productImages[index];

      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle("active-thumbnail", i === index);
      });

      leftArrow.disabled = index === 0;
      rightArrow.disabled = index === thumbnails.length - 1;
    }

    thumbnails.forEach((thumb) => {
      thumb.addEventListener("click", function () {
        const index = parseInt(this.getAttribute("data-index"));
        updateDisplay(index);
      });
    });

    leftArrow.addEventListener("click", function () {
      if (currentIndex > 0) updateDisplay(currentIndex - 1);
    });

    rightArrow.addEventListener("click", function () {
      if (currentIndex < thumbnails.length - 1) updateDisplay(currentIndex + 1);
    });

    updateDisplay(0);
  }

  // Lazy Loading Sections
  function loadSection(section) {
    console.log(`Loading section: ${section.dataset.section}`);
    section.classList.add("loaded");

    // Special handling for video section
    if (section.dataset.section === "videopopup") {
      const iframe = section.querySelector("iframe");
      if (iframe) {
        iframe.src = iframe.dataset.src;
      }
    }
  }

  const lazySections = document.querySelectorAll(".lazy-section");

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadSection(entry.target);
            sectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px 0px",
        threshold: 0.1,
      }
    );

    lazySections.forEach((section) => {
      sectionObserver.observe(section);
      console.log(`Observing section: ${section.dataset.section}`);
    });
  } else {
    lazySections.forEach(loadSection);
  }

  // Video Modal Functionality
  document.addEventListener("click", function (e) {
    // Open modal
    if (e.target.closest(".video-modal-trigger")) {
      e.preventDefault();
      const modal = document.getElementById("video-modal-id");
      if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    }

    // Close modal
    if (
      e.target.closest(".video-modal__close") ||
      e.target.classList.contains("video-modal")
    ) {
      const modal = document.getElementById("video-modal-id");
      if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
      }
    }
  });
});
