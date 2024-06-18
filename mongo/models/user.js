const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: {
    type: String,
    unique: true
  },
  passwordHash: String,
  admin: Boolean
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)