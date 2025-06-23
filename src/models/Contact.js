const mongoose = require('mongoose');

// Define the schema for the Contact Us entries
const contactSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'], 
      trim: true, 
    },
    email: {
      type: String,
      required: [true, 'Please add an email'], 
      unique: false, 
      trim: true,
      lowercase: true, 
      
    },
    phone: {
      type: String,
    
      trim: true,
    
      default: null, 
    },
    message: {
      type: String,
      required: [true, 'Please add a message'], // Message is required
      trim: true,
      maxlength: [1000, 'Message cannot be more than 1000 characters'],
    },
    zip: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null, 
    },
 
    status: {
      type: String,
      enum: ['new', 'read', 'archived'], // Define allowed statuses
      default: 'new', // New entries are 'new' by default
    }
  },
  {
    timestamps: true, 
  }
);

// Create and export the Contact model
module.exports = mongoose.model('Contact', contactSchema);
