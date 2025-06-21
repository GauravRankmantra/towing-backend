// backend/models/ZipCodeEntry.js

const mongoose = require("mongoose");

const zipCodeEntrySchema = new mongoose.Schema(
  {
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    cityName: {
      type: String,
      required: true,
      trim: true
    },
    mapLink: {
      type: String
    },
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ZipCodeEntry', zipCodeEntrySchema);