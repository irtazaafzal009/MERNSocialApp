const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

router.get('/', auth, async (req, res)=>{
    try{
     const user = await User.findById(req.user.id).select('-password');
      res.json(user);          
    }catch(err){
        console.error(err);
    }
});

router.post('/', [
    check('email', 'Please enter valid email').isEmail(),
    check('password', 'Password is required').exists()
    ], async (req, res)=> {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }
    
    const {email, password} = req.body;

    try{
        let user = await User.findOne({ email })
        if(!user){
           return res.status(500).json({ errors: [{ msg: 'Invalid email or password' }] })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(500).json({ errors: [{ msg: 'Invalid email or password' }] })
        }
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

module.exports = router;