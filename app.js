class TutorialApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.autoCloseTimer = null;
    this.focusedElementBeforeModal = null;
    this.autoCloseEnabled = this.getAutoCloseSetting();
    this.init();
  }

  // Determine auto-close setting based on URL parameter or device type
  getAutoCloseSetting() {
    const timeoutParam = this.urlParams.get('timeout');
    if (timeoutParam === 'false') return false;
    if (timeoutParam === 'true') return true;
    // Default: auto-close on Cisco devices (Navigator/RoomOS), otherwise false
    const ua = navigator.userAgent;
    const isCiscoDevice = ua.includes('Cisco Room Navigator') || ua.includes('RoomOS');
    return isCiscoDevice;
  }

  // Initialize event listeners and handle initial route
  init() {
    const modal = document.getElementById('videoModal');
    const closeBtn = document.getElementById('closeModal');

    // Event listener for each play button in the grid
    document.querySelectorAll('.play-btn').forEach(button => {
      button.addEventListener('click', () => {
        const videoSrc = button.getAttribute('data-video-src');
        const title = button.getAttribute('data-video-title') || '';
        const videoId = button.getAttribute('data-video-id') || '';

        // Save currently focused element to restore later
        this.focusedElementBeforeModal = document.activeElement;

        // Update URL (push new state) with video identifier for SPA routing
        if (videoId) {
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('video', videoId);
          window.history.pushState({ video: videoId }, '', newUrl);
        }

        // Open the modal with the selected video
        this.openModal(videoSrc, title);
      });
    });

    // Back button (close modal) click event
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close modal when clicking outside the video (on the modal backdrop)
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        this.closeModal();
      }
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => this.handleRoute());
    // Open modal on initial load if URL contains a video param
    this.handleRoute();
  }

  // Open the video modal with the given source and title
  openModal(videoSrc, title) {
    const modal = document.getElementById('videoModal');
    const videoElement = document.getElementById('modalVideo');
    const modalTitleElem = document.getElementById('modalTitle');

    // Populate video source and title
    videoElement.src = videoSrc;
    if (title) {
      modalTitleElem.textContent = title;
      modalTitleElem.style.display = 'block';
    }

    // Show modal and play video
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    videoElement.play();

    // Move focus to modal (back button) for accessibility
    document.getElementById('closeModal').focus();
    // Trap keyboard focus inside the modal
    this.trapFocus(modal);

    // When video ends, auto-close after 5 seconds if enabled
    videoElement.onended = () => {
      if (this.autoCloseEnabled) {
        this.autoCloseTimer = setTimeout(() => this.closeModal(), 5000);
      }
    };
  }

  // Close the video modal and restore the main page state
  closeModal() {
    const modal = document.getElementById('videoModal');
    const videoElement = document.getElementById('modalVideo');

    // Clear any pending auto-close timer
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    // Hide the modal
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Stop and reset the video
    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.load();
    // Restore focus to the previously focused element on the main page
    if (this.focusedElementBeforeModal) {
      this.focusedElementBeforeModal.focus();
      this.focusedElementBeforeModal = null;
    }
    // Remove the 'video' parameter from the URL (without reloading the page)
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('video');
    window.history.replaceState({}, '', newUrl);
  }

  // Trap focus within the modal for accessibility (so that Tab key cycles inside the modal)
  trapFocus(modalElement) {
    const focusableSelectors = 'button, [href], input, select, textarea, video, [tabindex]:not([tabindex="-1"])';
    const focusableElems = modalElement.querySelectorAll(focusableSelectors);
    if (focusableElems.length === 0) return;
    const firstElem = focusableElems[0];
    const lastElem = focusableElems[focusableElems.length - 1];

    modalElement.addEventListener('keydown', event => {
      // If Tab or Shift+Tab is pressed
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // If Shift+Tab and focus is on first element, move focus to last element
          if (document.activeElement === firstElem) {
            lastElem.focus();
            event.preventDefault();
          }
        } else {
          // If Tab (forward) and focus is on the last element, loop back to first element
          if (document.activeElement === lastElem) {
            firstElem.focus();
            event.preventDefault();
          }
        }
      }
      // Close modal on Escape key
      if (event.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  // Synchronize modal state with the current URL (handles direct navigation or back button)
  handleRoute() {
    const currentParams = new URLSearchParams(window.location.search);
    const videoId = currentParams.get('video');
    if (videoId) {
      // If a video ID is present in URL, open the corresponding video (if not already open)
      const button = document.querySelector(`.play-btn[data-video-id="${videoId}"]`);
      if (button) {
        const videoSrc = button.getAttribute('data-video-src');
        const title = button.getAttribute('data-video-title') || '';
        // Save focus and open the modal for the specified video
        this.focusedElementBeforeModal = document.activeElement;
        this.openModal(videoSrc, title);
      }
    } else {
      // No video param in URL, ensure modal is closed
      const modal = document.getElementById('videoModal');
      if (modal.classList.contains('active')) {
        this.closeModal();
      }
    }
  }
}

// Initialize the single-page application
window.tutorialApp = new TutorialApp();