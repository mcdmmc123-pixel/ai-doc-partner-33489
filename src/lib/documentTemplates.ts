export interface DocumentTemplate {
  name: string;
  content: string;
}

export const generateReadme = (answers: Record<string, string>, persona: string): string => {
  const projectName = answers.projectName || 'Project Name';
  const description = answers.description || 'Project description';
  const features = answers.features || 'List of features';
  const installation = answers.installation || 'Installation instructions';
  const usage = answers.usage || 'Usage instructions';

  const templates = {
    student: `# ${projectName}

## 📚 About This Project

${description}

### Learning Objectives
- Understanding of key concepts
- Practical application of technologies
- Problem-solving skills development

## ✨ Features

${features}

## 🚀 Getting Started

### Prerequisites
- List required software
- List required knowledge

### Installation

\`\`\`bash
${installation}
\`\`\`

## 💡 Usage

${usage}

## 🎓 What I Learned

Document key takeaways and challenges overcome.

## 📝 License

This project is created for educational purposes.
`,

    opensource: `# ${projectName}

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)

## Description

${description}

## Features

${features}

## Installation

\`\`\`bash
${installation}
\`\`\`

## Usage

${usage}

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Thank you to all contributors who have helped make this project better.
`,

    hackathon: `# ${projectName} 🚀

## 💡 The Problem

${description}

## ✨ Our Solution

${features}

## 🎯 Impact & Innovation

This project aims to solve real problems by leveraging cutting-edge technology.

## 🛠️ Quick Start

\`\`\`bash
${installation}
\`\`\`

## 📱 Usage

${usage}

## 🎨 Demo

[Live Demo Link](#) | [Video Demo](#) | [Screenshots](#)

## 🏗️ Built With

- List key technologies
- Why we chose them

## 🚀 What's Next

Future enhancements and scalability plans.

## 👥 Team

Meet the team behind this innovation.
`,

    professional: `# ${projectName}

## Executive Summary

${description}

## Key Features

${features}

## Architecture

High-level overview of system architecture and design decisions.

## Installation & Setup

### System Requirements
- Environment specifications
- Dependencies

### Installation Steps

\`\`\`bash
${installation}
\`\`\`

## Usage Guide

${usage}

## API Documentation

Detailed API reference and integration guides.

## Security Considerations

Overview of security measures and best practices implemented.

## Deployment

Production deployment guidelines and considerations.

## Maintenance & Support

Information on ongoing maintenance and support channels.

## License

All rights reserved.
`,
  };

  return templates[persona as keyof typeof templates] || templates.professional;
};

export const generateContributing = (): string => {
  return `# Contributing to This Project

Thank you for considering contributing! Here's how you can help:

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch for your feature
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Code Style

- Follow existing code conventions
- Write clear commit messages
- Add comments for complex logic
- Update documentation as needed

## Reporting Issues

- Use the issue tracker
- Provide detailed descriptions
- Include steps to reproduce
- Add relevant screenshots

## Pull Request Process

1. Update the README.md with details of changes
2. Ensure all tests pass
3. Request review from maintainers
4. Address feedback promptly

Thank you for your contributions!
`;
};

export const generateApiReference = (techStack: string[], fileAnalysis?: any): string => {
  const hasBackend = techStack.some(tech => 
    tech.toLowerCase().includes('api') || 
    tech.toLowerCase().includes('server') || 
    tech.toLowerCase().includes('backend')
  );

  return `# API Reference Documentation

> **Version:** 1.0.0  
> **Last Updated:** ${new Date().toISOString().split('T')[0]}

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)

---

## 🎯 Overview

This API provides programmatic access to the application's core functionality. All endpoints return JSON responses and follow RESTful conventions.

### Technology Stack
${techStack.length > 0 ? techStack.map(tech => `- ${tech}`).join('\n') : '- Add your technology stack'}

### Key Features
- RESTful architecture
- JSON request/response format
- Token-based authentication
- Comprehensive error handling
- Rate limiting protection

---

## 🔐 Authentication

All API requests require authentication using Bearer tokens.

### Obtaining an API Key

\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
\`\`\`

### Using the Token

Include the token in the Authorization header:

\`\`\`http
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

---

## 🌐 Base URL

### Production
\`\`\`
https://api.yourapp.com/v1
\`\`\`

### Development
\`\`\`
http://localhost:3000/api/v1
\`\`\`

---

## 📡 Endpoints

### Resources

#### GET /api/resources
Retrieve a list of resources with pagination support.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`page\` | integer | No | Page number (default: 1) |
| \`limit\` | integer | No | Items per page (default: 10, max: 100) |
| \`sort\` | string | No | Sort field (default: created_at) |
| \`order\` | string | No | Sort order: asc or desc (default: desc) |
| \`search\` | string | No | Search query |

**Request Example:**
\`\`\`http
GET /api/resources?page=1&limit=10&sort=name&order=asc
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-1234",
        "name": "Resource Name",
        "description": "Resource description",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
\`\`\`

---

#### GET /api/resources/:id
Retrieve a specific resource by ID.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`id\` | string | Yes | Resource unique identifier |

**Request Example:**
\`\`\`http
GET /api/resources/uuid-1234
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "name": "Resource Name",
    "description": "Detailed resource description",
    "status": "active",
    "metadata": {
      "tags": ["tag1", "tag2"],
      "category": "example"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

---

#### POST /api/resources
Create a new resource.

**Request Body:**
\`\`\`json
{
  "name": "string (required, max: 255)",
  "description": "string (optional, max: 1000)",
  "status": "string (optional, enum: active|inactive|pending)",
  "metadata": {
    "tags": ["string"],
    "category": "string"
  }
}
\`\`\`

**Request Example:**
\`\`\`http
POST /api/resources
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "name": "New Resource",
  "description": "This is a new resource",
  "status": "active",
  "metadata": {
    "tags": ["new", "example"],
    "category": "demo"
  }
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid-5678",
    "name": "New Resource",
    "description": "This is a new resource",
    "status": "active",
    "metadata": {
      "tags": ["new", "example"],
      "category": "demo"
    },
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
\`\`\`

---

#### PUT /api/resources/:id
Update an existing resource.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`id\` | string | Yes | Resource unique identifier |

**Request Body:**
\`\`\`json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional)",
  "metadata": "object (optional)"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "name": "Updated Resource Name",
    "updated_at": "2024-01-01T13:00:00Z"
  }
}
\`\`\`

---

#### DELETE /api/resources/:id
Delete a resource.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`id\` | string | Yes | Resource unique identifier |

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Resource successfully deleted"
}
\`\`\`

---

## 📊 Data Models

### Resource Object

\`\`\`typescript
interface Resource {
  id: string;              // UUID v4
  name: string;            // Max 255 characters
  description?: string;    // Optional, max 1000 characters
  status: 'active' | 'inactive' | 'pending';
  metadata?: {
    tags?: string[];
    category?: string;
    [key: string]: any;
  };
  created_at: string;      // ISO 8601 datetime
  updated_at: string;      // ISO 8601 datetime
}
\`\`\`

### Pagination Object

\`\`\`typescript
interface Pagination {
  page: number;           // Current page number
  limit: number;          // Items per page
  total: number;          // Total items count
  totalPages: number;     // Total pages count
}
\`\`\`

### Error Object

\`\`\`typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
\`\`\`

---

## ⚠️ Error Handling

### Standard Error Response

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| \`INVALID_TOKEN\` | Authentication token is invalid or expired |
| \`MISSING_FIELD\` | Required field is missing |
| \`INVALID_FORMAT\` | Field format is invalid |
| \`RESOURCE_NOT_FOUND\` | Requested resource does not exist |
| \`DUPLICATE_ENTRY\` | Resource already exists |
| \`RATE_LIMIT_EXCEEDED\` | Too many requests |

---

## 🚦 Rate Limiting

To ensure fair usage and system stability, API requests are rate-limited.

### Limits
- **Per Minute:** 100 requests
- **Per Hour:** 1,000 requests
- **Per Day:** 10,000 requests

### Rate Limit Headers

\`\`\`http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

### Exceeding Rate Limits

**Response (429 Too Many Requests):**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
\`\`\`

---

## 💻 Code Examples

### JavaScript/TypeScript (Fetch)

\`\`\`javascript
const API_BASE = 'https://api.yourapp.com/v1';
const API_TOKEN = 'your_api_token';

// GET request
async function getResources() {
  const response = await fetch(\`\${API_BASE}/resources?page=1&limit=10\`, {
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// POST request
async function createResource(data) {
  const response = await fetch(\`\${API_BASE}/resources\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}
\`\`\`

### Python (Requests)

\`\`\`python
import requests

API_BASE = 'https://api.yourapp.com/v1'
API_TOKEN = 'your_api_token'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# GET request
def get_resources():
    response = requests.get(
        f'{API_BASE}/resources',
        headers=headers,
        params={'page': 1, 'limit': 10}
    )
    return response.json()

# POST request
def create_resource(data):
    response = requests.post(
        f'{API_BASE}/resources',
        headers=headers,
        json=data
    )
    return response.json()
\`\`\`

### cURL

\`\`\`bash
# GET request
curl -X GET "https://api.yourapp.com/v1/resources?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"

# POST request
curl -X POST "https://api.yourapp.com/v1/resources" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Resource",
    "description": "Resource description",
    "status": "active"
  }'
\`\`\`

---

## 📝 Best Practices

1. **Always use HTTPS** in production
2. **Store API tokens securely** - never commit them to version control
3. **Implement exponential backoff** for rate limit errors
4. **Cache responses** when appropriate
5. **Validate input** before sending requests
6. **Handle errors gracefully** with proper error messages
7. **Use pagination** for large datasets
8. **Keep tokens refreshed** before expiration

---

## 🔗 Additional Resources

- [Swagger/OpenAPI Specification](#)
- [Postman Collection](#)
- [SDK Documentation](#)
- [Support Portal](#)

---

**Need Help?** Contact our support team at api-support@yourapp.com
`;
};

export const generateInstallationGuide = (techStack: string[]): string => {
  const hasPython = techStack.includes('Python');
  const hasNode = techStack.includes('JavaScript') || techStack.includes('TypeScript');
  const hasDocker = techStack.includes('Docker');

  return `# Installation Guide

## Prerequisites

${hasPython ? '- Python 3.8 or higher\n- pip package manager\n' : ''}
${hasNode ? '- Node.js 16.x or higher\n- npm or yarn package manager\n' : ''}
${hasDocker ? '- Docker and Docker Compose\n' : ''}

## Step 1: Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/your-project.git
cd your-project
\`\`\`

## Step 2: Install Dependencies

${hasPython ? `### Python Dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`
` : ''}

${hasNode ? `### Node.js Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`
` : ''}

## Step 3: Configuration

1. Copy the environment template:
\`\`\`bash
cp .env.example .env
\`\`\`

2. Edit the \`.env\` file with your configuration

## Step 4: Database Setup

\`\`\`bash
# Run migrations
npm run migrate
\`\`\`

## Step 5: Start the Application

${hasDocker ? `### Using Docker

\`\`\`bash
docker-compose up
\`\`\`
` : ''}

### Manual Start

\`\`\`bash
npm run dev
\`\`\`

The application should now be running at \`http://localhost:3000\`

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in your \`.env\` file
2. **Database connection failed**: Verify your database credentials
3. **Missing dependencies**: Run the install command again

## Next Steps

- Check out the [Usage Guide](README.md#usage)
- Read the [API Documentation](API_REFERENCE.md)
- Join our [Community](#)
`;
};
