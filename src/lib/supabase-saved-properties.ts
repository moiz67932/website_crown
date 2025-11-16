import { getSupabaseAuth } from './supabase-auth'

export interface SavedProperty {
  id: string
  user_id: string
  property_id: string
  listing_key: string
  property_data: any
  notes?: string
  tags?: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export class SupabaseSavedPropertiesService {
  // Save a property for a user
  static async saveProperty(
    userId: string,
    property: any,
    isFavorite: boolean = false,
    notes?: string,
    tags?: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const { error } = await supabase
        .from('user_saved_properties')
        .upsert({
          user_id: userId,
          property_id: property.listing_key,
          listing_key: property.listing_key,
          property_data: property,
          notes,
          tags,
          is_favorite: isFavorite,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,listing_key'
        })

      if (error) {
        console.error('Save property error:', error)
        return { success: false, message: 'Failed to save property' }
      }

      return { success: true, message: 'Property saved successfully' }
    } catch (error) {
      console.error('Save property error:', error)
      return { success: false, message: 'Failed to save property' }
    }
  }

  // Get all saved properties for a user
  static async getUserSavedProperties(userId: string): Promise<SavedProperty[]> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('user_saved_properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get saved properties error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get saved properties error:', error)
      return []
    }
  }

  // Get only favorite properties for a user
  static async getUserFavoriteProperties(userId: string): Promise<SavedProperty[]> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('user_saved_properties')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get favorite properties error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get favorite properties error:', error)
      return []
    }
  }

  // Check if a property is saved by user
  static async isPropertySaved(userId: string, listingKey: string): Promise<boolean> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return false
      }

      const { data, error } = await supabase
        .from('user_saved_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_key', listingKey)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Check saved property error:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Check saved property error:', error)
      return false
    }
  }

  // Remove a saved property
  static async removeSavedProperty(
    userId: string,
    listingKey: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const { error } = await supabase
        .from('user_saved_properties')
        .delete()
        .eq('user_id', userId)
        .eq('listing_key', listingKey)

      if (error) {
        console.error('Remove saved property error:', error)
        return { success: false, message: 'Failed to remove property' }
      }

      return { success: true, message: 'Property removed successfully' }
    } catch (error) {
      console.error('Remove saved property error:', error)
      return { success: false, message: 'Failed to remove property' }
    }
  }

  // Toggle favorite status
  static async togglePropertyFavorite(
    userId: string,
    listingKey: string,
    isFavorite: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const { error } = await supabase
        .from('user_saved_properties')
        .update({
          is_favorite: isFavorite,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('listing_key', listingKey)

      if (error) {
        console.error('Toggle favorite error:', error)
        return { success: false, message: 'Failed to update favorite status' }
      }

      return { success: true, message: 'Favorite status updated successfully' }
    } catch (error) {
      console.error('Toggle favorite error:', error)
      return { success: false, message: 'Failed to update favorite status' }
    }
  }

  // Update property notes
  static async updatePropertyNotes(
    userId: string,
    listingKey: string,
    notes: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const { error } = await supabase
        .from('user_saved_properties')
        .update({
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('listing_key', listingKey)

      if (error) {
        console.error('Update notes error:', error)
        return { success: false, message: 'Failed to update notes' }
      }

      return { success: true, message: 'Notes updated successfully' }
    } catch (error) {
      console.error('Update notes error:', error)
      return { success: false, message: 'Failed to update notes' }
    }
  }
}
