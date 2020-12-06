const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator/check')

router.get('/me', auth, async (req, res)=>{
    try{
        const profile = await  Profile.findOne({ user: req.user.id }).populate('user',['name', 'avatar']);
        if(!profile){
            res.status(400).json({ msg: 'There is no profile for this user'});
        }else{
            res.send(profile);
        }
    }catch(err){
        console.error(err);
        res.status(500).send('Server Error')
    }
});


router.post('/', 
[
    auth, 
    [
    check('status', 'Status is required')
        .not().isEmpty(),
    check('skills', 'Skills is required')
        .not().isEmpty()
    ]
], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
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

    // profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status= status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // social object

    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;


    try{
        let profile = await Profile.findOne({ user: req.user.id});
        if(profile){
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
            return res.json(profile);
        }

        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err);
        res.status(500).send('server error');
    }
});


router.get('/', async (req, res)=>{
    try {
        const profiles = await Profile.find().populate('user', ['name','avatar','email']);
        res.json(profiles);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

//profile/user/user_id
router.get('/user/:user_id', async (req, res)=>{
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name','avatar','email']);
        if(!profile) return res.status(400).json({ msg: 'No profile exist'});
        res.json(profile);

    } catch (error) {
        console.error(error);
        if(error.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'No profile exist'});
        }
        res.status(500).send('Server Error');
    }
});

// delete profile/user/posts
router.delete('/', auth, async(req, res)=>{
    try {
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User Deleted Successfully'});

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// put api/profile/experience

router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]], async(req, res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        }  = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        };

        try {
            let profile = await Profile.findOne({ user: req.user.id});
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.error(error);
            res.status(500).send('server error');
        }
});


//api/profile/experience
//private

router.delete('/experience/:exp_id', auth, async (req, res)=>{
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).send('server error');
    } 
});

// api/profile/education
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From is required').not().isEmpty(),
]] , async (req, res)=>{

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
        let profile = await Profile.findOne({ user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.error(error);
        res.status(500).send('server error');
    }
});

//api/profile/education
router.delete('/education/:ed_id', auth, async (req, res) =>{
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.ed_id);
        profile.education.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
        
    } catch (error) {
        console.error(error);
        res.status(500).send('server error');
    }
});

module.exports = router;