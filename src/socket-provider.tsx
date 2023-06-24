import React, { createContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import io, { Socket } from "socket.io-client";

// Create a new context
export const SocketContext = createContext<Socket | undefined>(undefined);

// Create a provider component to wrap your app
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { register, handleSubmit, setValue } = useForm();
  const [orderNo, setOrderNo] = useState("");
  const [storeId, setStoreId] = useState("63632a3a45d09b39b8c7c083");
  const [messages, setMessages] = useState<
    {
      body: string;
      id: string;
      sender: { type: "OM" | "PWA"; name: string };
      orderNo: string;
      storeId: string;
    }[]
  >([]);
  const [socket, setSocket] = useState<Socket>();
  useEffect(() => {
    const socketio = io(
      "https://nest-socket-production.up.railway.app/socket/socket"
    ); // Replace with your server URL
    setSocket(socketio);
    socketio.emit("leaveAllRooms");
    setMessages([]);

    if (orderNo && storeId) {
      socketio.on("connect", () => {
        socketio.emit("joinRoom", { roomId: orderNo });
        socketio.emit("getOrderConversation", { orderNo, storeId });
      });
      socketio.on("getOrderConversation", (payload) => {
        setMessages(payload);
      });
      socketio.on("newMessage", (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload]);
      });
    }

    // Clean up the socket connection on component unmount
    return () => {
      socketio.disconnect();
    };
  }, [orderNo, storeId]);

  const onSubmit = (body) => {
    const data = {
      orderNo: orderNo,
      storeId: storeId,
      body: body.message,
      sender: {
        type: "PWA",
        name: "Chan",
      },
    };
    socket?.emit("newMessage", data);
    setValue("message", "");
  };

  return (
    <SocketContext.Provider value={socket}>
      {children}
      <div className="bg-gray-500 h-screen flex flex-col items-center justify-center">
        {/* Inputs */}
        <div className="bg-white p-2 mb-4 w-[500px]">
          <input
            className="w-full border-2 mb-4"
            placeholder="Enter order number here"
            onBlur={(e) => setOrderNo(e.currentTarget.value)}
          />
          <input
            defaultValue="63632a3a45d09b39b8c7c083"
            className="w-full border-2"
            placeholder="Enter store id here"
            onBlur={(e) => setStoreId(e.currentTarget.value)}
          />
        </div>
        {/* Chat Messages */}
        <div className="bg-white w-[500px] h-[300px] overflow-y-auto">
          {messages &&
            messages.map((message: any, key: number) => (
              <p key={key} className="p-1">
                {message.sender.name}: {message.body}
              </p>
            ))}
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-row w-[500px] bg-white"
        >
          <input
            className="border flex-1"
            {...register("message")}
            placeholder="Insert message here"
          />
          <button className="p-2 bg-green-200">Send</button>
        </form>
      </div>
    </SocketContext.Provider>
  );
};
