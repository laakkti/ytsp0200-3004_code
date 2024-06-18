const axios = require("axios");
var calculateDim = require("../utils/calculateDim");

/**
 * Function to get statistics for a given geometry and time range.
 * 
 * @param {Object} geometry - The geometry object.
 * @param {string} dateFrom - The start date in ISO format.
 * @param {string} dateTo - The end date in ISO format.
 * @returns {Object[]} The statistics data.
 */
const getStatistics = async (geometry, dateFrom, dateTo) => {
  const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: [
              "B04",
              "B08",
              "dataMask"
            ]
          }],
          output: [
            {
              id: "data",
              bands: 1
            },
            {
              id: "dataMask",
              bands: 1
            }]
        };
      }
      
      function evaluatePixel(samples) { 
          let index = (samples.B08 - samples.B04) / (samples.B08+samples.B04);
          return {
              data: [index, samples.B08, samples.B04],
              dataMask: [samples.dataMask]        
          };
      }
  `;

  /**
   * Function to get width and height for the image.
   * 
   * @param {Object} geometry - The geometry object.
   * @returns {Object} Object containing width and height.
   */
  async function getWidthAndHeight(geometry) {
    const res = 512;

    let width = res;
    let height = await calculateDim.calculateHeight(geometry, width);

    if (width < height) {
      height = res;
      width = await calculateDim.calculateWidth(geometry, height);
    }

    return { width, height };
  }

  const { width, height } = await getWidthAndHeight(geometry);

  let bearAuthToken = `Bearer ${authToken}`;

  try {
    let result = await axios({
      method: "post",
      url: "https://services.sentinel-hub.com/api/v1/statistics",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearAuthToken,
      },

      data: {
        input: {
          bounds: {
            geometry: geometry,
          },
          data: [
            {
              dataFilter: { maxCloudCoverage: 20 },
              type: "sentinel-2-l1c",
            },
          ],
        },
        aggregation: {
          timeRange: {
            from: dateFrom,
            to: dateTo,
          },
          aggregationInterval: {
            of: "P1D",
          },

          RESX: "10m",
          RESY: "10m",
          width: width,
          height: height,

          evalscript: evalscript,
        },
        calculations: {
          default: {},
        },
      },
    });

    return result.data.data;
  } catch (err) {
    return [];
  }
};

module.exports = {
  getStatistics
};
