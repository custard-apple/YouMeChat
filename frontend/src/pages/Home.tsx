import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

const SERVER_URL = 'http://10.126.166.163:5000';
const Home: React.FC = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');

    const handleCreateRoom = () => {
        const newRoom = uuidv4().slice(0,8);
        const socket = io( SERVER_URL, { autoConnect: false });
        socket.connect();
        socket.emit('create-room', newRoom, (res) => {
            socket.disconnect();
            if(res?.success){
                navigate(`/call/${newRoom}`, {state: { isCreator: true}});
            } else {
                alert(res?.error || 'Error creating room. Please try again.');
            }
        });
    };

    const handleJoin = () => {
        if(!roomId.trim()) return alert('Please enter a valid Room ID');
        navigate(`/call/${roomId.trim()}`, { state:{ isCreator: false } });
    }

    return (
        <div className="home-page">
            <img src="/youmechat-96.png" />
            <h1>Welcome to YouMeChat</h1>
            <p>Your go-to platform for seamless video communication.</p>
            <div className='controls'>
                <button onClick={handleCreateRoom}>Create Room</button>
                <div className='mt-16 join-room'>
                    <input className="mr-16 mb-16" type="text" value={roomId} onChange={e => setRoomId(e.target.value)} placeholder='Enter Room ID' />
                    <button className='' onClick={handleJoin}>Join Room</button>
                </div>
                <p>
                    Create a room, copy the Room ID, and share it with your friends to start a video call instantly!
                </p>
            </div>
        </div>
    );
};

export default Home;