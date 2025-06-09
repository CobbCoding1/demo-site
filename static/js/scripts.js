document.addEventListener('DOMContentLoaded', () => {
  // 1) Responsive Nav Toggle (unchanged)
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav ul');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
    });
  }

  // 2) Array-Based Gallery Logic (unchanged)
  document.querySelectorAll('.gallery').forEach(section => {
    let images;
    try {
      images = JSON.parse(section.getAttribute('data-images'));
      if (!Array.isArray(images)) throw 0;
    } catch {
      console.error('Invalid data-images on', section);
      return;
    }
    const prev = section.querySelector('.prev');
    const next = section.querySelector('.next');
    const img  = section.querySelector('img');
    let idx = 0;
    const update = () => {
      img.src = images[idx];
      prev.disabled = idx === 0;
      next.disabled = idx === images.length-1;
    };
    update();
    prev.addEventListener('click', () => { if(idx>0){ idx--; update(); }});
    next.addEventListener('click', () => { if(idx<images.length-1){ idx++; update(); }});
  });

  // 3) Lightbox with Drag-to-Switch + Click-to-Zoom
  document.querySelectorAll('.gallery-viewer img').forEach(origImg => {
    origImg.style.cursor = 'pointer';
    origImg.addEventListener('click', () => {
      // identify gallery & images array
      const section = origImg.closest('.gallery');
      let images = [];
      try { images = JSON.parse(section.getAttribute('data-images')); }
      catch { return; }
      let idx = images.indexOf(origImg.src);
      if (idx < 0) idx = 0;

      // create overlay + slide
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      const slide = document.createElement('img');
      slide.className = 'lightbox-slide';
      slide.src = images[idx];
      slide.style.transition = 'transform 0.3s ease';
      overlay.appendChild(slide);
      document.body.appendChild(overlay);

      // close when clicking outside the slide
      overlay.addEventListener('click', e => {
        if (e.target === overlay) document.body.removeChild(overlay);
      });

      // track drag vs click
      let startX = 0, moved = false;
      const THRESHOLD = 50;

      slide.addEventListener('pointerdown', e => {
        startX = e.clientX;
        moved = false;
        slide.setPointerCapture(e.pointerId);
      });
      slide.addEventListener('pointermove', e => {
        if (Math.abs(e.clientX - startX) > 5) moved = true;
      });
      slide.addEventListener('pointerup', e => {
        const delta = e.clientX - startX;
        slide.releasePointerCapture(e.pointerId);

        if (moved && delta < -THRESHOLD && idx < images.length-1) {
          // swipe left → next
          idx++;
          slide.src = images[idx];
          slide.classList.remove('zoomed');
        } else if (moved && delta > THRESHOLD && idx > 0) {
          // swipe right → prev
          idx--;
          slide.src = images[idx];
          slide.classList.remove('zoomed');
        } else if (!moved) {
          // tap/click → toggle zoom
          slide.classList.toggle('zoomed');
        }
      });
    });
  });

  // 4) Match featured-projects heights (unchanged)
  window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.featured-projects .cards .featured-card');
    if (!cards.length) return;
    const heights = Array.from(cards).map(c => {
      const i = c.querySelector('img');
      return i ? i.clientHeight : 0;
    });
    const minH = Math.min(...heights);
    cards.forEach(c => c.style.height = `${minH}px`);
  });
});
