const mongoose = require("mongoose");

const propertySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    property_image: {
        type: String
    },
    property_price: {
        type: Number,
        required: true
    },
    property_type: {
        type: String,
        required: true
    },
    property_bedroom: {
        type: String,
        required: true
    },
    property_for: {
        type: String,
        required: true
    },
    property_area: {
        type: String,
        required: true
    },
    property_details: {
        type: String,
        required: true
    },
    property_contact: {
        type: Number,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

const Property = mongoose.model("Property", propertySchema);
module.exports = { Property };