(function () {
    const hamburger = document.querySelector('.navbar .hamburger');
    const mainNav = document.getElementById('main-nav');

    if (!hamburger || !mainNav) return;

    // Toggle function
    function setOpen(isOpen) {
      hamburger.classList.toggle('open', isOpen);
      mainNav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = hamburger.classList.contains('open');
      setOpen(!isOpen);
    });

    // Close when clicking a link (mobile)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 768px)').matches) {
          setOpen(false);
        }
      });
    });

    // Close when clicking outside navbar
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar')) {
        setOpen(false);
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Optional: keep nav closed when resizing to desktop
    window.addEventListener('resize', () => {
      if (!window.matchMedia('(max-width: 768px)').matches) {
        setOpen(false);
      }
    });
})();