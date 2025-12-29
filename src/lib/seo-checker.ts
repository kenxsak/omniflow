/**
 * SEO Score Checker for Blog Posts
 * Analyzes content and provides actionable SEO recommendations
 */

export interface SEOCheckResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: SEOCheck[];
  summary: string;
}

export interface SEOCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  importance: 'critical' | 'important' | 'minor';
  points: number; // Points earned (out of max)
  maxPoints: number;
}

interface SEOAnalysisInput {
  htmlContent: string;
  targetKeyword?: string;
  additionalKeywords?: string[];
}

/**
 * Extract text content from HTML
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract meta description from HTML
 */
function extractMetaDescription(html: string): string | null {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  return match ? match[1] : null;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract H1 from HTML
 */
function extractH1(html: string): string | null {
  const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return match ? match[1].trim() : null;
}

/**
 * Count headings by level
 */
function countHeadings(html: string): { h1: number; h2: number; h3: number; h4: number } {
  return {
    h1: (html.match(/<h1[^>]*>/gi) || []).length,
    h2: (html.match(/<h2[^>]*>/gi) || []).length,
    h3: (html.match(/<h3[^>]*>/gi) || []).length,
    h4: (html.match(/<h4[^>]*>/gi) || []).length,
  };
}

/**
 * Check for images and their alt text
 */
function analyzeImages(html: string): { total: number; withAlt: number; withoutAlt: number } {
  const images = html.match(/<img[^>]+>/gi) || [];
  let withAlt = 0;
  let withoutAlt = 0;
  
  images.forEach(img => {
    if (/alt=["'][^"']+["']/i.test(img)) {
      withAlt++;
    } else {
      withoutAlt++;
    }
  });
  
  return { total: images.length, withAlt, withoutAlt };
}

/**
 * Check for internal and external links
 */
function analyzeLinks(html: string): { internal: number; external: number; total: number } {
  const links = html.match(/<a[^>]+href=["'][^"']+["'][^>]*>/gi) || [];
  let internal = 0;
  let external = 0;
  
  // Get hostname safely (works on both server and client)
  const hostname = typeof window !== 'undefined' ? window.location?.hostname : '';
  
  links.forEach(link => {
    const href = link.match(/href=["']([^"']+)["']/i);
    if (href) {
      if (href[1].startsWith('http') && !href[1].includes(hostname)) {
        external++;
      } else {
        internal++;
      }
    }
  });
  
  return { internal, external, total: links.length };
}

/**
 * Check keyword density
 */
function checkKeywordDensity(text: string, keyword: string): number {
  if (!keyword) return 0;
  const words = text.toLowerCase().split(/\s+/);
  const keywordLower = keyword.toLowerCase();
  const keywordWords = keywordLower.split(/\s+/);
  
  let count = 0;
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const phrase = words.slice(i, i + keywordWords.length).join(' ');
    if (phrase === keywordLower) {
      count++;
    }
  }
  
  const totalWords = words.length;
  return totalWords > 0 ? (count / totalWords) * 100 : 0;
}

/**
 * Check if content has Open Graph tags
 */
function hasOpenGraphTags(html: string): boolean {
  return /og:title/i.test(html) && /og:description/i.test(html);
}

/**
 * Main SEO analysis function
 */
export function analyzeSEO(input: SEOAnalysisInput): SEOCheckResult {
  const { htmlContent, targetKeyword, additionalKeywords = [] } = input;
  const checks: SEOCheck[] = [];
  
  const textContent = stripHtml(htmlContent);
  const wordCount = countWords(textContent);
  const title = extractTitle(htmlContent);
  const metaDescription = extractMetaDescription(htmlContent);
  const h1 = extractH1(htmlContent);
  const headings = countHeadings(htmlContent);
  const images = analyzeImages(htmlContent);
  const links = analyzeLinks(htmlContent);
  
  // 1. Title Tag Check (Critical - 15 points)
  if (title) {
    const titleLength = title.length;
    if (titleLength >= 50 && titleLength <= 60) {
      checks.push({
        id: 'title-length',
        name: 'Title Tag Length',
        status: 'pass',
        message: `Perfect! Title is ${titleLength} characters (ideal: 50-60)`,
        importance: 'critical',
        points: 15,
        maxPoints: 15,
      });
    } else if (titleLength >= 30 && titleLength <= 70) {
      checks.push({
        id: 'title-length',
        name: 'Title Tag Length',
        status: 'warning',
        message: `Title is ${titleLength} characters. Aim for 50-60 characters for best results.`,
        importance: 'critical',
        points: 10,
        maxPoints: 15,
      });
    } else {
      checks.push({
        id: 'title-length',
        name: 'Title Tag Length',
        status: 'fail',
        message: `Title is ${titleLength} characters. Should be 50-60 characters.`,
        importance: 'critical',
        points: 0,
        maxPoints: 15,
      });
    }
  } else {
    checks.push({
      id: 'title-length',
      name: 'Title Tag',
      status: 'fail',
      message: 'Missing title tag! Add a compelling title for SEO.',
      importance: 'critical',
      points: 0,
      maxPoints: 15,
    });
  }

  // 2. Meta Description Check (Critical - 15 points)
  if (metaDescription) {
    const descLength = metaDescription.length;
    if (descLength >= 150 && descLength <= 160) {
      checks.push({
        id: 'meta-description',
        name: 'Meta Description',
        status: 'pass',
        message: `Perfect! Meta description is ${descLength} characters (ideal: 150-160)`,
        importance: 'critical',
        points: 15,
        maxPoints: 15,
      });
    } else if (descLength >= 120 && descLength <= 170) {
      checks.push({
        id: 'meta-description',
        name: 'Meta Description',
        status: 'warning',
        message: `Meta description is ${descLength} characters. Aim for 150-160 characters.`,
        importance: 'critical',
        points: 10,
        maxPoints: 15,
      });
    } else {
      checks.push({
        id: 'meta-description',
        name: 'Meta Description',
        status: 'fail',
        message: `Meta description is ${descLength} characters. Should be 150-160 characters.`,
        importance: 'critical',
        points: 5,
        maxPoints: 15,
      });
    }
  } else {
    checks.push({
      id: 'meta-description',
      name: 'Meta Description',
      status: 'fail',
      message: 'Missing meta description! Add one to improve click-through rates.',
      importance: 'critical',
      points: 0,
      maxPoints: 15,
    });
  }

  // 3. H1 Tag Check (Critical - 10 points)
  if (headings.h1 === 1) {
    checks.push({
      id: 'h1-tag',
      name: 'H1 Heading',
      status: 'pass',
      message: 'Perfect! Page has exactly one H1 heading.',
      importance: 'critical',
      points: 10,
      maxPoints: 10,
    });
  } else if (headings.h1 === 0) {
    checks.push({
      id: 'h1-tag',
      name: 'H1 Heading',
      status: 'fail',
      message: 'Missing H1 heading! Add one main heading to your content.',
      importance: 'critical',
      points: 0,
      maxPoints: 10,
    });
  } else {
    checks.push({
      id: 'h1-tag',
      name: 'H1 Heading',
      status: 'warning',
      message: `Found ${headings.h1} H1 headings. Use only one H1 per page.`,
      importance: 'critical',
      points: 5,
      maxPoints: 10,
    });
  }

  // 4. Content Length Check (Important - 10 points)
  if (wordCount >= 1500) {
    checks.push({
      id: 'content-length',
      name: 'Content Length',
      status: 'pass',
      message: `Excellent! ${wordCount} words. Long-form content ranks better.`,
      importance: 'important',
      points: 10,
      maxPoints: 10,
    });
  } else if (wordCount >= 800) {
    checks.push({
      id: 'content-length',
      name: 'Content Length',
      status: 'warning',
      message: `${wordCount} words. Consider adding more content (1500+ words ideal).`,
      importance: 'important',
      points: 7,
      maxPoints: 10,
    });
  } else if (wordCount >= 300) {
    checks.push({
      id: 'content-length',
      name: 'Content Length',
      status: 'warning',
      message: `${wordCount} words. Add more content for better SEO (800+ recommended).`,
      importance: 'important',
      points: 4,
      maxPoints: 10,
    });
  } else {
    checks.push({
      id: 'content-length',
      name: 'Content Length',
      status: 'fail',
      message: `Only ${wordCount} words. Content is too short for good SEO.`,
      importance: 'important',
      points: 0,
      maxPoints: 10,
    });
  }

  // 5. Heading Structure Check (Important - 10 points)
  if (headings.h2 >= 2 && headings.h2 <= 8) {
    checks.push({
      id: 'heading-structure',
      name: 'Heading Structure',
      status: 'pass',
      message: `Good structure with ${headings.h2} H2 headings and ${headings.h3} H3 headings.`,
      importance: 'important',
      points: 10,
      maxPoints: 10,
    });
  } else if (headings.h2 >= 1) {
    checks.push({
      id: 'heading-structure',
      name: 'Heading Structure',
      status: 'warning',
      message: `Only ${headings.h2} H2 heading(s). Add more subheadings to break up content.`,
      importance: 'important',
      points: 6,
      maxPoints: 10,
    });
  } else {
    checks.push({
      id: 'heading-structure',
      name: 'Heading Structure',
      status: 'fail',
      message: 'No H2 headings found. Add subheadings to improve readability and SEO.',
      importance: 'important',
      points: 0,
      maxPoints: 10,
    });
  }

  // 6. Image Alt Text Check (Important - 10 points)
  if (images.total === 0) {
    checks.push({
      id: 'images',
      name: 'Images',
      status: 'warning',
      message: 'No images found. Add relevant images to improve engagement.',
      importance: 'important',
      points: 5,
      maxPoints: 10,
    });
  } else if (images.withoutAlt === 0) {
    checks.push({
      id: 'images',
      name: 'Image Alt Text',
      status: 'pass',
      message: `All ${images.total} images have alt text. Great for accessibility and SEO!`,
      importance: 'important',
      points: 10,
      maxPoints: 10,
    });
  } else {
    checks.push({
      id: 'images',
      name: 'Image Alt Text',
      status: 'warning',
      message: `${images.withoutAlt} of ${images.total} images missing alt text.`,
      importance: 'important',
      points: 5,
      maxPoints: 10,
    });
  }

  // 7. Internal Links Check (Important - 10 points)
  if (links.internal >= 2) {
    checks.push({
      id: 'internal-links',
      name: 'Internal Links',
      status: 'pass',
      message: `Good! ${links.internal} internal links help with site navigation and SEO.`,
      importance: 'important',
      points: 10,
      maxPoints: 10,
    });
  } else if (links.internal >= 1) {
    checks.push({
      id: 'internal-links',
      name: 'Internal Links',
      status: 'warning',
      message: `Only ${links.internal} internal link. Add 2-3 more for better SEO.`,
      importance: 'important',
      points: 5,
      maxPoints: 10,
    });
  } else {
    checks.push({
      id: 'internal-links',
      name: 'Internal Links',
      status: 'fail',
      message: 'No internal links found. Add links to other pages on your site.',
      importance: 'important',
      points: 0,
      maxPoints: 10,
    });
  }

  // 8. Keyword in Title Check (Important - 10 points)
  if (targetKeyword && title) {
    if (title.toLowerCase().includes(targetKeyword.toLowerCase())) {
      checks.push({
        id: 'keyword-title',
        name: 'Keyword in Title',
        status: 'pass',
        message: `Target keyword "${targetKeyword}" found in title.`,
        importance: 'important',
        points: 10,
        maxPoints: 10,
      });
    } else {
      checks.push({
        id: 'keyword-title',
        name: 'Keyword in Title',
        status: 'fail',
        message: `Target keyword "${targetKeyword}" not found in title.`,
        importance: 'important',
        points: 0,
        maxPoints: 10,
      });
    }
  } else if (targetKeyword) {
    checks.push({
      id: 'keyword-title',
      name: 'Keyword in Title',
      status: 'fail',
      message: 'No title tag to check for keyword.',
      importance: 'important',
      points: 0,
      maxPoints: 10,
    });
  }

  // 9. Open Graph Tags Check (Minor - 5 points)
  if (hasOpenGraphTags(htmlContent)) {
    checks.push({
      id: 'og-tags',
      name: 'Open Graph Tags',
      status: 'pass',
      message: 'Open Graph tags found. Content will look great when shared!',
      importance: 'minor',
      points: 5,
      maxPoints: 5,
    });
  } else {
    checks.push({
      id: 'og-tags',
      name: 'Open Graph Tags',
      status: 'warning',
      message: 'Missing Open Graph tags. Add them for better social sharing.',
      importance: 'minor',
      points: 0,
      maxPoints: 5,
    });
  }

  // 10. Keyword Density Check (Minor - 5 points)
  if (targetKeyword) {
    const density = checkKeywordDensity(textContent, targetKeyword);
    if (density >= 0.5 && density <= 2.5) {
      checks.push({
        id: 'keyword-density',
        name: 'Keyword Density',
        status: 'pass',
        message: `Keyword density is ${density.toFixed(1)}% (ideal: 0.5-2.5%)`,
        importance: 'minor',
        points: 5,
        maxPoints: 5,
      });
    } else if (density > 0 && density < 0.5) {
      checks.push({
        id: 'keyword-density',
        name: 'Keyword Density',
        status: 'warning',
        message: `Keyword density is ${density.toFixed(1)}%. Consider using keyword more often.`,
        importance: 'minor',
        points: 3,
        maxPoints: 5,
      });
    } else if (density > 2.5) {
      checks.push({
        id: 'keyword-density',
        name: 'Keyword Density',
        status: 'warning',
        message: `Keyword density is ${density.toFixed(1)}%. Avoid keyword stuffing.`,
        importance: 'minor',
        points: 2,
        maxPoints: 5,
      });
    } else {
      checks.push({
        id: 'keyword-density',
        name: 'Keyword Density',
        status: 'fail',
        message: `Target keyword "${targetKeyword}" not found in content.`,
        importance: 'minor',
        points: 0,
        maxPoints: 5,
      });
    }
  }

  // Calculate total score
  const totalPoints = checks.reduce((sum, check) => sum + check.points, 0);
  const maxPoints = checks.reduce((sum, check) => sum + check.maxPoints, 0);
  const score = Math.round((totalPoints / maxPoints) * 100);

  // Determine grade
  let grade: SEOCheckResult['grade'];
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  // Generate summary
  const criticalFails = checks.filter(c => c.importance === 'critical' && c.status === 'fail');
  const importantFails = checks.filter(c => c.importance === 'important' && c.status === 'fail');
  
  let summary: string;
  if (score >= 90) {
    summary = 'Excellent SEO! Your content is well-optimized for search engines.';
  } else if (score >= 75) {
    summary = 'Good SEO with room for improvement. Address the warnings for better results.';
  } else if (score >= 60) {
    summary = 'Average SEO. Fix the critical issues to improve your ranking potential.';
  } else if (criticalFails.length > 0) {
    summary = `Poor SEO. Fix these critical issues first: ${criticalFails.map(c => c.name).join(', ')}.`;
  } else {
    summary = `Needs work. Focus on: ${importantFails.map(c => c.name).join(', ')}.`;
  }

  return {
    score,
    grade,
    checks,
    summary,
  };
}

/**
 * Get color for SEO score
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 75) return 'text-lime-600 dark:text-lime-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get background color for SEO score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 75) return 'bg-lime-100 dark:bg-lime-900/30';
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}
