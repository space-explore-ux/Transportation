const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                data: null, 
                message: 'Email and password are required.' 
            });
        }

        // 2. Check if user exists in the database
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                data: null, 
                message: 'Invalid email or password.' 
            });
        }

        // 3. Verify the password hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                data: null, 
                message: 'Invalid email or password.' 
            });
        }

        // 4. Generate the JWT Token (Includes agency_id for multi-tenancy!)
        const payload = {
            id: user.id,
            uuid: user.uuid,
            agency_id: user.agency_id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '24h' // Token expires in 1 day
        });

        // 5. Send success response (Clean JSON format)
        return res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    uuid: user.uuid,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    agency_id: user.agency_id
                }
            },
            message: 'Login successful.'
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ 
            success: false, 
            data: null, 
            message: 'Internal server error during login.' 
        });
    }
};

module.exports = {
    login
};