const bcrypt = require('bcrypt')
const User = require('../models/user')
const supertest = require('supertest')
const app = require('../app')
const mongoose = require('mongoose')

const api = supertest(app)

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const newUser = {
            username: 'mstitane',
            name: 'Mohammed STITANE',
            password: 'MST@123',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const res = await api
            .get('/api/users')
            .expect(200)
            .expect('Content-Type', /application\/json/)
        expect(res.body).toHaveLength(2)

        const usernames = res.body.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })
    test('creation fails without username', async () => {
        const newUser = {
            name: 'test name',
            password: '123',
        }

        const error = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)

        expect(error.body.name).toEqual('ValidationError')
        expect(error.body.message).toContain('Path `username` is required.')
    })

    test('creation fails without less chars in password ', async () => {
        const newUser = {
            username: 'test1',
            name: 'test name',
            password: '12',
        }

        const error = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        expect(error.body.error).toEqual('INVALID_PASSWORD')
    })
})

afterAll(() => {
    mongoose.connection.close()
})