const imageModel = require("./models/image");
const datesModel = require("./models/dates");
const userModel = require("./models/user");

const mongoose = require("mongoose");
const mongoURI = process.env.mongoURI;

// Separate development methods into their own file!!!!

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("DB Connected!");
    })
    .catch((err) => {
      console.error("Error while connecting to db: ", err);
    });
}

/**
 * Registers a new user.
 * @param {string} firstname - The user's first name.
 * @param {string} lastname - The user's last name.
 * @param {string} email - The user's email.
 * @param {string} passwordHash - The hashed password.
 * @param {boolean} admin - Whether the user is an admin.
 */
const register = async (firstname, lastname, email, passwordHash, admin) => {
  const user = new userModel({
    firstname,
    lastname,
    email,
    passwordHash,
    admin,
  });

  await user.save();
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @returns {Object|null} - The user object if found, otherwise null.
 */
const login = async (email) => {
  return await userModel.findOne({ email: email });
};

//#checked
/**
 * Saves dates data.
 * @param {string} id - The ID.
 * @param {Array} data - The dates data.
 * @param {Object} geometry - The geometry.
 * @param {number} area - The area.
 * @returns {boolean} - Whether the operation was successful.
 */
const saveDates = async (id, data, geometry, area) => {
  try {
    const item = await datesModel.findOne({ id });

    if (!item) {
      const dates = new datesModel({
        id,
        dates: data,
        geometry: geometry,
        area,
      });

      await dates.save();
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Error saving dates:", err.message);
    return false;
  }
};

/**
 * Inserts multiple dates into the database.
 * @param {Array} dataArray - The array of data objects.
 * @returns {boolean} - Whether the operation was successful.
 */
const insertManyDates = async (dataArray) => {
  try {
    // Extracting unique ids from the dataArray
    const ids = dataArray.map((item) => item.id);

    // Find existing items with the provided ids
    const existingItems = await datesModel.find({ id: { $in: ids } });

    // Filtering the dataArray to include only items that do not exist in the database
    const newDataArray = dataArray.filter(
      (item) =>
        !existingItems.some((existingItem) => existingItem.id === item.id)
    );

    if (newDataArray.length > 0) {
      // Using insertMany to insert multiple documents at once
      const result = await datesModel.insertMany(newDataArray);

      console.log(`${result.insertedCount} documents inserted`);
      return true;
    } else {
      console.log("No new documents to insert");
      return false;
    }
  } catch (err) {
    console.error("Error saving dates:", err.message);
    return false;
  }
};

//#checked
/**
 * Updates dates data.
 * @param {string} id - The ID.
 * @param {Array} newItem - The new item to add.
 * @returns {boolean} - Whether the operation was successful.
 */
const updateDates = async (id, newItem) => {
  try {
    const ret = await datesModel.findOneAndUpdate(
      { id: id },
      { $push: { dates: { $each: newItem, $position: 0 } } },
      { new: true }
    );
    return true;
  } catch (err) {
    console.log("ERROR", err);
    return false;
  }
};

//#checked
/**
 * Deletes dates data.
 * @param {string} id - The ID.
 * @returns {boolean} - Whether the operation was successful.
 */
const deleteDates = async (id) => {
  try {
    await datesModel.findOneAndDelete({ id: id });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

//#checked
/**
 * Retrieves dates data by ID.
 * @param {string} id - The ID.
 * @returns {Object|null} - The dates data object if found, otherwise null.
 */
const getDates = async (id) => {
  return await datesModel.findOne({ id: id }, { _id: 0, geometry: 0, __v: 0 });
};

/**
 * Retrieves all date sets.
 * @returns {Array} - The array of date sets.
 */
const getAllDateSets = async () => {
  return await datesModel.find({}, { _id: 0, __v: 0 });
};

//#checked
/**
 * Saves user data.
 * @param {string} data - The user data.
 * @returns {boolean} - Whether the operation was successful.
 */
const saveUser = async (data) => {
  try {
    const res = await userModel.findOne({ companyId: data });

    if (!res) {
      let user = new userModel();
      user.set({ companyId: data });

      try {
        await user.save();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

//#checked
/**
 * Updates user data.
 * @param {string} companyId - The company ID.
 * @param {Array} data - The new data.
 * @returns {boolean} - Whether the operation was successful.
 */
const updateUser = async (companyId, ...data) => {
  try {
    let _data = data[0];
    const res = await userModel.findOneAndUpdate(
      { companyId: companyId },
      _data,
      { new: true }
    );

    return ret;
  } catch (err) {
    console.log("ERROR", err);
    return false;
  }
};

/**
 * Retrieves user status.
 * @param {string} companyId - The company ID.
 * @returns {Object|boolean} - The user object if found, otherwise false.
 */
const userStatus = async (companyId) => {
  try {
    const res = await userModel.findOne({ companyId: companyId });

    if (res) {
      return res;
    } else {
      return false;
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

//#checked
/**
 * Saves image data.
 * @param {Object} data - The image data.
 * @returns {boolean} - Whether the operation was successful.
 */
const saveImage = async (data) => {
  try {
    const res = await imageModel.findOne({ id: data.id });

    if (!res) {
      let image = new imageModel();
      image.set(data);

      try {
        await image.save();
        return true;
      } catch (error) {
        console.error("Image Save Error:", error);
        return false;
      }
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

//#checked
/**
 * Retrieves image data by ID.
 * @param {string} id - The ID.
 * @returns {Object|null} - The image data object if found, otherwise null.
 */
const getImage = async (id) => {
  try {
    return await imageModel.findOne({ id: id }, { _id: 0, __v: 0 });
  } catch (e) {
    console.error(e.message);
  }
};

/**
 * Retrieves all images that match the search string.
 * @param {string} search - The search string.
 * @returns {Array} - The array of matching image data objects.
 */
const getAllImages = async (search) => {
  try {
    return await imageModel.find(
      { id: { $regex: search, $options: "i" } },
      { _id: 0, __v: 0 }
    );
  } catch (e) {
    console.error(e.message);
  }
};

/**
 * Deletes an image by ID.
 * @param {string} id - The ID.
 * @returns {boolean} - Whether the operation was successful.
 */
const deleteImage = async (id) => {
  try {
    return await imageModel.findOneAndDelete({ id: id });
  } catch (err) {
    console.error("xxxx ", err);
    return false;
  }
};

// frontin käyttämiä voisivat olla omassa tiedostossa kaikki!!!
//////////////////////////////////////////////////////////////////////////////

//------------------------------------------------------------------
const blockModel = require("./models/workarea");
const { geometry } = require("@turf/turf");

// turha koska drop versiot
/**
 * Clears all collections in the database.
 */
const doEmptyDb = () => {
  let ret = datesModel.deleteMany({});
  console.log("datesmModel deleted ", ret);
  ret = imageModel.deleteMany({});
  console.log("imageModel deleted ", ret);
  ret = userModel.deleteMany({});
  console.log("userModel deleted ", ret);
};

/**
 * Saves block data.
 * @param {Object} data - The block data.
 * @returns {boolean} - Whether the operation was successful.
 */
const saveBlock = async (data) => {
  try {
    const res = await blockModel.findOne({
      id: data.id,
      backofficeid: data.backoffice,
    });

    if (!res) {
      let block = new blockModel();
      block.set(data);

      try {
        await block.save();
        console.log("block saved");
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    } else {
      return null;
    }
  } catch (err) {
    console.log("ERROR ", err);
  }
};

/**
 * Retrieves all block data.
 * @returns {Array} - The array of block data objects.
 */
const getBlocks = async () => {
  try {
    return await blockModel.find({});
  } catch (err) {
    console.log("ERROR ", err);
  }
};

/**
 * Retrieves all block data that are not marked as NDVI.
 * @returns {Array} - The array of block data objects.
 */
const getBlocksNotNDVI = async () => {
  try {
    return await blockModel.find({ ndvi: false });
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Sets the NDVI status of all block data.
 * @param {boolean} status - The NDVI status to set.
 * @returns {boolean} - Whether the operation was successful.
 */
const setAllBlockNDVIStatus = async (status) => {
  try {
    await blockModel.updateMany({}, { $set: { ndvi: status } });
    return true;
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Sets the NDVI status of a block by ID.
 * @param {string} id - The block ID.
 * @param {boolean} status - The NDVI status to set.
 * @returns {boolean} - Whether the operation was successful.
 */
const setBlockNDVIStatus = async (id, status) => {
  try {
    const res = await blockModel.findOne({ id: id });

    if (!res) {
      return false;
    } else {
      await blockModel.updateOne({ id: id }, { $set: { ndvi: status } });
      return true;
    }
  } catch (err) {
    console.log("ERROR ", err);
    return false;
  }
};

/**
 * Drops the dates collection.
 * @returns {boolean} - Whether the operation was successful.
 */
const dropDates = async () => {
  try {
    const ret = await datesModel.collection.drop();

    if (ret) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e.message);
    return false;
  }
};

/**
 * Drops the images collection.
 * @returns {boolean} - Whether the operation was successful.
 */
const dropImages = async () => {
  try {
    const ret = await imageModel.collection.drop();

    if (ret) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e.message);
    return false;
  }
};

// seuraavat turhia POISTA
/**
 * Retrieves all data for a specific user.
 * @param {string} user - The user name.
 * @returns {Array} - The array of data objects.
 */
const getAllData = (user) => {
  return imageModel.find({ name: user }, { date: 1, average: 1, _id: 0 });
};

/**
 * Checks if data exists for a specific user and date.
 * @param {string} user - The user name.
 * @param {string} date - The date.
 * @returns {Object|null} - The data object if found, otherwise null.
 */
const ifExists = async (user, date) => {
  return await imageModel.findOne({ name: user, date: new Date(date) });
};

// dev-jutut omaan tiedostoonsa ja käytössä vain dev-routessa dev-controllers
module.exports = {
  register,
  login,
  saveUser,
  userStatus,
  updateUser,
  saveImage,
  getImage,
  getAllImages,
  deleteImage,
  saveDates,
  insertManyDates,
  updateDates,
  deleteDates,
  getDates,
  getAllDateSets,
  doEmptyDb,
  getAllData,
  ifExists,
  saveBlock,
  getBlocks,
  getBlocksNotNDVI,
  setBlockNDVIStatus,
  setAllBlockNDVIStatus,
  dropDates,
  dropImages,
};
