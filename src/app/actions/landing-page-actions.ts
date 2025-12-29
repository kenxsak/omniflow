'use server';

import { adminDb, getUserFromServerSession } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export interface LandingPageSection {
  id: string;
  type: string;
  content: Record<string, any>;
}

export interface LandingPageData {
  id: string;
  userId: string;
  name: string;
  slug: string;
  template: string;
  sections: LandingPageSection[];
  settings: {
    primaryColor: string;
    fontFamily: string;
    favicon?: string;
    metaTitle?: string;
    metaDescription?: string;
    aiAssistant?: {
      enabled: boolean;
      greeting?: string;
      position?: 'left' | 'right';
    };
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Publish a landing page to Firestore
export async function publishLandingPage(userId: string, pageData: Omit<LandingPageData, 'userId' | 'updatedAt'>) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const docRef = adminDb.collection('landing_pages').doc(pageData.id);
    
    await docRef.set({
      ...pageData,
      userId,
      isPublished: true,
      updatedAt: new Date(),
    });

    revalidatePath(`/p/${pageData.slug}`);
    
    return { success: true, slug: pageData.slug };
  } catch (error) {
    console.error('Error publishing landing page:', error);
    return { success: false, error: 'Failed to publish landing page' };
  }
}

// Get a published landing page by slug
export async function getPublishedLandingPage(slug: string) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const snapshot = await adminDb
      .collection('landing_pages')
      .where('slug', '==', slug)
      .where('isPublished', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Serialize all Firestore timestamps recursively
    return serializePage(doc.id, data);
  } catch (error) {
    console.error('Error fetching landing page:', error);
    return null;
  }
}

// Helper to serialize Firestore timestamps in page data
function serializePage(id: string, data: any): LandingPageData {
  // Serialize sections with any nested timestamps
  const sections = (data.sections || []).map((section: any) => ({
    ...section,
    content: serializeContent(section.content),
  }));

  return {
    id,
    ...data,
    sections,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  } as LandingPageData;
}

// Serialize a single timestamp
function serializeTimestamp(value: any): string | Date {
  if (!value) return new Date().toISOString();
  if (value.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

// Recursively serialize content object
function serializeContent(content: any): any {
  if (!content || typeof content !== 'object') return content;
  
  const result: any = {};
  for (const [key, value] of Object.entries(content)) {
    if (value && typeof value === 'object' && '_seconds' in value) {
      // Firestore Timestamp
      result[key] = new Date((value as any)._seconds * 1000).toISOString();
    } else if (value && typeof value === 'object' && (value as any).toDate) {
      // Firestore Timestamp with toDate method
      result[key] = (value as any).toDate().toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => serializeContent(item));
    } else if (value && typeof value === 'object') {
      result[key] = serializeContent(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Submit a lead form from a landing page
export async function submitLandingPageLead(
  pageId: string,
  pageSlug: string,
  userId: string,
  formData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    message?: string;
  }
) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    // Create lead/contact in Firestore
    const leadRef = adminDb.collection('users').doc(userId).collection('leads').doc();
    
    const leadData = {
      id: leadRef.id,
      name: formData.name || 'Unknown',
      email: formData.email || '',
      phone: formData.phone || '',
      company: formData.company || '',
      notes: formData.message || '',
      source: `Landing Page: ${pageSlug}`,
      sourcePageId: pageId,
      status: 'new',
      tags: ['landing-page-lead'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await leadRef.set(leadData);

    // Also track the submission in landing_page_submissions
    await adminDb.collection('landing_page_submissions').add({
      pageId,
      pageSlug,
      userId,
      leadId: leadRef.id,
      formData,
      submittedAt: new Date(),
    });

    return { success: true, leadId: leadRef.id };
  } catch (error) {
    console.error('Error submitting landing page lead:', error);
    return { success: false, error: 'Failed to submit form' };
  }
}

// Get user's landing pages
export async function getUserLandingPages(userId: string) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const snapshot = await adminDb
      .collection('landing_pages')
      .where('userId', '==', userId)
      .get();

    // Serialize Firestore timestamps and sort in memory
    const pages = snapshot.docs.map(doc => serializePage(doc.id, doc.data()));
    
    return pages.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching user landing pages:', error);
    return [];
  }
}

// Save landing page (draft)
export async function saveLandingPage(userId: string, pageData: Omit<LandingPageData, 'userId' | 'updatedAt'>) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const docRef = adminDb.collection('landing_pages').doc(pageData.id);
    
    await docRef.set({
      ...pageData,
      userId,
      updatedAt: new Date(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving landing page:', error);
    return { success: false, error: 'Failed to save landing page' };
  }
}

// Delete landing page
export async function deleteLandingPage(userId: string, pageId: string) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const docRef = adminDb.collection('landing_pages').doc(pageId);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data()?.userId !== userId) {
      return { success: false, error: 'Page not found or unauthorized' };
    }

    await docRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting landing page:', error);
    return { success: false, error: 'Failed to delete landing page' };
  }
}


// ============================================
// AI ASSIST - Section Content Generation
// ============================================

import { generateLandingPageContent, type GenerateLandingPageContentInput } from '@/ai/flows/generate-landing-page-content-flow';
import { trackAIUsage, checkAIQuota } from '@/lib/ai-usage-tracker';

export type SectionType = 'hero' | 'features' | 'faq' | 'testimonial' | 'cta' | 'pricing';
export type ToneType = 'professional' | 'casual' | 'friendly' | 'urgent';

export interface GenerateSectionContentInput {
  companyId: string;
  userId: string;
  sectionType: SectionType;
  productDescription: string;
  targetAudience?: string;
  tone?: ToneType;
}

export interface GenerateSectionContentResult {
  success: boolean;
  content?: Record<string, any>;
  error?: string;
  errorCode?: 'no_credits' | 'generation_failed' | 'invalid_input';
  creditsRemaining?: number;
  creditsLimit?: number;
}

/**
 * Generate AI content for a landing page section
 * Consumes 1 AI credit per generation
 * Super admins bypass quota restrictions
 */
export async function generateSectionContent(
  input: GenerateSectionContentInput
): Promise<GenerateSectionContentResult> {
  const { companyId, userId, sectionType, productDescription, targetAudience, tone } = input;

  // Validate input
  if (!productDescription || productDescription.length < 20) {
    return {
      success: false,
      error: 'Please provide a product description (at least 20 characters)',
      errorCode: 'invalid_input',
    };
  }

  try {
    // Check if user is super admin (bypasses quota)
    const authResult = await getUserFromServerSession();
    const isSuperAdmin = authResult.success && authResult.user?.role === 'superadmin';

    // Check AI quota before generation (super admins bypass)
    const quota = await checkAIQuota(companyId, { isSuperAdmin });
    
    if (!quota.allowed) {
      return {
        success: false,
        error: quota.message || 'AI credit limit reached',
        errorCode: 'no_credits',
        creditsRemaining: quota.remaining,
        creditsLimit: quota.limit,
      };
    }

    // Generate content using AI flow
    const aiInput: GenerateLandingPageContentInput = {
      sectionType,
      productDescription,
      targetAudience,
      tone: tone || 'professional',
    };

    const result = await generateLandingPageContent(aiInput);

    // Extract the content for the specific section type
    const sectionContent = result[sectionType];
    
    if (!sectionContent) {
      return {
        success: false,
        error: 'AI failed to generate content for this section',
        errorCode: 'generation_failed',
      };
    }

    // Track AI usage (1 credit for text generation)
    await trackAIUsage({
      companyId,
      userId,
      operationType: 'text_generation',
      model: 'gemini-2.0-flash',
      inputTokens: Math.ceil(productDescription.length / 4), // Approximate
      outputTokens: Math.ceil(JSON.stringify(sectionContent).length / 4), // Approximate
      feature: 'landing_page_ai_assist',
      success: true,
    });

    // Get updated quota
    const updatedQuota = await checkAIQuota(companyId);

    return {
      success: true,
      content: sectionContent,
      creditsRemaining: updatedQuota.remaining,
      creditsLimit: updatedQuota.limit,
    };
  } catch (error) {
    console.error('Error generating section content:', error);
    
    // Track failed attempt (no credits charged)
    await trackAIUsage({
      companyId,
      userId,
      operationType: 'text_generation',
      model: 'gemini-2.0-flash',
      feature: 'landing_page_ai_assist',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }).catch(() => {}); // Don't fail if tracking fails

    return {
      success: false,
      error: 'Failed to generate content. Please try again.',
      errorCode: 'generation_failed',
    };
  }
}

/**
 * Get current AI quota for display in UI
 * Super admins see unlimited quota
 */
export async function getAIQuotaForLandingPages(companyId: string) {
  try {
    // Check if user is super admin
    const authResult = await getUserFromServerSession();
    const isSuperAdmin = authResult.success && authResult.user?.role === 'superadmin';

    const quota = await checkAIQuota(companyId, { isSuperAdmin });
    return {
      remaining: quota.remaining,
      limit: quota.limit,
      exceeded: quota.exceeded,
    };
  } catch (error) {
    console.error('Error getting AI quota:', error);
    return {
      remaining: 0,
      limit: 0,
      exceeded: true,
    };
  }
}


// ============================================
// AI CLONE - Create Page from Reference
// ============================================

import { cloneLandingPageFlow, type CloneLandingPageInput } from '@/ai/flows/clone-landing-page-flow';

export interface ClonePageFromReferenceInput {
  companyId: string;
  userId: string;
  screenshotBase64?: string;
  referenceUrl?: string;
  productDescription: string;
  productName?: string;
  targetAudience?: string;
}

export interface ClonePageFromReferenceResult {
  success: boolean;
  page?: {
    name: string;
    sections: Array<{ type: string; content: Record<string, any> }>;
    settings: {
      primaryColor: string;
      fontFamily: string;
    };
  };
  analysisNotes?: string;
  error?: string;
  errorCode?: 'no_credits' | 'generation_failed' | 'invalid_input';
  creditsRemaining?: number;
  creditsLimit?: number;
}

/**
 * Clone/recreate a landing page from a reference screenshot or URL
 * Consumes 3 AI credits (more complex than single section generation)
 */
export async function clonePageFromReference(
  input: ClonePageFromReferenceInput
): Promise<ClonePageFromReferenceResult> {
  const { companyId, userId, screenshotBase64, referenceUrl, productDescription, productName, targetAudience } = input;

  // Validate input
  if (!screenshotBase64 && !referenceUrl) {
    return {
      success: false,
      error: 'Please provide either a screenshot or a reference URL',
      errorCode: 'invalid_input',
    };
  }

  if (!productDescription || productDescription.length < 20) {
    return {
      success: false,
      error: 'Please describe your product (at least 20 characters)',
      errorCode: 'invalid_input',
    };
  }

  try {
    // Check if user is super admin (bypasses quota)
    const authResult = await getUserFromServerSession();
    const isSuperAdmin = authResult.success && authResult.user?.role === 'superadmin';

    // Check AI quota before generation (costs 3 credits for full page clone)
    // Super admins bypass quota restrictions
    const quota = await checkAIQuota(companyId, { isSuperAdmin });
    
    if (!quota.allowed || (!isSuperAdmin && quota.remaining < 3)) {
      return {
        success: false,
        error: quota.remaining < 3 
          ? 'Not enough credits. Page cloning requires 3 credits.' 
          : (quota.message || 'AI credit limit reached'),
        errorCode: 'no_credits',
        creditsRemaining: quota.remaining,
        creditsLimit: quota.limit,
      };
    }

    // Call the AI flow
    const aiInput: CloneLandingPageInput = {
      screenshotBase64,
      referenceUrl,
      productDescription,
      productName,
      targetAudience,
    };

    const result = await cloneLandingPageFlow(aiInput);

    if (!result.success || !result.sections) {
      return {
        success: false,
        error: result.error || 'Failed to analyze reference page',
        errorCode: 'generation_failed',
      };
    }

    // Track AI usage (3 credits for full page clone - more complex operation)
    await trackAIUsage({
      companyId,
      userId,
      operationType: 'text_generation',
      model: 'gemini-2.0-flash',
      inputTokens: Math.ceil((productDescription.length + (screenshotBase64?.length || 0) / 100) / 4),
      outputTokens: Math.ceil(JSON.stringify(result.sections).length / 4),
      feature: 'landing_page_clone_from_reference',
      success: true,
    });

    // Track 2 more credits (total 3)
    await trackAIUsage({
      companyId,
      userId,
      operationType: 'text_generation',
      model: 'gemini-2.0-flash',
      inputTokens: 100,
      outputTokens: 100,
      feature: 'landing_page_clone_from_reference',
      success: true,
    });
    await trackAIUsage({
      companyId,
      userId,
      operationType: 'text_generation',
      model: 'gemini-2.0-flash',
      inputTokens: 100,
      outputTokens: 100,
      feature: 'landing_page_clone_from_reference',
      success: true,
    });

    // Get updated quota
    const updatedQuota = await checkAIQuota(companyId);

    return {
      success: true,
      page: {
        name: result.pageName || 'Cloned Page',
        sections: result.sections,
        settings: {
          primaryColor: result.primaryColor || '#3b82f6',
          fontFamily: 'Inter',
        },
      },
      analysisNotes: result.analysisNotes,
      creditsRemaining: updatedQuota.remaining,
      creditsLimit: updatedQuota.limit,
    };

  } catch (error) {
    console.error('Error cloning page from reference:', error);
    
    // Track failed attempt (no credits charged)
    await trackAIUsage({
      companyId,
      userId,
      operationType: 'text_generation',
      model: 'gemini-2.0-flash',
      feature: 'landing_page_clone_from_reference',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }).catch(() => {});

    return {
      success: false,
      error: 'Failed to clone page. Please try again.',
      errorCode: 'generation_failed',
    };
  }
}
