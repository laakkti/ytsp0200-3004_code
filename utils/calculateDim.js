const { calculateAutoDimensions } = require("./bboxRatio");

/**
 * Calculates the width dimension based on the given geometry and height.
 *
 * @param {object} geometry - The geometry object to calculate dimensions for.
 * @param {number} height - The height dimension to use for the calculation.
 * @returns {number} - The calculated width rounded to the nearest integer.
 */
const calculateWidth = async (geometry, height) => {
  let dimensions = calculateAutoDimensions(geometry, undefined, Number(height));
  return Math.round(dimensions[0]);
};

/**
 * Calculates the height dimension based on the given geometry and width.
 *
 * @param {object} geometry - The geometry object to calculate dimensions for.
 * @param {number} width - The width dimension to use for the calculation.
 * @returns {number} - The calculated height rounded to the nearest integer.
 */
const calculateHeight = async (geometry, width) => {
  let dimensions = calculateAutoDimensions(geometry, Number(width), undefined);
  return Math.round(dimensions[1]);
};

module.exports = {
  calculateWidth,
  calculateHeight
};
