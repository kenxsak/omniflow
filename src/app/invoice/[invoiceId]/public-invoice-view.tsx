"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

interface PublicInvoiceViewProps {
  invoice: Invoice;
  branding?: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200', icon: 'solar:document-linear' },
  sent: { label: 'Awaiting Payment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200', icon: 'solar:clock-circle-linear' },
  viewed: { label: 'Awaiting Payment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200', icon: 'solar:clock-circle-linear' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200', icon: 'solar:check-circle-linear' },
  partial: { label: 'Partially Paid', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200', icon: 'solar:pie-chart-2-linear' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200', icon: 'solar:alarm-linear' },
  cancelled: { label: 'Cancelled', color: 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400', icon: 'solar:close-circle-linear' },
};

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PublicInvoiceView({ invoice, branding }: PublicInvoiceViewProps) {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const statusConfig = STATUS_CONFIG[invoice.status];
  const primaryColor = branding?.primaryColor || '#10b981';
  const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && new Date(invoice.dueDate) < new Date();
  const canPay = ['sent', 'viewed', 'partial', 'overdue'].includes(invoice.status) && invoice.amountDue > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Use browser print to PDF functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        // Fallback to regular print
        window.print();
        return;
      }
      
      // Get the invoice content
      const invoiceContent = document.getElementById('invoice-content');
      if (!invoiceContent) {
        window.print();
        return;
      }
      
      // Create a styled HTML document for PDF
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-info h1 { font-size: 24px; color: ${primaryColor}; margin-bottom: 8px; }
            .company-info p { font-size: 12px; color: #6b7280; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { font-size: 32px; color: ${primaryColor}; letter-spacing: -1px; }
            .invoice-title .number { font-family: monospace; color: #6b7280; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background: #dcfce7; color: #166534; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
            .box { background: #f9fafb; padding: 16px; border-radius: 8px; }
            .box-title { font-size: 10px; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; letter-spacing: 0.5px; }
            .box p { font-size: 13px; color: #374151; }
            .box .name { font-weight: 600; font-size: 14px; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: ${primaryColor}; color: white; padding: 12px; font-size: 12px; text-align: left; }
            th:first-child { border-radius: 8px 0 0 0; }
            th:last-child { border-radius: 0 8px 0 0; text-align: right; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
            td:last-child { text-align: right; font-weight: 500; }
            tr:nth-child(even) { background: #f9fafb; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-box { width: 280px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
            .total-row.final { border-top: 2px solid ${primaryColor}; padding-top: 12px; margin-top: 8px; font-size: 16px; font-weight: 700; }
            .total-row.final span:last-child { color: ${primaryColor}; }
            .notes { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
            .notes-title { font-size: 10px; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
            .notes p { font-size: 12px; color: #6b7280; white-space: pre-wrap; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${branding?.name || 'Business'}</h1>
              ${branding?.address ? `<p>${branding.address}</p>` : ''}
              ${branding?.phone ? `<p>📞 ${branding.phone}</p>` : ''}
              ${branding?.email ? `<p>✉️ ${branding.email}</p>` : ''}
              ${invoice.companyGstin ? `<p>GSTIN: ${invoice.companyGstin}</p>` : ''}
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p class="number">${invoice.invoiceNumber}</p>
              <span class="status">${statusConfig.label}</span>
            </div>
          </div>
          
          <div class="grid">
            <div class="box">
              <p class="box-title">Bill To</p>
              <p class="name">${invoice.clientName}</p>
              <p>${invoice.clientEmail}</p>
              ${invoice.clientPhone ? `<p>${invoice.clientPhone}</p>` : ''}
              ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
              ${invoice.clientGstin ? `<p>GSTIN: ${invoice.clientGstin}</p>` : ''}
            </div>
            <div class="box">
              <p class="box-title">Invoice Details</p>
              <p><strong>Issue Date:</strong> ${format(new Date(invoice.issueDate), 'MMM d, yyyy')}</p>
              <p><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center; width: 80px;">Qty</th>
                <th style="text-align: right; width: 120px;">Rate</th>
                ${invoice.gstEnabled ? '<th style="text-align: center; width: 80px;">Tax</th>' : ''}
                <th style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, i) => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatCurrency(item.unitPrice, invoice.currency)}</td>
                  ${invoice.gstEnabled ? `<td style="text-align: center;">${item.taxRate || 0}%</td>` : ''}
                  <td>${formatCurrency(item.quantity * item.unitPrice, invoice.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              ${invoice.discountAmount && invoice.discountAmount > 0 ? `
                <div class="total-row" style="color: #059669;">
                  <span>Discount (${invoice.discountPercent}%)</span>
                  <span>-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                </div>
              ` : ''}
              ${invoice.gstEnabled ? invoice.taxes.map(tax => `
                <div class="total-row">
                  <span>${tax.name} (${tax.rate}%)</span>
                  <span>${formatCurrency(tax.amount, invoice.currency)}</span>
                </div>
              `).join('') : ''}
              <div class="total-row final">
                <span>Total</span>
                <span>${formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              ${invoice.amountPaid > 0 ? `
                <div class="total-row" style="color: #059669;">
                  <span>Paid</span>
                  <span>-${formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                </div>
                <div class="total-row" style="font-weight: 600;">
                  <span>Balance Due</span>
                  <span style="color: ${invoice.amountDue > 0 ? '#d97706' : '#059669'};">${formatCurrency(invoice.amountDue, invoice.currency)}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${invoice.notes || invoice.terms ? `
            <div class="notes">
              ${invoice.notes ? `
                <p class="notes-title">Notes</p>
                <p>${invoice.notes}</p>
              ` : ''}
              ${invoice.terms ? `
                <p class="notes-title" style="margin-top: 16px;">Terms & Conditions</p>
                <p>${invoice.terms}</p>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
            ${branding?.website ? `<p>${branding.website}</p>` : ''}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to regular print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePayNow = () => {
    if (invoice.paymentLink) {
      window.open(invoice.paymentLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 print:bg-white">
      {/* Header Actions - Hidden on print */}
      <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b print:hidden">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} className="h-8 w-auto object-contain" />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {branding?.name?.charAt(0) || 'B'}
              </div>
            )}
            <span className="font-semibold text-sm truncate">{branding?.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="h-8 text-xs">
              {isGeneratingPdf ? (
                <Icon icon="solar:spinner-bold" className="w-4 h-4 animate-spin sm:mr-1.5" />
              ) : (
                <Icon icon="solar:download-linear" className="w-4 h-4 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs">
              <Icon icon="solar:printer-linear" className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            {canPay && invoice.paymentLink && (
              <Button 
                size="sm" 
                onClick={handlePayNow}
                className="h-8 text-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <Icon icon="solar:card-bold" className="w-4 h-4 mr-1.5" />
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-3xl mx-auto p-3 sm:p-6 print:p-0">
        {/* Payment Status Alert */}
        {paymentStatus && (
          <div className="mb-4 print:hidden">
            {paymentStatus === 'success' && (
              <Alert className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
                <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-300 text-sm ml-2">
                  Payment received successfully! Thank you for your payment.
                </AlertDescription>
              </Alert>
            )}
            {paymentStatus === 'cancelled' && (
              <Alert className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
                <Icon icon="solar:info-circle-bold" className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm ml-2">
                  Payment was cancelled. You can try again using the Pay Now button.
                </AlertDescription>
              </Alert>
            )}
            {paymentStatus === 'pending' && (
              <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <Icon icon="solar:clock-circle-bold" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm ml-2">
                  Payment is being processed. Please wait a moment.
                </AlertDescription>
              </Alert>
            )}
            {paymentStatus === 'error' && (
              <Alert className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                <Icon icon="solar:danger-triangle-bold" className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-700 dark:text-red-300 text-sm ml-2">
                  There was an issue processing your payment. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <Card className="p-4 sm:p-8 print:shadow-none print:border-none">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
            <div>
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.name} className="h-10 sm:h-12 w-auto object-contain mb-2" />
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: primaryColor }}>
                  {branding?.name}
                </h1>
              )}
              {branding?.address && (
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-xs">{branding.address}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-stone-600 dark:text-stone-300">
                {branding?.phone && <span>📞 {branding.phone}</span>}
                {branding?.email && <span>✉️ {branding.email}</span>}
              </div>
              {invoice.companyGstin && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">GSTIN: {invoice.companyGstin}</p>
              )}
            </div>
            
            <div className="text-left sm:text-right">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: primaryColor }}>
                INVOICE
              </h2>
              <p className="font-mono text-sm text-stone-600 dark:text-stone-300 mt-1">{invoice.invoiceNumber}</p>
              <div className="mt-2">
                <Badge className={`${statusConfig.color} text-xs`}>
                  <Icon icon={statusConfig.icon} className="w-3 h-3 mr-1" />
                  {isOverdue && invoice.status !== 'overdue' ? 'Overdue' : statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bill To & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-stone-100 dark:bg-stone-800 rounded-lg">
              <p className="text-[10px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-semibold text-sm sm:text-base text-stone-900 dark:text-white">{invoice.clientName}</p>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">{invoice.clientEmail}</p>
              {invoice.clientPhone && (
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">{invoice.clientPhone}</p>
              )}
              {invoice.clientAddress && (
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">{invoice.clientAddress}</p>
              )}
              {invoice.clientGstin && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">GSTIN: {invoice.clientGstin}</p>
              )}
            </div>
            
            <div className="p-3 sm:p-4 bg-stone-100 dark:bg-stone-800 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-stone-500 dark:text-stone-400">Issue Date</span>
                  <span className="font-medium text-stone-900 dark:text-white">{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-stone-500 dark:text-stone-400">Due Date</span>
                  <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-stone-900 dark:text-white'}`}>
                    {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
                {invoice.gstEnabled && invoice.placeOfSupply && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-stone-500 dark:text-stone-400">Place of Supply</span>
                    <span className="font-medium text-stone-900 dark:text-white">{invoice.placeOfSupply}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items - Table on desktop, cards on mobile */}
          <div className="mb-6">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
                    <th className="text-left p-3 text-xs font-semibold rounded-tl-lg">Description</th>
                    <th className="text-center p-3 text-xs font-semibold w-20">Qty</th>
                    <th className="text-right p-3 text-xs font-semibold w-28">Rate</th>
                    {invoice.gstEnabled && <th className="text-center p-3 text-xs font-semibold w-20">Tax</th>}
                    <th className="text-right p-3 text-xs font-semibold w-28 rounded-tr-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-stone-50 dark:bg-stone-800/50' : 'bg-white dark:bg-stone-900'}>
                      <td className="p-3 text-sm text-stone-900 dark:text-white">{item.description}</td>
                      <td className="p-3 text-sm text-center text-stone-700 dark:text-stone-300">{item.quantity}</td>
                      <td className="p-3 text-sm text-right text-stone-700 dark:text-stone-300">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      {invoice.gstEnabled && <td className="p-3 text-sm text-center text-stone-700 dark:text-stone-300">{item.taxRate || 0}%</td>}
                      <td className="p-3 text-sm text-right font-medium text-stone-900 dark:text-white">
                        {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {invoice.items.map((item) => (
                <div key={item.id} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                  <p className="font-medium text-sm text-stone-900 dark:text-white">{item.description}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-stone-600 dark:text-stone-400">
                    <span>{item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}</span>
                    {invoice.gstEnabled && <span>Tax: {item.taxRate || 0}%</span>}
                  </div>
                  <p className="text-right font-semibold text-sm mt-1 text-stone-900 dark:text-white">
                    {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Subtotal</span>
                <span className="text-stone-900 dark:text-white">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({invoice.discountPercent}%)</span>
                  <span>-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                </div>
              )}
              
              {invoice.gstEnabled && invoice.taxes.map((tax) => (
                <div key={tax.name} className="flex justify-between text-sm">
                  <span className="text-stone-500 dark:text-stone-400">{tax.name} ({tax.rate}%)</span>
                  <span className="text-stone-900 dark:text-white">{formatCurrency(tax.amount, invoice.currency)}</span>
                </div>
              ))}
              
              <div 
                className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t-2"
                style={{ borderColor: primaryColor }}
              >
                <span className="text-stone-900 dark:text-white">Total</span>
                <span style={{ color: primaryColor }}>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Paid</span>
                    <span>-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-stone-900 dark:text-white">Balance Due</span>
                    <span className={invoice.amountDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {formatCurrency(invoice.amountDue, invoice.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Button - Mobile prominent */}
          {canPay && invoice.paymentLink && (
            <div className="mt-6 sm:hidden print:hidden">
              <Button 
                className="w-full h-12 text-base font-semibold"
                style={{ backgroundColor: primaryColor }}
                onClick={handlePayNow}
              >
                <Icon icon="solar:card-bold" className="w-5 h-5 mr-2" />
                Pay {formatCurrency(invoice.amountDue, invoice.currency)}
              </Button>
            </div>
          )}

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-6 sm:mt-8 pt-6 border-t border-stone-200 dark:border-stone-700 space-y-4">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">Terms & Conditions</p>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Payment History</p>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(payment.amount, invoice.currency)}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {format(new Date(payment.date), 'MMM d, yyyy')} • {payment.method.toUpperCase()}
                        {payment.reference && ` • ${payment.reference}`}
                      </p>
                    </div>
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700 text-center">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Thank you for your business!
            </p>
            {branding?.website && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {branding.website}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
