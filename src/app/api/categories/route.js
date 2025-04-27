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
    const categories = await prisma.category.findMany();
    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), { status: 500 });
  }
});

export const POST = withCORS(async (request) => {
  const { name } = await request.json();

  if (!name) {
    return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
  }

  try {
    const category = await prisma.category.create({ data: { name } });
    return new Response(JSON.stringify(category), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create category' }), { status: 500 });
  }
});

export const PUT = withCORS(async (request) => {
  const { id, name } = await request.json();

  if (!id || !name) {
    return new Response(JSON.stringify({ error: 'ID and name are required' }), { status: 400 });
  }

  try {
    const categoryExists = await prisma.category.findUnique({ where: { id } });

    if (!categoryExists) {
      return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return new Response(JSON.stringify(updatedCategory), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update category' }), { status: 500 });
  }
});

export const DELETE = withCORS(async (request) => {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
  }

  try {
    const categoryExists = await prisma.category.findUnique({ where: { id } });

    if (!categoryExists) {
      return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
    }

    await prisma.category.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Category deleted' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), { status: 500 });
  }
});

export const OPTIONS = withCORS(async () => {
  return new Response(null, { status: 204 });
});
