const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/Blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const api = supertest(app)

const initialBlogs = [
    {
        _id: '5a422a851b54a676234d17f7',
        title: 'React patterns',
        author: 'Michael Chan',
        url: 'https://reactpatterns.com/',
        likes: 7,
        __v: 0
    },
    {
        _id: '5a422aa71b54a676234d17f8',
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
        likes: 5,
        __v: 0
    }
]

beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', password: passwordHash })
    const userId = await user.save()

    await Blog.deleteMany({})
    let noteObject = new Blog({ ...initialBlogs[0], user: userId._id })
    await noteObject.save()
    noteObject = new Blog({ ...initialBlogs[1], user: userId._id })
    await noteObject.save()
}, 10000)

describe('when there is initially some blogs saved', () => {

    test('successfully authentication', async () => {
        const response = await api
            .post('/api/login')
            .send({ username: 'root', password: 'sekret' })
            .expect(200)
        expect(response.body.token).toBeDefined()
    })

    test('blogs are returned as json', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
        expect(response.body).toHaveLength(2)
    })

    describe('adding a blog', () => {
        test('the unique identifier property of the blog posts is named id', async () => {
            const response = await api
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)
            expect(response.body[0].id).toBeDefined()
        })

        test('fails creates a new blog post if no token is passed', async () => {
            const newBlog = {
                title: 'blog will not be created',
                author: '',
                url: '',
                likes: 0
            }

            const response = await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(401)
                .expect('Content-Type', /application\/json/)

            expect(response.body.error).toEqual('token missing or invalid')
        })

        test('successfully creates a new blog post', async () => {
            let auth = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)

            const newBlog = {
                title: 'Canonical string reduction',
                author: 'Edsger W. Dijkstra',
                url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
                likes: 12
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .set('Authorization', `bearer ${auth.body.token}`)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const response = await api
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)
            expect(response.body).toHaveLength(initialBlogs.length + 1)

            const contents = response.body.map(n => n.title)
            expect(contents).toContain(
                'Canonical string reduction'
            )
        })

        test('if the likes property is missing from the request, it will default to 0', async () => {
            let auth = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)
            const newBlog = {
                title: 'First class tests',
                author: 'Robert C. Martin',
                url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
            }

            const response = await api
                .post('/api/blogs')
                .send(newBlog)
                .set('Authorization', `bearer ${auth.body.token}`)
                .expect(201)
                .expect('Content-Type', /application\/json/)
            expect(response.body.likes).toBe(0)

        })

        test('if the title property is missing, it will return 400', async () => {
            let auth = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)
            const newBlogWithoutTitle = {
                author: 'TEST MISSING TITLE',
                url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
            }

            await api
                .post('/api/blogs')
                .send(newBlogWithoutTitle)
                .set('Authorization', `bearer ${auth.body.token}`)
                .expect(400)

        })

        test('if the url property is missing, it will return 400', async () => {
            let auth = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)
            const newBlogWithoutUrl = {
                author: 'TEST MISSING URL',
                title: 'Test title',
            }

            await api
                .post('/api/blogs')
                .send(newBlogWithoutUrl)
                .set('Authorization', `bearer ${auth.body.token}`)
                .expect(400)

        })
    })
    describe('deleting of blog', function () {
        const blogToDelete = new Blog(initialBlogs[0])
        test('succeeds with status code 204 if id is valid', async () => {
            let auth = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)
            await api
                .delete(`/api/blogs/${blogToDelete._id}`)
                .set('Authorization', `bearer ${auth.body.token}`)
                .expect(204)
            const response = await api
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)
            expect(response.body).toHaveLength(initialBlogs.length - 1)
        })
    })
    describe('updating a blog', function () {
        test('succeeds with status code 204 if id is valid', async () => {
            const initialBlog = new Blog(initialBlogs[0])
            let auth = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)
            const likes = 20
            const updated = await api.put(`/api/blogs/${initialBlog._id}`)
                .send({ likes: likes })
                .set('Authorization', `bearer ${auth.body.token}`)
                .expect(200)

            expect(updated.body.likes).toBe(likes)
        })
    })
})
afterAll(() => {
    mongoose.connection.close()
})