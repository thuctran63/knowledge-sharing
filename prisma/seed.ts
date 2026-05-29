import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Chen",
      email: "alice@example.com",
      emailVerified: new Date(),
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      bio: "Full-stack developer & writer. Passionate about distributed systems and clean code.",
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: "alice@example.com",
          access_token: hashedPassword,
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Martinez",
      email: "bob@example.com",
      emailVerified: new Date(),
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      bio: "Product designer exploring the intersection of design and engineering.",
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: "bob@example.com",
          access_token: hashedPassword,
        },
      },
    },
  });

  const tags = [
    "javascript",
    "react",
    "typescript",
    "design",
    "backend",
    "frontend",
    "devops",
    "tutorial",
    "career",
    "database",
  ];

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const allTags = await prisma.tag.findMany();

  const posts = [
    {
      title: "Building Scalable APIs with Next.js",
      slug: "building-scalable-apis-with-nextjs",
      content: `# Building Scalable APIs with Next.js

Next.js provides an excellent framework for building full-stack applications. In this guide, I'll walk through the best practices for creating scalable APIs using Next.js route handlers.

## Why Next.js for APIs?

Next.js API routes allow you to build serverless functions that are automatically deployed alongside your frontend. This eliminates the need for a separate backend service for many applications.

## Project Structure

A well-organized API structure is crucial for maintainability:

\`\`\`typescript
// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      include: {
        author: true,
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
\`\`\`

## Error Handling

Always implement proper error handling in your API routes. This ensures that your API returns consistent responses even when something goes wrong.

## Rate Limiting

For production applications, implement rate limiting to prevent abuse of your API endpoints.

## Conclusion

Next.js provides a powerful platform for building APIs. By following these patterns, you can create scalable and maintainable APIs that serve your application needs.`,
      excerpt: "Learn the best practices for building scalable APIs using Next.js route handlers and serverless functions.",
      published: true,
      authorId: user1.id,
      tags: ["javascript", "typescript", "backend"],
      viewCount: 342,
    },
    {
      title: "The Art of Component Design in React",
      slug: "the-art-of-component-design-in-react",
      content: `# The Art of Component Design in React

Designing good React components is both an art and a science. Let's explore the principles that make components maintainable, reusable, and delightful to work with.

## Composition Over Configuration

React's composition model is one of its greatest strengths. Instead of building monolithic components with many configuration options, compose smaller components together.

\`\`\`tsx
// Good: Composition
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
}
\`\`\`

## Single Responsibility

Each component should have one clear responsibility. If a component is doing too many things, it's time to break it down.

## Props Interface

Define clear TypeScript interfaces for your component props. This provides excellent developer experience and catches errors early.

## Conclusion

Great component design comes from practice and iteration. Keep your components focused, composable, and well-typed.`,
      excerpt: "Explore the principles of designing maintainable, reusable, and well-typed React components.",
      published: true,
      authorId: user1.id,
      tags: ["react", "typescript", "frontend"],
      viewCount: 567,
    },
    {
      title: "Designing for Accessibility: A Practical Guide",
      slug: "designing-for-accessibility-guide",
      content: `# Designing for Accessibility: A Practical Guide

Accessibility isn't just a nice-to-have—it's essential for creating inclusive digital experiences. Here's how to approach accessibility in your design process.

## Why Accessibility Matters

Over 1 billion people worldwide have some form of disability. By designing accessibly, we ensure that our products serve everyone.

## Color and Contrast

Always ensure sufficient color contrast. Use tools like the WebAIM contrast checker to verify your color choices meet WCAG guidelines.

\`\`\`css
/* Ensure at least 4.5:1 contrast ratio for normal text */
.text-body {
  color: #1a1a1a;
  background: #fafafa;
}
\`\`\`

## Keyboard Navigation

All interactive elements should be reachable and operable via keyboard. This includes proper focus management and skip links.

## Screen Reader Support

Use semantic HTML elements and ARIA attributes when necessary to provide context for screen readers.

## Conclusion

Accessibility is an ongoing practice, not a checklist. Start with these fundamentals and iterate.`,
      excerpt: "A practical guide to designing accessible digital experiences that work for everyone.",
      published: true,
      authorId: user2.id,
      tags: ["design", "frontend"],
      viewCount: 234,
    },
    {
      title: "Understanding Database Indexing Strategies",
      slug: "understanding-database-indexing",
      content: `# Understanding Database Indexing Strategies

Database indexing is one of the most impactful performance optimization techniques. Let's understand how indexes work and when to use them.

## What is an Index?

Think of a database index like the index in a book. Instead of scanning every page, you can look up the exact location of the information you need.

## Types of Indexes

- **B-Tree Indexes**: The default and most common, good for equality and range queries
- **Hash Indexes**: Best for equality lookups
- **GiST Indexes**: Good for full-text search and geometric data
- **GIN Indexes**: Excellent for composite types and arrays

## When to Index

\`\`\`sql
-- Good candidate for indexing
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Composite index for common query patterns
CREATE INDEX idx_posts_published_created 
ON posts(published, created_at DESC);
\`\`\`

## Common Pitfalls

Avoid over-indexing. Each index adds overhead on writes and consumes storage space.

## Conclusion

Understanding indexing strategies is crucial for building performant applications. Start with the most critical queries and measure the impact.`,
      excerpt: "Deep dive into database indexing strategies, index types, and best practices for optimal query performance.",
      published: true,
      authorId: user1.id,
      tags: ["backend", "database"],
      viewCount: 189,
    },
    {
      title: "Navigating Your First Year as a Developer",
      slug: "navigating-first-year-developer",
      content: `# Navigating Your First Year as a Developer

Starting your career in software development can be overwhelming. Here are the lessons I wish someone had told me on day one.

## Embrace the Learning Curve

You won't know everything, and that's okay. Every experienced developer was once where you are now.

## Build Real Projects

Theory is important, but nothing beats building real applications. Start with something small and gradually increase complexity.

## Read Code

Reading other people's code is one of the fastest ways to improve. Study open-source projects and understand their patterns.

## Ask Questions

Don't be afraid to ask for help. The best engineers ask the most questions because they're curious about how things work.

## Conclusion

Your first year sets the foundation for your career. Be patient, stay curious, and keep building.`,
      excerpt: "Essential advice for new developers navigating their first year in the software industry.",
      published: true,
      authorId: user2.id,
      tags: ["career", "tutorial"],
      viewCount: 891,
    },
    {
      title: "Mastering TypeScript: Advanced Patterns",
      slug: "mastering-typescript-advanced-patterns",
      content: `# Mastering TypeScript: Advanced Patterns

Take your TypeScript skills to the next level with these advanced patterns and techniques.

## Discriminated Unions

\`\`\`typescript
type Result<T> = 
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function handleResult<T>(result: Result<T>) {
  switch (result.status) {
    case "success":
      return result.data;
    case "error":
      console.error(result.error);
  }
}
\`\`\`

## Template Literal Types

TypeScript 4.1+ introduces template literal types for powerful string manipulations.

## Conditional Types

Create types that depend on other types, enabling complex type transformations.

## Conclusion

Advanced TypeScript patterns help you write safer, more expressive code. Practice these patterns in your daily work.`,
      excerpt: "Level up your TypeScript skills with advanced patterns including discriminated unions and conditional types.",
      published: true,
      authorId: user1.id,
      tags: ["typescript", "javascript"],
      viewCount: 445,
    },
  ];

  for (const post of posts) {
    const created = await prisma.post.create({
      data: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        authorId: post.authorId,
        viewCount: post.viewCount,
      },
    });

    for (const tagName of post.tags) {
      const tag = allTags.find((t) => t.name === tagName);
      if (tag) {
        await prisma.postTag.create({
          data: {
            postId: created.id,
            tagId: tag.id,
          },
        });
      }
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
