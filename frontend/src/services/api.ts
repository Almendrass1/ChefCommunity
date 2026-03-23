const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // If body is FormData, don't set Content-Type header manually (browser does it with boundary)
    if (options.body instanceof FormData) {
        delete (headers as any)['Content-Type'];
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

export const api = {
    auth: {
        login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        getMe: () => request<any>('/auth/me'),
    },
    recipes: {
        getAll: (params: { sort?: string; search?: string; category?: string; difficulty?: string; fridge?: boolean; ingredients?: string; max_time?: number } = {}) => {
            const query = new URLSearchParams();
            if (params.sort) query.append('sort', params.sort);
            if (params.search) query.append('search', params.search);
            if (params.category) query.append('category', params.category);
            if (params.difficulty) query.append('difficulty', params.difficulty);
            if (params.fridge) query.append('fridge', 'true');
            if (params.ingredients) query.append('ingredients', params.ingredients);
            if (params.max_time) query.append('max_time', params.max_time.toString());
            const queryString = query.toString();
            return request<any[]>(`/recipes${queryString ? `?${queryString}` : ''}`);
        },
        getOne: (id: number) => request<any>(`/recipes/${id}`),
        create: (formData: FormData) => request<any>('/recipes', { method: 'POST', body: formData }),
        update: (id: number, formData: FormData) => request<any>(`/recipes/${id}`, { method: 'PUT', body: formData }),
        delete: (id: number) => request<any>(`/recipes/${id}`, { method: 'DELETE' }),
        toggleLike: (id: number) => request<any>(`/recipes/${id}/like`, { method: 'POST' }),
        addReview: (id: number, data: FormData | { rating: number; comment: string }) => {
            const options: RequestInit = { method: 'POST' };
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
            }
            return request<any>(`/recipes/${id}/reviews`, options);
        },
    },
    users: {
        getProfile: (id: number) => request<any>(`/users/${id}`),
        updateProfile: (formData: FormData) => request<any>('/users/me', { method: 'PUT', body: formData }),
        follow: (id: number) => request<any>(`/users/${id}/follow`, { method: 'POST' }),
        getMealPlan: () => request<any[]>('/users/me/meal-plan'),
        addToMealPlan: (data: any) => request<any>('/users/me/meal-plan', { method: 'POST', body: JSON.stringify(data) }),
        deleteMealPlanItem: (id: number) => request<any>(`/users/me/meal-plan/${id}`, { method: 'DELETE' }),
        getFavorites: () => request<any[]>('/users/me/likes'),
        generateShoppingList: () => request<any[]>('/users/me/shopping-list/generate'),
    },
};
