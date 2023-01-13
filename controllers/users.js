const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body

    if (!password || password.length < 3) {
        response.status(400).send({
            error: 'INVALID_PASSWORD',
            message: 'password not resent or must be at least 3 chars'
        })
        return
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        password: passwordHash,
    })

    try {
        const savedUser = await user.save()
        response.status(201).json(savedUser)
    } catch (ex) {
        response.status(400).send(ex)
    }

})

usersRouter.get('', async (request, response) => {
    const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 })
    response.json(users)
})

module.exports = usersRouter