### This is not a replacement for @tanstack/react-query

## WHY THIS PACKAGE?

We have been working on a project using ReactJS and React-Native and we were happy with the React-Query package, now known as Tanstack-Query, which had made our lives easier by managing most of the state management features needed for enterprise software development. This had helped us focus on building functionalities easily without worrying about server state management.

However, we still faced some challenges. For each project, we have to configure how Tanstack-Query would connect to the Backend API and manage GET, POST, PUT, and PATCH requests efficiently. One of the major challenges was handling dynamic queryKeys in Tanstack-Query. For example, when building a screen with pagination, useQuery will have re-call the queryFunction every time the key changed, which will load the current page data. This meant that the queryKey changed dynamically, and sometimes we needed to use the queryKey of the current page to perform certain tasks like updating a specific row in the view. This was always tedious.

But we were not discouraged. So, we set out to find a solution which led to the development of this package. This package would handle dynamic queryKeys in Tanstack-Query and solve other related problems. It made configuring Tanstack-Query to connect to the Backend API and managing GET, POST, PUT, and PATCH requests a breeze. It also solved the problem of dynamic queryKeys, making it much easier to update specific rows in the view.

---

> Please note that this package is still being developed and may not function as expected. We are working to refine its implementation structure to meet a functional standard. The documentation may not align with the current implementation, so if you encounter any difficulties while setting up the package, please raise an issue in the GitHub repository. We appreciate your patience and understanding as we work to improve this package.

## Install

> You must install @tanstack/react-query and axios first to use this package

```
npm install @tanstack/react-query axios
```

After that install this package

```
$ npm install @ventlio/tanstack-query
```

```
$ yarn add @ventlio/tanstack-query
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

```
```js
import { QueryClient } from '@tanstack/react-query';
import { TanstackQueryConfig, bootstrapQueryRequest } from '@ventlio/tanstack-query';

// Global queryClient
const queryClient = new QueryClient();

// do this before adding the queryClient to QueryClientProvider
bootstrapQueryRequest(queryClient);

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
import {
  useQueryBaseURL,
  useQueryHeaders,
  useQueryTimeout,
} from '@ventlio/tanstack-query';

function LoginPage() {
  const { headers, setQueryHeaders } = useQueryHeaders();

  useEffect(() => {
    // after user has logged in successfully set the authorization header token
    headers.Authorization = 'Bearer token'; // this will be used for subsequent queries
    setQueryHeaders(headers);
  }, []);

  return <>{/** codes */}</>;
}
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
  const {
    data,
    isLoading,
    isError,
    error,
    updatePath,
    nextPage,
    prevPage,
    get,
    gotoPage,
    page,
    queryKey,
  } = useGetRequest({
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

If you want to refetch a different query, you can pass a different `queryKey` parameter to `refetchQuery` function:

```javascript
const { data } = (await refetchQuery) < MyDataType > ['myOtherQueryKey'];
```

If you want to perform additional operations after refetching the query, you can use the `data` returned by `refetchQuery` function:

```javascript
const { data } = await refetchQuery<MyDataType>();
// Perform additional operations with data
```

## Parameters

- `queryKey`: An array of any types that uniquely identifies the query.

## Return Value

- `refetchQuery`: A function that refetches the query and retrieves updated data.

## Example

```javascript
import { useQueryClient } from '@tanstack/react-query';
import { useRefetchQuery } from '@ventlio/tanstack-query';

const MyComponent = () => {
  const queryClient = useQueryClient();

  const { refetchQuery } = useRefetchQuery(['myQueryKey']);

  const handleClick = async () => {
    try {
      // Refetch the query and retrieve updated data
      const { data } = await refetchQuery<MyDataType>();

      // Perform additional operations with data
      console.log(data);
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  return (
    <button onClick={handleClick}>
      Refetch Query
    </button>
  );
};
```

# useKeyTrackerModel

A custom hook that utilizes `useQueryClient` hook from `@tanstack/react-query` and `useState` hook from `react` to track a query key and retrieve query data.

## Usage

1. Import `useKeyTrackerModel` from @ventlio/tanstack-query:

```javascript
import { useKeyTrackerModel } from '@ventlio/tanstack-query';
```

2. Call `useKeyTrackerModel` with a `keyTracker` parameter which is a string that uniquely identifies the query key:

```javascript
const { refetchQuery, getQueryKey, queryKey, data } =
  useKeyTrackerModel < MyDataType > 'myKeyTracker';
```

3. Invoke `getQueryKey` function to retrieve the query key:

```javascript
const key = getQueryKey();
```

4. Invoke `refetchQuery` function to retrieve query data:

```javascript
const queryData = refetchQuery();
```

5. Use `queryKey` and `data` as needed in your component:

```javascript
return (
  <div>
    <p>Query Key: {queryKey}</p>
    <p>Query Data: {data}</p>
  </div>
);
```

## Parameters

- `keyTracker`: A string that uniquely identifies the query key.

## Return Value

- `refetchQuery`: A function that retrieves query data.
- `getQueryKey`: A function that retrieves the query key.
- `queryKey`: The query key.
- `data`: The query data.

## Example

```javascript
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useKeyTrackerModel } from '@ventlio/tanstack-query';

const MyComponent = () => {
  const queryClient = useQueryClient();

  const { refetchQuery, getQueryKey, queryKey, data } =
    useKeyTrackerModel < MyDataType > 'myKeyTracker';

  const handleClick = async () => {
    // Retrieve the query key
    const key = getQueryKey();

    // Retrieve query data
    const queryData = refetchQuery();

    // Perform additional operations with query key and data
    console.log(key, queryData);
  };

  return (
    <div>
      <button onClick={handleClick}>Get Query Data</button>
      <p>Query Key: {queryKey}</p>
      <p>Query Data: {data}</p>
    </div>
  );
};
```

## Contributing

Contributions to this codebase are welcome. If you find any issues or have any suggestions, please feel free to create an issue or pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
