
document.addEventListener('DOMContentLoaded', () => {
  // ===== 1) Responsive Nav Toggle =====
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav ul');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.style.display === 'flex';
      menu.style.display = isOpen ? 'none' : 'flex';
    });
  }

  // ===== 2) Array-Based Gallery Logic =====
  //
  // Each <section class="gallery"> must include a data-images attribute
  // containing a JSON-encoded array of image URLs (in the desired order). Example:
  //
  //   <section class="gallery" data-images='[
  //     "https://i.ibb.co/abcd1234/img1.jpg",
  //     "https://i.ibb.co/abcd1234/img2.jpg",
  //     "https://i.ibb.co/abcd1234/img3.jpg"
  //   ]'>
  //     <div class="gallery-viewer">
  //       <button class="prev" aria-label="Previous image">‹</button>
  //       <img src="" alt="Gallery image">
  //       <button class="next" aria-label="Next image">›</button>
  //     </div>
  //   </section>
  //
  // This code reads that array and sets up the Prev/Next buttons to cycle through.

  document.querySelectorAll('.gallery').forEach(section => {
    // 2a) Parse the JSON array from data-images
    let images;
    try {
      images = JSON.parse(section.getAttribute('data-images'));
      if (!Array.isArray(images)) throw new Error('data-images is not an array');
    } catch (err) {
      console.error('Invalid or missing data-images on', section, err);
      return;
    }

    const prevBtn = section.querySelector('.prev');
    const nextBtn = section.querySelector('.next');
    const imgEl   = section.querySelector('img');
    let idx       = 0;

    function update() {
      imgEl.src = images[idx] || '';
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === images.length - 1;
    }

    // Initialize with the first image
    update();

    prevBtn.addEventListener('click', () => {
      if (idx > 0) {
        idx--;
        update();
      }
    });
    nextBtn.addEventListener('click', () => {
      if (idx < images.length - 1) {
        idx++;
        update();
      }
    });
  });

  // ===== 3) Lightbox Zoom for Gallery Images =====
  document.querySelectorAll('.gallery-viewer img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';

      const clone = img.cloneNode();
      clone.classList.remove('zoomed');
      overlay.appendChild(clone);

      document.body.appendChild(overlay);

      clone.addEventListener('click', e => {
        e.stopPropagation();
        const rect    = clone.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const originX = (offsetX / rect.width) * 100;
        const originY = (offsetY / rect.height) * 100;
        clone.style.transformOrigin = `${originX}% ${originY}%`;
        clone.classList.toggle('zoomed');
      });

      overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    });
  });

  // ===== 4) Equalize Featured-Projects Card Heights =====
  window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.featured-projects .cards .featured-card');
    if (!cards.length) return;

    const heights = Array.from(cards).map(card => {
      const img = card.querySelector('img');
      return img ? img.clientHeight : Infinity;
    });

    const minH = Math.min(...heights);
    cards.forEach(card => {
      card.style.height = `${minH}px`;
    });
  });
});
