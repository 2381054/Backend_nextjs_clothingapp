import { prisma } from '@/lib/prisma'

// CORS setup manual
const allowedOrigin = 'http://localhost:3000'

function withCORS(handler) {
  return async (request) => {
    const origin = request.headers.get('origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'true',
          'Vary': 'Origin',
        },
      });
    }

    const result = await handler(request);
    const cloned = result.clone();
    const text = await cloned.text();

    const headers = new Headers(result.headers);
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');

    return new Response(text, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  }
}

// GET all products
export const GET = withCORS(async () => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true, 
        reviews: true    // <= include reviews juga
      },
    });
    return Response.json(products, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
});

// POST create product
export const POST = withCORS(async (request) => {
  try {
    const { name, description, price, categoryId } = await request.json();

    if (!name || !description || !price) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: { name, description, price, categoryId },
    });

    return Response.json(newProduct, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
});

// PUT update product
export const PUT = withCORS(async (request) => {
  try {
    const { id, name, description, price, categoryId } = await request.json();

    if (!id || !name || !description || !price) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name, description, price, categoryId },
    });

    return Response.json(updatedProduct, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
});

// DELETE product
export const DELETE = withCORS(async (request) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return Response.json({ message: 'Product deleted' }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
});

// OPTIONS for CORS preflight
export const OPTIONS = withCORS(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
});
