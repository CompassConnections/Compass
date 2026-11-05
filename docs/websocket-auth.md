# WebSocket auth

The API websocket carries a mix of public and private topics. `backend/shared/src/websockets/topics.ts`
decides who may listen to what, and refuses anything it does not list.

| Topic                                | Who may subscribe |
| ------------------------------------ | ----------------- |
| `user/<uid>/comment`                 | Anyone            |
| `vote/<id>/comment`                  | Anyone            |
| `user/<uid>`                         | `<uid>` only      |
| `private-user/<uid>`                 | `<uid>` only      |
| `user-notifications/<uid>`           | `<uid>` only      |
| `private-user-messages/<uid>`        | `<uid>` only      |
| `private-user-messages/<uid>/typing` | `<uid>` only      |

## How a connection is identified

The client sends `identify` with a Firebase ID token on every connect and on every sign-in or sign-out.
The server verifies the token and takes the uid from it; the `uid` field of the message is ignored.
An `identify` without a token signs the connection out. The token is only checked at `identify`, which is
safe because the server closes every connection after 4 minutes and the client reconnects with a fresh one.

A refused topic is dropped and still acked as a success. Older clients have nothing handling a failed ack,
and the current client subscribes before its token is verified, then again once it is.
