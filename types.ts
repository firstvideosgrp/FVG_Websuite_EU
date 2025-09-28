import { Models } from 'appwrite';

export type ProjectType = 'Movie' | 'Short' | 'Series';
export type ProjectStatus = 'Upcoming' | 'In Production' | 'Released';

export type CastMember = Models.Document & {
  name: string;
  role: string;
  bio?: string;
};

export type CrewMember = Models.Document & {
  name: string;
  role: string;
  bio?: string;
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
  isRework?: boolean;
  dueDate?: string; // Should be ISO date string
  synopsis?: string;
  cast?: string[]; // Array of CastMember document IDs
  crew?: string[]; // Array of CrewMember document IDs
  language?: string;
  runtime?: number;
  hasSubtitles?: boolean;
  mainSubtitleLanguage?: string;
  directors?: string[]; // Array of CrewMember document IDs
  producers?: string[]; // Array of CrewMember document IDs
  rating?: string;
  genres?: string[];
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

// New types for Production Phases
export type ProductionPhaseStatus = 'Pending' | 'In Progress' | 'Completed';

export type ProductionPhase = Models.Document & {
  projectId: string;
  phaseName: string;
  status: ProductionPhaseStatus;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  steps?: ProductionPhaseStep[]; // For frontend convenience
};

// New type for Phase Steps
export type ProductionPhaseStep = Models.Document & {
  phaseId: string;
  stepName: string;
  description?: string;
  status: ProductionPhaseStatus;
  order: number;
};
