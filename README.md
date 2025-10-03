# Face Recognition Backend API

A secure Node.js/Express backend API for a face recognition application with user authentication, two-factor authentication (2FA), and image processing capabilities using the Clarifai API.

## 🚀 Features

- **User Authentication**: Secure registration and login with bcrypt password hashing
- **Two-Factor Authentication**: Complete 2FA implementation with QR codes
- **Image Processing**: Face detection and counting using Clarifai API
- **User Profiles**: Profile management and image entry tracking
- **Input Validation**: Comprehensive password requirements and email normalization
- **Database Security**: PostgreSQL with transaction support and error handling
- **CORS Configuration**: Secure cross-origin resource sharing
- **Environment Configuration**: Production-ready environment variable setup

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex.js query builder
- **Authentication**: bcryptjs for password hashing
- **2FA**: Speakeasy for TOTP generation, QRCode for setup
- **Image Processing**: Clarifai API for face detection
- **Security**: CORS, input validation, SQL injection prevention

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Clarifai API account

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/VanessaBusekrus/faceRecognition_BACKEND.git
cd faceRecognition_BACKEND
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Clarifai API
CLARIFAI_API_KEY=your_clarifai_api_key

# Frontend Configuration
FRONTEND_URL=http://localhost:3001

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Database Setup
Create the required PostgreSQL tables:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    entries INTEGER DEFAULT 0,
    joined TIMESTAMP DEFAULT NOW(),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    temp_two_factor_secret VARCHAR(255)
);

-- Login credentials table
CREATE TABLE login (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);
```

### 5. Start the server
```bash
npm start
```

The server will run on `http://localhost:3000` (or your specified PORT)

## 📚 API Endpoints

### Authentication
- `POST /register` - User registration with email validation
- `POST /signin` - User login
- `POST /signin2FA` - Two-factor authentication login

### Two-Factor Authentication
- `POST /enable-2fa` - Start 2FA setup process
- `POST /verify-2fa-setup` - Complete 2FA setup
- `POST /verify-2fa` - Verify 2FA token
- `POST /disable-2fa` - Disable 2FA for user

### User Management
- `GET /profile/:id` - Get user profile information

### Image Processing
- `PUT /image` - Update user's image entry count
- `POST /clarifaiAPI` - Process image with face detection

### Health Check
- `GET /` - Server health check

## 🔐 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

### Input Sanitization
- Email normalization (lowercase, trimmed)
- Name input cleaning
- SQL injection prevention through parameterized queries

### Database Security
- Password hashing with bcrypt (10 salt rounds)
- Database transactions for data integrity
- Comprehensive error handling

## 🏗️ Project Structure

```
├── controllers/
│   ├── register.js      # User registration logic
│   ├── signin.js        # User authentication logic
│   ├── 2fa.js          # Two-factor authentication handlers
│   ├── profile.js       # User profile management
│   ├── image.js         # Image processing logic
│   ├── clarifai.js      # Clarifai API integration
│   └── root.js          # Health check endpoint
├── server.js            # Main application entry point
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## 🌐 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PORT=5432
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=your_production_db_name
CLARIFAI_API_KEY=your_clarifai_api_key
FRONTEND_URL=https://your-frontend-domain.com
PORT=3000
```

### Deployment Platforms
- **Render**: Recommended for easy PostgreSQL integration
- **Heroku**: With Heroku Postgres add-on
- **Railway**: Simple deployment with built-in PostgreSQL
- **DigitalOcean**: App Platform with managed database

## 🧪 API Testing

### Example Registration Request
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

### Example Login Request
```bash
curl -X POST http://localhost:3000/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

## 🔧 Development

### Running in Development Mode
```bash
npm start
```
Uses nodemon for automatic server restart on file changes.

### Environment Setup for Development
1. Install PostgreSQL locally
2. Create a development database
3. Set up your `.env` file with local database credentials
4. Run the SQL schema to create tables
