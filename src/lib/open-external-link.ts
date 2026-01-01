/**
 * Utility to reliably open external links in a new browser tab
 * without navigating away from the current page.
 * 
 * This uses the anchor element approach which:
 * 1. Bypasses popup blockers
 * 2. Always opens in a new tab
 * 3. Preserves the current session (no re-login needed)
 */
export function openInNewTab(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens WhatsApp with a pre-filled message (FREE method - not Business API)
 * Uses api.whatsapp.com/send for better emoji/unicode support
 */
export function openWhatsApp(phone: string, message: string): void {
  // Clean phone number - remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Normalize message for proper emoji support
  const normalizedMessage = message.normalize('NFC');
  const encodedMessage = encodeURIComponent(normalizedMessage);
  
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
  openInNewTab(url);
}

/**
 * Opens WhatsApp Web with a pre-filled message
 */
export function openWhatsAppWeb(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, '');
  const normalizedMessage = message.normalize('NFC');
  const encodedMessage = encodeURIComponent(normalizedMessage);
  
  const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
  openInNewTab(url);
}

/**
 * Opens email client with pre-filled fields
 */
export function openEmailClient(email: string, subject?: string, body?: string): void {
  let url = `mailto:${email}`;
  const params: string[] = [];
  
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  // For mailto, we use window.location as it's the standard approach
  window.location.href = url;
}

/**
 * Opens phone dialer
 */
export function openPhoneDialer(phone: string): void {
  window.location.href = `tel:${phone}`;
}
