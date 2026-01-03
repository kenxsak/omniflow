import { Metadata } from 'next';
import { getPublicInvoiceAction } from '@/app/actions/invoice-actions';
import { PublicInvoiceView } from './public-invoice-view';

interface Props {
  params: { invoiceId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPublicInvoiceAction({ invoiceId: params.invoiceId });
  
  if (!result.success || !result.invoice) {
    return { title: 'Invoice Not Found' };
  }
  
  return {
    title: `Invoice ${result.invoice.invoiceNumber} - ${result.companyBranding?.name || 'Business'}`,
    description: `Invoice for ${result.invoice.clientName}`,
  };
}

export default async function PublicInvoicePage({ params }: Props) {
  const result = await getPublicInvoiceAction({ invoiceId: params.invoiceId });
  
  if (!result.success || !result.invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground">This invoice may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }
  
  return (
    <PublicInvoiceView 
      invoice={result.invoice} 
      branding={result.companyBranding} 
    />
  );
}
