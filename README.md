### This is a complementary library that should be used with @tanstack/react-query for API REQUESTS and more

## WHY THIS PACKAGE?

We have been working on a project using ReactJS and React-Native and we were happy with the React-Query package, now known as Tanstack-Query, which had made our lives easier by managing most of the state management features needed for enterprise software development. This had helped us focus on building functionalities easily without worrying about server state management.

However, we still faced some challenges. For each project, we have to configure how Tanstack-Query would connect to the Backend API and manage GET, POST, PUT, and PATCH requests efficiently. One of the major challenges was handling dynamic queryKeys in Tanstack-Query. For example, when building a screen with pagination, useQuery will have re-call the queryFunction every time the key changed, which will load the current page data. This meant that the queryKey changed dynamically, and sometimes we needed to use the queryKey of the current page to perform certain tasks like updating a specific row in the view. This was always tedious.

But we were not discouraged. So, we set out to find a solution which led to the development of this package. This package would handle dynamic queryKeys in Tanstack-Query and solve other related problems. It made configuring Tanstack-Query to connect to the Backend API and managing GET, POST, PUT, and PATCH requests a breeze. It also solved the problem of dynamic queryKeys, making it much easier to update specific rows in the view.

---

> Please note that this package is still being developed and may not function as expected. We are working to refine its implementation structure to meet a functional standard. The documentation may not align with the current implementation, so if you encounter any difficulties while setting up the package, please raise an issue in the GitHub repository. We appreciate your patience and understanding as we work to improve this package.

### Tasks

- [✅] Global settings for requests
- [✅] Requests context implementations
- [✅] Post, Get, Patch Requests
- [✅] Query key tracker to track dynamic query and help fetch query cache from any page
- [✅] Persistent queries implementation (Not completed)
- [✅] Put request
- [✅] Generic return type (this is currently an issue if the API does not return object with the necessary properties required by the library)
- [✅] Generic Pagination for any response without infinite queries
- [✅] Infinite Get Query implementation (still using implementation meant for our use case)
- [✅] Enhanced middleware system with chainable middleware
- [✅] Cross-framework compatibility (Vite, Next.js, CRA, etc.)
- [❌] Server sent events
- [❌] Socket implementations
- [✅] Tests

## Installation

> You must install @tanstack/react-query and axios first to use this package

```
yarn add @tanstack/react-query axios
```

After that install this package

```
$ npm install @ventlio/tanstack-query
```

OR

```
$ yarn add @ventlio/tanstack-query
```

## CURRENT RETURN TYPE

Currently the library return type expects data structure of the below schema, so depending on the API design,
you can reach out to the developer to implement the return type that follows the below schema.

```js
export interface IRequestError {
  statusCode: number;
  message: string;
  timeStamp: Date;
  status: boolean;
  data?: any;
}

export interface IRequestSuccess<T> {
  statusCode: number;
  message: string;
  timeStamp: Date;
  status: boolean;
  data: T;
}
```

## Getting Started

Follow the below instructions to have the package running on your project

### Set the environment variables

```env
# For ReactJS
REACT_APP_API_URL='https://api.example.com'
REACT_APP_API_TIMEOUT=300000

# For NextJS
NEXT_PUBLIC_API_URL='https://api.example.com'
NEXT_PUBLIC_API_TIMEOUT=300000

# For Vite (New!)
VITE_API_URL='https://api.example.com'
VITE_API_TIMEOUT=300000
```

```js
import { QueryClient } from '@tanstack/react-query';
import { TanstackQueryConfig, bootstrapQueryRequest } from '@ventlio/tanstack-query';

// Global queryClient
const queryClient = new QueryClient();

// do this before adding the queryClient to QueryClientProvider
bootstrapQueryRequest(queryClient);

// recommended setup for mobile apps as the .env setup won't work
bootstrapQueryRequest(queryClient, {
  context: 'app', // this is required to make the library switch to app context where necessary
  environments: {
    appBaseUrl: baseUrl,
    appTimeout: 30000,
  },
  modelConfig: {
    idColumn: 'id', // used for useQueryModel to uniquely identify query data in a collection/array instance
  },
  // NEW: Configure custom pagination
  pagination: {
    pageParamName: 'page', // default page parameter name
    // Custom function to extract pagination data from response
    extractPagination: (response) => {
      // Example for a different API format
      return {
        current_page: response.data.meta.currentPage,
        next_page: response.data.meta.currentPage + 1,
        previous_page: response.data.meta.currentPage - 1,
        size: response.data.meta.perPage,
        page_count: response.data.meta.lastPage,
        total: response.data.meta.total,
      };
    },
    // Custom function to build pagination URL
    buildPaginationUrl: (url, page) => {
      // Custom implementation
      const [pathname, queryString] = url.split('?');
      const queryParams = new URLSearchParams(queryString || '');
      queryParams.set('page', String(page));
      return pathname + '?' + queryParams.toString();
    },
  },
  // NEW: Enhanced middleware system
  middleware: [
    // Array of middleware functions that will be executed in order
    async (context, next) => {
      // Log request
      console.log('Request:', context.path);

      // Continue to next middleware or make the request
      const response = await next();

      // Log response
      console.log('Response:', response);

      return response;
    },
    // Authentication middleware
    async (context, next) => {
      // Add authentication token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        context.headers = {
          ...context.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Continue to next middleware or make the request
      const response = await next();

      // Handle 401 errors
      if (response.statusCode === 401) {
        // Redirect to login or refresh token
        window.location.href = '/login';
      }

      return response;
    },
  ],
});
```

You can now use it in a QueryClientProvider

```jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
      <About />
    </QueryClientProvider>
  );
}
```

Updating the configurations inside a component

```jsx
import { useQueryBaseURL, useQueryHeaders, useQueryTimeout } from '@ventlio/tanstack-query';

function LoginPage() {
  const { headers, setQueryHeaders } = useQueryHeaders();
  const [authToken, setAuthToken] = useState();
  useEffect(() => {
    // after user has logged in successfully set the authorization header token
    // this should also be done mostly in the layout that contains the authenticated views of the app
    // for instance in AuthLayout, so that after login in the authToken can still be used to authenticate future request
    // when user refreshes the page
    setQueryHeaders({ Authorization: `Bearer ${authToken}` });
  }, []);

  return <>{/** codes */}</>;
}
```

## New Features

### 1. Enhanced Middleware System

The library now supports a chainable middleware system that allows you to intercept and modify requests and responses:

```jsx
// Define middleware functions
const loggingMiddleware = async (context, next) => {
  console.log('Request:', context.path);
  const response = await next();
  console.log('Response:', response);
  return response;
};

const authMiddleware = async (context, next) => {
  // Add authentication token
  const token = localStorage.getItem('auth_token');
  if (token) {
    context.headers = {
      ...context.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return await next();
};

// Use middleware in bootstrap
bootstrapQueryRequest(queryClient, {
  middleware: [loggingMiddleware, authMiddleware],
});
```

### 2. Configurable Pagination

The library now supports custom pagination configuration to work with any API format:

```jsx
// Global pagination configuration
bootstrapQueryRequest(queryClient, {
  pagination: {
    pageParamName: 'page', // default page parameter name
    extractPagination: (response) => {
      // Custom extraction for your API format
      return {
        current_page: response.data.meta.current,
        next_page: response.data.meta.current + 1,
        previous_page: response.data.meta.current - 1,
        size: response.data.meta.per_page,
        page_count: response.data.meta.last_page,
        total: response.data.meta.total,
      };
    },
    buildPaginationUrl: (url, page) => {
      // Custom URL builder
      const [pathname, queryString] = url.split('?');
      const queryParams = new URLSearchParams(queryString || '');
      queryParams.set('page', String(page));
      return pathname + '?' + queryParams.toString();
    },
  },
});

// Per-request pagination configuration
const { data, nextPage, prevPage } = useGetRequest({
  path: '/api/users',
  load: true,
  paginationConfig: {
    // Override global pagination config for this specific request
    pageParamName: 'p', // Use 'p' instead of 'page' for this API
    extractPagination: (response) => {
      // Custom extraction for this specific API
      return {
        current_page: response.data.page,
        next_page: response.data.page + 1,
        previous_page: response.data.page - 1,
        size: response.data.limit,
        page_count: Math.ceil(response.data.total / response.data.limit),
        total: response.data.total,
      };
    },
  },
});
```

### 3. Cross-Framework Compatibility

The library now automatically detects and works with various React frameworks:

- Create React App (CRA)
- Next.js
- Vite
- React Native
- Expo

Environment variables are automatically detected based on the framework's conventions:

```js
// For CRA: REACT_APP_API_URL
// For Next.js: NEXT_PUBLIC_API_URL
// For Vite: VITE_API_URL
// For React Native: Provided in the bootstrap config
```

# Hooks

## useGetRequest Hook

The `useGetRequest` hook is a custom React Query hook that handles GET requests. It returns an object that contains the current state of the query, as well as several methods to update the query.

## Parameters

The `useGetRequest` hook takes an object as its parameter with the following properties:

- `path`: a string representing the URL path for the GET request. Required.
- `load`: a boolean indicating whether to load the query immediately. Default: `false`.
- `queryOptions`: an object containing additional options for the query. Optional.
- `keyTracker`: a string that tracks changes to the query key. Optional.

## Return Value

The `useGetRequest` hook returns an object with the following properties:

- `data`: the data returned by the query, if successful.
- `isLoading`: a boolean indicating whether the query is currently loading.
- `isError`: a boolean indicating whether the query resulted in an error.
- `error`: the error message, if an error occurred.
- `updatePath`: a function that updates the path of the query.
- `nextPage`: a function that navigates to the next page of results, if pagination is present.
- `prevPage`: a function that navigates to the previous page of results, if pagination is present.
- `get`: a function that updates the path and options of the query and returns the data.
- `gotoPage`: a function that navigates to a specific page of results, if pagination is present.
- `page`: the current page number, if pagination is present.
- `queryKey`: an array representing the query key.

## Example Usage

```jsx
import { useGetRequest } from '@ventlio/tanstack-query';

const MyComponent = () => {
  const { data, isLoading, isError, error, updatePath, nextPage, prevPage, get, gotoPage, page, queryKey } =
    useGetRequest({
      path: '/api/mydata',
      load: true,
      queryOptions: {
        staleTime: 10000,
        refetchOnWindowFocus: false,
      },
      keyTracker: 'mydata',
    });

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {isError && <p>{error.message}</p>}
      {data && (
        <ul>
          {data.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
      <button onClick={() => nextPage()}>Next Page</button>
      <button onClick={() => prevPage()}>Previous Page</button>
      <button onClick={() => gotoPage(1)}>Go to Page 1</button>
      <button onClick={() => get('/api/mydata?page=2')}>Get Page 2</button>
    </div>
  );
};
```

## `usePostRequest` Hook

The `usePostRequest` function is a custom React hook that provides an easy way to make POST requests using the `@tanstack/react-query` library.

## Usage

To use the `usePostRequest` hook, import it from the module where it's defined and call it in your component like this:

```jsx
import { usePostRequest } from '@ventlio/tanstack-query';

const MyComponent = () => {
  const { post, isLoading, isError, isSuccess, data, error } = usePostRequest({
    path: '/api/posts',
    isFormData: true,
  });

  const handleFormSubmit = async (formData) => {
    try {
      const response = await post(formData);
      console.log(response);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* form inputs */}
      <button type="submit">Submit</button>
    </form>
  );
};
```

## Parameters

The `usePostRequest` hook takes an object with two optional properties:

- `path` (required): the URL path to make the POST request to.
- `isFormData` (optional, default is `false`): a boolean that indicates whether to send the request data as form data.

## Returns

The `usePostRequest` hook returns an object with the following properties:

- `post`: a function that takes the data to be sent in the request and an optional `MutateOptions` object, and returns a promise that resolves to the response data.
- `isLoading`: a boolean that indicates whether the request is currently loading.
- `isError`: a boolean that indicates whether the request resulted in an error.
- `isSuccess`: a boolean that indicates whether the request was successful.
- `data`: the response data, if the request was successful.
- `error`: the error object, if the request resulted in an error.

## Implementation Details

The `usePostRequest` hook internally uses the `useMutation` hook from the `@tanstack/react-query` library to register a mutation that sends the POST request. It also uses the internal `makeRequest` function to actually make the request.

It users the `useQueryConfig` hook internally to get the `headers`, `baseURL`, and `timeout` values that are passed to `makeRequest`.

If the request is successful, the hook scrolls the page to the top using the `window.scrollTo` method. If the request fails, it also scrolls to the top before throwing the error.

## `usePatchRequest` Hook

`usePatchRequest` is a React hook that allows you to make PATCH requests. It takes in a `path` parameter that specifies the path of the API endpoint to call.

```typescript
usePatchRequest<TResponse>({ path: string }): { patch, ...mutation }
```

### Parameters

- `path` (required): A string that represents the path of the API endpoint to call.

### Return Values

`usePatchRequest` returns an object with the following properties:

- `patch`: A function that can be called to initiate a PATCH request.
- `...mutation`: The rest of the properties returned by the `useMutation` hook.

### Example

```jsx
import { usePatchRequest } from '@ventlio/tanstack-query';

function App() {
  const { patch, isLoading, isError, isSuccess, data } =
    usePatchRequest <
    User >
    {
      path: '/users/1',
    };

  const updateUser = async (user: User) => {
    await patch(user);
  };

  return (
    <div>
      <button onClick={() => updateUser({ name: 'John' })}>Update User</button>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error updating user</div>}
      {isSuccess && <div>Successfully updated user {data?.name}</div>}
    </div>
  );
}
```

In this example, we are using the `usePatchRequest` hook to send a PATCH request to update a user's name. We call the `patch` function with the new user data to initiate the request. The `isLoading`, `isError`, `isSuccess`, and `data` properties are used to display the request status and response data.

Note that we have assumed the existence of a `User` interface in this example.

## `useDeleteRequest` Hook

The `useDeleteRequest` hook is a custom hook used to make HTTP DELETE requests using `@tanstack/react-query` library. This hook returns an object that contains a `destroy` function and other properties inherited from the `useQuery` hook.

### Parameters

This hook does not take any parameter.

### Return value

The hook returns an object containing:

- `destroy`: a function used to make the DELETE request and returns the server's response.
- Other properties inherited from the `useQuery` hook.

### Example

Here's an example of how to use the `useDeleteRequest` hook:

```jsx
import { useDeleteRequest } from '@ventlio/tanstack-query';

function DeleteButton({ link }) {
  const { isLoading, isError, error, data, destroy } = useDeleteRequest();

  const handleDelete = async () => {
    const response = await destroy(link);
    // do something with the response
  };

  return (
    <button onClick={handleDelete} disabled={isLoading}>
      {isLoading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

In the above example, we created a `DeleteButton` component that uses the `useDeleteRequest` hook to make a DELETE request to the specified `link` when the button is clicked. The `destroy` function returns the server's response, which we can then use to update the UI.

# useRefetchQuery

A simple utility function that utilizes `useQueryClient` hook from `@tanstack/react-query` to refetch a query and retrieve updated data.

## Usage

1. Import `useRefetchQuery` from your desired file:

```javascript
import { useRefetchQuery } from '@ventlio/tanstack-query';
```

2. Call `useRefetchQuery` with a `queryKey` parameter which is an array of any types that uniquely identifies the query:

```javascript
const { refetchQuery } = useRefetchQuery(['myQueryKey']);
```

3. Invoke `refetchQuery` function to refetch the query and retrieve updated data:

```javascript
const { data } = await refetchQuery<MyDataType>();
```

If you want to refetch a different query, you can pass a different `
