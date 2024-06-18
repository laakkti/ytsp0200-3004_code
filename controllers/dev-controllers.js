const { geometry } = require("@turf/turf");
const hash = require("../utils/hash");
const mongodb = require("../mongo/mongodb");
//const postgre = require("../postgre/postgre");


/*
const mongoose = require("mongoose");
const mongoURI = process.env.mongoURI;

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected!");
  })
  .catch((err) => {
    console.error("Error while connecting to db: ", err);
  });
*/


const blocks = async (req, res, next) => {
  //const data= require("../data/peruslohkot.json");
  const data = require("../data/workareas.json");

  try {
    res.status(200).send(data);
  } catch (e) {
    console.log(e.message);
    res.status(404).send(e.message);
  }
};

const getBlocks = async (req, res, next) => {
  const data = await mongodb.getBlocks();
  res.status(200).send(data);
};


const setWorkareaNDVIStatus = async (req, res, next) => {
  console.log("setWorkareaNDVIStatus called ",typeof req.body.geometry);

  /*
  try{
  let geometry=null;
  if(typeof req.body.geometry!=="object"){
     geometry = JSON.parse(req.body.geometry);
  }else{
    geometry = req.body.geometry;
  }
}catch(e){
   console.log(e.message);
}*/

  let _geometry = req.body.geometry;

  let status = JSON.parse(req.body.status);

  //console.log("xxxxxxxxxxxxxx geometry");
  //console.log(_geometry);
  let id = hash.sha256(_geometry);
  
  const ret = await mongodb.setBlockNDVIStatus(id, status);
  res.status(200).send(ret);
};

const setAllBlockNDVIStatus = async (req, res, next) => {
  let status = JSON.parse(req.query.status);
  const ret = await mongodb.setAllBlockNDVIStatus(status);
  res.status(200).send(ret);
};

//???
const updateBlocksNDVIStatus = async (req, res, next) => {
  const data = await mongodb.getBlocksNotNDVI();

  let startTime = performance.now();
  for (let item of data) {
    //console.log(performance.now());
    let id = hash.sha256(item.geometry);
    let ndvi = await mongodb.getDates(id);
    if (ndvi !== null) {
      console.log("ööööööööööööööööööööööö: ", ndvi.area);
      await mongodb.setBlockNDVIStatus(id, true);
    }
  }

  let endTime = performance.now();
  var elapsedTime = endTime - startTime;
  console.log("ElapsedTime (sec): ", elapsedTime / 1000);

  res.status(200).send(data);
};

const aiosToMongo = async (req, res, next) => {

    console.log("Blocks to Mongo");
    //return res.status(200).send(true);;

  try {
    const data = require("../data/workareas.json");

    for (let item of data) {
      
      let id = hash.sha256(item.geometry);
      item.id = id; //mihin tarvitaan id kun se on grometriasta tehty TURHA ei ole käytössä!!!!!
      await mongodb.saveBlock(item);
    }

    res.status(200).send(true);
  } catch (e) {
    console.log(e.message);
    res.status(404).send(e.message);
  }
};

const getNDVIDates = async (req, res, next) => {
  let geometry = JSON.parse(req.query.geometry);
  let id = hash.sha256(geometry);

  let data = await mongodb.getDates(id);

  if (data) {
    //    console.log("NDVIDates");
    res.status(200).send(data.dates);
  } else {
    res.status(404).send("There is not data for the geometry");
  }
};

const deleteLastDate = async (req, res, next) => {
  let geometry = JSON.parse(req.query.geometry);

  let id = hash.sha256(geometry);

  try {
    //const data = await mongodb.getDates(id);
    let data = await postgre.getDates(id);

    console.log("before", data.dates[0]);
    console.log("before", data.dates[0].sentinelid);

    //if (await mongodb.deleteImage(data.dates[0].sentinelid)) {
    if (await postgre.deleteImage(data.dates[0].sentinelid)) {
      data.dates.shift();
      console.log("after", data.dates[0]);
      console.log("after", data.dates[0].sentinelid);

      ///////////////////////
      //await mongodb.updateDates(id, data.dates);
      await postgre.updateDates({ id: id, dates: data.dates });
      res.status(200).send(true);
    } else {
      res.status(404).send(false);
    }
  } catch (e) {
    console.log(e.message);
    res.status(400).send(e.message);
  }
};

const dropImagesAndDates = async (req, res, next) => {
  try {
    const imagesDropped = await mongodb.dropImages();
    console.log("Dropped images: ", imagesDropped);
    const datesDropped = await mongodb.dropDates();
    console.log("Dropped dates: ", datesDropped);
    if (imagesDropped && datesDropped) {
      res.status(204).send(true);
    } else {
      res.status(500).send("Failed to drop images and dates.");
    }
  } catch (e) {
    res.status(500).send(e.message);
  }
};


const deleteByGeometry = async (req, res, next) => {
  let geometry = JSON.parse(req.query.geometry);

  let id = hash.sha256(geometry);

  try {
    const dates = await mongodb.getDates(id);
    console.log("dates len :", dates.dates.length);
    console.log("dates :", dates.dates);

    for (let date of dates.dates) {
      //console.log("=================================>", date.sentinelid);
      await mongodb.deleteImage(date.sentinelid);
    }

    await mongodb.deleteDates(id);

    //-----------------------------------
    // tsekataan vielä löytyykö mongosta
    for (let date of dates.dates) {
      let _data = await mongodb.getImage(date.sentinelid);

      if (_data !== null) {
        console.log(date.sentinelid, "not deleted succesfully");
      } else {
        console.log(date.sentinelid, "not found any more");
      }
    }
    //-----------------------------------

    res.status(200).send(true);
  } catch (error) {
    console.log(error.message);
    res.send(false);
  }
};


//***********************************************************************
const getUser = async (req, res, next) => {
  //***********************************************************************

  let companyId = null;

  if (typeof req.query.companyId !== "undefined") {
    companyId = req.query.companyId;
  } else {
    res.status(404).send("companyId is missing...");
  }

  console.log("companyId=" + companyId);


  let response = await postgre.getUser(companyId);

  console.log("typeof response: ", typeof response);


  res.status(200).send(response);


};

const getAllUsers = async (req, res, next) => {
  //***********************************************************************

  let columns = [];

  if (typeof req.query.columns !== "undefined") {
    columns = req.query.columns;
  } else {
    res.status(404).send("companyId is missing...");
  }

  let response = await postgre.getAllUsers(columns);

  

  
  res.status(200).send(response);

  //}
};


const setActiveAOI = async (req, res, next) => {
  //***********************************************************************


  let columns = ['companyid','geometry'];
  
/*
  if (typeof req.query.columns !== "undefined") {
    columns = req.query.columns;
  } else {
    res.status(404).send("companyId is missing...");
  }
*/
  
  let response = await postgre.getAllUsers(columns);

  for (let item of response) {
    //let id = hash.sha256(item.geometry);
    //item.id = id; //mihin tarvitaan id kun se on grometriasta tehty TURHA ei ole käytössä!!!!!
    //console.log(item);
    for(let geometry of item.geometry) {      
      await mongodb.saveActiveAOI({companyId:item.companyid,geometry:JSON.stringify(geometry)});
    }
    //console.log("##### ",item);
  }


  
  res.status(200).send(response);

  //}
};

module.exports = {
  blocks,
  deleteByGeometry,
  deleteLastDate,
  getNDVIDates,
  aiosToMongo,
  getBlocks,
  updateBlocksNDVIStatus,
  setWorkareaNDVIStatus,
  setAllBlockNDVIStatus,
  dropImagesAndDates,
  getUser,
  setActiveAOI,
  //updateDatabase
//  getAllUsers,

  //  dropDates,
  //  dropImages
};
