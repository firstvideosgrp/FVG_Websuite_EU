# FirstVideos Group - Website & CMS

A modern, one-page website for the entertainment and movie studio group "FirstVideos Group," complete with a comprehensive content management dashboard powered by Appwrite.

## Project Overview

This project provides a sleek, responsive, and fully manageable website for a fictional movie studio. The public-facing site is a single-page application designed to showcase the studio's work, introduce the team, and provide contact information.

The core of the project is its powerful admin dashboard, which allows non-technical users to manage every aspect of the site's content without touching a single line of code.

### Key Features

-   **Public-Facing Website:**
    -   Smooth-scrolling single-page layout.
    -   Dynamic Hero, About, Projects, and Contact sections.
    -   Project showcase with details like posters, status, and descriptions.
    -   Content is fetched dynamically from the Appwrite backend.
-   **Admin Dashboard (`/admin`):**
    -   Secure login for administrators.
    -   **Content Management:**
        -   **About Section:** A rich text editor to update the company's story.
        -   **Projects:** Full CRUD (Create, Read, Update, Delete) functionality for movie/series projects. Manage details like synopsis, release year, status, and cast/crew.
    -   **Media Library:** A central hub to upload, view, and delete all media assets (posters, images, etc.).
    -   **Site Settings:** Globally configure the website's title, theme colors, footer content, social media links, and more.
    -   **Mail Configuration:** Set up and test SMTP settings for the contact form directly from the dashboard.

## Tech Stack

-   **Frontend:**
    -   **Framework:** React with TypeScript
    -   **Styling:** Tailwind CSS
    -   **Routing:** React Router
    -   **Icons:** Font Awesome
-   **Backend as a Service (BaaS):**
    -   **[Appwrite](https://appwrite.io/):** Used for...
        -   **Database:** Storing all site content (projects, settings, etc.).
        -   **Auth:** Secure user authentication for the admin dashboard.
        -   **Storage:** Hosting all media files for the library.
        -   **Functions:** Server-side logic for securely sending emails.

## Installation & Setup

Follow these steps to get the project running locally.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Appwrite Backend

The backend is crucial for the application to function. A detailed, step-by-step guide is available in the project documentation.

**➡️ See: [docs/database-setup.md](./docs/database-setup.md)**

This guide will walk you through:
1.  Creating an Appwrite project.
2.  Setting up the required Database, Collections, and Attributes.
3.  Configuring a Storage bucket for media.
4.  Deploying server-side Functions for sending emails.
5.  Creating an admin user account for the dashboard.

### 4. Configure Frontend Constants

After setting up your Appwrite backend, you must update the hardcoded configuration file with the IDs from your Appwrite project.

Open `src/constants.ts` and replace the placeholder values with your actual Appwrite credentials.

```typescript
// src/constants.ts

export const APPWRITE_ENDPOINT = "https://[YOUR_REGION].cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID = "YOUR_PROJECT_ID";
export const APPWRITE_DATABASE_ID = "YOUR_DATABASE_ID";
export const PROJECTS_COLLECTION_ID = "YOUR_PROJECTS_COLLECTION_ID";
// ... and so on for all other constants.
```

### 5. Run the Application

Once the dependencies are installed and the configuration is set, start the local development server.

```bash
npm start
```

The application should now be running on a local port (e.g., `http://localhost:3000`).

## Usage Guide

### Public Website

Navigate to the root URL (`/`) to view the public-facing site. Use the navigation bar to smoothly scroll between the **Home**, **About**, **Projects**, and **Contact** sections.

### Admin Dashboard

1.  **Login:** Navigate to `/admin`. Use the email and password for the user you created during the Appwrite setup to log in.
2.  **Navigation:** Use the sidebar on the left to switch between different management panels:
    -   **About Section:** Edit the text content for the "About Us" page.
    -   **Projects:**
        -   Click **Add New Project** to create a new entry.
        -   Use the ✏️ (Edit), 👥 (Manage Cast), and 🗑️ (Delete) icons to manage existing projects.
    -   **Media Library:**
        -   Click **Add New** to upload files.
        -   Hover over an image to get options to **Copy URL** or **Delete**. The copied URL can be pasted into fields like the "Poster URL" for a project.
    -   **Site Settings:** Modify any of the global settings. Remember to click **Save Settings** at the bottom. To test mail settings, save them first, then use the "Send Test" feature.

## Contributing

Contributions are welcome! If you'd like to extend or improve the project, please follow these steps:

1.  **Fork** the repository.
2.  Create a new branch for your feature (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a **Pull Request**.

Please try to follow the existing code style and conventions.

## License

This project is licensed under the MIT License.
