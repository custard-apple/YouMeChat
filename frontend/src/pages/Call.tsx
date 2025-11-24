import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useWebRTC from '../hooks/useWebRTC';
import Controls from '../components/Controls';

const Call: React.FC = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isCreator = location.state?.isCreator ?? false;

    const {
        localVideoRef,
        remoteVideoRef,
        status,
        muted,
        videoOff,
        toggleAudio,
        toggleVideo,
        endCall,
        getLocalStream,
    } = useWebRTC(roomId, isCreator);

    useEffect(() => {
        getLocalStream().catch((e) => {
            alert('Camera/Microphone access is required to join the call');
            navigate('/');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCopy = async () => {
        try {
            navigator.clipboard.writeText(roomId);
            alert('Room ID copied to clipboard');
        } catch (err) {
            console.warn('Failed to copy: ', err);
            alert(roomId);
        }
    }

    return (
        <div className="call-page">
            <div className='room-info'>
                <div className='room-id'>
                    Room ID: <span>{roomId}</span>
                </div>
                <div className='copy-room-id'>
                    <button onClick={handleCopy}>Copy Room ID</button>
                </div>
                <div className='status'>
                    Status: <span>{status}</span>
                </div>
            </div>

            <div className='video-section'>
                <div className='video-container'>
                    <video ref={localVideoRef} autoPlay muted playsInline className='local-video'></video>
                    <div className='label'>You</div>
                </div>
                <div className='video-container'>
                    <video ref={remoteVideoRef} autoPlay playsInline className='remote-video'></video>
                    <div className='label'>Peer</div>
                </div>
            </div>
            <Controls
                muted={muted}
                videoOff={videoOff}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onEndCall={() => {
                    endCall();
                    navigate('/');
                }}
            />
        </div>
    );
};

export default Call;