import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const allowedOrigin = 'https://frontend-nextjs-clothingapp.vercel.app'

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

export const POST = withCORS(async (request) => {
  const { email, password, name, type } = await request.json()

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 })
  }

  if (type === 'register') {
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      const user = await prisma.user.create({
        data: {
          email,
          name: name || '',
          password: hashedPassword,
        },
      })
      return new Response(JSON.stringify({ message: 'User registered', user }), { status: 201 })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400 })
    }
  } else if (type === 'login') {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 })
    }

    return new Response(JSON.stringify({ message: 'Login successful', user }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 })
  }
})

export const OPTIONS = withCORS(async () => {
  return new Response(null, { status: 204 });
});
