const express = require('express')
const colors = require ('colors')
const dotenv = require('dotenv').config()
const connectDB = require('./config/db')
const {errorHandler} = require('./middleware/errorMiddleware')
const cors = require('cors')

const port = process.env.PORT || 3000

connectDB()

const app = express ()

app.use(cors())

app.use(express.json()) //mandar datos de java script
app.use(express.urlencoded({extendend:false})) 


app.use('/api/tareas', require('./routes/tareasRoutes')) //ruta tareas
app.use('/api/users', require('./routes/usersRoutes'))

app.use(errorHandler)

app.listen(port, ()=> console.log(`Servidor Iniciado en ${port}`))
