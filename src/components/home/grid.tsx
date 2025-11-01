import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Heart } from "lucide-react";

const homes = [
  {
    id: 1,
    img: "/house-1.jpg",
    price: "$625,760",
    label: "NEW CONSTRUCTION",
    beds: 3,
    baths: 2.5,
    sqft: "2,166",
    address: "712 Bernese Pass",
    city: "Austin, TX 78745",
    listedAgo: "5 hours ago",
  },
  {
    id: 2,
    img: "/house-2.jpg",
    price: "$399,999",
    label: "",
    beds: 4,
    baths: 2,
    sqft: "1,722",
    address: "6404 Routenburn St",
    city: "Austin, TX 78754",
    listedAgo: "16 hours ago",
  },
  {
    id: 3,
    img: "/house-3.jpg",
    price: "$449,990",
    label: "NEW CONSTRUCTION",
    beds: 3,
    baths: 2,
    sqft: "1,903",
    address: "4901 Warm Wassail Dr",
    city: "Austin, TX 78747",
    listedAgo: "5 hours ago",
  },
  {
    id: 4,
    img: "/house-4.jpg",
    price: "$576,900",
    label: "NEW CONSTRUCTION",
    beds: 3,
    baths: 2.5,
    sqft: "2,003",
    address: "711 Bernese Pass",
    city: "Austin, TX 78745",
    listedAgo: "5 hours ago",
  },
];

export default function RealEstateGrid() {
  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-4">Explore Homes Near You</h2>
      <div className="flex space-x-6 mb-6 border-b pb-2 text-sm font-medium">
        {["New to Market", "3D Tours", "Most Viewed", "Open Houses", "Price Drop", "Luxury Homes"].map((tab, i) => (
          <button
            key={i}
            className={
              i === 0
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-600 hover:text-black"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {homes.map((home) => (
          <Card key={home.id} className="overflow-hidden">
            <div className="relative">
              <Image
                src={home.img}
                alt="House"
                width={400}
                height={250}
                className="object-cover w-full h-[200px]"
              />
              <div className="absolute top-2 left-2 text-sm bg-white rounded px-2 py-1 shadow">
                <span className="flex items-center gap-1">
                  🏠 <span className="font-medium">Newly Listed</span>
                </span>
                <span className="text-xs text-gray-500">{home.listedAgo}</span>
              </div>
            </div>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{home.price}</span>
                {home.label && <Badge>{home.label}</Badge>}
              </div>
              <div className="text-sm text-gray-600">
                {home.beds} Beds • {home.baths} Baths • {home.sqft} Sq Ft
              </div>
              <div className="text-sm text-gray-800">{home.address}</div>
              <div className="text-sm text-gray-500">{home.city}</div>
              <div className="flex justify-end">
                <Heart className="h-5 w-5 text-gray-400 hover:text-red-500 cursor-pointer" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}