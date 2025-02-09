const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const { check, validationResult } = require("express-validator");
const Profile = require("../../models/profile.model");
const User = require("../../models/user.model");

// @route   GET api/profile/me
// @desc    Get profile of logged in user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    console.log(req.user.id);
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["name", "email"]);
    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for this user!" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).send("Server error!");
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required!")
        .not()
        .isEmpty(),
      check("skills", "Skills is required!")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(", ").map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // Create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      res.status(500).send("Server error!");
    }
  }
);

// @route   GET api/profile
// @desc    Get all profile of logged in user
// @access  Public
router.get("/", async (req, res) => {
  try {
    let profiles = await Profile.find().populate("user", ["name", "avatar"]);
    if (!profiles) {
      return res.status(400).json({ msg: "There is no profiles !" });
    }
    res.json(profiles);
  } catch (err) {
    res.status(500).send("Server error!");
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user_id
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    console.log(req.params.user_id);
    const profile = await Profile.find({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);
    console.log(profile);
    if (!profile) {
      return res.status(400).json({ msg: "Profile not found!" });
    }
    res.json(profile);
  } catch (err) {
    console.log(err);
    if (err.kind == "ObjectId") {
      return res.status(400).send("Profile not found!");
    }
    res.status(500).send("Server error!");
  }
});

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    await User.findOneAndRemove({ _id: req.user.id });
    await Profile.findOneAndRemove({ user: req.user.id });
    res.json({ msg: "User removed!" });
  } catch (err) {
    res.status(500).send("Server error!");
  }
});

// @route   PUT api/profile/experience
// @desc    Add profile's experience
// @access  Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required!")
        .not()
        .isEmpty(),
      check("company", "Company is required!")
        .not()
        .isEmpty(),
      check("from", "From date is required!")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error!");
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience of user's profile
// @access  Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // Get remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);
    if (removeIndex === -1) {
      return res.send("This experience not found!");
    }
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json([{ profile }, { msg: "Experience removed!" }]);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server error!");
  }
});

// @route   PUT api/profile/education
// @desc    Add profile's education
// @access  Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required!")
        .not()
        .isEmpty(),
      check("degree", "Degree is required!")
        .not()
        .isEmpty(),
      check("fieldofstudy", "Field of study is required!")
        .not()
        .isEmpty(),
      check("from", "From date is required!")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error!");
    }
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education of user's profile
// @access  Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // Get remove index
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);
    if (removeIndex === -1) {
      return res.send("This Education not found!");
    }
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json([{ profile }, { msg: "Education removed!" }]);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server error!");
  }
});

module.exports = router;
