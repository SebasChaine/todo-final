const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  }
}, {
  timestamps: true // Esto añadirá automáticamente createdAt y updatedAt
});

const User = mongoose.model('User', userSchema);
module.exports = User;