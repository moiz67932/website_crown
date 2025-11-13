"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";

interface PropertyFormData {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size: number;
  property_type: string;
  status: string;
  description: string;
  features: string[];
}

export default function EditPropertyPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<PropertyFormData>({
    address: "",
    city: "",
    state: "",
    zipcode: "",
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    square_feet: 0,
    lot_size: 0,
    property_type: "",
    status: "active",
    description: "",
    features: [],
  });

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
      }
    } catch (error) {
      console.error("Error fetching property:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(property),
      });

      if (response.ok) {
        alert("Property updated successfully!");
        router.push("/admin/properties");
      } else {
        alert("Failed to update property");
      }
    } catch (error) {
      console.error("Error saving property:", error);
      alert("Error saving property");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/properties"
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Property</h1>
            <p className="text-slate-600 mt-1">{property.address}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <input
              type="text"
              value={property.address}
              onChange={(e) => setProperty({ ...property, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input
              type="text"
              value={property.city}
              onChange={(e) => setProperty({ ...property, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
            <input
              type="text"
              value={property.state}
              onChange={(e) => setProperty({ ...property, state: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
            <input
              type="text"
              value={property.zipcode}
              onChange={(e) => setProperty({ ...property, zipcode: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
            <input
              type="number"
              value={property.price}
              onChange={(e) => setProperty({ ...property, price: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms</label>
            <input
              type="number"
              value={property.bedrooms}
              onChange={(e) => setProperty({ ...property, bedrooms: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bathrooms</label>
            <input
              type="number"
              value={property.bathrooms}
              onChange={(e) => setProperty({ ...property, bathrooms: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Square Feet</label>
            <input
              type="number"
              value={property.square_feet}
              onChange={(e) => setProperty({ ...property, square_feet: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
            <select
              value={property.property_type}
              onChange={(e) => setProperty({ ...property, property_type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Type</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="land">Land</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={property.status}
              onChange={(e) => setProperty({ ...property, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={property.description}
            onChange={(e) => setProperty({ ...property, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  );
}
