// src/app/api/hello/route.js

export async function GET() {
  return Response.json({
    message: "Hello from the CSBS backend 👋",
    time: new Date().toISOString(),
  });
}

export async function POST(req) {
  const body = await req.json();
  return Response.json({
    received: body,
    status: "Success",
  });
}
