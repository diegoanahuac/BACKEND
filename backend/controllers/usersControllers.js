const jwt = require ('jsonwebtoken')
const bcrypt = require ('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/usersModel')

const login = asyncHandler(async(req,res) => {
    const {email, password} = req.body
    //verificamos que el usuario exista
    const user = await User.findOne({email})

    ///Si el Usuario existe verifico el hash
    if(user &&(await bcrypt.compare(password, user.password))){
        res.status(200).json({
            _id: user.id,
            nombre: user.nombre,
            email: user.email,
            token: generarToken(user.id)
        })
    }

})

const register = asyncHandler(async(req,res) => {
    const {nombre, email, password} = req.body
    if (!nombre || !email || !password){
        res.status(400)
        throw new Error('Faltan datos')
    }
    const userExists = await User.findOne({email})
    if (userExists){
        res.status(400)
        throw new Error('Ese usuario ya no existe')
    } else{
        //hash password
        const salt = await bcrypt.genSalt(10)
        const passwordHashed = await bcrypt.hash(password, salt)

        //crear usuario
        const user = await User.create({
            nombre,
            email,
            password: passwordHashed

        })

        //Si usuario se creo correctamente; lo muestro
        if(user){
            res.status(201).json({
                _id: user.id,
                nombre: user.nombre,
                email: user.email,
                password: user.password
            })
            
        }else{
            res.status(400)
            throw new Error ('No se pudieron guardar los datos')
        }
    }

})

const data = asyncHandler(async(req,res) => {
    res.status(200).json(req.user)
})

const generarToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

module.exports = {
    login, register, data
}