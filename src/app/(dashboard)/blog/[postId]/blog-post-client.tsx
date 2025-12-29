
"use client";

import React, { useEffect } from 'react';
import type { SocialMediaPost } from '@/types/social-media';

interface BlogPostClientProps {
    post: SocialMediaPost;
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const isWebPage = post.platform === 'SalesLandingPage' || post.platform === 'BlogPost';
  const contentToRender = isWebPage ? post.textContent : '';

  useEffect(() => {
    if (isWebPage && contentToRender) {
      // Inject the lead capture widget HTML/CSS/JS into the content
      const leadCaptureWidget = generateLeadCaptureWidget(post.id, post.originalTopic);
      const contentWithWidget = contentToRender + leadCaptureWidget;
      
      document.open();
      document.write(contentWithWidget);
      document.close();
    }
  }, [isWebPage, contentToRender, post.id, post.originalTopic]);

  return null;
}

/**
 * Generates the HTML/CSS/JS for the floating lead capture widget
 * This is injected directly into the page since we're using document.write
 */
function generateLeadCaptureWidget(postId: string, pageTitle?: string): string {
  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/capture-sales-lead`
    : '/api/capture-sales-lead';
    
  return `
<!-- OmniFlow Lead Capture Widget -->
<style>
  @keyframes omniflow-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  @keyframes omniflow-scale-in {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .omniflow-widget-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4);
    animation: omniflow-bounce 2s ease-in-out infinite;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .omniflow-widget-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 50px rgba(99, 102, 241, 0.5);
    animation: none;
  }
  .omniflow-widget-btn svg {
    width: 20px;
    height: 20px;
  }
  .omniflow-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
  .omniflow-modal-overlay.active {
    display: flex;
  }
  .omniflow-modal {
    width: 100%;
    max-width: 420px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: omniflow-scale-in 0.2s ease-out;
  }
  .omniflow-modal-header {
    padding: 20px 24px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    position: relative;
  }
  .omniflow-modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-modal-header p {
    margin: 4px 0 0;
    font-size: 14px;
    opacity: 0.9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: white;
    opacity: 0.8;
    cursor: pointer;
    padding: 4px;
  }
  .omniflow-close-btn:hover { opacity: 1; }
  .omniflow-modal-body {
    padding: 24px;
  }
  .omniflow-form-group {
    margin-bottom: 16px;
  }
  .omniflow-form-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-form-group label span {
    color: #ef4444;
  }
  .omniflow-form-group label .optional {
    color: #9ca3af;
    font-weight: 400;
  }
  .omniflow-form-group input,
  .omniflow-form-group textarea,
  .omniflow-form-group select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    background: #fff;
  }
  .omniflow-form-group input:focus,
  .omniflow-form-group textarea:focus,
  .omniflow-form-group select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  .omniflow-form-group textarea {
    resize: none;
    min-height: 80px;
  }
  .omniflow-phone-row {
    display: flex;
    gap: 8px;
  }
  .omniflow-phone-row select {
    width: 110px;
    flex-shrink: 0;
  }
  .omniflow-phone-row input {
    flex: 1;
  }
  .omniflow-phone-hint {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 4px;
  }
  .omniflow-submit-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 15px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity 0.2s;
  }
  .omniflow-submit-btn:hover { opacity: 0.9; }
  .omniflow-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .omniflow-submit-btn svg { width: 20px; height: 20px; }
  .omniflow-error {
    padding: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-success {
    text-align: center;
    padding: 32px 24px;
  }
  .omniflow-success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .omniflow-success-icon svg { width: 32px; height: 32px; color: #16a34a; }
  .omniflow-success h4 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-success p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-disclaimer {
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .omniflow-hidden { display: none !important; }
  .omniflow-spinner {
    animation: omniflow-spin 1s linear infinite;
  }
  @keyframes omniflow-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>

<button class="omniflow-widget-btn" id="omniflow-open-btn" style="display: none;">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
  </svg>
  <span>Get in Touch</span>
</button>

<div class="omniflow-modal-overlay" id="omniflow-modal">
  <div class="omniflow-modal">
    <div class="omniflow-modal-header">
      <button class="omniflow-close-btn" id="omniflow-close-btn">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <h3>Let's Connect!</h3>
      <p>Fill out the form and we'll get back to you shortly.</p>
    </div>
    <div class="omniflow-modal-body">
      <div id="omniflow-form-container">
        <form id="omniflow-lead-form">
          <input type="text" name="honeypot" style="display:none" tabindex="-1" autocomplete="off">
          <div class="omniflow-form-group">
            <label>Name <span>*</span></label>
            <input type="text" name="name" required placeholder="Your name">
          </div>
          <div class="omniflow-form-group">
            <label>Email <span>*</span></label>
            <input type="email" name="email" required placeholder="you@example.com">
          </div>
          <div class="omniflow-form-group">
            <label>Phone <span>*</span></label>
            <div class="omniflow-phone-row">
              <select name="country_code" id="omniflow-country-code" required>
                <option value="+91">IN +91</option>
                <option value="+1">US +1</option>
                <option value="+44">UK +44</option>
                <option value="+971">AE +971</option>
                <option value="+966">SA +966</option>
                <option value="+65">SG +65</option>
                <option value="+61">AU +61</option>
                <option value="+49">DE +49</option>
                <option value="+33">FR +33</option>
                <option value="+81">JP +81</option>
                <option value="+86">CN +86</option>
                <option value="+55">BR +55</option>
              </select>
              <input type="tel" name="phone_number" required placeholder="9876543210" pattern="[0-9]{6,15}">
            </div>
            <p class="omniflow-phone-hint">Select country code and enter phone number</p>
          </div>
          <div class="omniflow-form-group">
            <label>Message <span class="optional">(optional)</span></label>
            <textarea name="message" placeholder="How can we help you?"></textarea>
          </div>
          <div id="omniflow-error" class="omniflow-error omniflow-hidden"></div>
          <button type="submit" class="omniflow-submit-btn" id="omniflow-submit-btn">
            <span>Send Message</span>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
          <p class="omniflow-disclaimer">By submitting, you agree to be contacted about our services.</p>
        </form>
      </div>
      <div id="omniflow-success" class="omniflow-success omniflow-hidden">
        <div class="omniflow-success-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h4>Thank You!</h4>
        <p>We've received your message and will be in touch soon.</p>
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  var postId = '${postId}';
  var openBtn = document.getElementById('omniflow-open-btn');
  var modal = document.getElementById('omniflow-modal');
  var closeBtn = document.getElementById('omniflow-close-btn');
  var form = document.getElementById('omniflow-lead-form');
  var formContainer = document.getElementById('omniflow-form-container');
  var successDiv = document.getElementById('omniflow-success');
  var errorDiv = document.getElementById('omniflow-error');
  var submitBtn = document.getElementById('omniflow-submit-btn');

  // Show button after 2 seconds
  setTimeout(function() {
    openBtn.style.display = 'flex';
  }, 2000);

  openBtn.addEventListener('click', function() {
    modal.classList.add('active');
  });

  closeBtn.addEventListener('click', function() {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    var formData = new FormData(form);
    var countryCode = formData.get('country_code') || '+91';
    var phoneNumber = (formData.get('phone_number') || '').replace(/\\D/g, '');
    var fullPhone = countryCode + phoneNumber;
    
    var data = {
      postId: postId,
      name: formData.get('name'),
      email: formData.get('email'),
      phone: fullPhone,
      message: formData.get('message') || '',
      honeypot: formData.get('honeypot') || ''
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="omniflow-spinner" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Sending...</span>';
    errorDiv.classList.add('omniflow-hidden');

    fetch('/api/capture-sales-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      if (result.success) {
        formContainer.classList.add('omniflow-hidden');
        successDiv.classList.remove('omniflow-hidden');
      } else {
        errorDiv.textContent = result.message || 'Something went wrong. Please try again.';
        errorDiv.classList.remove('omniflow-hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Message</span><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
      }
    })
    .catch(function(err) {
      errorDiv.textContent = 'Network error. Please try again.';
      errorDiv.classList.remove('omniflow-hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send Message</span><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
    });
  });
})();
</script>
<!-- End OmniFlow Lead Capture Widget -->
`;
}
