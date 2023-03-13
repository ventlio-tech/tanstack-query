### This is not a replacement for @tanstack/react-query

## WHY THIS PACKAGE?

We have been working on a project using ReactJS and React-Native and we were happy with the React-Query package, now known as Tanstack-Query, which had made our lives easier by managing most of the state management features needed for enterprise software development. This had helped us focus on building functionalities easily without worrying about server state management.

However, we still faced some challenges. For each project, we have to configure how Tanstack-Query would connect to the Backend API and manage GET, POST, PUT, and PATCH requests efficiently. One of the major challenges was handling dynamic queryKeys in Tanstack-Query. For example, when building a screen with pagination, useQuery will have re-call the queryFunction every time the key changed, which will load the current page data. This meant that the queryKey changed dynamically, and sometimes we needed to use the queryKey of the current page to perform certain tasks like updating a specific row in the view. This was always tedious.

But we were not discouraged. So, we set out to find a solution which led to the development of this package. This package would handle dynamic queryKeys in Tanstack-Query and solve other related problems. It made configuring Tanstack-Query to connect to the Backend API and managing GET, POST, PUT, and PATCH requests a breeze. It also solved the problem of dynamic queryKeys, making it much easier to update specific rows in the view.

---

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

```js
import { QueryClient } from '@tanstack/react-query';
import { TanstackQueryConfig } from '@ventlio/tanstack-query';

// Global queryClient
const queryClient = new QueryClient();

// do this before adding the queryClient to QueryClientProvider
queryClient.setQueryData <
  TanstackQueryConfig >
  (['config'],
  {
    baseURL: 'https://pokeapi.co/api/v2',
    timeout: 10000,
    headers: {
      Authorization: `Bearer Hello`,
    },
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
import {
  useQueryBaseURL,
  useQueryHeaders,
  useQueryTimeout,
} from '@ventlio/tanstack-query';

function LoginPage() {
  const { baseURL, setQueryBaseUrl } = useQueryBaseURL();
  const { headers, setQueryHeaders } = useQueryHeaders();
  const { timeout, setQueryTimeout } = useQueryTimeout();

  useEffect(() => {
    // after user has logged in successfully set the authorization header token
    headers.Authorization = 'Bearer token'; // this will be used for subsequent queries
    setQueryHeaders(headers);
  }, []);

  return <>{/** codes */}</>;
}
```

## Hooks

- `useQueryBaseURL()`
  return

  - `baseURL: string`; the global baseURL
  - `setBaseURL(url: string)`; update the global baseURL

- `useQueryHeaders()`
  return

  - `headers: RawAxiosRequestHeaders`; the global request headers
  - `setHeaders(headers: RawAxiosRequestHeaders)`; update the global request headers

- `useGetRequest<T>(config: { path, load, queryOptions })`

  - params
    - config
      - `path: string`: request path
      - `load: boolean`: if true the request starts immediately otherwise it will wait until it is triggered to true, defaults to false
      - `queryOptions: TanstackQueryOption<TResponse>`: query options
      - `keyTracker`: query key tracker for dynamic queries

- `usePostRequest<T>(config: { path, isFormData })`

  - params
    - config
      - `path: string`: request path
      - `isFormData: boolean`: set it to true if you want to upload file with the post request

- `useDeleteRequest<T>()`

  - params
    - no params

- `usePatchRequest<T>({ path })`
  - params
    - `path : string`: path to the request to be deleted

## Examples

Make fetch Request

```jsx
import { useGetRequest } from '@ventlio/tanstack-query';

function PostPage() {
  const { isLoading, data, isInitialLoading, get } = useGetRequest({
    path: '/posts/1',
    load: true,
  });

  if (isLoading || isInitialLoading || !data) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1> {data.data.title} </h1>
      <article> {data.data.description} </article>
    </div>
  );
}
```

## We welcome any contribution that will help the project
