"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icon } from '@iconify/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { handleAIChatMessage } from '@/app/actions/ai-chat-actions';
import { addStoredSocialMediaPostAction } from '@/app/actions/social-media-actions';
import Image from 'next/image';
import type { SocialPlatform } from '@/types/social-media';
import GuidedTrendingTopics from './guided-trending-topics';
import GuidedReviewResponder from './guided-review-responder';
import ContentWorkflowActions from './content-workflow-actions';
import { AIAgent } from '@/config/ai-agents';
import { 
  createChatSession, 
  addMessage, 
  getMessages,
  updateChatSession,
  updateMessage 
} from '@/lib/chat-session-service';

interface NextStepSuggestion {
  label: string;
  prompt: string;
  icon: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'error';
  metadata?: any;
  creditsConsumed?: number;
  nextSteps?: NextStepSuggestion[];
  isEdited?: boolean;
  versions?: Array<{
    content: string;
    timestamp: Date;
    metadata?: any;
    nextSteps?: NextStepSuggestion[];
  }>;
  currentVersionIndex?: number;
}

interface ChatInterfaceProps {
  initialPrompt?: string;
  showGuidedTrendingTopics?: boolean;
  showGuidedReviewResponder?: boolean;
  selectedAgent?: AIAgent;
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

// Map agent IDs to Solar icons (linear style for consistency)
const agentIcons: Record<string, string> = {
  'content-writer': 'solar:document-text-linear',
  'ad-strategist': 'solar:chart-2-linear',
  'visual-designer': 'solar:gallery-linear',
  'seo-expert': 'solar:magnifer-linear',
  'customer-service': 'solar:chat-round-dots-linear',
  'video-producer': 'solar:videocamera-record-linear',
  'general-assistant': 'solar:stars-linear',
};

export default function ChatInterface({ 
  initialPrompt = '', 
  showGuidedTrendingTopics = false,
  showGuidedReviewResponder = false,
  selectedAgent,
  sessionId: initialSessionId,
  onSessionCreated
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [pendingSaveMessage, setPendingSaveMessage] = useState<Message | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showGuidedFlow, setShowGuidedFlow] = useState(showGuidedTrendingTopics || showGuidedReviewResponder);
  const [guidedFlowType, setGuidedFlowType] = useState<'trending' | 'review' | null>(
    showGuidedTrendingTopics ? 'trending' : showGuidedReviewResponder ? 'review' : null
  );
  const [lastGeneratedContent, setLastGeneratedContent] = useState<Message | null>(null);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [imageGeneratedFor, setImageGeneratedFor] = useState<Set<string>>(new Set());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'code'>('preview');
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { appUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (selectedAgent && messages.length === 0 && !currentSessionId) {
      const introMessage: Message = {
        id: 'agent-intro',
        role: 'assistant',
        content: selectedAgent.introMessage,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([introMessage]);
    }
  }, [selectedAgent, currentSessionId]);

  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!initialSessionId || !appUser?.companyId || !appUser?.uid) return;
      
      setIsLoadingSession(true);
      try {
        const sessionMessages = await getMessages(
          initialSessionId,
          appUser.companyId,
          appUser.uid
        );
        
        const convertedMessages: Message[] = sessionMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(),
          type: msg.type,
          metadata: msg.metadata,
          creditsConsumed: msg.creditsConsumed,
          nextSteps: msg.nextSteps
        }));
        
        setMessages(convertedMessages);
        setCurrentSessionId(initialSessionId);
      } catch (error: any) {
        toast({
          title: 'Error loading conversation',
          description: error.message || 'Failed to load conversation history',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    loadSessionMessages();
  }, [initialSessionId, appUser]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!appUser?.companyId || !appUser?.uid) {
      toast({
        title: 'Error',
        description: 'Please sign in to use AI chat',
        variant: 'destructive'
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let sessionId = currentSessionId;
      
      if (!sessionId) {
        setIsSavingMessage(true);
        const title = selectedAgent 
          ? `${selectedAgent.name} - ${userMessage.content.substring(0, 50)}...`
          : userMessage.content.substring(0, 50) + '...';
        
        sessionId = await createChatSession(
          appUser.companyId,
          appUser.uid,
          selectedAgent?.id,
          title
        );
        
        setCurrentSessionId(sessionId);
        
        if (onSessionCreated) {
          onSessionCreated(sessionId);
        }
        
        if (selectedAgent) {
          const introMsg = messages.find(m => m.id === 'agent-intro');
          if (introMsg) {
            await addMessage(sessionId, appUser.companyId, appUser.uid, {
              role: 'assistant',
              content: introMsg.content,
              type: 'text'
            });
          }
        }
      }

      setIsSavingMessage(true);
      await addMessage(sessionId, appUser.companyId, appUser.uid, {
        role: 'user',
        content: userMessage.content,
        type: 'text'
      });

      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const result = await handleAIChatMessage(
        userMessage.content, 
        appUser.companyId, 
        appUser.uid,
        conversationHistory,
        referenceImage || undefined, // Pass reference image for branded image generation
        selectedAgent?.id // Pass selected agent ID for intent detection
      );

      // Clear reference image after use
      if (referenceImage) {
        setReferenceImage(null);
        setReferenceImageName('');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        type: result.type,
        metadata: result.metadata,
        creditsConsumed: result.creditsConsumed,
        nextSteps: result.nextSteps
      };

      setMessages(prev => [...prev, aiMessage]);

      await addMessage(sessionId, appUser.companyId, appUser.uid, {
        role: 'assistant',
        content: aiMessage.content,
        type: aiMessage.type,
        metadata: aiMessage.metadata,
        creditsConsumed: aiMessage.creditsConsumed,
        nextSteps: aiMessage.nextSteps
      });

      if (result.creditsConsumed && result.creditsConsumed > 0) {
        toast({
          title: '✨ AI Credits Used',
          description: `${result.creditsConsumed} credits consumed for this request`,
          duration: 3000
        });
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process your request',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsSavingMessage(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle reference image upload for branded image generation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WebP image',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 2MB',
        variant: 'destructive'
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setReferenceImageName(file.name);
      toast({
        title: '📷 Reference image added',
        description: 'Your brand logo/image will be used for consistent image generation',
        duration: 3000
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageName('');
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard'
    });
  };

  const handlePreviewInNewTab = (content: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleSaveToContentHub = async (message: Message, generatedImageUrl?: string) => {
    if (!appUser?.companyId || !appUser?.uid) {
      toast({
        title: 'Error',
        description: 'Please sign in to save content',
        variant: 'destructive'
      });
      return;
    }

    let platform: SocialPlatform = message.metadata?.platform || 'Instagram';
    let suggestedImagePrompt = message.metadata?.imagePrompt || message.metadata?.suggestedImagePrompt;
    
    if (!suggestedImagePrompt && message.nextSteps) {
      const imageStep = message.nextSteps.find(step => 
        step.label.toLowerCase().includes('image') || 
        step.label.toLowerCase().includes('hero') ||
        step.label.toLowerCase().includes('featured')
      );
      if (imageStep) {
        suggestedImagePrompt = imageStep.prompt;
      }
    }

    const finalImageUrl = generatedImageUrl || message.metadata?.imageUrl;
    const contentToSave = message.metadata?.htmlContent || message.metadata?.textContent || message.content;
    const isPublicContent = platform === 'BlogPost' || platform === 'SalesLandingPage';
    
    const postData: any = {
      companyId: appUser.companyId,
      platform,
      textContent: contentToSave,
      status: isPublicContent ? 'Posted' : 'Draft',
      originalTopic: message.metadata?.topic || 'AI Generated Content',
      originalTone: message.metadata?.tone || 'Professional',
      suggestedImagePrompt: suggestedImagePrompt,
      imageAiHint: message.metadata?.imagePrompt || message.metadata?.topic || 'AI generated content',
      isAiGeneratedImage: finalImageUrl ? finalImageUrl.startsWith('data:image') : false,
    };

    if (finalImageUrl) {
      postData.imageUrl = finalImageUrl;
    }

    try {
      const result = await addStoredSocialMediaPostAction(appUser.uid, postData);
      
      if (result.success) {
        setSavedMessageIds(prev => new Set(prev).add(message.id));
        toast({
          title: '✅ Saved to Content Hub',
          description: `Your ${platform} has been saved${generatedImageUrl ? ' with generated image' : ''}.`,
          duration: 5000
        });
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save content',
        variant: 'destructive'
      });
    }
  };

  const handleSaveClick = async (message: Message) => {
    const hasSuggestedImage = message.nextSteps?.some(step => 
      step.label.toLowerCase().includes('image') || 
      step.label.toLowerCase().includes('hero') ||
      step.label.toLowerCase().includes('featured')
    );

    const hasImage = !!message.metadata?.imageUrl;

    if (hasSuggestedImage && !hasImage && (message.metadata?.htmlContent)) {
      setPendingSaveMessage(message);
      setShowImageDialog(true);
    } else {
      await handleSaveToContentHub(message);
    }
  };

  const handleGenerateAndSave = async () => {
    if (!pendingSaveMessage || !appUser?.companyId || !appUser?.uid) return;
    
    setShowImageDialog(false);
    setIsGeneratingImage(true);

    try {
      const imageStep = pendingSaveMessage.nextSteps?.find(step => 
        step.label.toLowerCase().includes('image') || 
        step.label.toLowerCase().includes('hero') ||
        step.label.toLowerCase().includes('featured')
      );

      if (!imageStep) {
        throw new Error('No image prompt found');
      }

      const result = await handleAIChatMessage(
        imageStep.prompt,
        appUser.companyId,
        appUser.uid
      );

      if (result.type === 'image' && result.metadata?.imageUrl) {
        await handleSaveToContentHub(pendingSaveMessage, result.metadata.imageUrl);
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error: any) {
      toast({
        title: 'Error generating image',
        description: error.message || 'Failed to generate image. Saving without image...',
        variant: 'destructive'
      });
      await handleSaveToContentHub(pendingSaveMessage);
    } finally {
      setIsGeneratingImage(false);
      setPendingSaveMessage(null);
    }
  };

  const handleSaveWithoutImage = async () => {
    if (!pendingSaveMessage) return;
    setShowImageDialog(false);
    await handleSaveToContentHub(pendingSaveMessage);
    setPendingSaveMessage(null);
  };

  const handleReviewResponseGenerated = async (response: string, reviewText: string) => {
    setShowGuidedFlow(false);
    setGuidedFlowType(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Help me respond to this customer review: "${reviewText}"`,
      timestamp: new Date()
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `**Review Response:**\n\n${response}`,
      timestamp: new Date(),
      type: 'text',
      metadata: { reviewText, response }
    };

    setMessages([userMessage, aiMessage]);
    setLastGeneratedContent(aiMessage);
  };

  const handleContentGenerated = (userMessage: Message, assistantMessage: Message) => {
    setShowGuidedFlow(false);
    setGuidedFlowType(null);
    setMessages([userMessage, assistantMessage]);
    setLastGeneratedContent(assistantMessage);
  };

  const handleCreateImage = async (message: Message) => {
    if (!appUser?.companyId || !appUser?.uid) return;

    const imageStep = message.nextSteps?.find(step => 
      step.label.toLowerCase().includes('image') || 
      step.label.toLowerCase().includes('hero') ||
      step.label.toLowerCase().includes('featured')
    );

    if (!imageStep) return;

    setIsGeneratingImage(true);
    
    try {
      const result = await handleAIChatMessage(
        imageStep.prompt,
        appUser.companyId,
        appUser.uid
      );

      if (result.type === 'image' && result.metadata?.imageUrl) {
        setImageGeneratedFor(prev => new Set(prev).add(message.id));
        
        if (message.metadata?.htmlContent) {
          const placeholderRegex = /https?:\/\/placehold\.co\/[\w/.]+|https?:\/\/picsum\.photos\/seed\/[^/]+\/\d+\/\d+/g;
          const updatedHtml = message.metadata.htmlContent.replace(placeholderRegex, result.metadata.imageUrl);
          
          setMessages(prev => prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, metadata: { ...msg.metadata, htmlContent: updatedHtml, imageUrl: result.metadata.imageUrl } }
              : msg
          ));
        }

        const imageMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `✨ Image generated successfully!`,
          timestamp: new Date(),
          type: 'image',
          metadata: { imageUrl: result.metadata.imageUrl, prompt: imageStep.prompt },
          creditsConsumed: result.creditsConsumed
        };

        setMessages(prev => [...prev, imageMessage]);

        // Show credits consumed toast for image generation
        if (result.creditsConsumed && result.creditsConsumed > 0) {
          toast({
            title: '✨ AI Credits Used',
            description: `${result.creditsConsumed} credits consumed for image generation`,
            duration: 4000
          });
        } else {
          toast({
            title: '✨ Image Generated',
            description: 'Your AI-generated image is ready',
            duration: 4000
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate image',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async (message: Message) => {
    if (!editedContent.trim() || !appUser?.companyId || !appUser?.uid || !currentSessionId) return;
    
    if (editedContent === message.content) {
      handleCancelEdit();
      return;
    }

    try {
      setIsSavingMessage(true);

      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, content: editedContent, isEdited: true } : msg
      ));

      await updateMessage(message.id, currentSessionId, appUser.companyId, appUser.uid, { content: editedContent });

      toast({ title: '✅ Message Updated' });

      const messageIndex = messages.findIndex(m => m.id === message.id);
      const contextMessages = messages.slice(0, messageIndex + 1).map(m => 
        m.id === message.id ? { ...m, content: editedContent } : m
      );
      const subsequentMessages = messages.slice(messageIndex + 1);
      setMessages(contextMessages);

      if (subsequentMessages.length > 0) {
        setIsLoading(true);
        
        const conversationHistory = contextMessages.map(m => ({ role: m.role, content: m.content }));

        const result = await handleAIChatMessage(editedContent, appUser.companyId, appUser.uid, conversationHistory);

        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.content,
          timestamp: new Date(),
          type: result.type,
          metadata: result.metadata,
          creditsConsumed: result.creditsConsumed,
          nextSteps: result.nextSteps
        };

        setMessages(prev => [...prev, aiMessage]);

        await addMessage(currentSessionId, appUser.companyId, appUser.uid, {
          role: 'assistant',
          content: aiMessage.content,
          type: aiMessage.type,
          metadata: aiMessage.metadata,
          creditsConsumed: aiMessage.creditsConsumed,
          nextSteps: aiMessage.nextSteps
        });

        setIsLoading(false);
      }

      handleCancelEdit();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update message', variant: 'destructive' });
    } finally {
      setIsSavingMessage(false);
    }
  };

  const handleRegenerateResponse = async (message: Message, messageIndex: number) => {
    if (!appUser?.companyId || !appUser?.uid || !currentSessionId) return;
    
    const previousMessages = messages.slice(0, messageIndex);
    const previousUserMessage = [...previousMessages].reverse().find(m => m.role === 'user');
    
    if (!previousUserMessage) return;

    try {
      setRegeneratingMessageId(message.id);

      const conversationHistory = previousMessages.map(m => ({ role: m.role, content: m.content }));

      const result = await handleAIChatMessage(previousUserMessage.content, appUser.companyId, appUser.uid, conversationHistory);

      const currentVersions = message.versions || [];
      
      if (currentVersions.length === 0) {
        currentVersions.push({
          content: message.content,
          timestamp: message.timestamp,
          metadata: message.metadata,
          nextSteps: message.nextSteps
        });
      }

      currentVersions.push({
        content: result.content,
        timestamp: new Date(),
        metadata: result.metadata,
        nextSteps: result.nextSteps
      });

      const updatedMessage = {
        ...message,
        content: result.content,
        metadata: result.metadata,
        nextSteps: result.nextSteps,
        versions: currentVersions,
        currentVersionIndex: currentVersions.length - 1
      };

      setMessages(prev => prev.map(msg => msg.id === message.id ? updatedMessage : msg));

      await updateMessage(message.id, currentSessionId, appUser.companyId, appUser.uid, {
        content: result.content,
        metadata: { ...result.metadata, versions: currentVersions, currentVersionIndex: currentVersions.length - 1 },
        nextSteps: result.nextSteps
      });

      toast({ title: '✨ Response Regenerated', duration: 4000 });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to regenerate response', variant: 'destructive' });
    } finally {
      setRegeneratingMessageId(null);
    }
  };

  const handleCycleVersion = async (message: Message, direction: 'prev' | 'next') => {
    if (!message.versions || message.versions.length === 0 || !currentSessionId || !appUser) return;

    const currentIndex = message.currentVersionIndex ?? message.versions.length - 1;
    let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0) newIndex = message.versions.length - 1;
    if (newIndex >= message.versions.length) newIndex = 0;

    const selectedVersion = message.versions[newIndex];

    const updatedMessage = {
      ...message,
      content: selectedVersion.content,
      metadata: selectedVersion.metadata,
      nextSteps: selectedVersion.nextSteps,
      currentVersionIndex: newIndex
    };

    setMessages(prev => prev.map(msg => msg.id === message.id ? updatedMessage : msg));

    try {
      await updateMessage(message.id, currentSessionId, appUser.companyId, appUser.uid, {
        content: selectedVersion.content,
        metadata: { ...selectedVersion.metadata, versions: message.versions, currentVersionIndex: newIndex },
        nextSteps: selectedVersion.nextSteps
      });
    } catch (error: any) {
      console.error('Failed to update version:', error);
    }
  };


  return (
    <div className="flex flex-col h-full">
      {/* Guided Flows */}
      {showGuidedFlow && guidedFlowType === 'trending' && (
        <div className="flex-1 overflow-y-auto">
          <GuidedTrendingTopics
            onContentGenerated={handleContentGenerated}
            onBack={() => { setShowGuidedFlow(false); setGuidedFlowType(null); }}
          />
        </div>
      )}

      {showGuidedFlow && guidedFlowType === 'review' && (
        <div className="flex-1 overflow-y-auto">
          <GuidedReviewResponder
            onResponseGenerated={handleReviewResponseGenerated}
            onBack={() => { setShowGuidedFlow(false); setGuidedFlowType(null); }}
          />
        </div>
      )}

      {/* Messages Area */}
      {!showGuidedFlow && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
              {/* Empty State */}
              {messages.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <Icon icon="solar:chat-round-dots-linear" className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40 mx-auto mb-2 sm:mb-3" />
                  <h2 className="text-sm sm:text-base font-medium mb-1">Start a conversation</h2>
                  <p className="text-muted-foreground text-[10px] sm:text-xs max-w-sm mx-auto mb-4 sm:mb-6">
                    Tell me what you need in plain English
                  </p>
                  <div className="text-left max-w-md mx-auto space-y-1 sm:space-y-1.5">
                    {[
                      'Create an Instagram post about my new product',
                      'Write an email to thank my customers',
                      'Generate ad copy for my coaching program',
                      'Make a blog post about coffee brewing tips'
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(example)}
                        className="w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-all text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message, index) => (
                <div key={message.id} className={cn("flex gap-2 sm:gap-2.5", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {/* AI Avatar */}
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={selectedAgent ? (agentIcons[selectedAgent.id] || 'solar:stars-linear') : 'solar:stars-linear'} 
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" 
                      />
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-1 max-w-[85%] sm:max-w-[80%]", message.role === 'user' && 'items-end')}>
                    {/* Message Bubble */}
                    <div className={cn(
                      "rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5",
                      message.role === 'user'
                        ? "bg-foreground text-background"
                        : "bg-stone-100 dark:bg-stone-800/80"
                    )}>
                      {/* Image Message */}
                      {message.type === 'image' && message.metadata?.imageUrl ? (
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-xs sm:text-sm">{message.content}</p>
                          {message.metadata.imageUrl.startsWith('data:') && (
                            <div className="relative group">
                              {/* Collapsed/Thumbnail View */}
                              {expandedImageId !== message.id ? (
                                <div 
                                  className="relative w-full max-w-[200px] sm:max-w-[280px] aspect-square rounded-lg sm:rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 cursor-pointer"
                                  onClick={() => setExpandedImageId(message.id)}
                                >
                                  <Image
                                    src={message.metadata.imageUrl}
                                    alt={message.metadata.prompt || 'Generated image'}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                  {/* Expand overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                                      <Icon icon="solar:maximize-square-linear" className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Expanded View */
                                <div className="relative w-full max-w-sm sm:max-w-md rounded-lg sm:rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
                                  <Image
                                    src={message.metadata.imageUrl}
                                    alt={message.metadata.prompt || 'Generated image'}
                                    width={400}
                                    height={400}
                                    className="w-full h-auto object-contain"
                                    unoptimized
                                  />
                                  {/* Close button */}
                                  <button
                                    onClick={() => setExpandedImageId(null)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                                  >
                                    <Icon icon="solar:close-circle-linear" className="w-4 h-4 text-white" />
                                  </button>
                                  {/* Action buttons */}
                                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                                    <button
                                      onClick={() => handleCopy(message.metadata.imageUrl)}
                                      className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                                      title="Copy image"
                                    >
                                      <Icon icon="solar:copy-linear" className="w-3.5 h-3.5 text-white" />
                                    </button>
                                    <a
                                      href={message.metadata.imageUrl}
                                      download="ai-generated-image.png"
                                      className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                                      title="Download image"
                                    >
                                      <Icon icon="solar:download-linear" className="w-3.5 h-3.5 text-white" />
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : message.type === 'error' ? (
                        <p className="text-xs sm:text-sm text-red-500">{message.content}</p>
                      ) : message.metadata?.htmlContent ? (
                        /* HTML Content (Blog/Sales Page) */
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-xs sm:text-sm font-medium">{message.content}</p>
                          
                          {/* Preview Tabs */}
                          <div className="mt-2 sm:mt-3">
                            <div className="flex gap-1 mb-2">
                              <button
                                onClick={() => setActivePreviewTab('preview')}
                                className={cn(
                                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all",
                                  activePreviewTab === 'preview'
                                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Icon icon="solar:eye-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1 sm:mr-1.5" />
                                Preview
                              </button>
                              <button
                                onClick={() => setActivePreviewTab('code')}
                                className={cn(
                                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all",
                                  activePreviewTab === 'code'
                                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Icon icon="solar:code-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1 sm:mr-1.5" />
                                HTML
                              </button>
                            </div>
                            
                            {activePreviewTab === 'preview' ? (
                              <div className="space-y-2">
                                <div className="border border-stone-200 dark:border-stone-700 rounded-lg sm:rounded-xl overflow-hidden bg-white">
                                  <iframe
                                    srcDoc={message.metadata.htmlContent}
                                    className="w-full h-[280px] sm:h-[400px] border-0"
                                    title="Content Preview"
                                    sandbox="allow-same-origin"
                                  />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full sm:flex-1 h-8 text-[10px] sm:text-xs"
                                    onClick={() => handlePreviewInNewTab(message.metadata.htmlContent)}
                                  >
                                    <Icon icon="solar:square-arrow-right-up-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                    Open in New Tab
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full sm:flex-1 h-8 text-[10px] sm:text-xs"
                                    onClick={() => handleCopy(message.metadata.htmlContent)}
                                  >
                                    <Icon icon="solar:copy-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                    Copy HTML
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <ScrollArea className="h-[200px] sm:h-[300px] border border-stone-200 dark:border-stone-700 rounded-lg sm:rounded-xl bg-stone-50 dark:bg-stone-900 p-2 sm:p-3">
                                  <pre className="text-[10px] sm:text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">{message.metadata.htmlContent}</pre>
                                </ScrollArea>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-8 text-[10px] sm:text-xs"
                                  onClick={() => handleCopy(message.metadata.htmlContent)}
                                >
                                  <Icon icon="solar:copy-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                  Copy HTML Code
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : editingMessageId === message.id && message.role === 'user' ? (
                        /* Edit Mode */
                        <div className="space-y-2">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm bg-transparent border-stone-300 dark:border-stone-600"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 text-[10px] sm:text-xs">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleSaveEdit(message)} disabled={!editedContent.trim() || isSavingMessage} className="h-7 text-[10px] sm:text-xs">
                              {isSavingMessage ? <Icon icon="solar:refresh-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Regular Text */
                        <div>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.isEdited && <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 italic">Edited</p>}
                        </div>
                      )}
                    </div>

                    {/* Workflow Actions for Blog/Sales */}
                    {message.role === 'assistant' && message.metadata?.htmlContent && (
                      (message.metadata.platform === 'BlogPost' || message.metadata.platform === 'SalesLandingPage')
                    ) && (
                      <div className="mt-2">
                        <ContentWorkflowActions
                          onCreateImage={() => handleCreateImage(message)}
                          onSave={() => handleSaveClick(message)}
                          hasImage={imageGeneratedFor.has(message.id) || !!message.metadata?.imageUrl}
                          isSaved={savedMessageIds.has(message.id)}
                          isGeneratingImage={isGeneratingImage}
                          contentType={message.metadata.platform === 'BlogPost' ? 'blog' : 'sales_page'}
                        />
                      </div>
                    )}

                    {/* Credits */}
                    {message.creditsConsumed && message.creditsConsumed > 0 && message.role === 'assistant' && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Icon icon="solar:wallet-linear" className="w-3 h-3" />
                        <span>{message.creditsConsumed} credits</span>
                      </div>
                    )}

                    {/* Next Steps */}
                    {message.nextSteps && message.nextSteps.length > 0 && message.role === 'assistant' && (
                      <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Next Steps</p>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-2">
                          {message.nextSteps.map((step, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(step.prompt)}
                              className="w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-left sm:text-center"
                            >
                              <span className="mr-1.5">{step.icon}</span>
                              <span className="truncate">{step.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions */}
                    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-1">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground mr-1 sm:mr-2">
                        {format(message.timestamp, 'h:mm a')}
                      </span>

                      {message.role === 'assistant' ? (
                        <>
                          {/* Version Cycling */}
                          {message.versions && message.versions.length > 1 && (
                            <div className="flex items-center gap-0.5 mr-1 pr-1 sm:pr-2 border-r border-stone-200 dark:border-stone-700">
                              <button
                                onClick={() => handleCycleVersion(message, 'prev')}
                                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                              >
                                <Icon icon="solar:alt-arrow-left-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                              </button>
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground px-0.5 sm:px-1">
                                {(message.currentVersionIndex ?? message.versions.length - 1) + 1}/{message.versions.length}
                              </span>
                              <button
                                onClick={() => handleCycleVersion(message, 'next')}
                                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                              >
                                <Icon icon="solar:alt-arrow-right-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                          <button onClick={() => handleCopy(message.content)} className="p-1 sm:p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Copy">
                            <Icon icon="solar:copy-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleSaveClick(message)} disabled={isGeneratingImage} className="p-1 sm:p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Save">
                            <Icon icon="solar:download-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          </button>
                          <button className="p-1 sm:p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Good response">
                            <Icon icon="solar:like-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleRegenerateResponse(message, index)}
                            disabled={regeneratingMessageId === message.id}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="Regenerate"
                          >
                            <Icon 
                              icon={regeneratingMessageId === message.id ? "solar:refresh-linear" : "solar:refresh-linear"} 
                              className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground", regeneratingMessageId === message.id && "animate-spin")} 
                            />
                          </button>
                        </>
                      ) : (
                        editingMessageId !== message.id && (
                          <button onClick={() => handleEditMessage(message)} className="p-1 sm:p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors" title="Edit">
                            <Icon icon="solar:pen-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] sm:text-xs font-medium">{appUser?.name?.charAt(0) || 'U'}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex gap-2 sm:gap-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                    <Icon 
                      icon={selectedAgent ? (agentIcons[selectedAgent.id] || 'solar:stars-linear') : 'solar:stars-linear'} 
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" 
                    />
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/80">
                    <Icon icon="solar:refresh-linear" className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Creating your content...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-stone-200 dark:border-stone-800 p-2.5 sm:p-3 md:p-4">
            <div className="max-w-3xl mx-auto">
              {/* Reference Image Preview */}
              {referenceImage && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                  <img 
                    src={referenceImage} 
                    alt="Reference" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium truncate">{referenceImageName}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">Brand reference for image generation</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveReferenceImage}
                    className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                  >
                    <Icon icon="solar:close-circle-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2 items-end">
                {/* Image Upload Button */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg"
                  title="Add brand logo/reference image for consistent image generation"
                >
                  <Icon icon="solar:gallery-add-linear" className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={referenceImage ? "Describe the image you want (your brand logo will be used)..." : "Ask anything, create anything..."}
                    className="min-h-[40px] sm:min-h-[44px] max-h-[120px] sm:max-h-[160px] resize-none text-xs sm:text-sm border-stone-200 dark:border-stone-800 rounded-lg pr-9 sm:pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="absolute right-1 sm:right-1.5 bottom-1 sm:bottom-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-md"
                  >
                    {isLoading ? (
                      <Icon icon="solar:refresh-linear" className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                    ) : (
                      <Icon icon="solar:arrow-up-linear" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              {selectedAgent && selectedAgent.quickActions.length > 0 && messages.length <= 1 && (
                <div className="mt-2 sm:mt-2.5">
                  <p className="text-[8px] sm:text-[9px] font-semibold tracking-wider text-muted-foreground/60 uppercase mb-1 sm:mb-1.5">Quick Actions</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.prompt)}
                        disabled={isLoading}
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-all disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Image Generation Dialog */}
      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <AlertDialogHeader className="space-y-1 pb-2">
            <AlertDialogTitle className="text-base sm:text-lg">Generate Featured Image?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Would you like to generate an AI image before saving? This will consume additional credits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <AlertDialogCancel onClick={handleSaveWithoutImage} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
              Skip & Save
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateAndSave} disabled={isGeneratingImage} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
              {isGeneratingImage ? (
                <><Icon icon="solar:refresh-linear" className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> Generating...</>
              ) : (
                <><Icon icon="solar:gallery-add-linear" className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Generate & Save</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
