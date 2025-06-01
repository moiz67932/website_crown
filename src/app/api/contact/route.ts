import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json();

  const res = await fetch('https://api.lofty.com/v1.0/leads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJleHQiOjMzMjU1MTA1NTMzMjMsInVzZXJfaWQiOjg0NDc2ODQ4NzAyNjYzOCwic2NvcGUiOiI1IiwiaWF0IjoxNzQ4NzEwNTUzMzIzfQ.MSR8yHKJw6DHRAlM8zEivRQ2ZVQ4vKnBaoNs200DlWY`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first_name: name,
      email,
      phone,
      source: 'crowncoastalhomes.com',
      content: message
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.log(error)
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ status: 'success' });
}
