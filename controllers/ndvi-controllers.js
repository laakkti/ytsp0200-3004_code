const axios = require("axios");
const hash = require("../utils/hash");
const geoUtils = require("../utils/geoUtils");
const statistics = require("../sentinelhub/getStatistics");
const imageRef = require("../sentinelhub/getImage");
const imageDataRef = require("../utils/image/getImageData");
const dateTime = require("../utils/dateTime");
const get_bounding_box = require("@turf/bbox").default;

const mongodb = require("../mongo/mongodb");
const scheduleUpdateDb = require("../utils/scheduleUpdateDb");
const growingSeason = require("../settings/growingSeason.json");
const isDateInGrowingSeason = require("../utils/isdateingrowingseason");

/**
 * Updates the database with new Sentinel data.
 * @returns {boolean} Indicates whether the update was successful.
 */
const updateDb = async () => {
  // Temporary for testing
  scheduleUpdateDb.stop();
  console.log(
    "Updating data *****************************************************************************"
  );

  let data = await mongodb.getAllDateSets();
  if (data && data.length > 0) {
    console.log(data.length, " --> [0] ", data[0].id);
    let endDate = new Date();
    await getDates(false, data[0].geometry, null, endDate);
  }

  return true;
};

/**
 * Starts the scheduled update of the database.
 */
const startScheduleUpdateDb = async () => {
  await updateDb();
};

/**
 * Retrieves Sentinel dates within a specified time range for a given geometry.
 * @param {Object} geometry - The geometry for which to retrieve Sentinel dates.
 * @param {Date} fromTime - The start time of the date range.
 * @param {Date} toTime - The end time of the date range.
 * @returns {Array<Object>} Array of Sentinel dates.
 */
const getSentinelDates = async (geometry, fromTime, toTime) => {
  let data = [];
  let stats = await statistics.getStatistics(geometry, fromTime, toTime);

  if (stats.length > 0) {
    stats.reverse();
    for (let stat of stats) {
      let statRef = stat.outputs.data.bands.B0.stats;
      let mean = statRef.mean;
      if (mean >= 0.1) {
        data = [
          ...data,
          {
            generationtime: stat.interval.from,
            stats: {
              average: statRef.mean,
              max: statRef.max,
              min: statRef.min,
              std: statRef.stDev,
            },
            sentinelid: stat.interval.from + "_" + hash.sha256(geometry),
          },
        ];
      }
    }
  } else {
    console.log(
      "No data for the geometry **********************************************************************",
      fromTime,
      " - ",
      toTime
    );
  }

  return data;
};

/**
 * Retrieves the image data for a given Sentinel date and geometry.
 * @param {Object} item - The Sentinel date object.
 * @param {Object} geometry - The geometry for which to retrieve the image data.
 * @returns {Object} Image data.
 */
const getImageWithData = async (item, geometry) => {
  let image = await imageRef.getImage(item.generationtime, geometry);

  if (image) {
    let data = await imageDataRef.getImageData(geometry, image, {
      id: item.sentinelid,
      average: item.stats.average,
      max: item.stats.max,
      min: item.stats.min,
      std: item.stats.std,
    });

    return data;
  } else {
    return null;
  }
};

/**
 * Saves Sentinel data to MongoDB.
 * @param {boolean} save - Indicates whether to save the data.
 * @param {Object} geometry - The geometry associated with the data.
 * @param {Date} fromTime - The start time of the date range.
 * @param {Date} toTime - The end time of the date range.
 * @returns {boolean} Indicates whether the saving process was successful.
 */
const saveSentinelDataToMongo = async (save, geometry, fromTime, toTime) => {
  let id = hash.sha256(geometry);
  const area = geoUtils.getAreaFromGeometry(geometry);
  let savedDates = [];
  let res = null;

  try {
    if (save) {
      res = await mongodb.saveDates(id, savedDates, geometry, area);
    }

    let startTime = performance.now();
    let dates = await getSentinelDates(geometry, fromTime, toTime);
    let endTime = performance.now();
    var elapsedTime = endTime - startTime;
    console.log(
      dates.length,
      " STATISTICS ElapsedTime (sec): ",
      elapsedTime / 1000
    );

    if (dates.length > 0) {
      startTime = performance.now();
      const responses = await axios.all(
        dates.map(async (item) => {
          let _data = await getImageWithData(item, geometry);

          if (_data) {
            await mongodb.saveImage(_data);
          }
        })
      );

      endTime = performance.now();
      elapsedTime = endTime - startTime;
      console.log("IMAGES ElapsedTime (sec): ", elapsedTime / 1000);

      savedDates = dateTime.sortByDateTime(dates, "generationtime", "desc");
      res = await mongodb.updateDates(id, savedDates);
      return res;
    }

    return false;
  } catch (e) {
    console.log("XXerror: ", e.message);
    return false;
  }
};

/**
 * Retrieves Sentinel dates and associated data for a given geometry and time range.
 * @param {boolean} returnData - Indicates whether to return the retrieved data.
 * @param {Object} geometry - The geometry for which to retrieve the data.
 * @param {Date} fromTime - The start time of the date range.
 * @param {Date} toTime - The end time of the date range.
 * @returns {Object|null} The retrieved data or null if no data is available.
 */
async function getDates(returnData, geometry, fromTime, toTime) {
  let status = true;
  let id = hash.sha256(geometry);
  let data = await mongodb.getDates(id);

  console.log("data", data);
  if (!data || data.dates.length === 0) {
    console.log("#1");
    status = await saveSentinelDataToMongo(true, geometry, fromTime, toTime);
  } else if (data.dates.length === 0) {
    console.log("#2");
    return null;
  } else {
    console.log("#3", status);
    console.log(
      toTime,
      " isDateInGrowingSeason ",
      isDateInGrowingSeason(toTime, growingSeason)
    );
    if (isDateInGrowingSeason(toTime, growingSeason)) {
      if (data.dates[0].generationtime < dateTime.zeroDateTime(toTime)) {
        let fromTime = new Date(
          dateTime.addOneDay(data.dates[0].generationtime)
        );
        console.log("#4", status);
        status = await saveSentinelDataToMongo(
          false,
          geometry,
          fromTime,
          toTime
        );
      }
    }
  }
  console.log(status, "---", returnData);
  if (returnData) {
    data = await mongodb.getDates(id);
    return data;
  } else {
    return null;
  }
}

let authToken;

/**
 * Retrieves a list of Sentinel data or updates the database.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 */
const list = async (req, res, next) => {
  authToken = req.authToken;
  let startTime = performance.now();
  let updateDb = false;
  try {
    updateDb = req.body.updateDb;
  } catch (e) {
    updateDb = false;
  }
  let geometry = null;
  try {
    if (typeof req.body.geometry !== "object") {
      geometry = JSON.parse(req.body.geometry);
    } else {
      geometry = req.body.geometry;
    }
  } catch (e) {}
  let fromTime = new Date(req.body.start_date);
  let toTime = new Date(req.body.end_date);
  const data = await getDates(true, geometry, fromTime, toTime);
  let endTime = performance.now();
  var elapsedTime = endTime - startTime;
  if (updateDb) {
    res.status(222).send("done");
  } else {
    if (data && !updateDb) {
      res.status(200).send(data);
    } else {
      res.status(404).send("no data available");
    }
  }
};

/**
 * Handles the processing of images for a given geometry and date range.
 * @param {Object} geometry - The geometry for which to process images.
 * @param {Array<Object>} dates - Array of dates for which to process images.
 * @returns {boolean} Indicates whether the processing was successful.
 */
async function handleImages(geometry, dates) {
  for (item of dates) {
    let startTime = performance.now();
    let retryCount = 0;
    try {
      let _data = await getImageWithData(item, geometry);
      if (_data) {
        await mongodb.saveImage(_data);
      } else {
        console.log("##########  IMAGE ERROR");
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`Too Many Requests. Retrying after delay...`);
      } else {
        console.error(error);
        break;
      }
    }
  }
  return true;
}

/**
 * Retrieves Sentinel dates and associated data for multiple geometries.
 * @param {Object} params - Parameters including geometry, start time, and end time.
 */
const doIt = async ({ geometry, fromTime, toTime }) => {
  if (geometry.length > 0) {
    console.log(fromTime);
    let startTime = performance.now();
    let imgCnt = 0;
    let responses = await axios.all(
      geometry.map(async (param) => {
        let data = await getDates(false,param.geometry, fromTime, toTime);
        return data;
      })
    );
    const data = await Promise.all(responses);
    for (item of data) {
      if (item !== undefined) {
        let id = hash.sha256(item.geometry);
        let area = geoUtils.getAreaFromGeometry(item.geometry);
        res = await mongodb.saveDates(id, item.dates, item.geometry, area);
      }
    }
    responses = await axios.all(
      data.map(async (param) => {
        return handleImages(param.geometry, param.dates);
      })
    );
    await Promise.all(responses);
    let endTime = performance.now();
    var elapsedTime = endTime - startTime;
  }
};

let queueParams = [];
let isProcessingQueue = false;

/**
 * Activates the processing of images for a given geometry and date range.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 */
const activate = async (req, res, next) => {
  let startTime = performance.now();
  authToken = req.authToken;
  let geometry = JSON.parse(req.body.geometry);
  let fromTime = new Date(req.body.start_date);
  let toTime = new Date(dateTime.addOneDay(req.body.end_date));

  const processQueue = async () => {
    while (queueParams.length > 0) {
      const params = queueParams.shift();
      console.log("#2  ..................");
      await doIt(params);
    }
    isProcessingQueue = false;
  };

  const addToQueue = async (params) => {
    queueParams.push(params);
    console.log("queue ", queueParams.length);
    if (!isProcessingQueue) {
      isProcessingQueue = true;
      await processQueue();
    }
  };

  const params = {
    geometry,
    fromTime,
    toTime,
  };

  await addToQueue(params);

  if (isProcessingQueue) {
  } else {
    let imgCnt = 0;
  }
  res.status(200).send("ok");
};

/**
 * Retrieves an image by its Sentinel ID.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 */
const image = async (req, res, next) => {
  const id = req.params.sentinelid;
  const epsg = req.query.epsg;
  const all = req.query.all;
  if (all) {
    let data = await mongodb.getAllImages(id);
    try {
      data = data.map((item) => {
        const plainObject = item.toObject({ getters: true, virtuals: false });
        const updatedImage = {
          ...plainObject.image,
          dataUrl: `data:image/png;base64,${Buffer.from(
            plainObject.image.dataUrl.buffer
          ).toString("base64")}`,
        };
        return {
          ...plainObject,
          image: updatedImage,
        };
      });
      return res.status(200).send(data);
    } catch (e) {
      console.log(e.message);
    }
  }

  let _data = await mongodb.getImage(id);

  if (_data) {
    const data = JSON.parse(JSON.stringify(_data));
    const dataUrl = `data:image/png;base64,${Buffer.from(
      data.image.dataUrl
    ).toString("base64")}`;

    if (epsg) {
      let bbox = [
        data.image.minX,
        data.image.minY,
        data.image.maxX,
        data.image.maxY,
      ];
      const newGeo = await convertBboxEPSG.convertBboxEPSG(
        bbox,
        "EPSG:4326",
        `EPSG:${epsg}`
      );
      data.image.minX = newGeo[0];
      data.image.minY = newGeo[1];
      data.image.maxX = newGeo[2];
      data.image.maxY = newGeo[3];
    }

    data.image.dataUrl = dataUrl;

    try {
      res.status(200).send(data);
    } catch (e) {
      console.log(e.message);
    }
  } else {
    console.log("there is no image");
    res.status(404).send("Not found");
  }
};

/**
 * Retrieves weather data based on a specified topic, geometry, and time range.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 */
const weather = async (req, res, next) => {
  function getCenterPoint(bbox) {
    const centerX = (bbox[0] + bbox[2]) / 2;
    const centerY = (bbox[1] + bbox[3]) / 2;
    return [centerY, centerX];
  }

  function getTimeStamp(dateString) {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000);
  }

  let topic = req.body.topic;

  try {
    if (typeof req.body.geometry !== "object") {
      geometry = JSON.parse(req.body.geometry);
    } else {
      geometry = req.body.geometry;
    }
  } catch (e) {
    console.log("ERRORxxxxxxxxxxxxx ", e.message);
  }

  let startDate = null;
  let endDate = null;

  if (topic !== "current") {
    let fromTime = new Date(req.body.startDate);
    let toTime = new Date(req.body.endDate);
    startDate = getTimeStamp(fromTime);
    endDate = getTimeStamp(toTime);
  }

  const API_KEY = process.env.OPW_API_KEY;

  let bbox = get_bounding_box(geometry);
  let coords = getCenterPoint(bbox);
  let lat = coords[0];
  let lon = coords[1];

  console.log("lat: ", lat);
  let url = null;
  if (topic === "current") {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  } else {
    url = `https://history.openweathermap.org/data/2.5/history/${topic}?lat=${lat}&lon=${lon}&start=${startDate}&end=${endDate}&appid=${API_KEY}`;
  }

  console.log(url);

  let _res;
  try {
    _res = await axios.get(url);
    if (topic === "current") {
      _res = _res.data;
    } else {
      _res = _res.data.list;
    }
    res.status(200).send(_res);
  } catch (e) {
    console.log(e.message);
  }
};

/**
 * Retrieves the Areas of Interest (AOIs) from the database.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 */
const AOIs = async (req, res, next) => {
  const data = await mongodb.getBlocks();
  res.status(200).send(data);
};


module.exports = {
  list,
  activate,
  image,
  weather,
  AOIs,
};
