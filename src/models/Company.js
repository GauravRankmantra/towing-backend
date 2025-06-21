const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    website: {
      type: String
    },
    location: {
      type: String
    },
    exactAddress: {
      type: String
    },
    distance: {
      type: String
    },
    operatingHours: {
      type: String
    },
    mapLink: {
      type: String
    },
    services: [
      {
        type: String
      }
    ],
    images: [
      {
        type: String // Array of image URLs
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);
