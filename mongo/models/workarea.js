var mongoose = require("mongoose");

var workareaSchema = new mongoose.Schema({
  
  id: {
    type: String,
    required: true,
    unique: true,
  },
  workareaid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: false,
  },
  backofficeid: {
    type: String,
    required: true,
    unique: false,
  },  
  geometry: {
    type: Object,
    required: true,
    unique: true,
  },
  ndvi: {
    type: Boolean,
    default: false,
  }
});

module.exports = new mongoose.model("Workarea", workareaSchema);
