# React Email Starter

A live preview right in your browser so you don't need to keep sending real emails during development.

## Getting Started

First, install the dependencies:

```sh
yarn install
```

Then, run the development server:

```sh
yarn dev
```

Open [localhost:3001](http://localhost:3001) with your browser to see the result.


### Notes

Right now, I can't make the email server run without breaking the backend API and web, as they require different versions of react.

To run the email server, temporarily install the deps in this folder. They require react 19.
```bash
yarn add -D @react-email/preview-server react-email
```

When you are done, reinstall react 18.2 by running `yarn clean-install` at the root so that you can run the backend and web servers again.

## Useful commands

```bash

```