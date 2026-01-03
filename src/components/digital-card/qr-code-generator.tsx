'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { QrCode, Download, Copy, Check, Share2, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  cardUrl: string;
  cardName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  iconOnly?: boolean;
  primaryColor?: string;
}

export default function QRCodeGenerator({ 
  cardUrl, 
  cardName,
  variant = 'outline',
  size = 'default',
  iconOnly = false,
  primaryColor = '#3B82F6'
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSize, setDownloadSize] = useState<'small' | 'medium' | 'large'>('medium');

  const generateQRCode = async (qrSize: number = 512) => {
    setGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(cardUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !qrCodeDataUrl) {
      generateQRCode();
    }
  };

  const downloadQRCode = async (size: 'small' | 'medium' | 'large') => {
    const sizes = { small: 256, medium: 512, large: 1024 };
    const qrSize = sizes[size];
    
    try {
      const dataUrl = await QRCode.toDataURL(cardUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${cardName.replace(/\s+/g, '-').toLowerCase()}-qr-${size}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardName}'s Digital Card`,
          text: `Check out ${cardName}'s digital business card`,
          url: cardUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      copyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={iconOnly ? '!p-2' : ''}>
          <QrCode className={iconOnly ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
          {!iconOnly && <span className="hidden sm:inline">QR Code</span>}
          {!iconOnly && <span className="sm:hidden">QR</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[400px] p-0 gap-0 rounded-xl">
        <DialogCloseButton />
        
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <QrCode className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">QR Code</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {cardName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-4 py-4 sm:px-6 sm:py-5">
          {/* QR Code Display */}
          <div className="flex flex-col items-center">
            {generating ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-600"></div>
                  <span className="text-xs text-stone-500">Generating...</span>
                </div>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="relative group">
                {/* QR Code with styled container */}
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-700">
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code for ${cardName}`}
                    className="w-44 h-44 sm:w-52 sm:h-52"
                  />
                </div>
                {/* Scan hint */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-lg">
                  <Smartphone className="h-3 w-3" />
                  Scan to view card
                </div>
              </div>
            ) : null}

            {/* Card URL */}
            <div className="mt-6 w-full">
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mb-0.5">Card URL</p>
                  <p className="text-xs sm:text-sm font-mono text-stone-700 dark:text-stone-300 truncate">
                    {cardUrl}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyUrl}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          {/* Download Options */}
          <div className="w-full">
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">Download Size</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => downloadQRCode('small')}
                className="flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
              >
                <Download className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                <span className="text-[10px] sm:text-xs font-medium text-stone-700 dark:text-stone-300">Small</span>
                <span className="text-[9px] sm:text-[10px] text-stone-400">256px</span>
              </button>
              <button
                onClick={() => downloadQRCode('medium')}
                className="flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl border-2 border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 transition-colors relative"
              >
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-1.5 py-0.5 rounded font-medium">Best</span>
                <Download className="h-4 w-4 text-stone-900 dark:text-stone-100" />
                <span className="text-[10px] sm:text-xs font-semibold text-stone-900 dark:text-stone-100">Medium</span>
                <span className="text-[9px] sm:text-[10px] text-stone-500">512px</span>
              </button>
              <button
                onClick={() => downloadQRCode('large')}
                className="flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
              >
                <Download className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                <span className="text-[10px] sm:text-xs font-medium text-stone-700 dark:text-stone-300">Large</span>
                <span className="text-[9px] sm:text-[10px] text-stone-400">1024px</span>
              </button>
            </div>
          </div>

          {/* Share Button */}
          <Button
            onClick={shareCard}
            variant="outline"
            className="w-full"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Card Link
          </Button>

          {/* Tip */}
          <p className="text-[10px] sm:text-xs text-center text-stone-400 dark:text-stone-500">
            Print on business cards, flyers, posters, or product packaging
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
