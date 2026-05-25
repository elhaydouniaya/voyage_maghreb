/**
 * API utility for MaghrebVoyage
 * Use this for all frontend-to-backend communication
 */

export const api = {
  // Trips
  trips: {
    getAll: async (params?: any) => {
      // Mock fetch
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetch(`/api/trips${query}`);
      return res.json();
    },
    getOne: async (slug: string) => {
      const res = await fetch(`/api/trips/${slug}`);
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.json();
    }
  },

  // Bookings
  bookings: {
    create: async (data: any) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    }
  }
};
