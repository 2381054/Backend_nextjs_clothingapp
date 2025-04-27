import { prisma } from '@/lib/prisma'

const allowedOrigin = 'http://localhost:3000'

function withCORS(handler) {
    return async (request) => {
      const origin = request.headers.get('origin') || '*';
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(),
        })
      }
      const result = await handler(request);
      const cloned = result.clone();
      const text = await cloned.text();
  
      const headers = new Headers(result.headers);
      corsHeaders(headers);
  
      return new Response(text, {
        status: result.status,
        statusText: result.statusText,
        headers,
      })
    }
}

function corsHeaders(headers = new Headers()) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
    return headers;
}

export const GET = withCORS(async () => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: true, product: true },  // Including user and product info
    });
    return new Response(JSON.stringify(reviews), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch reviews' }), { status: 500 });
  }
});

export const POST = withCORS(async (request) => {
  const { userId, productId, rating, comment } = await request.json();

  if (!userId || !productId || !rating || !comment) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });

    return new Response(JSON.stringify(review), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create review' }), { status: 500 });
  }
});

export const PUT = withCORS(async (request) => {
  const { id, rating, comment } = await request.json();

  if (!id || !rating || !comment) {
    return new Response(JSON.stringify({ error: 'ID, rating, and comment are required' }), { status: 400 });
  }

  try {
    const reviewExists = await prisma.review.findUnique({ where: { id } });

    if (!reviewExists) {
      return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { rating, comment },
    });

    return new Response(JSON.stringify(updatedReview), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update review' }), { status: 500 });
  }
});

export const DELETE = withCORS(async (request) => {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
  }

  try {
    const reviewExists = await prisma.review.findUnique({ where: { id } });

    if (!reviewExists) {
      return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    return new Response(JSON.stringify({ message: 'Review deleted' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete review' }), { status: 500 });
  }
});

export const OPTIONS = withCORS(async () => {
  return new Response(null, { status: 204 });
});
