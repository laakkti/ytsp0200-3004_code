const express = require('express');
const devControllers = require('../controllers/dev-controllers');

const router = express.Router();

router.get('/deleteByGeometry', devControllers.deleteByGeometry);
router.get('/deleteLastDate', devControllers.deleteLastDate);
router.get('/getNDVIDates', devControllers.getNDVIDates);
router.get('/blocks', devControllers.blocks);
router.get('/aiostomongo', devControllers.aiosToMongo);
router.get('/getBlocks', devControllers.getBlocks);
router.get('/updateBlocksNDVIStatus', devControllers.updateBlocksNDVIStatus);
router.post('/setWorkareaNDVIStatus', devControllers.setWorkareaNDVIStatus);
router.get('/setAllBlockNDVIStatus', devControllers.setAllBlockNDVIStatus);
router.get('/dropImagesAndDates', devControllers.dropImagesAndDates);
//router.get('/companyIdStatus', devControllers.companyIdStatus);
router.get('/getUser', devControllers.getUser);
//router.get('/getAllUsers', devControllers.getAllUsers);
router.get('/getAllUsers', devControllers.setActiveAOI);


//router.get('/updateDatabase', devControllers.updateDatabase);

//router.get('/dropDates', devControllers.dropDates);
//router.get('/dropImages', devControllers.dropImages);


module.exports = router;