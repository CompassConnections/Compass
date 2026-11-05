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

A public topic must not carry anything that depends on the viewer. `user/<uid>/comment` is an empty
"something changed" signal for that reason: subscribers refetch from `get-profile-comments`, which applies
the members-only, block and hidden rules. `vote/<id>/comment` still carries the comment, because
`vote_comments` can be read with the anon key anyway.

## How a connection is identified

The client sends `identify` with a Firebase ID token on every connect and on every sign-in or sign-out.
The server verifies the token and takes the uid from it; the `uid` field of the message is ignored.
An `identify` without a token signs the connection out. The token is only checked at `identify`, which is
safe because the server closes every connection after 4 minutes and the client reconnects with a fresh one.

A refused topic is dropped and still acked as a success. Older clients have nothing handling a failed ack,
and the current client subscribes before its token is verified, then again once it is.
