import React from 'react';

const Controls = ({ muted, videoOff, onToggleAudio, onToggleVideo, onEndCall}) => {
    return (
        <div className='controls-bar'>
            <button onClick={onToggleAudio}>{muted ? 'Unmute' : 'Mute'}</button>
            <button onClick={onToggleVideo}>{videoOff ? 'Video On' : 'Video Off'}</button>
            <button onClick={onEndCall} className='end-call'>End Call</button>
        </div>
    );
}

export default Controls;