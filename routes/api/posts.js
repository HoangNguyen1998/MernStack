const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const { check, validationResult } = require("express-validator");
const Post = require("../../models/post.model");
const Profile = require("../../models/profile.model");
const User = require("../../models/user.model");

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("text", "Text is required!")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      await newPost.save();
      res.json(newPost);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error!");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error!");
  }
});

// @route   GET api/posts/:post_id
// @desc    Get all posts
// @access  Private
router.get("/:post_id", auth, async (req, res) => {
  console.log(req.params.post_id);
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: "Post not found!" });
    }
    res.json(post);
  } catch (error) {
    console.log(error);
    if (error === "ObjectId") {
      return res.status(404).send({ msg: "Post not found!" });
    }
    res.status(500).send("Server error!");
  }
});

// @route   DELETE api/posts/:post_id
// @desc    Delete a post
// @access  Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized!" });
    }
    await post.remove();
    res.json({ msg: "Post removed!" });
  } catch (error) {
    console.log(error);
    if (error === "ObjectId") {
      return res.status(404).send({ msg: "Post not found!" });
    }
    res.status(500).send("Server error!");
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post
// @access  Private
router.put("/like/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //Check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: "Post already liked!" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error!");
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //Check if the post has not been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post has not been liked!" });
    }
    //Get removed index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error!");
  }
});

// @route   POST api/posts/comment/:post_id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:post_id",
  [
    auth,
    [
      check("text", "Text is required!")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.post_id);
      const newComment = {
        text: req.body.text,
        avatar: user.avatar,
        user: req.user.id
      };
      post.comments.push(newComment);
      await post.save();
      res.json(post);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error!");
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete comment on a post
// @access  Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const indexComment = post.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);
    // const comment = post.comments.find(
    //   comment => comment.id === req.params.comment_id
    // );
    // if (!comment) {
    //   return res.status(404).json({ msg: "This comment is not exists!" });
    // }
    // if (comment.user.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "User not authorized!" });
    // }
    if (indexComment === -1) {
      return res.status(404).json({ msg: "This comment is not exists!" });
    }
    if (post.comments[indexComment].user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized!" });
    }
    post.comments.splice(indexComment, 1);
    await post.save();
    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error!");
  }
});

module.exports = router;
