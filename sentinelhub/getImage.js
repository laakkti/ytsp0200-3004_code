const sentinelHub = require("@sentinel-hub/sentinelhub-js");
const calculateDim = require("../utils/calculateDim");
const get_bounding_box = require("@turf/bbox").default;

/**
 * Function to add one day to a date.
 * 
 * @param {Date} date - The input date.
 * @returns {string} The date string representing the next day.
 */
function addOneDay(date) {
  date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

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

/**
 * Function to get NDVI image based on date and geometry.
 * 
 * @param {Date} date - The date of the image.
 * @param {Object} geometry - The geometry object.
 * @returns {Object} The NDVI image response.
 */
const getImage = async (date, geometry) => {
  // Evalscript for NDVI calculation
  const evalscript = `
    //VERSION=3
    function setup() {
        return {  
            input: ["B04", "B08", "dataMask"],
            output: [
                { id: "default", bands: 4 },
                { id: "index", bands: 1, sampleType: "FLOAT32" },                    
                { id: "dataMask", bands: 1 }
            ]
          };
    }

    function evaluatePixel(samples) {
        let val = index(samples.B08, samples.B04);
        let imgVals = null;
        
        // The library for tiffs works well only if there is only one channel returned.
        // So we encode the "no data" as NaN here and ignore NaNs on frontend.
        const indexVal = samples.dataMask === 1 ? val : NaN;
        
        if (val<0.30) imgVals = [0.9568627450980393, 0.2627450980392157, 0.21176470588235294,samples.dataMask];
        else if (val<0.45) imgVals = [1.0, 0.596078431372549, 0.0,samples.dataMask];                        
        else if (val<0.60) imgVals = [1.0, 0.9215686274509803, 0.23137254901960785,samples.dataMask];
        else if (val<0.65) imgVals = [0.31,0.54,0.18,samples.dataMask];
        else if (val<0.70) imgVals = [0.25,0.49,0.14,samples.dataMask];
        else if (val<0.75) imgVals = [0.19,0.43,0.11,samples.dataMask];
        else if (val<0.80) imgVals = [0.13,0.38,0.07,samples.dataMask];
        else if (val<0.85) imgVals = [0.06,0.33,0.04,samples.dataMask];
        else imgVals = [0,0.27,0,samples.dataMask];  
        return {
          default: imgVals,
          index: [indexVal],              
          dataMask: [samples.dataMask]
        };
        
    }
    `;

  // Creating a layer for NDVI calculation
  const layer = new sentinelHub.S2L1CLayer({
    evalscript: evalscript,
    maxCloudCoverPercent: 20,
  });

  // Getting width and height for the image
  const { width, height } = await getWidthAndHeight(geometry);

  // Getting bounding box for the geometry
  let bbox = get_bounding_box(geometry);

  // Setting up parameters for fetching the map
  let fromTime = new Date(date);
  let toTime = new Date(addOneDay(date));
  const getMapParams = {
    bbox: new sentinelHub.BBox(sentinelHub.CRS_EPSG4326, ...bbox),
    fromTime: fromTime,
    toTime: toTime,
    RESX: "10m",
    RESY: "10m",
    width: width,
    height: height,
    format: sentinelHub.MimeTypes.PNG,
    geometry: geometry,
  };

  try {
    // Fetching the map using the layer and parameters
    const response = await layer.getMap(getMapParams, sentinelHub.ApiType.PROCESSING);
    return response;
  } catch (e) {
    console.log("IMAGE ERROR: ", e.message);
    return null;
  }
};

// Exporting the getImage function
module.exports = {
  getImage
};
