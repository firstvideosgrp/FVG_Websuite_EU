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
  posterUrl?: string;
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
  departments?: string[]; // Array of Department document IDs
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
  // Logo Settings
  logoLightUrl?: string;
  logoDarkUrl?: string;
  // Slate Settings
  customBeepSoundUrl?: string;
};

// New types for Media Library
export type MediaCategory = 'Image' | 'Poster' | 'Soundtrack' | 'Document' | 'Video' | 'Logo' | 'Behind-the-Scenes' | 'Hero Background' | 'Project Poster' | 'Audio Clip';

export type MediaMetadata = Models.Document & {
  fileId: string;
  category: MediaCategory;
  name: string;
};

export type MediaFile = Models.File & {
  category: MediaCategory;
  name: string;
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

// New type for Slate Entries
export type SlateEntry = Models.Document & {
  roll: string;
  scene: string;
  take: number;
  production: string;
  director: string;
  dop: string; // Director of Photography
  note?: string;
  date: string; // ISO date string
  timecode: string;
};

// New types for Production Tasks
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export type ProductionTask = Models.Document & {
  taskName: string;
  priority: TaskPriority;
  dueDate: string; // ISO date string
  assigneeId: string; // Cast or Crew member ID
  projectId: string;
  phaseId?: string;
  status: TaskStatus;
};

// New types for Department Management
export type Department = Models.Document & {
  name: string;
  description?: string;
  managerId?: string; // Crew member ID
};

export type DepartmentRole = Models.Document & {
  departmentId: string;
  roleName: string;
  description?: string;
};

export type DepartmentCrew = Models.Document & {
  departmentId: string;
  roleId: string;
  crewId: string; // Crew member ID
};

// New type for Project-specific crew assignments
export type ProjectDepartmentCrew = Models.Document & {
  projectId: string;
  roleId: string; // The DepartmentRole ID
  crewId: string;
};

// New types for Production Elements Library
export type ProductionElementType = 'Production Image' | 'Soundtrack' | 'Logo' | 'Document' | 'Behind-the-Scenes';

export type ProductionElement = Models.Document & {
  elementName: string;
  elementType: ProductionElementType;
  projectId?: string;
  fileId: string;
};

export type ProductionElementFile = Models.File & {
  elementName: string;
  elementType: ProductionElementType;
  projectId?: string;
};

// New type for unified media view
export type UnifiedMediaFile = Models.File & {
    displayName: string;
    category: MediaCategory | ProductionElementType;
    projectId?: string;
    library: 'media' | 'elements';
    fileId: string;
};

// New types for Notification System
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
};

// New type for Static Contact Info
export type StaticContactInfo = Models.Document & {
  label: string; // e.g., "General Inquiries"
  value: string; // e.g., "contact@firstvideos.com"
  icon: string; // e.g., "fas fa-envelope"
  url?: string; // e.g., "mailto:contact@firstvideos.com"
};

// New type for Pricing Tiers
export type PricingTier = Models.Document & {
  title: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  order: number;
  isFeatured?: boolean;
  buttonText: string;
  buttonUrl?: string;
};

// New types for Soundtrack Management
export type SoundtrackType = 'Background Music' | 'Licensed Track' | 'Score Cue' | 'Sound Design Element' | 'Foley';

export type Soundtrack = Models.Document & {
  title: string;
  productionIds: string[];
  type: SoundtrackType;
  composer: string; // Artist / Composer
  licenseInfo: string;
  fileId: string;
};

export type SoundtrackFile = Models.File & {
  title: string;
  productionIds: string[];
  type: SoundtrackType;
  composer: string;
  licenseInfo: string;
};
