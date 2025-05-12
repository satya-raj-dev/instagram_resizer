const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Serve static files
app.use(express.static('public'));
app.use('/results', express.static('results'));

// Create results directory if it doesn't exist
if (!fs.existsSync('results')) {
  fs.mkdirSync('results');
}

// Handle image upload and conversion
app.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { format } = req.body;
    if (!format || (format !== 'portrait' && format !== 'landscape')) {
      return res.status(400).json({ error: 'Invalid format specified' });
    }

    // Define target dimensions
    const dimensions = {
      portrait: { width: 1080, height: 1350 },  // 4:5 ratio for Instagram portrait
      landscape: { width: 1200, height: 630 }   // Common landscape ratio for social media
    };

    const targetWidth = dimensions[format].width;
    const targetHeight = dimensions[format].height;
    
    // Get image metadata
    const metadata = await sharp(req.file.path).metadata();
    
    // Calculate resize dimensions while maintaining aspect ratio
    let resizeWidth, resizeHeight;
    const aspectRatio = metadata.width / metadata.height;
    
    if (format === 'portrait') {
      if (aspectRatio > targetWidth / targetHeight) {
        // Image is wider than target ratio
        resizeWidth = targetWidth;
        resizeHeight = Math.round(targetWidth / aspectRatio);
      } else {
        // Image is taller than target ratio
        resizeHeight = targetHeight;
        resizeWidth = Math.round(targetHeight * aspectRatio);
      }
    } else { // landscape
      if (aspectRatio > targetWidth / targetHeight) {
        // Image is wider than target ratio
        resizeWidth = targetWidth;
        resizeHeight = Math.round(targetWidth / aspectRatio);
      } else {
        // Image is taller than target ratio
        resizeHeight = targetHeight;
        resizeWidth = Math.round(targetHeight * aspectRatio);
      }
    }

    // Calculate positioning to center the image
    const left = Math.round((targetWidth - resizeWidth) / 2);
    const top = Math.round((targetHeight - resizeHeight) / 2);

    // Create output filename
    const outputFilename = `${path.parse(req.file.filename).name}_${format}${path.extname(req.file.originalname)}`;
    const outputPath = path.join('results', outputFilename);

    // Process the image: resize and embed in canvas with white background
    await sharp(req.file.path)
      .resize(resizeWidth, resizeHeight, {
        fit: 'contain',
        position: 'center',
        withoutEnlargement: false
      })
      .extend({
        top,
        bottom: targetHeight - resizeHeight - top,
        left,
        right: targetWidth - resizeWidth - left,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(outputPath);

    // Return the URL to the processed image
    res.json({
      success: true,
      message: 'Image converted successfully',
      imageUrl: `/results/${outputFilename}`
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});