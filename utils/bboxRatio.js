const convertToBbox = require('@turf/bbox').default;
const { isBbox } = require('./geoUtils');

/**
 * Calculates the auto dimensions for width and height based on the provided geometry, maximum width, and maximum height.
 * @param {Object} geometry - The geometry object.
 * @param {number} maxWidth - The maximum width.
 * @param {number} maxHeight - The maximum height.
 * @returns {Array} An array containing the calculated width and height.
 */
const calculateAutoDimensions = (geometry, maxWidth, maxHeight) => {
  try {
    const distances = calculateMaxMetersPerPixel(geometry);
    const totX = distances[0];
    const totY = distances[1];
    let newWidth, newHeight;
    const ratio = totX / totY;
    if (maxWidth !== undefined) {
      newWidth = maxWidth;
      newHeight = parseFloat((newWidth / ratio).toFixed(3));
      return [newWidth, newHeight];
    } else if (maxHeight !== undefined) {
      newHeight = maxHeight;
      newWidth = parseFloat((newHeight * ratio).toFixed(3));
      return [newWidth, newHeight];
    }
  } catch (err) {
    console.error('Something went wrong while calculating dimensions', err);
  }
};

/**
 * Calculates the maximum meters per pixel for a given geometry.
 * @param {Object} geometry - The geometry object.
 * @returns {Array} An array containing the maximum x distance and y distance in meters per pixel.
 */
const calculateMaxMetersPerPixel = (geometry) => {
  try {
    let bbox;
    if (isBbox(geometry)) {
      bbox = geometry;
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      bbox = convertToBbox(geometry);
    }
    const xDistance1 = measure(bbox[3], bbox[0], bbox[3], bbox[2]);
    const xDistance2 = measure(bbox[1], bbox[0], bbox[1], bbox[2]);
    const yDistance = measure(bbox[3], bbox[0], bbox[1], bbox[0]);
    return [Math.max(xDistance1, xDistance2), yDistance];
  } catch (err) {
    console.error('Error calculating meters per pixel', err);
  }
};

/**
 * Calculates the pixel size based on the provided geometry and dimensions.
 * @param {Object} geometry - The geometry object.
 * @param {Array} dimensions - An array containing the width and height.
 * @returns {Array} An array containing the pixel size for width and height.
 */
const calculatePixelSize = (geometry, dimensions) => {
  const bboxDimensions = calculateMaxMetersPerPixel(geometry);
  return [bboxDimensions[0] / dimensions[0], bboxDimensions[1] / dimensions[1]];
};

// Haversine formula
function measure(lat1, lon1, lat2, lon2) {
  // generally used geo measurement function
  var R = 6378.137; // Radius of earth in KM
  var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
  var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d * 1000; // meters
}

module.exports = {
  calculateAutoDimensions,
  calculateMaxMetersPerPixel,
  calculatePixelSize
};
