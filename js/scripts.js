document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav ul');
  toggle.addEventListener('click', () => {
    const isOpen = menu.style.display === 'flex';
    menu.style.display = isOpen ? 'none' : 'flex';
  });
});

document.querySelectorAll('.gallery').forEach(section => {
  const dir     = section.dataset.dir;     // e.g. "gallery1"
  const prevBtn = section.querySelector('.prev');
  const nextBtn = section.querySelector('.next');
  const imgEl   = section.querySelector('img');
  let images    = [];
  let idx       = 0;

  function update() {
    imgEl.src = images[idx] || '';
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx >= images.length - 1;
  }

  // fetch the directory listing and parse out image files
  fetch(`assets/${dir}/`)
    .then(res => {
      if (!res.ok) throw new Error(`Cannot fetch ${dir}`);
      return res.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc    = parser.parseFromString(html, 'text/html');
      images = Array.from(doc.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter(href => href.match(/\.(png|jpe?g|gif)$/i))
        .map(name => `assets/${dir}/${name}`)
        .sort((a, b) => {
          const nA = a.split('/').pop();
          const nB = b.split('/').pop();
          return nA.localeCompare(nB, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        });
      update();
    })
    .catch(err => console.error(err));

  prevBtn.addEventListener('click', () => {
    if (idx > 0) { idx--; update(); }
  });
  nextBtn.addEventListener('click', () => {
    if (idx < images.length - 1) { idx++; update(); }
  });
});

document.querySelectorAll('.gallery-viewer img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';

    // clone & prepare
    const clone = img.cloneNode();
    clone.classList.remove('zoomed');
    overlay.appendChild(clone);

    document.body.appendChild(overlay);

    // click on image toggles zoom at click-point
    clone.addEventListener('click', e => {
      e.stopPropagation();             // prevent closing

      // Calculate click position relative to image
      const rect    = clone.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const originX = (offsetX / rect.width) * 100;
      const originY = (offsetY / rect.height) * 100;

      // Set transform-origin so it zooms around the click
      clone.style.transformOrigin = `${originX}% ${originY}%`;
      clone.classList.toggle('zoomed');
    });

    // click outside image closes
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  });
});
