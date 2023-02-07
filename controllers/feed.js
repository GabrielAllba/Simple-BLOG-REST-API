const { validationResult } = require("express-validator/check");
const fs = require('fs')
const path = require("path");

const Post = require("../models/post");
const User = require('../models/user')

const isAuth = require('../middleware/is-auth')

exports.getPosts = async (req, res, next) => {

  const currentPage = req.query.page || 1
  const perPage = 2
  let totalItems

  try{
    const count = await Post.find().countDocuments()
    const posts = await Post.find().skip((currentPage - 1)*perPage).limit(perPage)
    
    res.status(200).json({
      message: "Successfully get",
      posts: posts, totalItems: count
    });
  }catch(err){
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
  };

    
  
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect asfasdfasf.");
    error.statusCode = 422;
    error.data = errors.array()
    throw error;
  }

  if(!req.file){
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }

  const title = req.body.title;
  const content = req.body.content;
  const name = req.body.name;
  const tempImageUrl = req.file.path.replace("\\", "/");
  const imageUrl = tempImageUrl
  let creator 

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  
  
  post.save().then((result) => {
      return User.findById(req.userId)
    })
    .then(user => {
      creator = user
      user.posts.push(post)
      return user.save()
    })
    .then(result => {
      res.status(201).json({
        message: "Post created successfully!",
        post: post,
        creator : {
          _id: creator._id,
          name: creator.name
        }
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      
      next(err);
    });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId
    Post.findById(postId).then(post => {
        if(!post){
            const error = new Error('Could not find post.')
            error.statusCode = 404;
            throw error
        }else{
            res.status(200).json({
                message: 'Post fetched successfully',
                post: post
            })
        }
    }).catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
    })
}

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title
  const content = req.body.content
  let imageUrl = req.body.imageUrl

  if(req.file){
    imageUrl = req.file.path;
  }

  if(!imageUrl){
    const error = new Error('No file picked')
    error.statusCode = 422
    throw error
  }

  Post.findById(postId).then(post => {
    if(!post){
      const error = new Error('Could not find post')
      error.statusCode = 404
      throw error
    }

    if(post.creator.toString() !== req.userId){
      const error = new Error("Not authorized ");
      error.statusCode = 404;
      throw error;
    }

    if(imageUrl !== post.imageUrl){
      clearImage(post.imageUrl)
    }

    post.title = title;
    post.imageUrl = imageUrl
    post.content = content
    return post.save()

  }).then(result => {
    res.status(200).json({message: 'Post updated!', post: result})
  }).catch(err => {
    if(!err.statusCode){
      err.statusCode=500
    }
    next(err)
  })

}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId
  Post.findById(postId)
  .then(post => {
    // check logged in user

     if (!post) {
       const error = new Error("Could not delete post");
       error.statusCode = 404;
       throw error;
     }else{
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
     }
     
  }).then(result => {
    return User.findById(req.userId)
  }).then(user => {
    user.posts.pull(postId)
    return user.save()
  }).then(result => {
    res.status(200).json({ message: "Successfully delete the post" });
  }).catch(err => {
     if (!err.statusCode) {
       err.statusCode = 404;
     }
     next(err);
  })
}

const clearImage = filePath => {
  let imagepath = path.join(__dirname, '..', filePath)
  console.log(imagepath)
  fs.unlink(imagepath, err => console.log(err))
}

