// FIX: Imported the `Models` namespace to resolve reference errors below.
import { Client, Account, Databases, ID, Query, Models, Storage, Functions } from 'appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, ABOUT_COLLECTION_ID, SITE_SETTINGS_COLLECTION_ID, APPWRITE_STORAGE_BUCKET_ID, MEDIA_METADATA_COLLECTION_ID, CONTACT_FORM_FUNCTION_ID, TEST_EMAIL_FUNCTION_ID, CAST_COLLECTION_ID, CREW_COLLECTION_ID, PRODUCTION_PHASES_COLLECTION_ID, PHASE_STEPS_COLLECTION_ID, SLATE_ENTRIES_COLLECTION_ID, TASKS_COLLECTION_ID, DEPARTMENTS_COLLECTION_ID, DEPARTMENT_ROLES_COLLECTION_ID, DEPARTMENT_CREW_COLLECTION_ID, PROJECT_DEPARTMENT_CREW_COLLECTION_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, PRODUCTION_ELEMENTS_STORAGE_BUCKET_ID, STATIC_CONTACT_INFO_COLLECTION_ID } from '../constants';
import type { AboutContent, Project, SiteSettings, MediaFile, MediaMetadata, MediaCategory, CastMember, CrewMember, ProductionPhase, ProductionPhaseStep, SlateEntry, ProductionTask, Department, DepartmentRole, DepartmentCrew, ProjectDepartmentCrew, ProductionElement, ProductionElementType, ProductionElementFile, UnifiedMediaFile, StaticContactInfo } from '../types';

// FIX: Removed the check for placeholder credentials. The constants are hardcoded, making this check unnecessary and causing a TypeScript error due to non-overlapping literal types.
const client = new Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Authentication
// FIX: Added types to function parameters.
export const login = (email: string, password: string) => account.createEmailPasswordSession(email, password);
export const logout = () => account.deleteSession('current');
export const getCurrentUser = () => account.get();

// About Content
export const getAboutContent = async (): Promise<AboutContent | null> => {
    try {
        // FIX: Using a generic (<AboutContent>) with listDocuments ensures type safety and resolves the casting error on the return statement.
        const response = await databases.listDocuments<AboutContent>(APPWRITE_DATABASE_ID, ABOUT_COLLECTION_ID, [Query.limit(1)]);
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Failed to fetch about content:", error);
        return null;
    }
};

export const updateAboutContent = (documentId: string, content: string) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, ABOUT_COLLECTION_ID, documentId, { content });
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
    try {
        // FIX: Using a generic (<Project>) with listDocuments ensures type safety and resolves the casting error on the return statement.
        const response = await databases.listDocuments<Project>(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, [Query.orderDesc('releaseYear')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return [];
    }
};

export const createProject = (data: Omit<Project, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, ID.unique(), data);
};

export const updateProject = (documentId: string, data: Partial<Omit<Project, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, documentId, data);
};

export const deleteProject = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, documentId);
};

// Cast
export const getCast = async (): Promise<CastMember[]> => {
    try {
        const response = await databases.listDocuments<CastMember>(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, [Query.limit(500), Query.orderAsc('name')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch cast members:", error);
        return [];
    }
};

export const createCastMember = (data: Omit<CastMember, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, ID.unique(), data);
};

export const updateCastMember = (documentId: string, data: Partial<Omit<CastMember, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, documentId, data);
};

export const deleteCastMember = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, documentId);
};

// Crew
export const getCrew = async (): Promise<CrewMember[]> => {
    try {
        const response = await databases.listDocuments<CrewMember>(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, [Query.limit(500), Query.orderAsc('name')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch crew members:", error);
        return [];
    }
};

export const createCrewMember = (data: Omit<CrewMember, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, ID.unique(), data);
};

export const updateCrewMember = (documentId: string, data: Partial<Omit<CrewMember, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, documentId, data);
};

export const deleteCrewMember = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, documentId);
};

// Production Phases
export const getProductionPhasesForProject = async (projectId: string): Promise<ProductionPhase[]> => {
    try {
        const response = await databases.listDocuments<ProductionPhase>(
            APPWRITE_DATABASE_ID,
            PRODUCTION_PHASES_COLLECTION_ID,
            [
                Query.equal('projectId', projectId),
                Query.orderAsc('$createdAt')
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch production phases:", error);
        return [];
    }
};

export const createProductionPhase = (data: Omit<ProductionPhase, keyof Models.Document>) => {
    // FIX: Corrected typo in variable name from PRODUCTION_PHASES_COLlection_ID to PRODUCTION_PHASES_COLLECTION_ID.
    return databases.createDocument(APPWRITE_DATABASE_ID, PRODUCTION_PHASES_COLLECTION_ID, ID.unique(), data);
};

export const updateProductionPhase = (documentId: string, data: Partial<Omit<ProductionPhase, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, PRODUCTION_PHASES_COLLECTION_ID, documentId, data);
};

export const deleteProductionPhase = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, PRODUCTION_PHASES_COLLECTION_ID, documentId);
};

// Production Phase Steps
export const getPhaseStepsForPhase = async (phaseId: string): Promise<ProductionPhaseStep[]> => {
    try {
        const response = await databases.listDocuments<ProductionPhaseStep>(
            APPWRITE_DATABASE_ID,
            PHASE_STEPS_COLLECTION_ID,
            [
                Query.equal('phaseId', phaseId),
                Query.orderAsc('order')
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch phase steps:", error);
        return [];
    }
};

export const createPhaseStep = (data: Omit<ProductionPhaseStep, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, PHASE_STEPS_COLLECTION_ID, ID.unique(), data);
};

export const updatePhaseStep = (documentId: string, data: Partial<Omit<ProductionPhaseStep, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, PHASE_STEPS_COLLECTION_ID, documentId, data);
};

export const deletePhaseStep = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, PHASE_STEPS_COLLECTION_ID, documentId);
};

// Batch update for reordering
export const updateStepOrder = (steps: { $id: string; order: number }[]) => {
    const promises = steps.map(step =>
        databases.updateDocument(APPWRITE_DATABASE_ID, PHASE_STEPS_COLLECTION_ID, step.$id, { order: step.order })
    );
    return Promise.all(promises);
};

// Slate Entries
export const getSlateEntries = async (): Promise<SlateEntry[]> => {
    try {
        const response = await databases.listDocuments<SlateEntry>(APPWRITE_DATABASE_ID, SLATE_ENTRIES_COLLECTION_ID, [
            Query.orderDesc('date'),
            Query.orderDesc('$createdAt'),
            Query.limit(100)
        ]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch slate entries:", error);
        return [];
    }
};

export const createSlateEntry = (data: Omit<SlateEntry, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, SLATE_ENTRIES_COLLECTION_ID, ID.unique(), data);
};

export const updateSlateEntry = (documentId: string, data: Partial<Omit<SlateEntry, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, SLATE_ENTRIES_COLLECTION_ID, documentId, data);
};

export const deleteSlateEntry = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, SLATE_ENTRIES_COLLECTION_ID, documentId);
};

// Production Tasks
export const getTasks = async (queries: string[] = []): Promise<ProductionTask[]> => {
    try {
        // Using a high limit to fetch all tasks; consider pagination for very large datasets.
        const allQueries = [...queries, Query.limit(2000)];
        const response = await databases.listDocuments<ProductionTask>(
            APPWRITE_DATABASE_ID,
            TASKS_COLLECTION_ID,
            allQueries
        );
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return [];
    }
};

export const createTask = (data: Omit<ProductionTask, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, TASKS_COLLECTION_ID, ID.unique(), data);
};

export const updateTask = (documentId: string, data: Partial<Omit<ProductionTask, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, TASKS_COLLECTION_ID, documentId, data);
};

export const deleteTask = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, TASKS_COLLECTION_ID, documentId);
};

// Site Settings
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
    try {
        const response = await databases.listDocuments<SiteSettings>(APPWRITE_DATABASE_ID, SITE_SETTINGS_COLLECTION_ID, [Query.limit(1)]);
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Failed to fetch site settings:", error);
        return null;
    }
};

export const updateSiteSettings = (documentId: string, data: Partial<Omit<SiteSettings, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, SITE_SETTINGS_COLLECTION_ID, documentId, data);
};

// Contact Form Email
/**
 * Executes a server-side Appwrite Function to send an email.
 * This is the secure way to handle email sending, as it prevents
 * SMTP credentials from being exposed on the client-side.
 * The server-side function is responsible for fetching the mail settings
 * from the database and using an SMTP client to dispatch the email.
 * @param payload The contact form data.
 */
export const sendContactEmail = (payload: { name: string; email: string; message: string; }) => {
    return functions.createExecution(CONTACT_FORM_FUNCTION_ID, JSON.stringify(payload));
};

/**
 * Executes a server-side Appwrite Function to send a test email.
 * This function uses the saved SMTP settings to send a predefined
 * message to the specified recipient to verify the configuration.
 * @param payload The test email data.
 */
export const sendTestEmail = (payload: { recipientEmail: string }) => {
    return functions.createExecution(TEST_EMAIL_FUNCTION_ID, JSON.stringify(payload));
};

// --- New Static Contact Info ---

export const getStaticContactInfo = async (): Promise<StaticContactInfo[]> => {
    try {
        const response = await databases.listDocuments<StaticContactInfo>(
            APPWRITE_DATABASE_ID,
            STATIC_CONTACT_INFO_COLLECTION_ID,
            [Query.orderAsc('$createdAt')]
        );
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch static contact info:", error);
        return [];
    }
};

export const createStaticContactInfo = (data: Omit<StaticContactInfo, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, STATIC_CONTACT_INFO_COLLECTION_ID, ID.unique(), data);
};

export const updateStaticContactInfo = (documentId: string, data: Partial<Omit<StaticContactInfo, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, STATIC_CONTACT_INFO_COLLECTION_ID, documentId, data);
};

export const deleteStaticContactInfo = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, STATIC_CONTACT_INFO_COLLECTION_ID, documentId);
};

// --- Department Management ---

// Departments
export const getDepartments = async (): Promise<Department[]> => {
    try {
        const response = await databases.listDocuments<Department>(APPWRITE_DATABASE_ID, DEPARTMENTS_COLLECTION_ID, [Query.orderAsc('name')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return [];
    }
};

export const createDepartment = (data: Omit<Department, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, DEPARTMENTS_COLLECTION_ID, ID.unique(), data);
};

export const updateDepartment = (documentId: string, data: Partial<Omit<Department, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, DEPARTMENTS_COLLECTION_ID, documentId, data);
};

export const deleteDepartment = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, DEPARTMENTS_COLLECTION_ID, documentId);
};

// Department Roles
export const getDepartmentRoles = async (departmentId: string): Promise<DepartmentRole[]> => {
    try {
        const response = await databases.listDocuments<DepartmentRole>(APPWRITE_DATABASE_ID, DEPARTMENT_ROLES_COLLECTION_ID, [
            Query.equal('departmentId', departmentId),
            Query.orderAsc('roleName')
        ]);
        return response.documents;
    } catch (error) {
        console.error(`Failed to fetch roles for department ${departmentId}:`, error);
        return [];
    }
};

export const getAllDepartmentRoles = async (): Promise<DepartmentRole[]> => {
    try {
        const response = await databases.listDocuments<DepartmentRole>(APPWRITE_DATABASE_ID, DEPARTMENT_ROLES_COLLECTION_ID, [
            Query.limit(2000)
        ]);
        return response.documents;
    } catch (error) {
        console.error(`Failed to fetch all department roles:`, error);
        return [];
    }
};

export const createDepartmentRole = (data: Omit<DepartmentRole, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, DEPARTMENT_ROLES_COLLECTION_ID, ID.unique(), data);
};

export const updateDepartmentRole = (documentId: string, data: Partial<Omit<DepartmentRole, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, DEPARTMENT_ROLES_COLLECTION_ID, documentId, data);
};

export const deleteDepartmentRole = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, DEPARTMENT_ROLES_COLLECTION_ID, documentId);
};

// Department Crew Assignments
export const getDepartmentCrew = async (departmentId: string): Promise<DepartmentCrew[]> => {
    try {
        const response = await databases.listDocuments<DepartmentCrew>(APPWRITE_DATABASE_ID, DEPARTMENT_CREW_COLLECTION_ID, [
            Query.equal('departmentId', departmentId),
            Query.limit(2000) // Assuming a department won't have more than 2000 assignments
        ]);
        return response.documents;
    } catch (error) {
        console.error(`Failed to fetch crew for department ${departmentId}:`, error);
        return [];
    }
};

export const getAllDepartmentCrew = async (): Promise<DepartmentCrew[]> => {
    try {
        const response = await databases.listDocuments<DepartmentCrew>(APPWRITE_DATABASE_ID, DEPARTMENT_CREW_COLLECTION_ID, [
            Query.limit(5000) // High limit to get all assignments
        ]);
        return response.documents;
    } catch (error) {
        console.error(`Failed to fetch all department crew assignments:`, error);
        return [];
    }
};

export const getAssignmentsForRole = async(roleId: string): Promise<DepartmentCrew[]> => {
    try {
        const response = await databases.listDocuments<DepartmentCrew>(APPWRITE_DATABASE_ID, DEPARTMENT_CREW_COLLECTION_ID, [
            Query.equal('roleId', roleId),
            Query.limit(500)
        ]);
        return response.documents;
    } catch (error) {
        console.error(`Failed to fetch assignments for role ${roleId}:`, error);
        return [];
    }
}

export const assignCrewToDepartment = (data: Omit<DepartmentCrew, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, DEPARTMENT_CREW_COLLECTION_ID, ID.unique(), data);
};

export const unassignCrewFromDepartment = (assignmentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, DEPARTMENT_CREW_COLLECTION_ID, assignmentId);
};

// --- New Project Department Crew Assignments ---

export const getProjectDepartmentCrew = async (projectId: string): Promise<ProjectDepartmentCrew[]> => {
    try {
        const response = await databases.listDocuments<ProjectDepartmentCrew>(APPWRITE_DATABASE_ID, PROJECT_DEPARTMENT_CREW_COLLECTION_ID, [
            Query.equal('projectId', projectId),
            Query.limit(2000)
        ]);
        return response.documents;
    } catch (error) {
        console.error(`Failed to fetch project crew assignments for project ${projectId}:`, error);
        return [];
    }
};

export const assignCrewToProjectDepartment = (data: Omit<ProjectDepartmentCrew, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, PROJECT_DEPARTMENT_CREW_COLLECTION_ID, ID.unique(), data);
};

export const unassignCrewFromProjectDepartment = (assignmentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, PROJECT_DEPARTMENT_CREW_COLLECTION_ID, assignmentId);
};

// --- Production Elements Library ---

export const listProductionElementFiles = async (): Promise<ProductionElementFile[]> => {
    try {
        const [storageFilesResponse, metadataDocsResponse] = await Promise.all([
            storage.listFiles(PRODUCTION_ELEMENTS_STORAGE_BUCKET_ID),
            databases.listDocuments<ProductionElement>(APPWRITE_DATABASE_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, [Query.limit(5000)])
        ]);
        
        const metadataMap = new Map<string, ProductionElement>();
        for (const doc of metadataDocsResponse.documents) {
            metadataMap.set(doc.fileId, doc);
        }

        const mergedFiles: ProductionElementFile[] = storageFilesResponse.files.map(file => {
            const metadata = metadataMap.get(file.$id);
            return {
                ...file,
                elementName: metadata?.elementName || file.name,
                elementType: metadata?.elementType || 'Document', // Fallback
                projectId: metadata?.projectId,
            };
        });

        return mergedFiles.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    } catch (error) {
        console.error("Failed to list production element files:", error);
        return [];
    }
};

export const uploadProductionElementFile = async (file: File, data: Omit<ProductionElement, 'fileId' | keyof Models.Document>) => {
    const storageFile = await storage.createFile(PRODUCTION_ELEMENTS_STORAGE_BUCKET_ID, ID.unique(), file);
    try {
        await databases.createDocument(APPWRITE_DATABASE_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, ID.unique(), {
            ...data,
            fileId: storageFile.$id,
        });
    } catch (dbError) {
        console.error("Failed to create production element metadata, cleaning up storage file.", dbError);
        await storage.deleteFile(PRODUCTION_ELEMENTS_STORAGE_BUCKET_ID, storageFile.$id);
        throw dbError;
    }
    return storageFile;
};

export const updateProductionElement = async (fileId: string, data: Partial<Omit<ProductionElement, 'fileId' | keyof Models.Document>>) => {
    try {
        const metadataDocs = await databases.listDocuments<ProductionElement>(APPWRITE_DATABASE_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, [
            Query.equal('fileId', fileId),
            Query.limit(1)
        ]);

        if (metadataDocs.documents.length > 0) {
            const documentId = metadataDocs.documents[0].$id;
            return await databases.updateDocument(APPWRITE_DATABASE_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, documentId, data);
        } else {
            throw new Error(`No metadata found for fileId: ${fileId}. Cannot update.`);
        }
    } catch (error) {
        console.error("Failed to update production element metadata:", error);
        throw error;
    }
};

export const getProductionElementFilePreviewUrl = (fileId: string): string => {
    return storage.getFileView(PRODUCTION_ELEMENTS_STORAGE_BUCKET_ID, fileId).toString();
};

export const deleteProductionElementFile = async (fileId: string) => {
    await storage.deleteFile(PRODUCTION_ELEMENTS_STORAGE_BUCKET_ID, fileId);
    try {
        const metadataDocs = await databases.listDocuments(APPWRITE_DATABASE_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, [
            Query.equal('fileId', fileId),
            Query.limit(1)
        ]);
        if (metadataDocs.documents.length > 0) {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, PRODUCTION_ELEMENTS_COLLECTION_ID, metadataDocs.documents[0].$id);
        }
    } catch (dbError) {
        console.warn(`File ${fileId} was deleted from storage, but its metadata could not be removed.`, dbError);
    }
};

// Storage / Media
export const listFiles = async (): Promise<MediaFile[]> => {
    try {
        const [storageFilesResponse, metadataDocsResponse] = await Promise.all([
            storage.listFiles(APPWRITE_STORAGE_BUCKET_ID),
            databases.listDocuments<MediaMetadata>(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, [Query.limit(5000)])
        ]);
        
        const metadataMap = new Map<string, MediaMetadata>();
        for (const doc of metadataDocsResponse.documents) {
            metadataMap.set(doc.fileId, doc);
        }

        const mergedFiles: MediaFile[] = storageFilesResponse.files.map(file => {
            const metadata = metadataMap.get(file.$id);
            return {
                ...file,
                category: metadata?.category || 'Image', // Fallback for legacy files
                name: metadata?.name || file.name,
            };
        });

        return mergedFiles.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    } catch (error) {
        console.error("Failed to list files:", error);
        return [];
    }
};

export const uploadFile = async (file: File, category: MediaCategory) => {
    const storageFile = await storage.createFile(APPWRITE_STORAGE_BUCKET_ID, ID.unique(), file);
    try {
        await databases.createDocument(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, ID.unique(), {
            fileId: storageFile.$id,
            category: category,
            name: file.name
        });
    } catch (dbError) {
        // If DB write fails, delete the orphaned storage file to keep things clean
        console.error("Failed to create media metadata, cleaning up storage file.", dbError);
        await storage.deleteFile(APPWRITE_STORAGE_BUCKET_ID, storageFile.$id);
        throw dbError; // re-throw the error
    }
    return storageFile;
};

export const updateMediaMetadata = async (fileId: string, data: { category?: MediaCategory, name?: string }) => {
    try {
        const metadataDocs = await databases.listDocuments<MediaMetadata>(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, [
            Query.equal('fileId', fileId),
            Query.limit(1)
        ]);

        if (metadataDocs.documents.length > 0) {
            const documentId = metadataDocs.documents[0].$id;
            return await databases.updateDocument(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, documentId, data);
        } else {
            // This case should ideally not happen if uploads are transactional
            console.warn(`No metadata found for fileId: ${fileId}. Cannot update.`);
            return null;
        }
    } catch (error) {
        console.error("Failed to update media metadata:", error);
        throw error;
    }
};

// FIX: As per user request, switched from `getFilePreview` to `getFileView` to resolve issues with image rendering.
// The `getFileView` method provides a direct link to view the file in the browser.
// Note that this method does not support width and height parameters for thumbnail generation.
export const getFilePreviewUrl = (fileId: string, width?: number, height?: number): string => {
    // width and height arguments are kept for compatibility with existing calls, but are unused by getFileView.
    return storage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId).toString();
};

export const deleteFile = async (fileId: string) => {
    // FIX: Refactored the deletion process to be sequential and more robust.
    // The previous `Promise.all` implementation would fail the entire operation
    // if metadata deletion failed, even if file storage deletion could succeed.
    // This new approach prioritizes deleting the file from storage.

    // 1. Delete the file from storage first. This is the primary action.
    // If it fails, an exception is thrown, and the UI will correctly show an error.
    await storage.deleteFile(APPWRITE_STORAGE_BUCKET_ID, fileId);

    // 2. After successfully deleting the file, attempt to clean up its metadata.
    try {
        const metadataDocs = await databases.listDocuments(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, [
            Query.equal('fileId', fileId),
            Query.limit(1)
        ]);

        // If a corresponding metadata document exists, delete it.
        if (metadataDocs.documents.length > 0) {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, metadataDocs.documents[0].$id);
        }
    } catch (dbError) {
        // 3. If metadata cleanup fails, log it as a warning but do not throw an error.
        // The main goal of deleting the file was successful, so we should still
        // allow the UI to reflect that. The metadata document is now orphaned but can be cleaned up manually if needed.
        console.warn(`File ${fileId} was successfully deleted from storage, but its metadata document could not be removed.`, dbError);
    }
};

// --- New Unified Media Functions ---

export const listAllMediaFiles = async (): Promise<UnifiedMediaFile[]> => {
    try {
        const [mediaFiles, elementFiles] = await Promise.all([
            listFiles(),
            listProductionElementFiles()
        ]);

        const unifiedMedia: UnifiedMediaFile[] = mediaFiles.map(file => ({
            ...file,
            displayName: file.name,
            category: file.category,
            library: 'media',
            fileId: file.$id,
        }));

        const unifiedElements: UnifiedMediaFile[] = elementFiles.map(file => ({
            ...file,
            displayName: file.elementName,
            category: file.elementType,
            projectId: file.projectId,
            library: 'elements',
            fileId: file.$id,
        }));

        const allFiles = [...unifiedMedia, ...unifiedElements];
        
        return allFiles.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

    } catch (error) {
        console.error("Failed to list all media files:", error);
        return [];
    }
};

export const getUnifiedFilePreviewUrl = (file: UnifiedMediaFile): string => {
    if (file.library === 'elements') {
        return getProductionElementFilePreviewUrl(file.fileId);
    }
    return getFilePreviewUrl(file.fileId);
};