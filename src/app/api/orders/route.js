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
    });
  }
}

function corsHeaders(headers = new Headers()) {
  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Vary', 'Origin');
  return headers;
}

export const GET = withCORS(async () => {
  const orders = await prisma.order.findMany({ include: { product: true, user: true } })
  return new Response(JSON.stringify(orders), { status: 200 })
})

export const POST = withCORS(async (request) => {
  const { userId, productId, quantity } = await request.json()

  if (!userId || !productId || !quantity) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })
  }

  const totalPrice = product.price * quantity

  const order = await prisma.order.create({
    data: { userId, productId, quantity, totalPrice },
  })

  return new Response(JSON.stringify(order), { status: 201 })
})

export const DELETE = withCORS(async (request) => {
  const { id } = await request.json()
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 })
  }

  await prisma.order.delete({ where: { id } })
  return new Response(JSON.stringify({ message: 'Order deleted' }), { status: 200 })
})

export const OPTIONS = withCORS(async () => {
  return new Response(null, { status: 204 });
});
