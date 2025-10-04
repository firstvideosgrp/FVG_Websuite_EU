# FirstVideos Group - Website & CMS

A modern, one-page website for the entertainment and movie studio group "FirstVideos Group," complete with a comprehensive content management dashboard powered by Appwrite.

This project is a fully-featured, single-page application (SPA) with a powerful admin panel, designed to provide a sleek, responsive, and easily manageable web presence for a creative studio.

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

This project provides a sleek, responsive, and fully manageable website for a fictional movie studio. The public-facing site is a single-page application designed to showcase the studio's work, introduce the team, and provide contact information.

The core of the project is its powerful admin dashboard, which allows non-technical users to manage every aspect of the site's content—from project details and production timelines to global branding and mail server settings—without touching a single line of code.

## Key Features

### Public-Facing Website

-   **Fully Responsive Design:** Looks great on desktops, tablets, and mobile devices.
-   **Dynamic Content:** All sections (Hero, About, Projects, Contact) are populated with data from the Appwrite backend.
-   **Smooth Scrolling SPA:** A seamless single-page experience with smooth navigation.
-   **Interactive Project Showcase:** Displays projects in a grid with details available in a feature-rich modal view.
-   **Production Progress:** Visitors can view the production status of upcoming projects, including completed phases and steps.
-   **Themable:** Light and dark modes available for a comfortable viewing experience.

### Admin Dashboard (`/admin`)

A secure, feature-rich dashboard for complete site management.
-   **Secure Authentication:** Admin access is protected by Appwrite's authentication system.
-   **Content Management:**
    -   **About Section:** Update the company's story and mission.
    -   **Projects:** Full CRUD (Create, Read, Update, Delete) functionality for projects (movies, series, shorts).
    -   **Cast & Crew:** Maintain a central database of cast and crew members, and easily assign them to projects.
    -   **Production Phases:** Define and track custom production timelines for each project with nested steps and completion statuses.
-   **Media Library:**
    -   Upload, view, categorize, and delete all media assets (posters, logos, background images).
    -   Intelligently tracks where each media file is being used to prevent accidental deletion of critical assets.
-   **Global Site Settings:**
    -   **Branding:** Configure the site title, logos (for light/dark themes), and theme colors.
    -   **Hero Section:** Customize the hero's background (image or plexus animation), title, description, and button text.
    -   **Footer:** Manage footer text, version number, social media links, and other custom links.
-   **Mail Configuration:**
    -   Set up, manage, and test SMTP settings for the contact form directly from the dashboard.
    -   Enable or disable mail functionality globally with a single toggle.

## Tech Stack

-   **Frontend:**
    -   **Framework:** React with TypeScript
    -   **Styling:** Tailwind CSS
    -   **Routing:** React Router
    -   **Icons:** Font Awesome
-   **Backend as a Service (BaaS):**
    -   **[Appwrite](https://appwrite.io/):**
        -   **Database:** Storing all site content (projects, settings, cast, phases, etc.).
        -   **Auth:** Secure user authentication for the admin dashboard.
        -   **Storage:** Hosting for all media files.
        -   **Functions:** Server-side logic for securely sending emails via SMTP.

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

### 4. Configure Application Settings

This project uses a central configuration file to manage Appwrite settings. You will need to edit this file with the values from your Appwrite project.

1.  Open the `src/constants.ts` file in your code editor.
2.  Replace all placeholder values (e.g., `'YOUR_PROJECT_ID'`) with the actual IDs and credentials you obtained during the Appwrite setup.

For a detailed list of all required values and more in-depth setup instructions, please refer to the backend setup guide.

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
        -   Use the ✏️ (Edit), 👥 (Manage Cast/Crew), and 🗑️ (Delete) icons to manage existing projects.
    -   **Production Phases:**
        -   Select a project from the dropdown.
        -   Add, edit, or delete production phases (e.g., Pre-Production, Filming).
        -   Within each phase, add, edit, delete, and reorder individual steps (e.g., Scriptwriting, Casting).
    -   **Cast & Crew:**
        -   Manage separate global lists for Cast and Crew members.
        -   Add new members with their name, role, and bio.
        -   Edit or delete existing members. These members will then be available to assign to projects.
    -   **Media Library:**
        -   Click **Add New** to upload files and assign a category.
        -   Hover over an image to get options to **Edit Details**, **Copy URL**, or **Delete**. The usage tracker will warn you if you try to delete an image that is currently in use.
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
