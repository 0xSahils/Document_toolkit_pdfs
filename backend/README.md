# PDF Toolkit - Online PDF Processing Tool

A comprehensive online PDF toolkit built with the MERN stack that allows users to merge, split, compress, and convert PDF files.

## Features

- **Merge PDFs**: Combine multiple PDF files into a single document
- **Split PDFs**: Extract specific pages or split into separate files
- **Compress PDFs**: Reduce file size while maintaining quality
- **Convert PDFs**: Convert PDF pages to images (PNG, JPG)
- **File Upload**: Drag & drop interface with file validation
- **History Tracking**: View recent operations (when database is connected)
- **Cloud Storage**: Optional Cloudinary integration for file storage
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend

- Node.js + Express.js
- MongoDB (optional for history)
- Multer for file uploads
- pdf-merger-js for merging PDFs
- pdf-lib for PDF manipulation
- pdf2pic for PDF to image conversion
- Cloudinary for cloud storage (optional)

### Frontend

- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- React Dropzone for file uploads
- React Hot Toast for notifications
- Lucide React for icons
- Axios for API calls

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (optional)
- Cloudinary account (optional)

### Backend Setup

1. Install backend dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
```

3. Start the backend server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to client directory:

```bash
cd client
```

2. Install frontend dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### Merge PDFs

1. Go to the Merge page
2. Upload 2 or more PDF files
3. Click "Merge PDFs"
4. Download the combined PDF

### Split PDFs

1. Go to the Split page
2. Upload a PDF file
3. Choose to split all pages or specific pages
4. Click "Split PDF"
5. Download individual PDF files

### Compress PDFs

1. Go to the Compress page
2. Upload a PDF file
3. Select compression level
4. Click "Compress PDF"
5. Download the compressed file

### Convert PDFs

1. Go to the Convert page
2. Upload a PDF file
3. Choose output format (PNG, JPG, JPEG)
4. Click "Convert to [FORMAT]"
5. Download individual image files

## Configuration

### Database (Optional)

The application works without a database, but you can connect MongoDB to track operation history:

```env
MONGODB_URI=mongodb://localhost:27017/pdf-toolkit
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pdf-toolkit
```

### Cloud Storage (Optional)

Configure Cloudinary for cloud file storage:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## File Limits

- Maximum file size: 50MB per file
- Maximum files for merge: 10 files
- Supported format: PDF only
- Automatic cleanup: Files are deleted after 5 minutes

## API Endpoints

- `POST /api/pdf/merge` - Merge multiple PDFs
- `POST /api/pdf/split` - Split PDF into pages
- `POST /api/pdf/compress` - Compress PDF file
- `POST /api/pdf/convert` - Convert PDF to images
- `GET /api/pdf/info` - Get PDF information
- `GET /api/pdf/history` - Get operation history
- `GET /api/pdf/download/:filename` - Download processed file

## Development

### Project Structure

```
pdf-toolkit/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── ...
├── config/                 # Configuration files
├── middleware/             # Express middleware
├── models/                 # MongoDB models
├── routes/                 # API routes
├── utils/                  # Backend utilities
├── uploads/                # Temporary file storage
└── ...
```

### Scripts

Backend:

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

Frontend:

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Install dependencies: `npm install`
3. Start the server: `npm start`

### Frontend Deployment

1. Build the frontend: `cd client && npm run build`
2. Serve the `client/build` directory
3. Configure proxy to backend API

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Security Features

- File type validation (PDF only)
- File size limits
- Automatic file cleanup
- Input sanitization
- Error handling
- CORS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue on the GitHub repository.
