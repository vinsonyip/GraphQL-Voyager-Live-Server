# GraphQL-Voyager-Live-Server

This is a express server that empowered with hot-reload feature to detect file change and rerender the GraphQL to the GraphQL Voyager.

## How to use?

1. Clone this repo
2. Install dependencies

    ```bash
    npm install --legacy-peer-deps
    ```

3. Run the server

    ```bash
    npm start
    ```

## How it works?

1. Put your .graphql files in `schema` folder
2. Please be reminded that the `type Query {}` must occurs within any .graphql file in the `schema` folder, which works like an entry point of your schema

    - Only one `type Query {}` is allowed

3. When server start, it concats all the .graphql files in the `schema` folder and compile them into a single schema, so that the GraphQL schema becomes modulized.