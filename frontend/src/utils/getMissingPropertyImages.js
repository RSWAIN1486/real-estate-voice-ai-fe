import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to property images
const outputDir = path.resolve(__dirname, '../assets/images/properties');

// List of new Unsplash image URLs for missing property images
const additionalImageUrls = [
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1580216143062-9505b52776a8?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1565953399831-63cdb63de2eb?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1586105251261-72a756497a11?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600566753376-12c8ab8e17a9?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600566753375-809cdd93e66c?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600488999585-e4364713b90a?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600047509782-20d39509f26d?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600566752229-250ed79470f8?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?ixlib=rb-4.0.3",
];

// Find all missing property images
const findMissingPropertyImages = () => {
  // Check if property images directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all existing property image files
  const existingFiles = fs.readdirSync(outputDir);
  const existingPropertyNumbers = existingFiles
    .filter(file => file.startsWith('property-') && file.endsWith('.jpg'))
    .map(file => {
      const match = file.match(/property-(\d+)\.jpg/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null);
  
  // Find missing property numbers (1-100)
  const missingPropertyNumbers = [];
  for (let i = 1; i <= 100; i++) {
    if (!existingPropertyNumbers.includes(i)) {
      missingPropertyNumbers.push(i);
    }
  }
  
  return missingPropertyNumbers;
};

// Function to download an image
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Downloaded: ${filepath}`);
          resolve();
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete the file on error
          console.error(`Error writing to ${filepath}:`, err.message);
          reject(err);
        });
      } else {
        console.error(`Failed to download ${url}. Status: ${response.statusCode}`);
        reject(new Error(`HTTP Status: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.error(`Error downloading ${url}:`, err.message);
      reject(err);
    });
  });
};

// Download missing property images
const downloadMissingPropertyImages = async () => {
  const missingPropertyNumbers = findMissingPropertyImages();
  
  if (missingPropertyNumbers.length === 0) {
    console.log('All property images exist. Nothing to download.');
    return;
  }
  
  console.log(`Found ${missingPropertyNumbers.length} missing property images: ${missingPropertyNumbers.join(', ')}`);
  
  // Use additionalImageUrls for missing property images
  // If we don't have enough new URLs, we'll reuse existing images
  let urlIndex = 0;
  
  for (const propertyNumber of missingPropertyNumbers) {
    const filename = `property-${propertyNumber}.jpg`;
    const filepath = path.join(outputDir, filename);
    
    if (urlIndex < additionalImageUrls.length) {
      // Use a new URL from our additional list
      const url = additionalImageUrls[urlIndex++];
      
      try {
        await downloadImage(url, filepath);
        console.log(`Downloaded ${filename} from ${url}`);
      } catch (error) {
        console.error(`Failed to download image for property ${propertyNumber}:`, error);
        
        // If download fails, copy an existing image
        const existingFiles = fs.readdirSync(outputDir);
        if (existingFiles.length > 0) {
          const sourceFile = path.join(outputDir, existingFiles[0]);
          fs.copyFileSync(sourceFile, filepath);
          console.log(`Copied ${existingFiles[0]} to ${filename}`);
        }
      }
    } else {
      // We've used all additional URLs, so copy an existing image
      const existingFiles = fs.readdirSync(outputDir);
      if (existingFiles.length > 0) {
        const sourceFile = path.join(outputDir, existingFiles[Math.floor(Math.random() * existingFiles.length)]);
        fs.copyFileSync(sourceFile, filepath);
        console.log(`Copied existing image to ${filename}`);
      }
    }
  }
  
  console.log('All missing property images have been downloaded or copied.');
};

// Main execution
const main = async () => {
  try {
    await downloadMissingPropertyImages();
    console.log('Done!');
  } catch (error) {
    console.error('Error in main process:', error);
  }
};

main(); 