import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Images array from PropertyList.tsx
const images = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600566753051-f0b4ae10f956?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600573472550-8090733a73c6?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1605146769289-440113cc3d00?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1633114073945-ccefa7237461?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1628745277862-fde2c19b3ab3?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1630699144867-37acec97df5a?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1560518883-7d82c5767c25?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1560749003-f4b1e17e2dff?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1621551122354-e96737d64b21?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600047508967-c9cd77d2d492?ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1600047508788-26df7b3599f4?ixlib=rb-4.0.3",
];

// Path to save images
const outputDir = path.resolve(__dirname, '../assets/images/properties');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

// Download all images
const downloadAllImages = async () => {
  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    // Extract the image ID from the URL
    const imageId = url.split('photo-')[1].split('?')[0];
    const filename = `property-${i + 1}.jpg`;
    const filepath = path.join(outputDir, filename);
    
    try {
      await downloadImage(url, filepath);
      console.log(`[${i+1}/${images.length}] Downloaded ${filename}`);
    } catch (error) {
      console.error(`Failed to download image ${i+1}:`, error);
    }
  }
  
  console.log('All images downloaded!');
};

// Generate additional images if fewer than 100
const generateAdditionalImages = async () => {
  const totalImagesNeeded = 100;
  const currentImages = images.length;
  
  if (currentImages >= totalImagesNeeded) {
    console.log(`Already have ${currentImages} images, no need for additional ones.`);
    return;
  }
  
  console.log(`Generating ${totalImagesNeeded - currentImages} additional images...`);
  
  // Reuse existing images for the additional ones
  for (let i = currentImages; i < totalImagesNeeded; i++) {
    const sourceIndex = i % currentImages;
    const sourceUrl = images[sourceIndex];
    const sourceFilename = `property-${sourceIndex + 1}.jpg`;
    const targetFilename = `property-${i + 1}.jpg`;
    
    const sourcePath = path.join(outputDir, sourceFilename);
    const targetPath = path.join(outputDir, targetFilename);
    
    try {
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${sourceFilename} to ${targetFilename}`);
    } catch (error) {
      console.error(`Failed to copy image ${i+1}:`, error);
    }
  }
  
  console.log('All additional images generated!');
};

// Main execution
const main = async () => {
  try {
    await downloadAllImages();
    await generateAdditionalImages();
    console.log('Done!');
  } catch (error) {
    console.error('Error in main process:', error);
  }
};

main(); 