var PremiumGallery = {
  images: [],
  currentSlide: 0,
  slideTimer: null,
  categories: ['All', 'Ceremony', 'Portraits', 'Reception', 'Details', 'Candid', 'Nature'],
  keyHandlerAttached: false,

  init: function() {
    this.images = window.galleryImages || [];
    this.renderGallery();
    this.setupFilterButtons();
    this.setupLightboxKeys();
  },

  renderGallery: function(filter) {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;
    filter = filter || 'All';
    var filtered = filter === 'All' ? this.images : this.images.filter(function(img) {
      return img.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    });
    if (!filtered.length && filter !== 'All') {
      grid.innerHTML = '<div class="empty-gallery-msg"><i class="fas fa-images"></i> No photos in this category yet</div>';
      return;
    }
    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-gallery-msg"><i class="fas fa-images"></i> Gallery photos will appear here once uploaded</div>';
      return;
    }
    var self = this;
    grid.innerHTML = filtered.map(function(img, i) {
      return '<div class="gallery-item" data-index="' + i + '" onclick="PremiumGallery.openLightbox(' + i + ')"><img src="' + img + '" alt="Gallery photo ' + (i+1) + '" loading="lazy"><div class="overlay"><span><i class="fas fa-expand"></i></span></div></div>';
    }).join('');
    grid.style.display = 'grid';
  },

  setupFilterButtons: function() {
    var container = document.getElementById('galleryFilters');
    if (!container) return;
    var self = this;
    container.innerHTML = this.categories.map(function(cat) {
      return '<button class="gallery-filter-btn' + (cat === 'All' ? ' active' : '') + '" data-filter="' + cat + '">' + cat + '</button>';
    }).join('') + '<button class="gallery-filter-btn gallery-slideshow-btn" onclick="PremiumGallery.startSlideshow()"><i class="fas fa-play"></i> Slideshow</button>';

    container.querySelectorAll('.gallery-filter-btn:not(.gallery-slideshow-btn)').forEach(function(btn) {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.gallery-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        self.renderGallery(btn.dataset.filter);
      });
    });
  },

  setupLightboxKeys: function() {
    var self = this;
    document.addEventListener('keydown', function(e) {
      var lb = document.getElementById('lightbox');
      if (!lb || !lb.classList.contains('active')) return;
      if (e.key === 'Escape') self.closeLightbox();
      if (e.key === 'ArrowLeft') self.changeSlide(-1);
      if (e.key === 'ArrowRight') self.changeSlide(1);
    });
    this.keyHandlerAttached = true;
  },

  openLightbox: function(index) {
    this.currentSlide = index;
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    if (lb && img) {
      img.src = this.images[index];
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeLightbox: function() {
    var lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('active');
    document.body.style.overflow = '';
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
      var btn = document.querySelector('.gallery-slideshow-btn');
      if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Slideshow';
    }
  },

  changeSlide: function(dir) {
    this.currentSlide = (this.currentSlide + dir + this.images.length) % this.images.length;
    var img = document.getElementById('lightboxImg');
    if (img) {
      img.style.transform = 'scale(0.95)';
      img.style.opacity = '0.5';
      setTimeout(function() {
        img.src = PremiumGallery.images[PremiumGallery.currentSlide];
        setTimeout(function() {
          img.style.transform = 'scale(1)';
          img.style.opacity = '1';
        }, 50);
      }, 200);
    }
  },

  startSlideshow: function() {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
      var btn = document.querySelector('.gallery-slideshow-btn');
      if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Slideshow';
      return;
    }
    if (!this.images.length) { if (window.showNotification) showNotification('No gallery images to show.', 'warning'); return; }
    var btn = document.querySelector('.gallery-slideshow-btn');
    if (btn) btn.innerHTML = '<i class="fas fa-stop"></i> Stop';
    this.openLightbox(0);
    this.slideTimer = setInterval(function() {
      PremiumGallery.changeSlide(1);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var gallerySection = document.querySelector('.gallery-section');
  if (gallerySection && !document.getElementById('galleryFilters')) {
    var title = gallerySection.querySelector('.section-title');
    if (title) {
      var filterDiv = document.createElement('div');
      filterDiv.id = 'galleryFilters';
      filterDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px;position:relative;z-index:1;';
      title.parentNode.insertBefore(filterDiv, title.nextSibling);
    }
  }
  PremiumGallery.init();
});
