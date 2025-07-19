import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export async function externalApiRequest(endpoint: string) {
  const url = `http://34.63.198.88:8080${endpoint}`;
  console.log('Fetching from external API:', url);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      console.error('External API HTTP error:', res.status, res.statusText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('External API response received, length:', Array.isArray(data) ? data.length : 'not array');
    if (Array.isArray(data) && data.length > 0) {
      console.log('Sample project keys:', Object.keys(data[0]));
    }
    return data;
  } catch (error) {
    console.error('External API error:', error.message || error);
    throw error;
  }
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const keyString = queryKey.join("/") as string;
    
    // Use proxy endpoint for external projects
    if (keyString === "/api/projects/external") {
      // Use local proxy endpoint instead of direct external call
      const res = await fetch('/api/projects', {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }
    
    const res = await fetch(keyString, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
