# @ventlio/tanstack-query: Comprehensive Technical Overview

## Introduction

`@ventlio/tanstack-query` is a specialized wrapper library built around TanStack Query (formerly React Query) designed to streamline and standardize HTTP REST API interactions in React and React Native applications. This library addresses common challenges in API integration, such as dynamic query key management, standardized response handling, pagination, file uploads, and cross-platform compatibility.

## Core Problem Statement

When building applications with React and React Native that interact with REST APIs, developers often face several challenges:

1. Configuring TanStack Query to connect with backend APIs efficiently
2. Managing dynamic query keys for operations like pagination
3. Standardizing request/response formats across the application
4. Handling file uploads and form data consistently
5. Supporting both web and mobile environments with the same codebase

This library provides solutions to these challenges through a unified API that works seamlessly across platforms.

## Folder Structure and Architecture

```
src/
├── __tests__/           # Test files
├── config/              # Configuration setup
│   ├── bootStore.ts     # Store for bootstrap configuration
│   ├── bootstrapQueryRequest.ts # Main initialization function
│   ├── useEnvironmentVariables.ts # Environment variable access
│   ├── useQueryHeaders.ts # Header management
│   ├── useReactNativeEnv.ts # React Native environment detection
│   └── index.ts
├── helpers/             # Utility functions
├── hooks/               # Custom React hooks
│   ├── useUploadProgress.ts # Track file upload progress
│   └── index.ts
├── model/               # Query data modeling
│   ├── useQueryModel.ts # Model operations (CRUD)
│   ├── useKeyTrackerModel.ts # Query key tracking
│   ├── useRefetchQuery.ts # Query refetching
│   ├── model.interface.ts # Model interfaces
│   └── index.ts
├── queries/             # Query hooks for HTTP methods
│   ├── useGetRequest.ts # GET requests
│   ├── usePostRequest.ts # POST requests
│   ├── usePatchRequest.ts # PATCH requests
│   ├── usePutRequest.ts # PUT requests
│   ├── useDeleteRequest.ts # DELETE requests
│   ├── useGetInfiniteRequest.ts # Infinite queries
│   ├── queries.interface.ts # Query interfaces
│   └── index.ts
├── request/             # HTTP request handling
│   ├── make-request.ts  # Core request function
│   ├── axios-instance.ts # Axios configuration
│   ├── transformer.ts   # Response transformation
│   ├── buildFormData.ts # Form data handling
│   ├── request.interface.ts # Request interfaces
│   ├── request.enum.ts  # Request enums
│   └── index.ts
├── stores/              # Global state management
│   ├── useHeaderStore.ts # Header state
│   ├── useBaseUrlStore.ts # Base URL state
│   ├── usePauseFutureRequests.ts # Request pausing
│   └── index.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── env.d.ts             # Environment variable types
└── index.ts             # Main entry point
```

## Core Components and Their Interactions

### 1. Initialization and Configuration

The library is initialized using the `bootstrapQueryRequest` function, which sets up the global configuration:

```typescript
bootstrapQueryRequest(queryClient, {
  context: 'web', // or 'app' for React Native
  environments: {
    appBaseUrl: 'https://api.example.com',
    appTimeout: 30000,
  },
  modelConfig: {
    idColumn: 'id', // Used for model operations
  },
  middleware: async (next, configs) => {
    // Custom middleware for request/response processing
    return await next();
  },
});
```

This configuration is stored in a Zustand store (`bootStore`) and accessed throughout the library.

### 2. Request Handling

The core of the library is the `makeRequest` function in `request/make-request.ts`, which:

1. Configures the request based on the provided options
2. Handles form data and file uploads
3. Makes the request using Axios
4. Transforms the response to a standardized format
5. Handles errors consistently

```typescript
export async function makeRequest<TResponse>({
  body,
  method,
  path,
  isFormData,
  headers,
  baseURL,
  timeout,
  appFileConfig,
  onUploadProgress,
}: IMakeRequest): Promise<IRequestSuccess<TResponse> | IRequestError> {
  // Implementation details
}
```

### 3. Query Hooks

The library provides hooks for different HTTP methods, all built on top of TanStack Query:

#### `useGetRequest`

```typescript
const { data, isLoading, isError, error, updatePath, nextPage, prevPage, get, gotoPage, page, queryKey } =
  useGetRequest({
    path: '/api/users',
    load: true,
    queryOptions: { staleTime: 60000 },
    keyTracker: 'users',
  });
```

This hook handles GET requests with pagination support and query key tracking.

#### `usePostRequest`

```typescript
const { post, isLoading, isError, error, isSuccess, data, uploadProgressPercent } = usePostRequest({
  path: '/api/users',
  isFormData: true,
  fileSelectors: ['avatar'],
});

// Usage
const handleSubmit = async (formData) => {
  await post(formData);
};
```

Similar hooks exist for `usePatchRequest`, `usePutRequest`, `useDeleteRequest`, and `useGetInfiniteRequest`.

### 4. Query Model

The `useQueryModel` hook provides a model-like interface for working with query data:

```typescript
const model = useQueryModel<User>('users');

// Find all users
const users = model.findAll();

// Find a specific user
const user = model.find(123);

// Update a user
model.update(123, { name: 'New Name' });

// Add a user
model.add({ id: 456, name: 'New User' });

// Remove a user
model.remove(123);
```

This is particularly useful for updating specific items in a collection without refetching the entire list.

### 5. State Management

The library uses Zustand for global state management:

- `useHeaderStore`: Manages global headers for all requests
- `useBaseUrlStore`: Manages the base URL for requests
- `usePauseFutureRequests`: Controls pausing of future requests

```typescript
// Set global headers
const { setQueryHeaders } = useQueryHeaders();
setQueryHeaders({ Authorization: `Bearer ${token}` });

// Pause future requests (e.g., when offline)
const { pauseFutureRequests, resumeFutureRequests } = usePauseFutureRequests();
pauseFutureRequests();
```

## Key Features and Implementation Details

### 1. Standardized Response Format

The library expects and transforms API responses to a standardized format:

```typescript
interface IRequestSuccess<T> {
  statusCode: number;
  message: string;
  timeStamp: Date;
  status: boolean;
  data: T;
}

interface IRequestError {
  statusCode: number;
  message: string;
  timeStamp: Date;
  status: boolean;
  data?: any;
}
```

This standardization simplifies error handling and data access throughout the application.

### 2. Dynamic Query Key Tracking

One of the library's key features is its ability to track dynamic query keys:

```typescript
// In a component with pagination
const { data, queryKey } = useGetRequest({
  path: '/api/users?page=1',
  keyTracker: 'users',
});

// In another component, access the same data
const { getQueryKey } = useKeyTrackerModel('users');
const queryKey = getQueryKey();
const queryClient = useQueryClient();
const data = queryClient.getQueryData(queryKey);
```

This solves the problem of accessing query data when the query key changes dynamically.

### 3. Pagination Support

The library provides built-in pagination support:

```typescript
const { data, nextPage, prevPage, gotoPage } = useGetRequest({
  path: '/api/users?page=1',
});

// Go to next page
nextPage();

// Go to previous page
prevPage();

// Go to specific page
gotoPage(3);
```

It automatically handles URL parameter updates and maintains the current page state.

### 4. File Upload Support

The library handles file uploads with progress tracking:

```typescript
const { post, uploadProgressPercent } = usePostRequest({
  path: '/api/upload',
  isFormData: true,
  fileSelectors: ['file'],
});

// In your component
return (
  <div>
    <input type="file" onChange={handleFileChange} />
    <button onClick={() => post(formData)}>Upload</button>
    <progress value={uploadProgressPercent} max="100" />
  </div>
);
```

### 5. Cross-Platform Support

The library detects the environment (web or React Native) and adjusts its behavior accordingly:

```typescript
// In src/config/useReactNativeEnv.ts
export const useReactNativeEnv = () => {
  const { context } = useStore(bootStore);
  const isApp = context === 'app';

  return {
    isApp,
  };
};
```

This allows the same code to work seamlessly in both web and mobile environments.

### 6. Middleware Support

The library supports custom middleware for request/response processing:

```typescript
bootstrapQueryRequest(queryClient, {
  middleware: async (next, configs) => {
    // Add custom logic before the request
    console.log('Request:', configs);

    // Make the request
    const response = await next();

    // Add custom logic after the request
    console.log('Response:', response);

    return response;
  },
});
```

This is useful for adding global error handling, logging, authentication, etc.

## Data Flow

1. **Request Initiation**:

   - A hook like `useGetRequest` is called with a path and options
   - The hook creates a query key based on the path and options
   - If `load` is true, the query is executed immediately

2. **Request Processing**:

   - The `makeRequest` function is called with the configured options
   - If middleware is configured, it's executed before the request
   - The request is made using Axios
   - The response is transformed to the standardized format

3. **Response Handling**:

   - If successful, the data is cached by TanStack Query
   - The hook returns the data and status information
   - If a `keyTracker` was provided, the query key is stored for later access

4. **Data Manipulation**:
   - The `useQueryModel` hook can be used to manipulate the cached data
   - Operations like add, update, and remove modify the cache without refetching
   - TanStack Query's invalidation and refetching mechanisms are used when needed

## Advanced Usage Patterns

### 1. Global Error Handling

```typescript
bootstrapQueryRequest(queryClient, {
  middleware: async (next, configs) => {
    try {
      const response = await next();
      return response;
    } catch (error) {
      if (error.statusCode === 401) {
        // Handle authentication error
        logout();
        redirectToLogin();
      }
      throw error;
    }
  },
});
```

### 2. Optimistic Updates

```typescript
const { post } = usePostRequest({ path: '/api/todos' });
const model = useQueryModel<Todo>('todos');

const addTodo = async (todo) => {
  // Optimistically add the todo to the cache
  model.add({ ...todo, id: 'temp-id' });

  try {
    // Make the actual request
    const response = await post(todo);

    // Update the cache with the real ID
    model.remove('temp-id');
    model.add(response.data);
  } catch (error) {
    // Revert the optimistic update
    model.remove('temp-id');
  }
};
```

### 3. Dependent Queries

```typescript
const { data: user } = useGetRequest({
  path: '/api/user',
  load: true,
  keyTracker: 'currentUser',
});

const { data: userPosts } = useGetRequest({
  path: user ? `/api/users/${user.id}/posts` : null,
  load: !!user,
  keyTracker: 'userPosts',
});
```

## Performance Considerations

1. **Caching Strategy**:

   - The library leverages TanStack Query's caching mechanisms
   - Default stale time and cache time can be configured globally
   - Individual queries can override these settings

2. **Request Deduplication**:

   - Multiple components requesting the same data will only trigger one network request
   - This is handled by TanStack Query's built-in deduplication

3. **Pagination Optimization**:

   - The library maintains page state and only fetches new pages when needed
   - Previous pages are cached and can be accessed without refetching

4. **Memory Management**:
   - The library doesn't introduce significant memory overhead beyond TanStack Query
   - Query garbage collection is handled by TanStack Query

## Limitations and Future Improvements

1. **Generic Return Type**:

   - Currently, the library expects a specific response format
   - Future versions could support more flexible response formats

2. **Infinite Query Support**:

   - The current implementation is tailored for specific use cases
   - A more generic implementation would be beneficial

3. **Server-Sent Events and WebSockets**:

   - Not currently supported but planned for future releases

4. **Test Coverage**:
   - More comprehensive tests are needed for better reliability

## Conclusion

`@ventlio/tanstack-query` provides a robust and flexible solution for handling HTTP REST API interactions in React and React Native applications. By addressing common challenges like dynamic query keys, standardized responses, and cross-platform compatibility, it significantly simplifies API integration and state management.

The library's architecture is designed to be extensible and adaptable to different use cases, making it suitable for a wide range of applications from simple CRUD operations to complex data management scenarios.
