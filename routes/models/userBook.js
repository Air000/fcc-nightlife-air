var mongoose = require('mongoose');

var bookingSchema = mongoose.Schema({
    userName:   String,
    bookingList:    [String]
});

module.exports = mongoose.model('Booking', bookingSchema);