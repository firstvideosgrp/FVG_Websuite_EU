import { Models } from 'appwrite';

export type ProjectType = 'Movie' | 'Short' | 'Series';
export type ProjectStatus = 'Upcoming' | 'In Production' | 'Released';

export type CastMember = {
  id: string; // Used for React key prop
  name: string;
  role: string;
};

// FIX: Changed interfaces to type aliases using intersection with Models.Document.
// This ensures that system properties like '$id' are correctly included in the types,
// resolving errors where '$id' was reported as not existing on Project or AboutContent.
export type Project = Models.Document & {
  title: string;
  description: string;
  posterUrl: string;
  releaseYear: number;
  projectType: ProjectType;
  status: ProjectStatus;
  dueDate?: string; // Should be ISO date string
  synopsis?: string;
  castAndCrew?: string; // JSON string of CastMember[]
};

export type AboutContent = Models.Document & {
  content: string;
};

export type SocialLink = {
  icon: string; // e.g., 'fab fa-twitter'
  url: string;
};

export type FooterLink = {
  label: string;
  url: string;
};

export type SiteSettings = Models.Document & {
  siteTitle: string;
  primaryColor: string;
  secondaryColor: string;
  adminTitle: string;
  footerText: string;
  siteVersion?: string;
  /** JSON stringified array of SocialLink objects */
  socialLinks: string;
  /** JSON stringified array of FooterLink objects */
  footerLinks: string;
  // Mail Settings
  mailEnabled?: boolean;
  mailSenderEmail?: string;
  mailContactRecipient?: string;
  mailSmtpHost?: string;
  mailSmtpPort?: number;
  mailSmtpEncryption?: 'none' | 'ssl' | 'tls';
  mailSmtpUsername?: string;
  mailSmtpPassword?: string;
  // Hero Section Customization
  heroBackgroundImageUrl?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroButtonText?: string;
  heroUseImage?: boolean;
  heroUsePlexus?: boolean;
};

// New types for Media Library
export type MediaCategory = 'Image' | 'Poster' | 'Soundtrack' | 'Document' | 'Video';

export type MediaMetadata = Models.Document & {
  fileId: string;
  category: MediaCategory;
  name: string;
};

export type MediaFile = Models.File & {
  category: MediaCategory;
};