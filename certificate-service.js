/**
 * Certificate generation service
 * Handles the creation and management of course completion certificates
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const QRCode = require('qrcode');
const User = require('../models/User');
const Course = require('../models/Course');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure certificate settings
const certificateConfig = {
  width: 1100,
  height: 800,
  backgroundDefault: path.join(__dirname, '../../uploads/certificate-templates/default.png'),
  outputDir: path.join(__dirname, '../../uploads/certificates'),
  fonts: {
    title: {
      path: path.join(__dirname, '../../uploads/fonts/Montserrat-Bold.ttf'),
      family: 'Montserrat-Bold',
      size: 36
    },
    name: {
      path: path.join(__dirname, '../../uploads/fonts/Montserrat-Bold.ttf'),
      family: 'Montserrat-Bold',
      size: 48
    },
    course: {
      path: path.join(__dirname, '../../uploads/fonts/Montserrat-SemiBold.ttf'),
      family: 'Montserrat-SemiBold',
      size: 24
    },
    date: {
      path: path.join(__dirname, '../../uploads/fonts/Montserrat-Regular.ttf'),
      family: 'Montserrat-Regular',
      size: 16
    },
    id: {
      path: path.join(__dirname, '../../uploads/fonts/Montserrat-Light.ttf'),
      family: 'Montserrat-Light',
      size: 12
    }
  },
  baseUrl: process.env.BASE_URL || 'http://localhost:5000'
};

// Ensure certificate directory exists
if (!fs.existsSync(certificateConfig.outputDir)) {
  fs.mkdirSync(certificateConfig.outputDir, { recursive: true });
}

// Register fonts
Object.values(certificateConfig.fonts).forEach(font => {
  try {
    registerFont(font.path, { family: font.family });
  } catch (error) {
    console.error(`Error registering font ${font.family}:`, error.message);
  }
});

/**
 * Generate a certificate for a user completing a course
 * @param {string} userId - The ID of the user
 * @param {string} courseTitle - The title of the completed course
 * @param {string} certificateTemplate - Optional template name
 * @returns {string} - URL to the generated certificate
 */
const generateCertificate = async (userId, courseTitle, certificateTemplate = 'default') => {
  try {
    // Get user data
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate unique certificate ID
    const certificateId = uuidv4();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create canvas for certificate
    const canvas = createCanvas(certificateConfig.width, certificateConfig.height);
    const ctx = canvas.getContext('2d');
    
    // Load background image
    let backgroundPath = certificateConfig.backgroundDefault;
    
    // Check if template exists
    const customTemplatePath = path.join(__dirname, `../../uploads/certificate-templates/${certificateTemplate}.png`);
    if (fs.existsSync(customTemplatePath)) {
      backgroundPath = customTemplatePath;
    }
    
    const background = await loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0, certificateConfig.width, certificateConfig.height);
    
    // Set up text content
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = `${certificateConfig.fonts.title.size}px "${certificateConfig.fonts.title.family}"`;
    ctx.fillStyle = '#333333';
    ctx.fillText('CERTIFICATE OF COMPLETION', certificateConfig.width / 2, 200);
    
    // User name
    ctx.font = `${certificateConfig.fonts.name.size}px "${certificateConfig.fonts.name.family}"`;
    ctx.fillStyle = '#000000';
    ctx.fillText(user.name, certificateConfig.width / 2, 320);
    
    // Course title (with wrapping)
    ctx.font = `${certificateConfig.fonts.course.size}px "${certificateConfig.fonts.course.family}"`;
    ctx.fillStyle = '#444444';
    
    // Handle long course titles with wrapping
    const maxWidth = 800;
    const words = courseTitle.split(' ');
    let line = '';
    let y = 420;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, certificateConfig.width / 2, y);
        line = word + ' ';
        y += 40;
      } else {
        line = testLine;
      }
    });
    
    ctx.fillText(line, certificateConfig.width / 2, y);
    
    // Date
    ctx.font = `${certificateConfig.fonts.date.size}px "${certificateConfig.fonts.date.family}"`;
    ctx.fillStyle = '#666666';
    ctx.fillText(`Completed on ${formattedDate}`, certificateConfig.width / 2, y + 80);
    
    // Certificate ID
    ctx.font = `${certificateConfig.fonts.id.size}px "${certificateConfig.fonts.id.family}"`;
    ctx.fillStyle = '#999999';
    ctx.fillText(`Certificate ID: ${certificateId}`, certificateConfig.width / 2, certificateConfig.height - 60);
    
    // Generate QR code for verification
    const verificationUrl = `${certificateConfig.baseUrl}/verify-certificate/${certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 120
    });
    
    const qrCodeImage = await loadImage(qrCodeDataUrl);
    ctx.drawImage(
      qrCodeImage, 
      certificateConfig.width - 150, 
      certificateConfig.height - 150, 
      100, 
      100
    );
    
    // Save certificate to file
    const fileName = `${certificateId}.png`;
    const filePath = path.join(certificateConfig.outputDir, fileName);
    
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    
    // Return certificate URL
    const certificateUrl = `/uploads/certificates/${fileName}`;
    
    // Return when the writing has finished
    return new Promise((resolve, reject) => {
      out.on('finish', () => resolve(certificateUrl));
      out.on('error', reject);
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error.message);
    throw error;
  }
};

/**
 * Verify a certificate is valid
 * @param {string} certificateId - The unique certificate ID
 * @returns {Object|null} - Certificate information if valid, null if invalid
 */
const verifyCertificate = async (certificateId) => {
  try {
    // Check if certificate file exists
    const certificatePath = path.join(certificateConfig.outputDir, `${certificateId}.png`);
    
    if (!fs.existsSync(certificatePath)) {
      return null;
    }
    
    // In a real implementation, you would look up this certificate ID in a database
    // For this implementation, we'll extract from the file name to verify it exists
    
    return {
      id: certificateId,
      isValid: true,
      verifiedAt: new Date()
    };
  } catch (error) {
    console.error('Error verifying certificate:', error.message);
    return null;
  }
};

module.exports = {
  generateCertificate,
  verifyCertificate
};
