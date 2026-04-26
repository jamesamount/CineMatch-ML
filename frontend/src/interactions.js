// ============================================================================
// Custom Cursor & Interactive Enhancements
// Creates premium cursor glow effect that follows mouse movement
// ============================================================================

class CursorEnhancer {
  constructor() {
    this.cursor = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.isVisible = false;

    this.init();
  }

  init() {
    // Create cursor element
    this.cursor = document.createElement('div');
    this.cursor.className = 'cursor-glow';
    this.cursor.style.display = 'none';
    document.body.appendChild(this.cursor);

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.show();
    });

    // Hide cursor when mouse leaves window
    document.addEventListener('mouseleave', () => this.hide());

    // Start animation loop
    this.animate();
  }

  show() {
    if (!this.isVisible) {
      this.isVisible = true;
      this.cursor.style.display = 'block';
    }
  }

  hide() {
    this.isVisible = false;
    this.cursor.style.display = 'none';
  }

  animate() {
    // Smooth follow with easing
    this.cursorX += (this.mouseX - this.cursorX) * 0.12;
    this.cursorY += (this.mouseY - this.cursorY) * 0.12;

    // Update cursor position
    this.cursor.style.transform = `translate(${this.cursorX - 12}px, ${this.cursorY - 12}px)`;

    requestAnimationFrame(() => this.animate());
  }
}

// ============================================================================
// Scroll Reveal Animations
// Progressive disclosure as elements enter viewport
// ============================================================================

class ScrollReveal {
  constructor() {
    this.elements = [];
    this.init();
  }

  init() {
    // Find all elements with reveal class
    this.elements = Array.from(document.querySelectorAll('.reveal-on-scroll'));

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15
      }
    );

    // Observe all elements
    this.elements.forEach(el => observer.observe(el));
  }
}

// ============================================================================
// Typography Enhancements
// Advanced text animations and effects
// ============================================================================

class TypographyEffects {
  constructor() {
    this.animateText();
  }

  animateText() {
    // Stagger animation for hero paragraphs
    const paragraphs = document.querySelectorAll('.hero__lede');
    paragraphs.forEach((p, index) => {
      p.style.opacity = '0';
      p.style.transform = 'translateY(20px)';
      p.style.transition = 'opacity 500ms ease, transform 500ms ease';
      p.style.transitionDelay = `${200 * (index + 1)}ms`;

      setTimeout(() => {
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      }, 800);
    });
  }
}

// ============================================================================
// Interactive Cinematic Effects!
// Initialize all enhancements when DOM is ready
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize cursor
  const cursor = new CursorEnhancer();

  // Initialize scroll reveals
  const reveal = new ScrollReveal();

  // Initialize typography effects
  const typography = new TypographyEffects();

  // Add reveal classes to major sections
  const sections = document.querySelectorAll('.panel, .hero');
  sections.forEach(section => {
    section.classList.add('reveal-on-scroll');
  });

  // Cinematic click effects on buttons
  document.addEventListener('click', (e) => {
    if (e.target.matches('.primary-button, .secondary-button')) {
      // Create ripple
      const ripple = document.createElement('div');
      ripple.style.position = 'absolute';
      ripple.style.width = '4px';
      ripple.style.height = '4px';
      ripple.style.background = 'rgba(229, 9, 20, 0.8)';
      ripple.style.borderRadius = '50%';
      ripple.style.pointerEvents = 'none';
      ripple.style.left = (e.clientX - e.target.getBoundingClientRect().left - 2) + 'px';
      ripple.style.top = (e.clientY - e.target.getBoundingClientRect().top - 2) + 'px';
      e.target.appendChild(ripple);

      setTimeout(() => {
        ripple.style.width = '96px';
        ripple.style.height = '96px';
        ripple.style.left = (e.clientX - e.target.getBoundingClientRect().left - 48) + 'px';
        ripple.style.top = (e.clientY - e.target.getBoundingClientRect().top - 48) + 'px';
        ripple.style.opacity = '0';
        ripple.style.transition = 'all 600ms ease-out';
        setTimeout(() => ripple.remove(), 650);
      }, 50);
    }
  });
});
