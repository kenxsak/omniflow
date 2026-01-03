'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Check, Loader2 } from 'lucide-react';
import { submitDigitalCardLead } from '@/app/actions/digital-card-lead-actions';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
];

interface ContactFormProps {
  cardId: string;
  businessName: string;
  buttonText?: string;
  formTitle?: string;
  formDescription?: string;
  primaryColor?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function ContactForm({ 
  cardId, 
  businessName,
  buttonText = 'Contact Us',
  formTitle = 'Get in Touch',
  formDescription = "Send us a message and we'll get back to you soon!",
  primaryColor = '#000000',
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = ''
}: ContactFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    message: '',
    honeypot: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Combine phone with country code
    let combinedPhone = '';
    if (formData.phoneNumber) {
      const trimmedPhone = formData.phoneNumber.trim();
      if (trimmedPhone.startsWith('+')) {
        combinedPhone = trimmedPhone;
      } else if (countryCode && countryCode !== '_OTHER_') {
        combinedPhone = `${countryCode}${trimmedPhone}`;
      } else {
        combinedPhone = trimmedPhone;
      }
    }

    try {
      const result = await submitDigitalCardLead(cardId, {
        ...formData,
        phone: combinedPhone,
      });

      if (result && result.success) {
        setIsSuccess(true);
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          message: '',
          honeypot: '',
        });
        setCountryCode('+91');
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
        }, 2500);
      } else {
        if (result.errors) {
          const errorMap: Record<string, string> = {};
          result.errors.forEach(err => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: result.message });
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      message: '',
      honeypot: '',
    });
    setCountryCode('+91');
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`w-full ${className}`}
          style={{
            backgroundColor: variant === 'default' ? primaryColor : undefined,
            borderColor: variant === 'outline' ? primaryColor : undefined,
            color: variant === 'outline' ? primaryColor : undefined,
          }}
        >
          {showIcon && <MessageSquare className="h-5 w-5 mr-2" />}
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] p-0 gap-0 overflow-hidden rounded-xl">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
          <DialogTitle className="text-lg sm:text-xl">{formTitle}</DialogTitle>
          <DialogDescription className="text-sm">
            {formDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 max-h-[60vh] overflow-y-auto">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div 
                className="mb-4 rounded-full p-3"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Check className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for reaching out. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleChange}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  disabled={isSubmitting}
                  className="h-9 sm:h-10"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                  className="h-9 sm:h-10"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Phone with Country Code */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[90px] sm:w-[100px] h-9 sm:h-10 flex-shrink-0">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_OTHER_">🌍 Other</SelectItem>
                      {COUNTRY_CODES.map(({ code, flag }) => (
                        <SelectItem key={code} value={code}>
                          {flag} {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="9876543210"
                    disabled={isSubmitting}
                    className="flex-1 h-9 sm:h-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Please provide at least email or phone number
                </p>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm font-medium">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  disabled={isSubmitting}
                  rows={3}
                  className="resize-none"
                />
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message}</p>
                )}
              </div>

              {/* Error Messages */}
              {errors.general && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {errors.general}
                </div>
              )}

              {errors.contact && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-600 dark:text-amber-400">
                  {errors.contact}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-stone-200 dark:border-stone-800 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { resetForm(); setIsOpen(false); }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="contact-form"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
