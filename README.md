# e-conference (Web Application for Conference Organization)

This is a Next.js project for a Single Page Application (SPA) web app designed to manage scientific conferences.

## Description

The application allows for the organization of conferences, including the process of submitting, reviewing, and approving scientific papers. It is designed to be accessible from desktops and mobile devices.

## Core Functionality

The application has three types of users with distinct roles:

- **Organizer**:
  - Can create new conferences.
  - Can assign reviewers to the created conferences.
  - Can monitor the status of all submitted articles.
- **Author**:
  - Can register for a conference.
  - Can submit a paper proposal.
  - Can upload a new version of the article based on received feedback.
- **Reviewer**:
  - Automatically receives articles for review (2 reviewers per article).
  - Can approve an article.
  - Can provide feedback to the author for modifications.
