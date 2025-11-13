const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    nombre:{
        type: String,
        required: [true, 'Por favor teclea tu nombre: ']
    },
    email:{
        type: String,
        required: [true, 'Por favor teclea tu enail: ']
    },
    password:{
        type: String,
        required: [true, 'Por favor teclea tu password: ']
    },
    esAdmin: {
        type: Boolean,
        default: false
    }
    

    

},{
    timestapms: true
})

module.exports = mongoose.model('User', userSchema)