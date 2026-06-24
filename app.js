/* ==========================================================================
   AeroQR Studio — Application Frontend Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE VARIABLES ---
  let qrCodeInstance = null;
  let validationTimeout = null;
  let customLogoDataUrl = null;
  let contactPhotoBase64 = null; // State for compressed contact photo (clean base64)
  
  // Camera scanning state
  let streamActive = false;
  let localStream = null;
  let scanAnimationId = null;

  // Preset SVGs for quick brand embedding (Data URIs for offline speed)
  const presetSvgs = {
    none: null,
    contact: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%236366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>')}`,
    wifi: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%2314b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke="%2314b8a6" stroke-width="3"/></svg>')}`,
    mail: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%23ec4899" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>')}`,
    phone: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%233b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>')}`,
    instagram: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%23f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="%23f43f5e" stroke-width="3"/></svg>')}`,
    twitter: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>')}`,
    linkedin: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%230a66c2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>')}`,
    youtube: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="%23ff0000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="4.5" rx="3" ry="3"/><polygon points="10 9 15 12 10 15" fill="%23ff0000"/></svg>')}`
  };

  // --- ELEMENT SELECTORS ---
  // Nav Elements
  const navBtns = document.querySelectorAll('.nav-btn');
  const footerNavs = document.querySelectorAll('.footer-nav');
  const tabContents = document.querySelectorAll('.tab-content');

  // Stepper Elements
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const stepLines = document.querySelectorAll('.step-line');
  const stepPanes = document.querySelectorAll('.step-pane');
  const btnBackSteps = document.querySelectorAll('.btn-back-step');
  const btnNextSteps = document.querySelectorAll('.btn-next-step');
  const previewCard = document.querySelector('.preview-card');

  // Generator Selection Cards
  const typeCardBtns = document.querySelectorAll('.type-card-btn');
  const formPanes = document.querySelectorAll('.qr-form-pane');

  // Accordion triggers
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');

  // Live styling input controls
  const dotsTypeSelect = document.getElementById('dots-type');
  const dotsFillRadio = document.getElementsByName('dots-fill-type');
  const dotsColorPicker = document.getElementById('dots-color');
  const dotsColorText = document.getElementById('dots-color-text');
  const dotsGradType = document.getElementById('dots-grad-type');
  const dotsGradRotation = document.getElementById('dots-grad-rotation');
  const dotsGradColor1 = document.getElementById('dots-grad-color1');
  const dotsGradColor1Text = document.getElementById('dots-grad-color1-text');
  const dotsGradColor2 = document.getElementById('dots-grad-color2');
  const dotsGradColor2Text = document.getElementById('dots-grad-color2-text');

  const cornersSquareType = document.getElementById('corners-square-type');
  const cornersSquareFillRadio = document.getElementsByName('corners-square-fill-type');
  const cornersSquareColor = document.getElementById('corners-square-color');
  const cornersSquareColorText = document.getElementById('corners-square-color-text');
  const cornersSquareGradType = document.getElementById('corners-square-grad-type');
  const cornersSquareGradRotation = document.getElementById('corners-square-grad-rotation');
  const cornersSquareGradColor1 = document.getElementById('corners-square-grad-color1');
  const cornersSquareGradColor1Text = document.getElementById('corners-square-grad-color1-text');
  const cornersSquareGradColor2 = document.getElementById('corners-square-grad-color2');
  const cornersSquareGradColor2Text = document.getElementById('corners-square-grad-color2-text');

  const cornersDotType = document.getElementById('corners-dot-type');
  const cornersDotFillRadio = document.getElementsByName('corners-dot-fill-type');
  const cornersDotColor = document.getElementById('corners-dot-color');
  const cornersDotColorText = document.getElementById('corners-dot-color-text');
  const cornersDotGradType = document.getElementById('corners-dot-grad-type');
  const cornersDotGradRotation = document.getElementById('corners-dot-grad-rotation');
  const cornersDotGradColor1 = document.getElementById('corners-dot-grad-color1');
  const cornersDotGradColor1Text = document.getElementById('corners-dot-grad-color1-text');
  const cornersDotGradColor2 = document.getElementById('corners-dot-grad-color2');
  const cornersDotGradColor2Text = document.getElementById('corners-dot-grad-color2-text');

  const bgFillRadio = document.getElementsByName('bg-fill-type');
  const bgColorPicker = document.getElementById('bg-color');
  const bgColorText = document.getElementById('bg-color-text');
  const bgGradType = document.getElementById('bg-grad-type');
  const bgGradRotation = document.getElementById('bg-grad-rotation');
  const bgGradColor1 = document.getElementById('bg-grad-color1');
  const bgGradColor1Text = document.getElementById('bg-grad-color1-text');
  const bgGradColor2 = document.getElementById('bg-grad-color2');
  const bgGradColor2Text = document.getElementById('bg-grad-color2-text');

  // Logo & Advanced Config selectors
  const presetLogoBtns = document.querySelectorAll('.preset-logo-btn');
  const logoUploadInput = document.getElementById('logo-upload');
  const logoUploadTrigger = document.getElementById('logo-upload-trigger');
  const logoFilename = document.getElementById('logo-filename');
  const btnRemoveLogo = document.getElementById('btn-remove-logo');
  const logoSizeSlider = document.getElementById('logo-size');
  const logoSizeVal = document.getElementById('logo-size-val');
  const logoMarginSlider = document.getElementById('logo-margin');
  const logoMarginVal = document.getElementById('logo-margin-val');
  const hideLogoDotsCheckbox = document.getElementById('hide-logo-dots');

  const qrErrorLevelSelect = document.getElementById('qr-error-level');
  const qrMarginSlider = document.getElementById('qr-margin');
  const qrMarginVal = document.getElementById('qr-margin-val');
  const qrSizeSlider = document.getElementById('qr-size');
  const qrSizeVal = document.getElementById('qr-size-val');

  // Preview elements
  const qrCanvasContainer = document.getElementById('qr-canvas-container');
  const scanValidationBadge = document.getElementById('scan-validation-badge');
  const validationIcon = document.getElementById('validation-icon');
  const validationText = document.getElementById('validation-text');
  const validationSpinner = document.getElementById('validation-spinner');

  // Download & action buttons
  const btnDownloadPng = document.querySelector('.btn-download[data-format="png"]');
  const btnDownloadSvg = document.querySelector('.btn-download[data-format="svg"]');
  const btnDownloadJpeg = document.querySelector('.btn-download[data-format="jpeg"]');
  const btnCopyClipboard = document.getElementById('btn-copy-clipboard');
  const btnPrint = document.getElementById('btn-print');
  const btnSaveHistory = document.getElementById('btn-save-history');

  // Scanner elements
  const scanTabBtns = document.querySelectorAll('.scan-tab-btn');
  const scanPanes = document.querySelectorAll('.scan-pane');
  const btnStartCamera = document.getElementById('btn-start-camera');
  const btnStopCamera = document.getElementById('btn-stop-camera');
  const scannerVideo = document.getElementById('scanner-video');
  const cameraCanvas = document.getElementById('scanner-camera-canvas');
  const cameraFallback = document.getElementById('camera-fallback');
  const cameraControls = document.getElementById('camera-controls');
  const cameraSelect = document.getElementById('camera-select');

  const fileDropZone = document.getElementById('file-drop-zone');
  const scanFileInput = document.getElementById('scan-file-input');
  const uploadedImageWrapper = document.getElementById('uploaded-image-wrapper');
  const uploadedQrImg = document.getElementById('uploaded-qr-img');
  const btnClearScanFile = document.getElementById('btn-clear-scan-file');

  const scanResultEmpty = document.getElementById('scan-result-empty');
  const scanResultContent = document.getElementById('scan-result-content');
  const resultBadgeIcon = document.getElementById('result-badge-icon');
  const resultBadgeLabel = document.getElementById('result-badge-label');
  const resultRawText = document.getElementById('result-raw-text');
  const resultStructuredView = document.getElementById('result-structured-view');
  const btnCopyScanResult = document.getElementById('btn-copy-scan-result');
  const scanContextualActions = document.getElementById('scan-contextual-actions');

  // History elements
  const historyEmpty = document.getElementById('history-empty');
  const historyGrid = document.getElementById('history-grid');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const btnNavGeneratorFromEmpty = document.getElementById('btn-nav-generator-from-empty');

  // --- INITIALIZE LUCIDE ICONS ---
  lucide.createIcons();

  // --- TOAST NOTIFICATIONS ---
  function showToast(type, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon based on toast type
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'danger') iconName = 'alert-octagon';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons({ attrs: { class: 'toast-icon' } });

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  }

  // --- TAB NAVIGATION SYSTEM ---
  function switchMainTab(targetTabId) {
    // Deactivate all nav buttons
    navBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Deactivate all tab content sections
    tabContents.forEach(content => {
      if (content.id === `${targetTabId}-section`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Custom actions per tab
    if (targetTabId !== 'scanner') {
      stopCameraScanner();
    } else {
      // Auto trigger webcam check when entering scanner if camera tab active
      const activeScanSource = document.querySelector('.scan-tab-btn.active').getAttribute('data-source');
      if (activeScanSource === 'camera' && streamActive === false) {
        // Optional auto-start logic can go here
      }
    }

    if (targetTabId === 'history') {
      renderHistoryCollection();
    }
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchMainTab(tabId);
      window.location.hash = tabId;
    });
  });

  footerNavs.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-nav');
      switchMainTab(tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Handle direct url hashes
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (['generator', 'scanner', 'history'].includes(hash)) {
      switchMainTab(hash);
    }
  }

  // Empty state button redirect
  btnNavGeneratorFromEmpty.addEventListener('click', () => switchMainTab('generator'));

  // --- INTERACTIVE STYLE ACCORDIONS ---
  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.parentElement;
      const content = trigger.nextElementSibling;
      const isOpen = content.classList.contains('open');

      // Toggle current trigger
      trigger.classList.toggle('active');
      content.classList.toggle('open');
    });
  });

  // Handle color text inputs syncing with color pickers
  function syncColorPickerAndText(pickerEl, textEl) {
    pickerEl.addEventListener('input', (e) => {
      textEl.value = e.target.value;
      generateQRCode();
    });

    textEl.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      // Simple Hex validation
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        pickerEl.value = val;
        textEl.value = val;
        generateQRCode();
      } else {
        showToast('warning', 'Invalid color hex code.');
        textEl.value = pickerEl.value;
      }
    });
  }

  syncColorPickerAndText(dotsColorPicker, dotsColorText);
  syncColorPickerAndText(dotsGradColor1, dotsGradColor1Text);
  syncColorPickerAndText(dotsGradColor2, dotsGradColor2Text);

  syncColorPickerAndText(cornersSquareColor, cornersSquareColorText);
  syncColorPickerAndText(cornersSquareGradColor1, cornersSquareGradColor1Text);
  syncColorPickerAndText(cornersSquareGradColor2, cornersSquareGradColor2Text);

  syncColorPickerAndText(cornersDotColor, cornersDotColorText);
  syncColorPickerAndText(cornersDotGradColor1, cornersDotGradColor1Text);
  syncColorPickerAndText(cornersDotGradColor2, cornersDotGradColor2Text);

  syncColorPickerAndText(bgColorPicker, bgColorText);
  syncColorPickerAndText(bgGradColor1, bgGradColor1Text);
  syncColorPickerAndText(bgGradColor2, bgGradColor2Text);

  // Range sliders UI indicators
  function linkSliderVal(sliderEl, valEl, suffix = '') {
    sliderEl.addEventListener('input', (e) => {
      valEl.textContent = e.target.value + suffix;
      generateQRCode();
    });
  }

  linkSliderVal(logoSizeSlider, logoSizeVal, '%');
  linkSliderVal(logoMarginSlider, logoMarginVal, 'px');
  linkSliderVal(qrMarginSlider, qrMarginVal, 'px');
  linkSliderVal(qrSizeSlider, qrSizeVal, ' x 400'); // Note: height keeps square match
  
  // Custom display label for size slider
  qrSizeSlider.addEventListener('input', (e) => {
    qrSizeVal.textContent = `${e.target.value} x ${e.target.value}`;
  });

  // Toggle fill groups based on selected type (Solid vs Gradient vs Transparent)
  function setupFillToggleListeners(radioGroup, solidGroupEl, gradGroupEl) {
    radioGroup.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'solid') {
          solidGroupEl.classList.remove('hidden');
          gradGroupEl.classList.add('hidden');
        } else if (val === 'gradient') {
          solidGroupEl.classList.add('hidden');
          gradGroupEl.classList.remove('hidden');
        } else if (val === 'transparent') {
          solidGroupEl.classList.add('hidden');
          gradGroupEl.classList.add('hidden');
        }
        generateQRCode();
      });
    });
  }

  setupFillToggleListeners(dotsFillRadio, document.getElementById('dots-solid-color-group'), document.getElementById('dots-gradient-group'));
  setupFillToggleListeners(cornersSquareFillRadio, document.getElementById('corners-square-solid-group'), document.getElementById('corners-square-gradient-group'));
  setupFillToggleListeners(cornersDotFillRadio, document.getElementById('corners-dot-solid-group'), document.getElementById('corners-dot-gradient-group'));
  setupFillToggleListeners(bgFillRadio, document.getElementById('bg-solid-color-group'), document.getElementById('bg-gradient-group'));

  // Sync linear only angle inputs
  [dotsGradType, cornersSquareGradType, cornersDotGradType, bgGradType].forEach(selectEl => {
    selectEl.addEventListener('change', (e) => {
      const container = e.target.closest('.gradient-config');
      const rotationInput = container.querySelector('.linear-only');
      if (rotationInput) {
        if (e.target.value === 'linear') {
          rotationInput.classList.remove('hidden');
        } else {
          rotationInput.classList.add('hidden');
        }
      }
      generateQRCode();
    });
  });

  // --- STEPPER STATE MACHINE & WIZARD ---
  let currentStep = 1;

  function validateStep2Input() {
    const activeCard = document.querySelector('.type-card-btn.active');
    if (!activeCard) return false;
    const type = activeCard.getAttribute('data-type');

    if (type === 'url') {
      const url = document.getElementById('input-url').value.trim();
      if (!url) {
        showToast('warning', 'Please enter a website URL.');
        return false;
      }
    } else if (type === 'contact') {
      const firstName = document.getElementById('contact-first-name').value.trim();
      const lastName = document.getElementById('contact-last-name').value.trim();
      if (!firstName && !lastName) {
        showToast('warning', 'Please enter at least a First or Last name.');
        return false;
      }
    } else if (type === 'text') {
      const txt = document.getElementById('input-text').value.trim();
      if (!txt) {
        showToast('warning', 'Please enter some text payload.');
        return false;
      }
    } else if (type === 'wifi') {
      const ssid = document.getElementById('wifi-ssid').value.trim();
      if (!ssid) {
        showToast('warning', 'Please enter the WiFi SSID.');
        return false;
      }
    } else if (type === 'email') {
      const to = document.getElementById('email-to').value.trim();
      if (!to || !to.includes('@')) {
        showToast('warning', 'Please enter a valid recipient email.');
        return false;
      }
    } else if (type === 'sms') {
      const phone = document.getElementById('sms-phone').value.trim();
      if (!phone) {
        showToast('warning', 'Please enter a recipient phone number.');
        return false;
      }
    } else if (type === 'phone') {
      const phone = document.getElementById('phone-number').value.trim();
      if (!phone) {
        showToast('warning', 'Please enter a dial phone number.');
        return false;
      }
    } else if (type === 'social') {
      const handle = document.getElementById('social-handle').value.trim();
      if (!handle) {
        showToast('warning', 'Please enter the account handle.');
        return false;
      }
    }
    return true;
  }

  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 3) return;

    // Validate if moving forward from step 2
    if (stepNumber > 2 && currentStep === 2) {
      if (!validateStep2Input()) {
        return; // Prevent progress
      }
    }

    currentStep = stepNumber;

    // Toggle active pane display
    stepPanes.forEach(pane => {
      if (pane.id === `step-pane-${stepNumber}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update Step indicators styling
    stepIndicators.forEach(ind => {
      const stepIdx = parseInt(ind.getAttribute('data-step'), 10);
      if (stepIdx < currentStep) {
        ind.classList.add('completed');
        ind.classList.remove('active');
      } else if (stepIdx === currentStep) {
        ind.classList.add('active');
        ind.classList.remove('completed');
      } else {
        ind.classList.remove('active', 'completed');
      }
    });

    // Update connecting lines fill percentage
    stepLines.forEach((line, idx) => {
      if (currentStep > idx + 1) {
        line.classList.add('filled');
      } else {
        line.classList.remove('filled');
      }
    });
  }

  // Bind top stepper header click jumps
  stepIndicators.forEach(ind => {
    ind.addEventListener('click', () => {
      const step = parseInt(ind.getAttribute('data-step'), 10);
      if (step < currentStep) {
        goToStep(step);
      } else if (step === 2 && currentStep === 1) {
        goToStep(2);
      } else if (step === 3 && currentStep === 2) {
        goToStep(3);
      } else if (step === 3 && currentStep === 1) {
        goToStep(2);
        goToStep(3);
      }
    });
  });

  // Bind Back and Next buttons
  btnBackSteps.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-target'), 10);
      goToStep(target);
    });
  });

  btnNextSteps.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-target'), 10);
      goToStep(target);
    });
  });

  // --- QR TYPE SELECTION (GRID CARDS) ---
  typeCardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active button
      typeCardBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Set active form pane
      const type = btn.getAttribute('data-type');
      formPanes.forEach(pane => {
        if (pane.id === `form-${type}`) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Update Step 2 Subtitle
      const step2Subtitle = document.getElementById('step-2-subtitle');
      if (step2Subtitle) {
        const typeLabels = {
          url: 'website URL link details',
          contact: 'vCard contact details',
          text: 'plain text content details',
          wifi: 'wireless network security details',
          email: 'compose email draft parameters',
          sms: 'compose SMS details',
          phone: 'trigger phone call details',
          social: 'social platform coordinates'
        };
        step2Subtitle.textContent = `Enter ${typeLabels[type] || 'details'} below`;
      }

      // Update social prefix
      if (type === 'social') {
        updateSocialPrefix();
      }

      generateQRCode();
      
      // Auto advance to Step 2
      goToStep(2);
    });
  });

  // --- 3D TILT EFFECT ON PREVIEW CARD ---
  if (previewCard) {
    previewCard.addEventListener('mousemove', (e) => {
      const rect = previewCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const width = rect.width;
      const height = rect.height;
      
      const xRotation = -((y - height / 2) / height) * 10;
      const yRotation = ((x - width / 2) / width) * 10;
      
      previewCard.style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    previewCard.style.transformStyle = 'preserve-3d';
    previewCard.style.backfaceVisibility = 'hidden';

    previewCard.addEventListener('mouseleave', () => {
      previewCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  // Social prefix logic
  const socialPlatformSelect = document.getElementById('social-platform');
  const socialPrefixSpan = document.getElementById('social-prefix');
  const socialHandleInput = document.getElementById('social-handle');

  function updateSocialPrefix() {
    const platform = socialPlatformSelect.value;
    if (platform === 'youtube') {
      socialPrefixSpan.textContent = '@';
      socialHandleInput.placeholder = 'channelhandle';
    } else if (platform === 'linkedin') {
      socialPrefixSpan.textContent = 'in/';
      socialHandleInput.placeholder = 'profile-slug';
    } else {
      socialPrefixSpan.textContent = '@';
      socialHandleInput.placeholder = 'username';
    }
  }

  socialPlatformSelect.addEventListener('change', () => {
    updateSocialPrefix();
    generateQRCode();
  });

  // --- BRAND LOGO PRESSETS AND UPLOAD ---
  presetLogoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetLogoBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      generateQRCode();
    });
  });

  // Logo Upload Trigger
  logoUploadTrigger.addEventListener('click', () => logoUploadInput.click());

  // Logo Upload drag/drop
  logoUploadTrigger.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoUploadTrigger.style.borderColor = 'var(--primary)';
  });

  logoUploadTrigger.addEventListener('dragleave', () => {
    logoUploadTrigger.style.borderColor = 'var(--border-color)';
  });

  logoUploadTrigger.addEventListener('drop', (e) => {
    e.preventDefault();
    logoUploadTrigger.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length > 0) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  });

  logoUploadInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleLogoFile(e.target.files[0]);
    }
  });

  function handleLogoFile(file) {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      showToast('warning', 'Only PNG or JPG images are allowed.');
      return;
    }
    if (file.size > 1024 * 1024) { // 1MB limit
      showToast('warning', 'Logo file size exceeds the 1MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      customLogoDataUrl = e.target.result;
      logoFilename.textContent = file.name;
      btnRemoveLogo.classList.remove('hidden');
      
      // Deactivate presets since we uploaded a custom logo
      presetLogoBtns.forEach(b => b.classList.remove('active'));
      
      showToast('success', 'Custom logo loaded!');
      generateQRCode();
    };
    reader.readAsDataURL(file);
  }

  btnRemoveLogo.addEventListener('click', () => {
    customLogoDataUrl = null;
    logoFilename.textContent = 'Max file size: 1MB';
    logoUploadInput.value = '';
    btnRemoveLogo.classList.add('hidden');
    
    // Fallback to "None" preset logo
    presetLogoBtns.forEach(b => {
      if (b.getAttribute('data-preset') === 'none') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    
    showToast('info', 'Custom logo removed.');
    generateQRCode();
  });

  // --- CONTACT PHOTO UPLOADER & COMPRESSION ---
  const contactPhotoInput = document.getElementById('contact-photo-input');
  const btnTriggerPhotoUpload = document.getElementById('btn-trigger-photo-upload');
  const btnRemoveContactPhoto = document.getElementById('btn-remove-contact-photo');
  const contactPhotoPreviewCircle = document.getElementById('contact-photo-preview');
  const contactPhotoImg = document.getElementById('contact-photo-img');
  const photoPreviewIcon = document.getElementById('photo-preview-icon');

  if (btnTriggerPhotoUpload) {
    btnTriggerPhotoUpload.addEventListener('click', () => contactPhotoInput.click());
  }
  if (contactPhotoPreviewCircle) {
    contactPhotoPreviewCircle.addEventListener('click', () => contactPhotoInput.click());
  }

  if (contactPhotoInput) {
    contactPhotoInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleContactPhotoFile(e.target.files[0]);
      }
    });
  }

  function handleContactPhotoFile(file) {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast('warning', 'Only PNG or JPG images are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Downscale image to a tiny 48x48 pixel square to conserve QR code capacity
        const targetSize = 48;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        // Draw cropped to center square
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, targetSize, targetSize);

        // Compress as low-medium quality JPEG (0.4)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
        
        // Strip the data URL prefix to get raw base64 payload
        contactPhotoBase64 = compressedDataUrl.split(',')[1];

        // Update uploader preview
        contactPhotoImg.src = compressedDataUrl;
        contactPhotoImg.classList.remove('hidden');
        photoPreviewIcon.classList.add('hidden');
        if (btnRemoveContactPhoto) btnRemoveContactPhoto.classList.remove('hidden');

        showToast('success', 'Contact photo loaded & compressed!');
        generateQRCode();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (btnRemoveContactPhoto) {
    btnRemoveContactPhoto.addEventListener('click', () => {
      contactPhotoBase64 = null;
      contactPhotoInput.value = '';
      contactPhotoImg.src = '';
      contactPhotoImg.classList.add('hidden');
      photoPreviewIcon.classList.remove('hidden');
      btnRemoveContactPhoto.classList.add('hidden');

      showToast('info', 'Contact photo removed.');
      generateQRCode();
    });
  }

  // --- QR CODE GENERATION LOGIC ---
  function getActiveQRData() {
    const activeTab = document.querySelector('.type-card-btn.active').getAttribute('data-type');
    
    switch (activeTab) {
      case 'url':
        let url = document.getElementById('input-url').value.trim();
        if (url && !/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        return url || 'https://google.com';

      case 'contact':
        const firstName = document.getElementById('contact-first-name').value.trim();
        const lastName = document.getElementById('contact-last-name').value.trim();
        const jobTitle = document.getElementById('contact-job-title').value.trim();
        const org = document.getElementById('contact-org').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const addressWork = document.getElementById('contact-address-work').value.trim();
        const addressHome = document.getElementById('contact-address-home').value.trim();
        const website = document.getElementById('contact-website').value.trim();
        const notes = document.getElementById('contact-notes').value.trim();

        // Standard vCard 3.0 String formatting
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        vcard += `N:${lastName};${firstName};;;\n`;
        vcard += `FN:${firstName} ${lastName}\n`;
        if (org) vcard += `ORG:${org}\n`;
        if (jobTitle) vcard += `TITLE:${jobTitle}\n`;
        if (phone) vcard += `TEL;TYPE=CELL,VOICE:${phone}\n`;
        if (email) vcard += `EMAIL;TYPE=PREF,INTERNET:${email}\n`;
        if (addressWork) {
          const cleanAddr = addressWork.replace(/[,;]/g, '\\$&').replace(/\r?\n/g, ', ');
          vcard += `ADR;TYPE=WORK:;;${cleanAddr};;;;\n`;
        }
        if (addressHome) {
          const cleanAddr = addressHome.replace(/[,;]/g, '\\$&').replace(/\r?\n/g, ', ');
          vcard += `ADR;TYPE=HOME:;;${cleanAddr};;;;\n`;
        }
        if (contactPhotoBase64) {
          vcard += `PHOTO;TYPE=JPEG;ENCODING=b:${contactPhotoBase64}\n`;
        }
        if (website) vcard += `URL:${website}\n`;
        if (notes) vcard += `NOTE:${notes}\n`;
        vcard += 'END:VCARD';
        return vcard;

      case 'text':
        return document.getElementById('input-text').value.trim() || 'AeroQR Studio';

      case 'wifi':
        const ssid = document.getElementById('wifi-ssid').value.trim() || 'WiFi Network';
        const password = document.getElementById('wifi-password').value;
        const encryption = document.getElementById('wifi-encryption').value;
        const hidden = document.getElementById('wifi-hidden').checked;
        
        // WiFi format: WIFI:S:SSID;T:WPA;P:Password;H:false;;
        return `WIFI:S:${ssid};T:${password ? encryption : 'nopass'};P:${password};H:${hidden ? 'true' : 'false'};;`;

      case 'email':
        const to = document.getElementById('email-to').value.trim();
        const subject = document.getElementById('email-subject').value.trim();
        const body = document.getElementById('email-body').value;
        return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      case 'sms':
        const smsPhone = document.getElementById('sms-phone').value.trim();
        const smsMessage = document.getElementById('sms-message').value;
        return `SMSTO:${smsPhone}:${smsMessage}`;

      case 'phone':
        const phoneNumber = document.getElementById('phone-number').value.trim();
        return phoneNumber ? `tel:${phoneNumber}` : 'tel:+15550199';

      case 'social':
        const platform = socialPlatformSelect.value;
        const handle = socialHandleInput.value.trim();
        if (!handle) return 'https://instagram.com';
        
        if (platform === 'instagram') return `https://instagram.com/${handle}`;
        if (platform === 'twitter') return `https://twitter.com/${handle}`;
        if (platform === 'linkedin') return `https://linkedin.com/in/${handle}`;
        if (platform === 'youtube') return `https://youtube.com/@${handle}`;
        if (platform === 'facebook') return `https://facebook.com/${handle}`;
        if (platform === 'github') return `https://github.com/${handle}`;
        return `https://${platform}.com/${handle}`;

      default:
        return 'AeroQR Studio';
    }
  }

  function getGradientSettings(radioGroup, solidColor, gradType, gradRot, gradC1, gradC2) {
    const typeValue = Array.from(radioGroup).find(r => r.checked).value;
    if (typeValue === 'solid') {
      return { color: solidColor.value, gradient: null };
    } else if (typeValue === 'gradient') {
      return {
        color: null,
        gradient: {
          type: gradType.value,
          rotation: gradType.value === 'linear' ? (parseFloat(gradRot.value) * Math.PI) / 180 : 0,
          colorStops: [
            { offset: 0, color: gradC1.value },
            { offset: 1, color: gradC2.value }
          ]
        }
      };
    } else { // Transparent
      return { color: 'rgba(0,0,0,0)', gradient: null };
    }
  }

  function generateQRCode() {
    const payload = getActiveQRData();
    const dotsStyle = getGradientSettings(dotsFillRadio, dotsColorPicker, dotsGradType, dotsGradRotation, dotsGradColor1, dotsGradColor2);
    const cornersSquareStyle = getGradientSettings(cornersSquareFillRadio, cornersSquareColor, cornersSquareGradType, cornersSquareGradRotation, cornersSquareGradColor1, cornersSquareGradColor2);
    const cornersDotStyle = getGradientSettings(cornersDotFillRadio, cornersDotColor, cornersDotGradType, cornersDotGradRotation, cornersDotGradColor1, cornersDotGradColor2);
    const bgStyle = getGradientSettings(bgFillRadio, bgColorPicker, bgGradType, bgGradRotation, bgGradColor1, bgGradColor2);

    // Get Logo
    let logoUrl = null;
    const activePreset = document.querySelector('.preset-logo-btn.active');
    if (activePreset) {
      const presetName = activePreset.getAttribute('data-preset');
      if (presetName !== 'none') {
        logoUrl = presetSvgs[presetName];
      }
    }
    // Override with custom logo if it exists and presets are not overridden
    if (customLogoDataUrl && (!activePreset || activePreset.getAttribute('data-preset') === 'none')) {
      logoUrl = customLogoDataUrl;
    }

    const errorLevel = qrErrorLevelSelect.value;
    const size = parseInt(qrSizeSlider.value, 10);
    const margin = parseInt(qrMarginSlider.value, 10);

    const logoSize = parseFloat(logoSizeSlider.value);
    const logoMargin = parseInt(logoMarginSlider.value, 10);
    const hideLogoDots = hideLogoDotsCheckbox.checked;

    // Build configurations object for qr-code-styling
    const options = {
      width: size,
      height: size,
      type: 'canvas',
      data: payload,
      margin: margin,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: errorLevel
      },
      dotsOptions: {
        type: dotsTypeSelect.value,
        color: dotsStyle.color,
        gradient: dotsStyle.gradient
      },
      backgroundOptions: {
        color: bgStyle.color,
        gradient: bgStyle.gradient
      },
      cornersSquareOptions: {
        type: cornersSquareType.value,
        color: cornersSquareStyle.color,
        gradient: cornersSquareStyle.gradient
      },
      cornersDotOptions: {
        type: cornersDotType.value,
        color: cornersDotStyle.color,
        gradient: cornersDotStyle.gradient
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        hideBackgroundDots: hideLogoDots,
        imageSize: logoSize,
        margin: logoMargin
      }
    };

    if (logoUrl) {
      options.image = logoUrl;
    }

    // Render Canvas
    qrCanvasContainer.innerHTML = '';
    qrCodeInstance = new QRCodeStyling(options);
    qrCodeInstance.append(qrCanvasContainer);

    // Trigger validation checker after rendering is complete (canvas takes a microsecond to render)
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(validateQRReadability, 300);
  }

  // Bind live listeners on inputs to auto-generate
  const liveInputs = [
    dotsTypeSelect, cornersSquareType, cornersDotType, qrErrorLevelSelect,
    hideLogoDotsCheckbox
  ];
  
  // Add listeners to standard controls
  liveInputs.forEach(input => {
    input.addEventListener('change', generateQRCode);
  });

  // Text inputs keyups
  const textInputs = [
    'input-url', 'contact-first-name', 'contact-last-name', 'contact-job-title',
    'contact-org', 'contact-phone', 'contact-email', 'contact-address-work', 'contact-address-home',
    'contact-website', 'contact-notes', 'input-text', 'wifi-ssid', 'wifi-password',
    'wifi-encryption', 'email-to', 'email-subject', 'email-body', 'sms-phone',
    'sms-message', 'phone-number', 'social-handle'
  ];

  textInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', generateQRCode);
    }
  });

  document.getElementById('wifi-hidden').addEventListener('change', generateQRCode);

  // --- BACKGROUND QR VERIFICATION (USING jsQR) ---
  function validateQRReadability() {
    validationSpinner.classList.remove('hidden');
    validationIcon.classList.add('hidden');
    validationText.textContent = 'Verifying Readability...';
    
    // Find canvas in DOM
    const canvas = qrCanvasContainer.querySelector('canvas');
    if (!canvas) {
      setValidationBadge('warning', 'Verification Skipped (Pending Canvas Render)');
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        // QR Code is readable!
        setValidationBadge('valid', 'Scan Readability: Excellent ✅');
      } else {
        // Unreadable QR
        // Warn users that heavy gradient/colors or logos might block it
        setValidationBadge('danger', 'Warning: Code unreadable. Lower styling or increase error level ⚠️');
      }
    } catch (e) {
      // In case canvas is tainted by external image cross-origin
      setValidationBadge('warning', 'Validation Blocked (Security Canvas Origin restrictions)');
      console.warn('Canvas security origin prevented validation check:', e);
    }
  }

  function setValidationBadge(status, text) {
    validationSpinner.classList.add('hidden');
    validationIcon.classList.remove('hidden');
    validationText.textContent = text;
    
    scanValidationBadge.className = 'validation-badge';
    
    if (status === 'valid') {
      scanValidationBadge.classList.add('is-valid');
      validationIcon.setAttribute('data-lucide', 'check-circle');
    } else if (status === 'warning') {
      scanValidationBadge.classList.add('is-warning');
      validationIcon.setAttribute('data-lucide', 'info');
    } else if (status === 'danger') {
      scanValidationBadge.classList.add('is-danger');
      validationIcon.setAttribute('data-lucide', 'alert-triangle');
    }
    lucide.createIcons({ attrs: { class: 'badge-icon' } });
  }

  // --- DOWNLOAD & PRINT ACTIONS ---
  function downloadQR(format) {
    if (!qrCodeInstance) return;
    const activeTab = document.querySelector('.type-card-btn.active').getAttribute('data-type');
    const filename = `aeroqr-${activeTab}-${Date.now()}`;
    
    qrCodeInstance.download({
      name: filename,
      extension: format
    }).then(() => {
      showToast('success', `QR code downloaded as ${format.toUpperCase()}!`);
    }).catch(err => {
      showToast('danger', 'Download failed.');
    });
  }

  btnDownloadPng.addEventListener('click', () => downloadQR('png'));
  btnDownloadSvg.addEventListener('click', () => downloadQR('svg'));
  btnDownloadJpeg.addEventListener('click', () => downloadQR('jpeg'));

  // Copy to Clipboard
  btnCopyClipboard.addEventListener('click', () => {
    const canvas = qrCanvasContainer.querySelector('canvas');
    if (!canvas) {
      showToast('warning', 'QR Code image not generated.');
      return;
    }

    try {
      canvas.toBlob(blob => {
        if (!blob) {
          showToast('danger', 'Error preparing image blob.');
          return;
        }
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          showToast('success', 'QR Image copied to clipboard!');
        }).catch(err => {
          showToast('danger', 'Your browser does not support copy image to clipboard.');
          console.error(err);
        });
      }, 'image/png');
    } catch (err) {
      showToast('danger', 'Security blocks: unable to copy (possibly uploaded logo cross-origin).');
    }
  });

  // Print PDF
  btnPrint.addEventListener('click', () => {
    const canvas = qrCanvasContainer.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code — AeroQR</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: 'Outfit', sans-serif;
              background-color: #fff;
              color: #000;
            }
            img {
              max-width: 320px;
              border: 1px solid #eee;
              border-radius: 8px;
              padding: 12px;
            }
            h2 { font-weight: 500; font-size: 20px; margin-bottom: 5px; }
            p { font-size: 13px; color: #666; margin-top: 15px; }
          </style>
        </head>
        <body>
          <h2>AeroQR Code</h2>
          <img src="${dataUrl}" />
          <p>Scan to read content</p>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  });

  // --- LOCAL HISTORY MANAGEMENT ---
  function getSavedHistory() {
    const history = localStorage.getItem('aero_qr_history');
    return history ? JSON.parse(history) : [];
  }

  function saveToHistory(label, payload, optionsConfig, thumbnailBase64) {
    const history = getSavedHistory();
    const newItem = {
      id: Date.now(),
      label: label,
      payload: payload,
      config: optionsConfig,
      thumbnail: thumbnailBase64
    };

    history.unshift(newItem); // Add to beginning
    
    // Limit history items to 30 for local storage capacity
    if (history.length > 30) {
      history.pop();
    }

    localStorage.setItem('aero_qr_history', JSON.stringify(history));
    showToast('success', 'Saved to your studio collection!');
  }

  btnSaveHistory.addEventListener('click', () => {
    const canvas = qrCanvasContainer.querySelector('canvas');
    if (!canvas) return;

    const payload = getActiveQRData();
    const activeTab = document.querySelector('.type-card-btn.active').getAttribute('data-type');
    
    // Create friendly label
    let label = 'AeroQR Code';
    if (activeTab === 'url') {
      label = document.getElementById('input-url').value.trim() || 'URL';
    } else if (activeTab === 'contact') {
      const fName = document.getElementById('contact-first-name').value.trim();
      const lName = document.getElementById('contact-last-name').value.trim();
      label = `Contact: ${fName} ${lName}`.trim() || 'Contact Card';
    } else if (activeTab === 'wifi') {
      label = `WiFi: ${document.getElementById('wifi-ssid').value.trim() || 'SSID'}`;
    } else if (activeTab === 'text') {
      const txt = document.getElementById('input-text').value.trim();
      label = txt.length > 20 ? txt.substring(0, 17) + '...' : txt || 'Text payload';
    } else {
      label = `${activeTab.toUpperCase()} QR Code`;
    }

    // Take smaller thumbnail version
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 120;
    thumbCanvas.height = 120;
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(canvas, 0, 0, 120, 120);
    const thumbUrl = thumbCanvas.toDataURL('image/png');

    // Collect configurations to reload later
    const config = {
      activeTab: activeTab,
      formData: getFormDataConfig(),
      styling: getStylingFormConfig()
    };

    saveToHistory(label, payload, config, thumbUrl);
  });

  function getFormDataConfig() {
    const config = {};
    const textFields = [
      'input-url', 'contact-first-name', 'contact-last-name', 'contact-job-title',
      'contact-org', 'contact-phone', 'contact-email', 'contact-address-work', 'contact-address-home',
      'contact-website', 'contact-notes', 'input-text', 'wifi-ssid', 'wifi-password',
      'wifi-encryption', 'email-to', 'email-subject', 'email-body', 'sms-phone',
      'sms-message', 'phone-number', 'social-platform', 'social-handle'
    ];

    textFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) config[id] = el.value;
    });

    config['wifi-hidden'] = document.getElementById('wifi-hidden').checked;
    return config;
  }

  function getStylingFormConfig() {
    const config = {
      dotsType: dotsTypeSelect.value,
      dotsFill: Array.from(dotsFillRadio).find(r => r.checked).value,
      dotsColor: dotsColorPicker.value,
      dotsGradType: dotsGradType.value,
      dotsGradRotation: dotsGradRotation.value,
      dotsGradColor1: dotsGradColor1.value,
      dotsGradColor2: dotsGradColor2.value,

      cornersSquareType: cornersSquareType.value,
      cornersSquareFill: Array.from(cornersSquareFillRadio).find(r => r.checked).value,
      cornersSquareColor: cornersSquareColor.value,
      cornersSquareGradType: cornersSquareGradType.value,
      cornersSquareGradRotation: cornersSquareGradRotation.value,
      cornersSquareGradColor1: cornersSquareGradColor1.value,
      cornersSquareGradColor2: cornersSquareGradColor2.value,

      cornersDotType: cornersDotType.value,
      cornersDotFill: Array.from(cornersDotFillRadio).find(r => r.checked).value,
      cornersDotColor: cornersDotColor.value,
      cornersDotGradType: cornersDotGradType.value,
      cornersDotGradRotation: cornersDotGradRotation.value,
      cornersDotGradColor1: cornersDotGradColor1.value,
      cornersDotGradColor2: cornersDotGradColor2.value,

      bgFill: Array.from(bgFillRadio).find(r => r.checked).value,
      bgColor: bgColorPicker.value,
      bgGradType: bgGradType.value,
      bgGradRotation: bgGradRotation.value,
      bgGradColor1: bgGradColor1.value,
      bgGradColor2: bgGradColor2.value,

      logoPreset: document.querySelector('.preset-logo-btn.active').getAttribute('data-preset'),
      logoSize: logoSizeSlider.value,
      logoMargin: logoMarginSlider.value,
      hideLogoDots: hideLogoDotsCheckbox.checked,

      qrErrorLevel: qrErrorLevelSelect.value,
      qrMargin: qrMarginSlider.value,
      qrSize: qrSizeSlider.value
    };

    // Store custom logo DataURL inside config if uploaded
    if (customLogoDataUrl) {
      config.customLogo = customLogoDataUrl;
    }

    // Store custom contact photo base64 inside config if uploaded
    if (contactPhotoBase64) {
      config.contactPhoto = contactPhotoBase64;
    }

    return config;
  }

  function renderHistoryCollection() {
    const history = getSavedHistory();
    if (history.length === 0) {
      historyEmpty.classList.remove('hidden');
      historyGrid.classList.add('hidden');
      return;
    }

    historyEmpty.classList.add('hidden');
    historyGrid.classList.remove('hidden');
    historyGrid.innerHTML = '';

    history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card glass-card history-item-card';
      
      const dateStr = new Date(item.id).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      card.innerHTML = `
        <div class="history-img-wrapper">
          <img src="${item.thumbnail}" alt="QR Thumbnail">
        </div>
        <div class="history-meta">
          <h4 title="${item.label}">${item.label}</h4>
          <div class="history-meta-sub">
            <span>${item.config.activeTab.toUpperCase()}</span>
            <span>${dateStr}</span>
          </div>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-primary btn-sm btn-history-load" data-id="${item.id}" title="Reload this configuration in the editor">
            <i data-lucide="edit-3"></i> Load
          </button>
          <button class="btn btn-secondary btn-sm btn-history-download" data-id="${item.id}" title="Download PNG">
            <i data-lucide="download"></i>
          </button>
          <button class="btn btn-secondary btn-sm text-danger btn-history-delete" data-id="${item.id}" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      historyGrid.appendChild(card);
    });

    lucide.createIcons({ attrs: { class: 'history-item-icon' } });
    bindHistoryItemActionListeners();
  }

  function bindHistoryItemActionListeners() {
    const history = getSavedHistory();

    // Load action
    document.querySelectorAll('.btn-history-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const item = history.find(i => i.id === id);
        if (item) {
          loadHistoryItemConfig(item.config);
          switchMainTab('generator');
          showToast('info', 'Loaded template into editor.');
        }
      });
    });

    // Quick download
    document.querySelectorAll('.btn-history-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const item = history.find(i => i.id === id);
        if (item) {
          // Temporarily render QR configuration for full resolution download
          const tempDiv = document.createElement('div');
          const tempOptions = buildStylingOptionsFromSaved(item.config, item.payload);
          const tempQR = new QRCodeStyling(tempOptions);
          tempQR.download({ name: `aeroqr-${Date.now()}`, extension: 'png' })
            .then(() => showToast('success', 'Downloaded successfully!'))
            .catch(() => showToast('danger', 'Download failed.'));
        }
      });
    });

    // Delete item
    document.querySelectorAll('.btn-history-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        let currentHistory = getSavedHistory();
        currentHistory = currentHistory.filter(i => i.id !== id);
        localStorage.setItem('aero_qr_history', JSON.stringify(currentHistory));
        renderHistoryCollection();
        showToast('info', 'Item removed.');
      });
    });
  }

  function buildStylingOptionsFromSaved(config, payload) {
    // Helper to recreate styling parameters
    const size = parseInt(config.qrSize, 10);
    const margin = parseInt(config.qrMargin, 10);
    
    // Map gradients helper
    function getGradient(fillType, color, gradType, gradRot, c1, c2) {
      if (fillType === 'solid') return { color: color, gradient: null };
      if (fillType === 'gradient') {
        return {
          color: null,
          gradient: {
            type: gradType,
            rotation: gradType === 'linear' ? (parseFloat(gradRot) * Math.PI) / 180 : 0,
            colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
          }
        };
      }
      return { color: 'rgba(0,0,0,0)', gradient: null };
    }

    const dots = getGradient(config.dotsFill, config.dotsColor, config.dotsGradType, config.dotsGradRotation, config.dotsGradColor1, config.dotsGradColor2);
    const cornersSquare = getGradient(config.cornersSquareFill, config.cornersSquareColor, config.cornersSquareGradType, config.cornersSquareGradRotation, config.cornersSquareGradColor1, config.cornersSquareGradColor2);
    const cornersDot = getGradient(config.cornersDotFill, config.cornersDotColor, config.cornersDotGradType, config.cornersDotGradRotation, config.cornersDotGradColor1, config.cornersDotGradColor2);
    const bg = getGradient(config.bgFill, config.bgColor, config.bgGradType, config.bgGradRotation, config.bgGradColor1, config.bgGradColor2);

    let logo = null;
    if (config.logoPreset !== 'none') logo = presetSvgs[config.logoPreset];
    if (config.customLogo) logo = config.customLogo;

    const opt = {
      width: size,
      height: size,
      type: 'canvas',
      data: payload,
      margin: margin,
      qrOptions: { errorCorrectionLevel: config.qrErrorLevel },
      dotsOptions: { type: config.dotsType, color: dots.color, gradient: dots.gradient },
      backgroundOptions: { color: bg.color, gradient: bg.gradient },
      cornersSquareOptions: { type: config.cornersSquareType, color: cornersSquare.color, gradient: cornersSquare.gradient },
      cornersDotOptions: { type: config.cornersDotType, color: cornersDot.color, gradient: cornersDot.gradient },
      imageOptions: {
        crossOrigin: 'anonymous',
        hideBackgroundDots: config.hideLogoDots,
        imageSize: parseFloat(config.logoSize),
        margin: parseInt(config.logoMargin, 10)
      }
    };
    if (logo) opt.image = logo;
    return opt;
  }

  function loadHistoryItemConfig(config) {
    // 1. Reload Form Inputs
    const keys = Object.keys(config.formData);
    keys.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = config.formData[id];
        } else {
          el.value = config.formData[id];
        }
      }
    });

    // Reload Contact Photo uploader preview if saved
    if (config.styling && config.styling.contactPhoto) {
      contactPhotoBase64 = config.styling.contactPhoto;
      if (contactPhotoImg) {
        contactPhotoImg.src = `data:image/jpeg;base64,${contactPhotoBase64}`;
        contactPhotoImg.classList.remove('hidden');
      }
      if (photoPreviewIcon) photoPreviewIcon.classList.add('hidden');
      if (btnRemoveContactPhoto) btnRemoveContactPhoto.classList.remove('hidden');
    } else {
      contactPhotoBase64 = null;
      if (contactPhotoInput) contactPhotoInput.value = '';
      if (contactPhotoImg) {
        contactPhotoImg.src = '';
        contactPhotoImg.classList.add('hidden');
      }
      if (photoPreviewIcon) photoPreviewIcon.classList.remove('hidden');
      if (btnRemoveContactPhoto) btnRemoveContactPhoto.classList.add('hidden');
    }

    // 2. Activate type tab
    typeCardBtns.forEach(btn => {
      if (btn.getAttribute('data-type') === config.activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    formPanes.forEach(pane => {
      if (pane.id === `form-${config.activeTab}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // 3. Reload Design Styling inputs
    dotsTypeSelect.value = config.dotsType;
    setRadioValue(dotsFillRadio, config.dotsFill);
    dotsColorPicker.value = config.dotsColor;
    dotsColorText.value = config.dotsColor;
    dotsGradType.value = config.dotsGradType;
    dotsGradRotation.value = config.dotsGradRotation;
    dotsGradColor1.value = config.dotsGradColor1;
    dotsGradColor1Text.value = config.dotsGradColor1;
    dotsGradColor2.value = config.dotsGradColor2;
    dotsGradColor2Text.value = config.dotsGradColor2;

    cornersSquareType.value = config.cornersSquareType;
    setRadioValue(cornersSquareFillRadio, config.cornersSquareFill);
    cornersSquareColor.value = config.cornersSquareColor;
    cornersSquareColorText.value = config.cornersSquareColor;
    cornersSquareGradType.value = config.cornersSquareGradType;
    cornersSquareGradRotation.value = config.cornersSquareGradRotation;
    cornersSquareGradColor1.value = config.cornersSquareGradColor1;
    cornersSquareGradColor1Text.value = config.cornersSquareGradColor1;
    cornersSquareGradColor2.value = config.cornersSquareGradColor2;
    cornersSquareGradColor2Text.value = config.cornersSquareGradColor2;

    cornersDotType.value = config.cornersDotType;
    setRadioValue(cornersDotFillRadio, config.cornersDotFill);
    cornersDotColor.value = config.cornersDotColor;
    cornersDotColorText.value = config.cornersDotColor;
    cornersDotGradType.value = config.cornersDotGradType;
    cornersDotGradRotation.value = config.cornersDotGradRotation;
    cornersDotGradColor1.value = config.cornersDotGradColor1;
    cornersDotGradColor1Text.value = config.cornersDotGradColor1;
    cornersDotGradColor2.value = config.cornersDotGradColor2;
    cornersDotGradColor2Text.value = config.cornersDotGradColor2;

    setRadioValue(bgFillRadio, config.bgFill);
    bgColorPicker.value = config.bgColor;
    bgColorText.value = config.bgColor;
    bgGradType.value = config.bgGradType;
    bgGradRotation.value = config.bgGradRotation;
    bgGradColor1.value = config.bgGradColor1;
    bgGradColor1Text.value = config.bgGradColor1;
    bgGradColor2.value = config.bgGradColor2;
    bgGradColor2Text.value = config.bgGradColor2;

    // Logo settings
    presetLogoBtns.forEach(btn => {
      if (btn.getAttribute('data-preset') === config.logoPreset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    customLogoDataUrl = config.customLogo || null;
    if (customLogoDataUrl) {
      logoFilename.textContent = 'Custom Loaded Template Logo';
      btnRemoveLogo.classList.remove('hidden');
    } else {
      logoFilename.textContent = 'Max file size: 1MB';
      btnRemoveLogo.classList.add('hidden');
    }

    logoSizeSlider.value = config.logoSize;
    logoSizeVal.textContent = Math.round(parseFloat(config.logoSize) * 100) + '%';
    logoMarginSlider.value = config.logoMargin;
    logoMarginVal.textContent = config.logoMargin + 'px';
    hideLogoDotsCheckbox.checked = config.hideLogoDots;

    // Advanced settings
    qrErrorLevelSelect.value = config.qrErrorLevel;
    qrMarginSlider.value = config.qrMargin;
    qrMarginVal.textContent = config.qrMargin + 'px';
    qrSizeSlider.value = config.qrSize;
    qrSizeVal.textContent = `${config.qrSize} x ${config.qrSize}`;

    // Force layouts toggle updates
    triggerChange(dotsFillRadio);
    triggerChange(cornersSquareFillRadio);
    triggerChange(cornersDotFillRadio);
    triggerChange(bgFillRadio);

    // Update social helper
    if (config.activeTab === 'social') updateSocialPrefix();

    // Re-render
    generateQRCode();
  }

  function setRadioValue(radioGroup, value) {
    radioGroup.forEach(radio => {
      if (radio.value === value) radio.checked = true;
    });
  }

  function triggerChange(radioGroup) {
    const checked = Array.from(radioGroup).find(r => r.checked);
    if (checked) {
      checked.dispatchEvent(new Event('change'));
    }
  }

  btnClearHistory.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all saved QR codes?')) {
      localStorage.removeItem('aero_qr_history');
      renderHistoryCollection();
      showToast('info', 'History collection cleared.');
    }
  });

  // --- SCANNER TABS SWITCHING ---
  scanTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scanTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const source = btn.getAttribute('data-source');
      scanPanes.forEach(pane => {
        if (pane.id === `pane-scan-${source}`) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      if (source === 'camera') {
        // Stop current scanner and start camera scanner if active
        stopCameraScanner();
      } else {
        stopCameraScanner();
      }
    });
  });

  // --- WEBCAM SCANNER CONTROLLER (jsQR) ---
  btnStartCamera.addEventListener('click', startCameraScanner);
  btnStopCamera.addEventListener('click', stopCameraScanner);
  cameraSelect.addEventListener('change', startCameraScanner); // Switch camera input

  function startCameraScanner() {
    cameraFallback.classList.add('hidden');
    cameraControls.classList.remove('hidden');

    const constraints = {
      video: { facingMode: 'environment' }
    };

    // If camera device selected, request it explicitly
    if (cameraSelect.value) {
      constraints.video = { deviceId: { exact: cameraSelect.value } };
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        localStream = stream;
        scannerVideo.srcObject = stream;
        scannerVideo.setAttribute('playsinline', true); // IOS compatibility
        scannerVideo.play();
        streamActive = true;
        
        // Hide fallback, show controls
        cameraControls.classList.remove('hidden');

        // Populate camera selector if empty
        populateCameraSelectDevices();

        // Start animation scanning loop
        scanAnimationId = requestAnimationFrame(scanCameraLoop);
        showToast('info', 'Camera source active.');
      })
      .catch(err => {
        console.error('Camera access error:', err);
        cameraFallback.classList.remove('hidden');
        cameraControls.classList.add('hidden');
        showToast('danger', 'Camera access blocked or not available.');
      });
  }

  function stopCameraScanner() {
    streamActive = false;
    cancelAnimationFrame(scanAnimationId);

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    scannerVideo.srcObject = null;
    
    // Clear canvas
    const ctx = cameraCanvas.getContext('2d');
    ctx.clearRect(0, 0, cameraCanvas.width, cameraCanvas.height);

    cameraFallback.classList.remove('hidden');
    cameraControls.classList.add('hidden');
  }

  function populateCameraSelectDevices() {
    if (cameraSelect.children.length > 0) return; // Already populated
    
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        cameraSelect.innerHTML = '';
        
        videoDevices.forEach((device, index) => {
          const opt = document.createElement('option');
          opt.value = device.deviceId;
          opt.textContent = device.label || `Camera ${index + 1}`;
          cameraSelect.appendChild(opt);
        });

        if (videoDevices.length === 0) {
          const opt = document.createElement('option');
          opt.textContent = 'No cameras found';
          cameraSelect.appendChild(opt);
        }
      })
      .catch(err => console.error('Enumerate devices failed:', err));
  }

  function scanCameraLoop() {
    if (!streamActive) return;

    if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
      cameraCanvas.width = scannerVideo.videoWidth;
      cameraCanvas.height = scannerVideo.videoHeight;
      const ctx = cameraCanvas.getContext('2d');
      
      // Mirror canvas drawing
      ctx.save();
      ctx.translate(cameraCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(scannerVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
      ctx.restore();

      const imageData = ctx.getImageData(0, 0, cameraCanvas.width, cameraCanvas.height);
      const code = jsQR(imageData.data, cameraCanvas.width, cameraCanvas.height);

      if (code) {
        // Draw highlight overlay box around QR code
        drawQRBoundingOutline(ctx, code.location, 'var(--secondary)');
        
        // Decoded data! Stop scanner and render result
        stopCameraScanner();
        renderDecodedResult(code.data);
        showToast('success', 'QR Code successfully scanned!');
        return; // Break loop
      }
    }
    scanAnimationId = requestAnimationFrame(scanCameraLoop);
  }

  function drawQRBoundingOutline(ctx, location, color) {
    function drawLine(begin, end) {
      ctx.beginPath();
      ctx.moveTo(begin.x, begin.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    
    drawLine(location.topLeftCorner, location.topRightCorner);
    drawLine(location.topRightCorner, location.bottomRightCorner);
    drawLine(location.bottomRightCorner, location.bottomLeftCorner);
    drawLine(location.bottomLeftCorner, location.topLeftCorner);
  }

  // --- FILE SCANNER CONTROLLER ---
  fileDropZone.addEventListener('click', () => scanFileInput.click());

  fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('dragover');
  });

  fileDropZone.addEventListener('dragleave', () => {
    fileDropZone.classList.remove('dragover');
  });

  fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      scanUploadedFile(e.dataTransfer.files[0]);
    }
  });

  scanFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      scanUploadedFile(e.target.files[0]);
    }
  });

  function scanUploadedFile(file) {
    if (file.size > 3 * 1024 * 1024) { // 3MB limit
      showToast('warning', 'Uploaded file size exceeds 3MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedQrImg.src = e.target.result;
      
      // Toggle views
      fileDropZone.classList.add('hidden');
      uploadedImageWrapper.classList.remove('hidden');

      // Process image using Image element canvas extraction
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);

          if (code) {
            renderDecodedResult(code.data);
            showToast('success', 'File Decoded successfully!');
          } else {
            renderScanFailure();
            showToast('danger', 'Unable to find or decode a QR code in this image.');
          }
        } catch (err) {
          showToast('danger', 'Security error accessing uploaded image pixels.');
          console.error(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  btnClearScanFile.addEventListener('click', () => {
    uploadedQrImg.src = '';
    scanFileInput.value = '';
    fileDropZone.classList.remove('hidden');
    uploadedImageWrapper.classList.add('hidden');
    renderScanReset();
  });

  // --- SCAN RESULTS VIEWPARSER ---
  function renderDecodedResult(rawData) {
    scanResultEmpty.classList.add('hidden');
    scanResultContent.classList.remove('hidden');
    
    resultRawText.textContent = rawData;

    // Detect type and format structured view
    const typeInfo = detectQRPayloadType(rawData);
    
    // Set Badge styles
    resultBadgeLabel.textContent = typeInfo.type;
    resultBadgeIcon.setAttribute('data-lucide', typeInfo.icon);
    
    // Color code based on type
    const badge = resultBadgeLabel.parentElement;
    badge.className = 'result-type-badge';

    // Populate structured details
    resultStructuredView.innerHTML = '';
    resultStructuredView.classList.remove('hidden');
    scanContextualActions.innerHTML = '';

    if (typeInfo.type === 'CONTACT') {
      const contact = parseVCard(rawData);
      renderStructuredContact(contact);
    } else if (typeInfo.type === 'WIFI') {
      const wifi = parseWiFi(rawData);
      renderStructuredWiFi(wifi);
    } else if (typeInfo.type === 'WEBSITE' || typeInfo.type === 'EMAIL') {
      // General links context
      resultStructuredView.classList.add('hidden'); // No deep parsing needed
      renderContextLinkActions(typeInfo.type, rawData);
    } else {
      resultStructuredView.classList.add('hidden');
    }

    lucide.createIcons({ attrs: { class: 'decoded-card-icon' } });
  }

  function renderScanFailure() {
    scanResultEmpty.classList.remove('hidden');
    scanResultContent.classList.add('hidden');
    scanResultEmpty.querySelector('p').textContent = 'Unable to decode code';
    scanResultEmpty.querySelector('span').textContent = 'The uploaded image did not contain a valid or readable QR code. Try an image with higher contrast.';
  }

  function renderScanReset() {
    scanResultEmpty.classList.remove('hidden');
    scanResultContent.classList.add('hidden');
    scanResultEmpty.querySelector('p').textContent = 'Awaiting QR scan or file upload...';
    scanResultEmpty.querySelector('span').textContent = 'Bring a QR code in front of the camera or upload a saved file.';
  }

  function detectQRPayloadType(data) {
    if (/^https?:\/\//i.test(data)) {
      return { type: 'WEBSITE', icon: 'globe' };
    }
    if (/^BEGIN:VCARD/i.test(data) || /^MECARD:/i.test(data)) {
      return { type: 'CONTACT', icon: 'user' };
    }
    if (/^WIFI:/i.test(data)) {
      return { type: 'WIFI', icon: 'wifi' };
    }
    if (/^mailto:/i.test(data)) {
      return { type: 'EMAIL', icon: 'mail' };
    }
    if (/^tel:/i.test(data)) {
      return { type: 'PHONE', icon: 'phone' };
    }
    if (/^smsto:/i.test(data)) {
      return { type: 'SMS', icon: 'message-square' };
    }
    return { type: 'TEXT PAYLOAD', icon: 'align-left' };
  }

  // Parses basic vCard 3.0 fields
  function parseVCard(vcardStr) {
    const contact = {
      fullName: '',
      organization: '',
      jobTitle: '',
      phone: '',
      email: '',
      addressWork: '',
      addressHome: '',
      photo: '', // Base64 data URL
      website: '',
      notes: ''
    };

    // Unfold multi-line parameters (necessary for wrapped base64 photo payloads)
    const unfoldedStr = vcardStr.replace(/\r?\n[ \t]/g, '');
    const lines = unfoldedStr.split(/\r?\n/);
    
    lines.forEach(line => {
      // Find matches for standard vCard parameters
      if (/^FN:/i.test(line)) {
        contact.fullName = line.substring(3).trim();
      } else if (/^ORG:/i.test(line)) {
        contact.organization = line.substring(4).trim();
      } else if (/^TITLE:/i.test(line)) {
        contact.jobTitle = line.substring(6).trim();
      } else if (/^TEL[^:]*:/i.test(line)) {
        contact.phone = line.split(':').slice(1).join(':').trim();
      } else if (/^EMAIL[^:]*:/i.test(line)) {
        contact.email = line.split(':').slice(1).join(':').trim();
      } else if (/^URL:/i.test(line)) {
        contact.website = line.substring(4).trim();
      } else if (/^NOTE:/i.test(line)) {
        contact.notes = line.substring(5).trim();
      } else if (/^ADR;TYPE=WORK[^:]*:/i.test(line) || /^ADR;WORK[^:]*:/i.test(line)) {
        const rawAddr = line.split(':').slice(1).join(':').trim();
        contact.addressWork = rawAddr.split(';').filter(Boolean).join(', ').replace(/\\([,;])/g, '$1');
      } else if (/^ADR;TYPE=HOME[^:]*:/i.test(line) || /^ADR;HOME[^:]*:/i.test(line)) {
        const rawAddr = line.split(':').slice(1).join(':').trim();
        contact.addressHome = rawAddr.split(';').filter(Boolean).join(', ').replace(/\\([,;])/g, '$1');
      } else if (/^ADR[^:]*:/i.test(line)) {
        // Fallback address parsing
        const rawAddr = line.split(':').slice(1).join(':').trim();
        const parsedAddr = rawAddr.split(';').filter(Boolean).join(', ').replace(/\\([,;])/g, '$1');
        if (!contact.addressWork) {
          contact.addressWork = parsedAddr;
        } else {
          contact.addressHome = parsedAddr;
        }
      } else if (/^PHOTO[^:]*:/i.test(line)) {
        const parts = line.split(':');
        const params = parts[0];
        const base64Data = parts.slice(1).join(':').trim();
        if (base64Data) {
          let mime = 'image/jpeg';
          if (/png/i.test(params)) mime = 'image/png';
          contact.photo = `data:${mime};base64,${base64Data}`;
        }
      }
    });

    // Fallback if FN is empty but N is present
    if (!contact.fullName) {
      const nLine = lines.find(l => /^N:/i.test(l));
      if (nLine) {
        const parts = nLine.substring(2).split(';');
        const last = parts[0] || '';
        const first = parts[1] || '';
        contact.fullName = `${first} ${last}`.trim();
      }
    }

    return contact;
  }

  function parseWiFi(wifiStr) {
    // WIFI:S:SSID;T:WPA;P:Password;H:false;;
    const wifi = { ssid: '', encryption: 'None', password: '', hidden: 'No' };
    const cleanStr = wifiStr.replace(/^WIFI:/i, '');
    
    // Split by semicolons, but ignore semicolons escaped or inside strings
    const parts = cleanStr.split(/(?<!\\);/);
    parts.forEach(part => {
      const splitVal = part.split(/(?<!\\):/);
      if (splitVal.length >= 2) {
        const key = splitVal[0].toUpperCase();
        const val = splitVal.slice(1).join(':').replace(/\\([:;])/g, '$1');
        
        if (key === 'S') wifi.ssid = val;
        if (key === 'T') wifi.encryption = val === 'nopass' ? 'None' : val;
        if (key === 'P') wifi.password = val;
        if (key === 'H') wifi.hidden = val === 'true' ? 'Yes' : 'No';
      }
    });
    return wifi;
  }

  function renderStructuredContact(contact) {
    const initials = contact.fullName ? contact.fullName.substring(0, 2).toUpperCase() : 'QR';
    
    resultStructuredView.innerHTML = `
      <div class="structured-contact-card">
        <div class="contact-avatar-row">
          <div class="contact-avatar">
            ${contact.photo ? `<img src="${contact.photo}" alt="Contact Photo">` : initials}
          </div>
          <div class="contact-main-info">
            <h3>${contact.fullName || 'No Name Field'}</h3>
            <p>${contact.jobTitle ? contact.jobTitle : ''} ${contact.organization ? 'at ' + contact.organization : ''}</p>
          </div>
        </div>
        <div class="contact-field-grid">
          ${contact.phone ? `
            <div class="contact-field">
              <i data-lucide="phone"></i>
              <div>
                <label>Phone Number</label>
                <span>${contact.phone}</span>
              </div>
            </div>` : ''}
          ${contact.email ? `
            <div class="contact-field">
              <i data-lucide="mail"></i>
              <div>
                <label>Email Address</label>
                <span>${contact.email}</span>
              </div>
            </div>` : ''}
          ${contact.addressWork ? `
            <div class="contact-field">
              <i data-lucide="building-2"></i>
              <div>
                <label>Work Address</label>
                <span>${contact.addressWork}</span>
              </div>
            </div>` : ''}
          ${contact.addressHome ? `
            <div class="contact-field">
              <i data-lucide="home"></i>
              <div>
                <label>Home Address</label>
                <span>${contact.addressHome}</span>
              </div>
            </div>` : ''}
          ${contact.website ? `
            <div class="contact-field">
              <i data-lucide="globe"></i>
              <div>
                <label>Website</label>
                <span>${contact.website}</span>
              </div>
            </div>` : ''}
          ${contact.notes ? `
            <div class="contact-field">
              <i data-lucide="sticky-note"></i>
              <div>
                <label>Memo / Notes</label>
                <span>${contact.notes}</span>
              </div>
            </div>` : ''}
        </div>
      </div>
    `;

    // Add Save Contact VCF Action
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-secondary';
    downloadBtn.style.marginTop = '10px';
    downloadBtn.innerHTML = '<i data-lucide="user-plus"></i> Export as Contact File (.vcf)';
    downloadBtn.addEventListener('click', () => {
      const payload = resultRawText.textContent;
      const blob = new Blob([payload], { type: 'text/vcard;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${contact.fullName.replace(/\s+/g, '_') || 'contact'}.vcf`;
      link.click();
      showToast('success', 'vCard contact exported successfully!');
    });
    scanContextualActions.appendChild(downloadBtn);
  }

  function renderStructuredWiFi(wifi) {
    resultStructuredView.innerHTML = `
      <div class="structured-wifi-card">
        <h3><i data-lucide="wifi"></i> WiFi Network Details</h3>
        <div class="wifi-data-row">
          <div class="wifi-data-cell">
            <label>SSID / Network Name</label>
            <span>${wifi.ssid || '(Missing)'}</span>
          </div>
          <div class="wifi-data-cell">
            <label>Security Protocol</label>
            <span>${wifi.encryption}</span>
          </div>
        </div>
        <div class="wifi-data-row">
          ${wifi.password ? `
            <div class="wifi-data-cell">
              <label>Password</label>
              <span>${wifi.password}</span>
            </div>` : ''}
          <div class="wifi-data-cell">
            <label>Hidden Network</label>
            <span>${wifi.hidden}</span>
          </div>
        </div>
      </div>
    `;

    // Add connect context instruction
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-secondary';
    actionBtn.style.marginTop = '10px';
    actionBtn.innerHTML = '<i data-lucide="copy"></i> Copy WiFi Password';
    actionBtn.addEventListener('click', () => {
      if (wifi.password) {
        navigator.clipboard.writeText(wifi.password);
        showToast('success', 'WiFi password copied!');
      } else {
        showToast('warning', 'Network is unsecured, no password needed.');
      }
    });
    scanContextualActions.appendChild(actionBtn);
  }

  function renderContextLinkActions(type, rawData) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-secondary';
    
    if (type === 'WEBSITE') {
      actionBtn.innerHTML = '<i data-lucide="external-link"></i> Launch Website URL';
      actionBtn.addEventListener('click', () => {
        window.open(rawData, '_blank');
      });
    } else if (type === 'EMAIL') {
      actionBtn.innerHTML = '<i data-lucide="mail-forward"></i> Compose Email';
      actionBtn.addEventListener('click', () => {
        window.location.href = rawData;
      });
    }
    scanContextualActions.appendChild(actionBtn);
  }

  btnCopyScanResult.addEventListener('click', () => {
    const txt = resultRawText.textContent;
    if (txt) {
      navigator.clipboard.writeText(txt);
      showToast('success', 'Payload copied to clipboard!');
    }
  });

  // --- COPY GENERATED DATA & BOOT ---
  // Generate first code on load
  generateQRCode();
});
