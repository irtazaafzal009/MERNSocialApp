const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator/check');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');

// endpoint to register user
router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please enter valid email')
        .isEmail(),
    check('password', 'Please enter password with 6 or more characters')
        .isLength({ min : 6 })
    ], async (req, res)=> {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }
    
    const {name, email, password} = req.body;

    try{
        let user = await User.findOne({ email })
        if(user){
           return res.status(500).json({ errors: [{ msg: 'User already registered on this email, please user another email' }] })
        }
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d:'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = {
            user:{
                id:user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),{
            expiresIn: 360000
        }, (err, token)=>{
            if(err) throw err;
            res.json({ token });
        });

    }catch(err){
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//endpoint to get users list

router.get('/', (req, res) => {
    User.find({}, function(err, users) { 
        var userMap = {}; 
        users.forEach(function(user) { 
        userMap[user._id] = user; 
        }); 
        console.log(Object.keys(userMap).length)
        if(Object.keys(userMap).length){
            res.send(userMap); 
        }else{
            res.send('No users exists')
        }
        }); 
});

// endpoint to delete user

router.delete('/', async (req, res) =>{

      const result = await User.deleteOne({ email: req.body.email});
      if(result.deletedCount === 1){
          res.send('User deleted successfully');
      }else{
          res.send('No user exist');
      }

});

module.exports = router;