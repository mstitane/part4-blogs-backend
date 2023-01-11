const dummy = (blogs) => {
    return 1
}
const totalLikes = (blogs) => {
    return blogs.reduce((previousValue, currentValue) => previousValue + currentValue.likes, 0)
}

const favoriteBlog = (blogs) => {
    const max = Math.max(...blogs.map(b => b.likes))
    const { title, author, likes } = blogs.find(blog => blog.likes === max)
    return { title, author, likes }
}

const mostBlogs = (blogs) => {
    const mostBloggers = {}
    blogs.forEach((obj) => {
        const key = obj.author
        if (!mostBloggers[key]) {
            mostBloggers[key] = {
                ...obj,
                blogs: 1,
            }
        } else {
            mostBloggers[key].blogs = mostBloggers[key].blogs + 1
        }
    })
    let max = 0
    const result = Object.keys(mostBloggers).map(key => {
        const { author, blogs } = mostBloggers[key]
        max = max < blogs ? blogs : max
        return { author, blogs }
    })
    return result.find(a => a.blogs === max)
}

const mostLikes = (blogs) => {
    const mostLikes = {}
    blogs.forEach((obj) => {
        const author = obj.author
        if (!mostLikes[author]) {
            mostLikes[author] = {
                author,
                likes: obj.likes,
            }
        } else {
            mostLikes[author].likes = mostLikes[author].likes + obj.likes
        }
    })
    let max = 0
    const result = Object.keys(mostLikes).map(key => {
        const { author, likes } = mostLikes[key]
        max = max < likes ? likes : max
        return { author, likes }
    })
    return result.find(a => a.likes === max)
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}