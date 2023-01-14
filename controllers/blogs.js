const blogRouter = require('express').Router()

const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogRouter.get('', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogRouter.post('', async (request, response) => {
    const body = request.body
    let decodedToken
    try {
        decodedToken = jwt.verify(request.token, process.env.SECRET)
    } catch (ex) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }
    const user = await User.findById(decodedToken.id)

    const userId = user ? user._id : undefined

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: userId
    })
    if (blog.title === undefined || blog.url === undefined)
        response.status(400).end()
    else {
        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()
        response.status(201).json(savedBlog)
    }
})

blogRouter.delete('/:id', async (request, response) => {
    let decodedToken
    try {
        decodedToken = jwt.verify(request.token, process.env.SECRET)
    } catch (ex) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }
    const blog = await Blog.findById(request.params.id)

    if (!blog.user.equals(decodedToken.id))
        return response.status(401).json({ error: 'You can delete only your own blogs' })

    await Blog.deleteOne(blog._id)
    response.status(204).end()
})

blogRouter.put('/:id', async (request, response) => {
    const body = request.body

    const blog = {
        likes: body.likes,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.status(200).json(updatedBlog)
})

module.exports = blogRouter