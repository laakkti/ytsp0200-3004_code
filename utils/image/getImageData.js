const Jimp = require("jimp");
const scales = require("./scales");
var get_bounding_box = require("@turf/bbox").default;

/**
 * Processes the response to extract pixel data and calculate color percentages.
 *
 * @param {Buffer} response - The image data buffer.
 * @param {string[]} scaleColors - An array of scale color strings.
 * @returns {Promise<object[]>} - An array of objects containing colors and their respective percentages.
 */
const getPixelData = async (response, scaleColors) => {
  /**
   * Reads the image and extracts the RGBA values for each pixel.
   *
   * @param {Buffer} response - The image data buffer.
   * @returns {Promise<number[][]>} - A 2D array of RGBA values.
   */
  async function getRGBArray(response) {
    try {
      const image = await Jimp.read(response);
      let width = image.bitmap.width;
      let height = image.bitmap.height;
      let rgbArray = [];
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let { r, g, b, a } = Jimp.intToRGBA(image.getPixelColor(x, y));
          rgbArray.push([r, g, b, a]);
        }
      }
      // remove transparents (out of figure)
      rgbArray = rgbArray.filter((item) => {
        return item[3] !== 0;
      });
      return rgbArray;
    } catch (err) {
      console.error(err);
    }
  }

  const rgbArray = await getRGBArray(response);

  /**
   * Gets unique pixel colors from the image.
   *
   * @param {number[][]} image - A 2D array of RGBA values.
   * @returns {number[][]} - A 2D array of unique RGBA values.
   */
  function getUniquePixels(image) {
    let uniqueRGB = image.reduce((unique, color) => {
      if (
        !unique.some(function (c) {
          return c.toString() === color.toString();
        })
      ) {
        unique.push(color);
      }
      return unique;
    }, []);

    return uniqueRGB;
  }

  const uniquePixels = getUniquePixels(rgbArray);

  /**
   * Counts the number of occurrences of a specific color.
   *
   * @param {number[][]} colors - A 2D array of RGBA values.
   * @param {number[]} pixel - An array representing a single RGBA value.
   * @returns {number[]} - An array containing the counts of the specified color.
   */
  function getCounts(colors, pixel) {
    return colors.filter((item) => {
      return item.toString() === pixel.toString();
    });
  }

  const counts = uniquePixels.map((pixel) => {
    return getCounts(rgbArray, pixel).length;
  });

  let greenColor = scaleColors[scaleColors.length - 1];
  let notGreenColors = [...scaleColors];
  notGreenColors.pop();

  /**
   * Converts an RGBA array to an RGB string.
   *
   * @param {number[]} color - An array representing an RGBA value.
   * @returns {string} - An RGB string representation of the color.
   */
  function getRgbString(color) {
    return `rgb(${color.slice(0, 3).toString()})`;
  }

  const valuesString = greenColor.substring(4, greenColor.length - 1);
  const values = valuesString.split(",").map(Number);

  greenColor = [...values, 255];

  let greenCount = 0;
  let res = [];
  for (let i = 0; i < uniquePixels.length; i++) {
    const formattedColorString = getRgbString(uniquePixels[i]).replace(
      /\s*,\s*/g,
      ", "
    );

    if (!notGreenColors.includes(formattedColorString)) {
      greenCount += counts[i];
    } else {
      res = [...res, { color: uniquePixels[i], amount: counts[i] }];
    }
  }
  if (greenCount > 0) res = [...res, { color: greenColor, amount: greenCount }];

  let sum = res.reduce((a, b) => {
    return a + b.amount;
  }, 0);

  const percentages = res.map((item) => {
    if (item !== 0) {
      return Math.round((item.amount / sum) * 100);
    } else {
      return 0;
    }
  });

  sum = percentages.reduce((a, b) => {
    return a + b;
  }, 0);

  let error = 100 - sum;

  if (error !== 0) {
    if (error > 0) {
      let min = Math.min(...percentages);

      let minIndex = percentages.indexOf(min);

      if (res[minIndex] === 0) {
        let res2 = [...res];
        res2.splice(minIndex, 1);

        let min = Math.min(...res2);

        let minIndex = res.indexOf(min);
      } else {
        percentages[minIndex] += 1;
      }
    } else {
      let max = Math.max(...percentages);
      let maxIndex = percentages.indexOf(max);
      percentages[maxIndex] -= 1;
    }
  }

  let pixColors = res.map((item) => {
    return item.color;
  });

  let tmp = [];
  for (let i = 0; i < pixColors.length; i++) {
    tmp = [...tmp, { color: pixColors[i], amount: percentages[i] }];
  }

  return tmp;
};

/**
 * Creates a template with color percentages based on the given image.
 *
 * @param {Buffer} image - The image data buffer.
 * @returns {Promise<object[]>} - An array of objects representing the template with color percentages.
 */
const getTemplate = async (image) => {
  // shallow copy
  let template = scales.template.map((obj) => ({ ...obj }));

  let scaleColors = template.map((obj) => {
    return obj.color;
  });

  const tmp = await getPixelData(image, scaleColors);

  for (let i = 0; i < tmp.length; i++) {
    for (let j = 0; j < template.length; j++) {
      if (
        template[j].color.toString().replace(/ /g, "") ===
        `rgb(${tmp[i].color.slice(0, 3).toString()})`
      ) {
        template[j].amount = tmp[i].amount;
        break;
      }
    }
  }
  return template;
};

/**
 * Generates image data including statistics and bounding box information.
 *
 * @param {object} geometry - The geometry object to calculate the bounding box.
 * @param {Buffer} image - The image data buffer.
 * @param {object} stats - An object containing statistics (id, average, max, min, std).
 * @returns {Promise<object>} - An object containing image data, statistics, and scale.
 */
const getImageData = async (geometry, image, stats) => {
  let template = await getTemplate(image);
  let bbox = get_bounding_box(geometry);

  let _data = {
    id: stats.id,
    average: stats.average,
    max: stats.max,
    min: stats.min,
    std: stats.std,
    image: {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      dataUrl: image,
    },
    scale: [...template],
  };

  return _data;
};

module.exports = {
  getImageData,
};
