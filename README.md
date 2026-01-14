# Note-me

A writing app similar to Notion, built with Electron and SQLite.

## Overview

Note-me is a desktop note-taking application that provides a simple interface for creating and managing documents. Built with Electron, it offers a native desktop experience with persistent storage using SQLite.

## Features

- Create and manage documents
- SQLite database for reliable local storage
- Cross-platform desktop application (Windows, macOS, Linux)
- Fast and lightweight

## Tech Stack

- **Electron** - Desktop application framework
- **better-sqlite3** - SQLite database integration
- **Node.js** - Runtime environment

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd note-me
```

2. Install dependencies:
```bash
npm install
```

## Usage

Start the application:
```bash
npm start
```

## Project Structure

```
note-me/
├── main.js          # Electron main process
├── database.js      # Database manager with SQLite operations
├── index.html       # Application UI
├── package.json     # Project configuration
└── README.md        # This file
```

## Database

The application uses SQLite with Write-Ahead Logging (WAL) mode for improved performance. The database file is stored in the user's application data directory.

### Schema

- **documents** table:
  - `id` (TEXT, PRIMARY KEY) - Unique document identifier
  - `title` (TEXT) - Document title
  - `created_at` (INTEGER) - Creation timestamp
  - `updated_at` (INTEGER) - Last update timestamp
  - `deleted` (INTEGER) - Soft delete flag

## Development

The application is currently in early development. The basic Electron setup and database layer are functional.

## License

ISC
