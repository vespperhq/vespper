const sharp = require("sharp");

async function getMetadata(buffer) {
  return await sharp(buffer).metadata();
}

async function resize(buffer, maxWidth, maxHeight) {
  const { width: originalWidth, height: originalHeight } = await getMetadata(
    buffer
  );

  // Calculate new dimensions while maintaining the aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  let newWidth = maxWidth;
  let newHeight = maxHeight;

  if (newWidth / aspectRatio > maxHeight) {
    newWidth = maxHeight * aspectRatio;
  } else {
    newHeight = newWidth / aspectRatio;
  }

  const resizedBuffer = await sharp(buffer)
    .resize(Math.round(newWidth), Math.round(newHeight))
    .toBuffer();
  return resizedBuffer;
}

module.exports = { getMetadata, resize };
