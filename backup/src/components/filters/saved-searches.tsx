"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// Using basic HTML inputs instead of complex UI components
import { 
  Save, Search, Bell, BellOff, Edit, Trash2, MoreVertical, 
  Plus, Eye, Clock, MapPin, DollarSign, Filter, Star,
  Mail, Smartphone, Calendar
} from "lucide-react"
import { PropertyFilters, SavedSearch } from "@/types/filters"

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onSaveSearch: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateSearch: (id: string, updates: Partial<SavedSearch>) => Promise<void>;
  onDeleteSearch: (id: string) => Promise<void>;
  onLoadSearch: (search: SavedSearch) => void;
  currentFilters?: PropertyFilters;
  userId?: string;
}

interface SaveSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  onSave: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  userId?: string;
  existingSearch?: SavedSearch;
}

const ALERT_FREQUENCIES = [
  { label: 'Immediately', value: 'immediate' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Never', value: 'never' }
];

function SaveSearchDialog({ 
  open, 
  onOpenChange, 
  filters, 
  onSave, 
  userId,
  existingSearch 
}: SaveSearchDialogProps) {
  
  const [name, setName] = useState(existingSearch?.name || "");
  const [alertsEnabled, setAlertsEnabled] = useState(existingSearch?.alertsEnabled || false);
  const [alertFrequency, setAlertFrequency] = useState("daily");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getFilterSummary = useMemo(() => {
    const summary: string[] = [];
    
    if (filters.propertyType?.length) {
      summary.push(`${filters.propertyType.join(", ")}`);
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      const formatPrice = (price: number) => {
        if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
        return `$${price}`;
      };
      summary.push(`${formatPrice(min)} - ${formatPrice(max)}`);
    }
    
    if (filters.beds && filters.beds !== "Any") {
      summary.push(`${filters.beds} beds`);
    }
    
    if (filters.baths && filters.baths !== "Any") {
      summary.push(`${filters.baths} baths`);
    }
    
    if (filters.features?.length) {
      summary.push(`${filters.features.length} features`);
    }
    
    if (filters.city) {
      summary.push(filters.city);
    }
    
    return summary.join(" • ");
  }, [filters]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !userId) return;
    
    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        filters,
        userId,
        alertsEnabled,
      });
      onOpenChange(false);
      setName("");
      setAlertsEnabled(false);
      setDescription("");
    } catch (error) {
      console.error('Failed to save search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [name, filters, userId, alertsEnabled, onSave, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {existingSearch ? 'Edit Saved Search' : 'Save This Search'}
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search-name">Search Name *</Label>
            <Input
              id="search-name"
              placeholder="e.g., 3BR Houses Under $500K"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm text-slate-600">Current Filters</Label>
            <div className="mt-1 p-3 bg-slate-50 rounded border text-sm">
              {getFilterSummary || "No filters applied"}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Alerts</Label>
              <p className="text-sm text-slate-500">
                Get notified when new properties match your criteria
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertsEnabled}
              onChange={(e) => setAlertsEnabled(e.target.checked)}
              className="rounded"
            />
          </div>

          {alertsEnabled && (
            <div>
              <Label>Alert Frequency</Label>
              <select 
                value={alertFrequency} 
                onChange={(e) => setAlertFrequency(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {ALERT_FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Notes (Optional)</Label>
            <textarea
              id="description"
              placeholder="Add notes about this search..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full p-2 border rounded resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : existingSearch ? 'Update' : 'Save Search'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SavedSearches({
  savedSearches,
  onSaveSearch,
  onUpdateSearch,
  onDeleteSearch,
  onLoadSearch,
  currentFilters = {},
  userId
}: SavedSearchesProps) {
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleAlerts = useCallback(async (searchId: string, enabled: boolean) => {
    try {
      await onUpdateSearch(searchId, { alertsEnabled: enabled });
    } catch (error) {
      console.error('Failed to update alerts:', error);
    }
  }, [onUpdateSearch]);

  const handleDeleteSearch = useCallback(async (searchId: string) => {
    setDeletingId(searchId);
    try {
      await onDeleteSearch(searchId);
    } catch (error) {
      console.error('Failed to delete search:', error);
    } finally {
      setDeletingId(null);
    }
  }, [onDeleteSearch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSearchPreview = (filters: PropertyFilters) => {
    const items: string[] = [];
    
    if (filters.propertyType?.length) {
      items.push(`${filters.propertyType.length} property type${filters.propertyType.length > 1 ? 's' : ''}`);
    }
    
    if (filters.priceRange) {
      items.push('Price range');
    }
    
    if (filters.beds && filters.beds !== "Any") {
      items.push(`${filters.beds} beds`);
    }
    
    if (filters.features?.length) {
      items.push(`${filters.features.length} features`);
    }
    
    if (filters.city || filters.county) {
      items.push('Location');
    }
    
    return items.slice(0, 3).join(" • ");
  };

  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof PropertyFilters];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value !== "" && value !== "Any" && value !== "recommended";
      return value !== undefined && value !== null;
    });
  }, [currentFilters]);

  return (
    <div className="space-y-6">
      
      {/* Header with Save Current Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Saved Searches</h2>
          <p className="text-sm text-slate-600">
            Save your searches and get alerts for new properties
          </p>
        </div>
        
        {hasActiveFilters && (
          <>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              Save Current Search
            </Button>
            <SaveSearchDialog
              open={saveDialogOpen}
              onOpenChange={setSaveDialogOpen}
              filters={currentFilters}
              onSave={onSaveSearch}
              userId={userId}
            />
          </>
        )}
      </div>

      {/* Saved Searches List */}
      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              No Saved Searches Yet
            </h3>
            <p className="text-slate-500 mb-4">
              Save your search criteria to quickly find properties and get alerts for new listings.
            </p>
            {hasActiveFilters && (
              <Button onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save Current Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedSearches.map((search) => (
            <Card key={search.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {search.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        Created {formatDate(search.createdAt)}
                      </div>
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onLoadSearch(search)}
                      className="h-8 w-8 p-0"
                      title="Load Search"
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingSearch(search)}
                      className="h-8 w-8 p-0"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteSearch(search.id)}
                      disabled={deletingId === search.id}
                      className="h-8 w-8 p-0 text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                
                {/* Search Preview */}
                <div className="text-sm text-slate-600">
                  {getSearchPreview(search.filters) || "Basic search"}
                </div>

                {/* Location */}
                {(search.filters.city || search.filters.county) && (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-600">
                      {search.filters.city || search.filters.county}
                    </span>
                  </div>
                )}

                {/* Price Range */}
                {search.filters.priceRange && (
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-600">
                      ${search.filters.priceRange[0].toLocaleString()} - 
                      ${search.filters.priceRange[1].toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Features */}
                {search.filters.features && search.filters.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {search.filters.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature.replace('_', ' ')}
                      </Badge>
                    ))}
                    {search.filters.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{search.filters.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Alerts Toggle */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    {search.alertsEnabled ? (
                      <Bell className="h-3 w-3 text-green-600" />
                    ) : (
                      <BellOff className="h-3 w-3 text-slate-400" />
                    )}
                    <span className="text-slate-600">
                      Alerts {search.alertsEnabled ? 'on' : 'off'}
                    </span>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={search.alertsEnabled}
                    onChange={(e) => handleToggleAlerts(search.id, e.target.checked)}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onLoadSearch(search)}
                    className="flex-1"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    Load
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingSearch(search)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Search Dialog */}
      {editingSearch && (
        <SaveSearchDialog
          open={!!editingSearch}
          onOpenChange={(open) => !open && setEditingSearch(null)}
          filters={editingSearch.filters}
          onSave={async (updatedSearch) => {
            await onUpdateSearch(editingSearch.id, updatedSearch);
            setEditingSearch(null);
          }}
          userId={userId}
          existingSearch={editingSearch}
        />
      )}
    </div>
  );
}