'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { createLeadAction, validateBulkImportAction } from '@/app/actions/lead-actions';
import { useRouter } from 'next/navigation';

interface CsvImportCardProps {
  companyId: string;
}

export function CsvImportCard({ companyId }: CsvImportCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [
      {
        'Name': 'John Doe',
        'Email': 'john@example.com',
        'Phone': '+1234567890',
        'Company': 'Example Corp',
        'Status': 'New'
      },
      {
        'Name': 'Jane Smith',
        'Email': 'jane@example.com',
        'Phone': '+1987654321',
        'Company': 'Sample Inc',
        'Status': 'Qualified'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts Template");
    XLSX.writeFile(workbook, "OmniFlow_CRM_Contacts_Template.xlsx");
    toast({ 
      title: "Template Downloaded", 
      description: "Fill in the template with your contacts and upload it back",
      duration: 3000
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const XLSX = await import('xlsx');
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const data = e.target?.result;
      let addedCount = 0;
      let skippedCount = 0;
      
      if (data) {
        try {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
          
          const validContacts = jsonData.filter(row => {
            const name = row['Name'] || row['name'] || row['Full Name'];
            const email = row['Email'] || row['email'];
            return name && email;
          });
          
          const contactsToImport = validContacts.length;
          const validation = await validateBulkImportAction(companyId, contactsToImport);
          
          if (!validation.canImport) {
            toast({
              title: "Contact Limit Exceeded",
              description: validation.message || `Cannot import ${contactsToImport} contacts. Please upgrade your plan.`,
              variant: "destructive",
              duration: 8000
            });
            setIsUploading(false);
            if (event.target) event.target.value = '';
            return;
          }
          
          for (const row of jsonData) {
            const name = row['Name'] || row['name'] || row['Full Name'];
            const email = row['Email'] || row['email'];
            const phone = row['Phone'] || row['phone'] || row['Mobile'];
            const company = row['Company'] || row['company'];
            const status = row['Status'] || row['status'] || 'New';
            
            if (name && email) {
              try {
                await createLeadAction(companyId, {
                  name: String(name).trim(),
                  email: String(email).toLowerCase().trim(),
                  phone: phone ? String(phone).trim() : undefined,
                  status: status as any,
                  source: 'CSV Import',
                  notes: company ? `Company: ${company}` : undefined,
                });
                addedCount++;
              } catch (error: any) {
                console.error('Error adding lead:', error);
                if (error?.message?.includes('limit reached')) {
                  toast({
                    title: "Contact Limit Reached",
                    description: `Imported ${addedCount} contacts before hitting limit.`,
                    variant: "destructive",
                    duration: 8000
                  });
                  break;
                }
                skippedCount++;
              }
            } else {
              skippedCount++;
            }
          }
          
          toast({ 
            title: "Import Complete", 
            description: `${addedCount} contacts added. ${skippedCount} rows skipped.`,
            duration: 5000
          });
          
          router.refresh();
        } catch (error) {
          console.error("Error processing file:", error);
          toast({ 
            title: "Upload Failed", 
            description: "Error processing file. Make sure it's a valid Excel or CSV file.", 
            variant: "destructive" 
          });
        }
      }
      
      setIsUploading(false);
      if (event.target) event.target.value = '';
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
      <CardHeader className="pt-4">
        <div className="flex items-center gap-3">
          <Icon icon="solar:file-text-linear" className="h-5 w-5 text-muted-foreground/60" />
          <div>
            <CardTitle className="text-base">Import Contacts from CSV/Excel</CardTitle>
            <CardDescription>
              Bulk upload your contacts in 2 easy steps
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg border border-dashed border-border bg-muted/30">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Icon icon="solar:info-circle-linear" className="h-4 w-4 mt-0.5 shrink-0" />
            <span><span className="text-foreground font-medium">New to CSV import?</span> Download the template below to see the correct format. Fill it with your contacts (Name, Email, Phone, Company, Status), then upload it back.</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-foreground">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">1</span>
              Download Template
            </p>
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              <Icon icon="solar:download-linear" className="h-4 w-4 mr-2" />
              Download Excel Template
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-foreground">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">2</span>
              Upload Your File
            </p>
            <Button 
              onClick={() => document.getElementById('csv-upload-hub-input')?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Icon icon="solar:upload-linear" className="h-4 w-4 mr-2" />
                  Import CSV/Excel
                </>
              )}
            </Button>
            <input 
              type="file" 
              id="csv-upload-hub-input" 
              accept=".csv, .xlsx, .xls" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Supported formats: CSV (.csv), Excel (.xlsx, .xls) • Required fields: Name, Email • Optional: Phone, Company, Status
        </p>
      </CardContent>
    </Card>
  );
}
