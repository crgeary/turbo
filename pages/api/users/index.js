import Joi from 'joi';

import { User } from '../../../db/models/User';
import db from '../../../db/db';
import { hashPassword } from '../../../lib/auth';

const handler = async (req, res) => {
    const { method, body } = req;
    try {
        if (method === 'GET') {
            res.status(200).json({
                data: await User.query(),
            });
        } else if (method === 'POST') {
            const { name, email, password } = body;

            const schema = Joi.object({
                name: Joi.string().required(),
                email: Joi.string().email().required(),
                password: Joi.string().min(8).required(),
            });

            Joi.assert({ name, email, password }, schema);

            const user = await User.query().insert({
                name: name,
                email: email,
                password: typeof password !== 'undefined' ? await hashPassword(password) : undefined,
                created_at: db.raw('NOW()'),
                updated_at: db.raw('NOW()'),
            });
            res.status(201).json({
                data: user,
            });
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end();
        }
    } catch (err) {
        if (Joi.isError(err)) {
            return res.json({
                error: {
                    status: 422,
                    message: err.details.map((e) => e.message).join(', '),
                },
            });
        } else {
            res.status(500).json({
                error: {
                    status: 500,
                    message: process.env.APP_DEBUG ? err.message : 'An unexpected error occurred',
                },
            });
        }
    }
};

export default handler;
