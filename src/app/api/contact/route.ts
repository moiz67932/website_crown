import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, phone, message, propertyData } = await req.json();
  const firstName = name.split(' ')[0];
  const lastName = name.split(' ')[1];
  const res = await fetch('https://api.lofty.com/v1.0/leads', {
    method: 'POST',
    headers: {
      'Authorization': `token ${process.env.LOFTY_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: firstName,
      listName: lastName || '',
      emails: [email],
      phones: [phone],
      streetAddress: propertyData.address,
      city: propertyData.city,
      zipCode: propertyData.postal_code,
      stage: "Pending",
      property: {
        price: propertyData.list_price,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zipCode: propertyData.postal_code,
        propertyType: propertyData.property_type,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareFeet: propertyData.square_feet,
        yearBuilt: propertyData.year_built,
        lotSize: propertyData.lot_size,
        lotSizeUnit: propertyData.lot_size_unit,
        lotSizeValue: propertyData.lot_size_value,
      },
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
