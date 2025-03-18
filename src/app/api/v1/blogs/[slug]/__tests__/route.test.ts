import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import * as dbHandler from '@/lib/test/db-handler';
import Blog from '@/models/Blog';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose, { Document } from 'mongoose';

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Single Blog API', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let adminToken: string; // Declared but only used for token generation
    let userToken: string;
    let userId: string;
    let blogId: string;
    let blogSlug: string;

    beforeEach(async () => {
        // Create admin user
        const admin = await User.create({
            email: 'admin@example.com',
            password: 'password123',
            name: 'Admin User',
            role: 'admin',
        }) as Document & { _id: mongoose.Types.ObjectId; email: string; role: string };

        // Create regular user
        const user = await User.create({
            email: 'user@example.com',
            password: 'password123',
            name: 'Regular User',
            role: 'user',
        }) as Document & { _id: mongoose.Types.ObjectId; email: string; role: string };

        userId = user._id.toString();

        // Generate auth tokens
        adminToken = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1d' }
        );

        userToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1d' }
        );

        // Create test blog
        const blog = await Blog.create({
            title: 'Test Blog',
            slug: 'test-blog',
            author: user._id,
            introduction: 'Test introduction',
            body: 'Test body content',
            conclusion: 'Test conclusion',
            categories: ['test'],
            tags: ['test-tag'],
            status: 'published',
            publishDate: new Date().toISOString(),
            meta: { views: 0, likes: 0, shares: 0 },
        }) as Document & { _id: mongoose.Types.ObjectId; slug: string };

        blogId = blog._id.toString();
        blogSlug = blog.slug;
    });

    describe('GET /api/v1/blogs/[slug]', () => {
        it('should get a blog by ID', async () => {
            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${blogId}`);
            const params = { slug: blogId };

            const response = await GET(req, { params });
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.title).toBe('Test Blog');
            expect(data.slug).toBe('test-blog');
        });

        it('should get a blog by slug', async () => {
            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${blogSlug}`);
            const params = { slug: blogSlug };

            const response = await GET(req, { params });
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.title).toBe('Test Blog');
            expect(data._id.toString()).toBe(blogId);
        });

        it('should return 404 for non-existent blog', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${nonExistentId}`);
            const params = { slug: nonExistentId };

            const response = await GET(req, { params });
            expect(response.status).toBe(404);

            const data = await response.json();
            expect(data.error).toBe('Blog not found');
        });
    });

    describe('PUT /api/v1/blogs/[slug]', () => {
        it('should update a blog when user is the author', async () => {
            const updateData = {
                title: 'Updated Test Blog',
                introduction: 'Updated introduction',
            };

            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${blogId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            // Mock the auth middleware
            interface AuthRequest extends NextRequest {
                user: { id: string; role: string };
            }
            const authReq = req as AuthRequest;
            authReq.user = { id: userId, role: 'user' };

            const params = { slug: blogId };
            const response = await PUT(req, { params });
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.title).toBe(updateData.title);
            expect(data.introduction).toBe(updateData.introduction);
        });

        it('should return 403 when user is not the author', async () => {
            const otherUserId = new mongoose.Types.ObjectId().toString();
            const updateData = {
                title: 'Updated Test Blog',
            };

            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${blogId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            // Mock the auth middleware with a different user
            interface AuthRequest extends NextRequest {
                user: { id: string; role: string };
            }
            const authReq = req as AuthRequest;
            authReq.user = { id: otherUserId, role: 'user' };

            const params = { slug: blogId };
            const response = await PUT(req, { params });
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe('Not authorized to update this blog');
        });
    });

    describe('DELETE /api/v1/blogs/[slug]', () => {
        it('should delete a blog when user is the author', async () => {
            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${blogId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            // Mock the auth middleware
            interface AuthRequest extends NextRequest {
                user: { id: string; role: string };
            }
            const authReq = req as AuthRequest;
            authReq.user = { id: userId, role: 'user' };

            const params = { slug: blogId };
            const response = await DELETE(req, { params });
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.message).toBe('Blog deleted successfully');

            // Verify blog is deleted
            const blog = await Blog.findById(blogId);
            expect(blog).toBeNull();
        });

        it('should return 403 when user is not the author', async () => {
            const otherUserId = new mongoose.Types.ObjectId().toString();
            const req = new NextRequest(`http://localhost:3000/api/v1/blogs/${blogId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            // Mock the auth middleware with a different user
            interface AuthRequest extends NextRequest {
                user: { id: string; role: string };
            }
            const authReq = req as AuthRequest;
            authReq.user = { id: otherUserId, role: 'user' };

            const params = { slug: blogId };
            const response = await DELETE(req, { params });
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe('Not authorized to delete this blog');
        });
    });
});
