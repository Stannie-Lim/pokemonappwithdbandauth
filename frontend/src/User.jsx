import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import socketio from "socket.io-client";

import UserContext from "./UserContext";

// we are currently on localhost:5173
// we want to connect to the server running on localhost:3000
const socket = socketio("http://localhost:3000");

const User = ({ logout }) => {
  const [pokemon, setPokemon] = useState("");
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [ownedPokemons, setOwnedPokemons] = useState([]);
  const [allMessages, setAllMessages] = useState([]);

  const user = useContext(UserContext);

  useEffect(() => {
    // whenever you enter homepage, we emit 'user_joined' event
    // to let the socket server know that user has joined
    socket.emit("user_joined", user);

    socket.on("all_users", (users) => {
      setLoggedInUsers(users);
    });

    socket.on("receive_message", (msgs) => {
      setAllMessages(msgs);
    });

    const getData = async () => {
      const response = await axios.get(
        "http://localhost:3000/api/user/my_pokemon",
        {
          headers: {
            authorization: window.localStorage.getItem("token"),
          },
        }
      );

      const ownedPokemon = response.data;

      setOwnedPokemons(ownedPokemon);
    };

    getData();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();

    const response = await axios.post(
      "http://localhost:3000/api/user/catch_pokemon",
      {
        pokemon,
      },
      {
        headers: {
          authorization: window.localStorage.getItem("token"),
        },
      }
    );

    const ownedPokemon = response.data;

    setOwnedPokemons(ownedPokemon);
  };

  const [selectedUserToChatWith, setSelectedUserToChatWith] = useState(null);
  const [message, setMessage] = useState("");

  const startChat = (toUser) => {
    // if we're trying to send a msg to ourself, dont
    if (toUser.user.id === user.id) {
      return;
    }

    setSelectedUserToChatWith(toUser);
  };

  const sendMessage = () => {
    socket.emit("send_message", {
      fromUser: user.id,
      toUser: selectedUserToChatWith.user.id,
      message,
    });
  };

  const receivedMessages = allMessages.filter(
    (message) => message.toUser === user.id
  );

  const sentMessages = allMessages.filter(
    (message) => message.fromUser === user.id
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <ul>
          {loggedInUsers.map((loggedInUser) => (
            <li
              style={{
                cursor:
                  loggedInUser.user.id === user.id ? undefined : "pointer",
              }}
              onClick={() => startChat(loggedInUser)}
              key={loggedInUser.socketId}
            >
              {loggedInUser.user.username}
            </li>
          ))}
        </ul>
        {selectedUserToChatWith && (
          <div
            style={{
              border: "1px solid lightseagreen",
              position: "relative",
              overflow: "scroll",
              minHeight: 400,
            }}
          >
            <h3>
              You are chatting with {selectedUserToChatWith.user.username}
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {allMessages.map((msg) => (
                <h3
                  style={{
                    textAlign: msg.toUser === user.id ? "left" : "right",
                  }}
                >
                  {msg.fromUser !== user.id
                    ? selectedUserToChatWith.user.username
                    : user.username}{" "}
                  - {msg.message}
                </h3>
              ))}
            </div>

            <div style={{ position: "absolute", bottom: 0 }}>
              <input
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
              />
              <button onClick={sendMessage}>Send message</button>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => {
          logout();
        }}
      >
        Log out
      </button>
      <h6>
        You are logged in as {user.username}. Your hashed password is{" "}
        {user.password}
      </h6>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Catch a pokemon"
          value={pokemon}
          onChange={(ev) => setPokemon(ev.target.value)}
        />
        <button>Catch em all</button>
      </form>
      <ul>
        {ownedPokemons.map((pokemon) => (
          <li key={pokemon.id}>{pokemon.name}</li>
        ))}
      </ul>
    </>
  );
};

export default User;
