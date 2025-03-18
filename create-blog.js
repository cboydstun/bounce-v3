// Script to create a sample blog post
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Create a development token
const createDevToken = () => {
    // This is for development purposes only
    const devUser = {
        id: '6382a44a44b6735842231ed2', // Use a valid user ID from your database
        email: 'dev@example.com',
        role: 'admin'
    };

    return jwt.sign(
        devUser,
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1d' }
    );
};

async function createBlog() {
    try {
        // Generate a development token
        const token = createDevToken();

        const response = await fetch('http://localhost:3000/api/v1/blogs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Sample Blog Post',
                introduction: 'This is a sample introduction.',
                body: 'This is the main content of the blog post.',
                conclusion: 'This is the conclusion of the blog post.',
                status: 'published',
                categories: ['test'],
                tags: ['sample']
            })
        });

        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

createBlog();
