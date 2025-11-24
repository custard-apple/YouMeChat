import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://10.126.166.163:5000";
const STUN_SERVERS = [{urls: 'stun:stun.l.google.com:19302'}];

const useWebRTC = (roomId, isCreator) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const [status, setStatus] = useState('idle');
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);

    useEffect(() => {
        socketRef.current = io(SERVER_URL, {reconnectionAttempts: 5});
        socketRef.current.on('connect', () => {
            console.log('Connected to signaling server', socketRef.current.id);
        })

        socketRef.current.on('peer-joined', () => {
            console.log('peer-joined');
            setStatus('connecting');
        })

        socketRef.current.on('offer', async ({sdp, from}) => {
            console.log('Got Offer');
            await createPeerConnection();
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.selLocalDescription(answer);
            socketRef.current.emit('answer', {roomId, sdp:pcRef.current.localDescription});
            setStatus('Connected');
        });

        socketRef.current.on('answer', async ({sdp}) => {
            console.log('Got answer');
            if(!pcRef.current) return;
            await pcRef.current.setRemoteDescription( new RTCSessionDescription(sdp));
            setStatus('connected');
        });

        socketRef.current.on('ice-candidate', async ({candidate}) => {
            try {
                if(candidate && pcRef.current) {
                    await pcRef.current.addIceCandidate( new RTCIceCandidate(candidate));
                }
            } catch(err) {
                console.warn('Error adding remote ICE candidate', err);
            }
        });

        socketRef.current.on('peer-left', () => {
            console.log('peer-left');
            setStatus('disconnected');
            cleanupPeer();
        });

        socketRef.current.on('disconnect', ()=> {
            setStatus('disconnected');
        });

        socketRef.current.on('connect', () => {
            if(isCreator) {
                socketRef.current.emit('create-room', roomId, (res) => {
                    if(!res?.success) {
                        setStatus('error');
                        console.log(res?.error || 'Create room failed');
                    } else {
                        setStatus('waiting');
                    }
                })
            } else {
                socketRef.current.emit('join-room', roomId, (res) => {
                    if(!res?.status) {
                        setStatus('error');
                        console.log(res?.error || 'Join room failed');
                    } else {
                        setStatus('connecting');
                        createAndSendOffer();
                    }
                });
            }
        });

        return () => {
            socketRef.current?.disconnect();
            cleanupLocalStream();
            cleanupPeer();
        }

    }, [roomId, isCreator]);

    const getLocalStream = async () => {
        if(localStreamRef.current) return localStreamRef.current;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true, audio: true
            });
            localStreamRef.current = stream;
            console.log(localStreamRef, localVideoRef, 'testing')
            if(localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play();
            } else {
                console.warn('localVideoRef is not ready yet');
            }
            return stream;
        } catch(err) {
            console.log('There is User Media Error', err);
            setStatus('error');
            throw err;
        }
    }

    const createPeerConnection = async () => {
        if(pcRef.current) return pcRef.current;
        pcRef.current = new RTCPeerConnection({iceServers: STUN_SERVERS});

        pcRef.current.onicecandidate = (event) => {
            if(event.candidate) {
                socketRef.current.emit('ice-candidate', {roomId, candidate: event.candidate});
            }
        ;}

        pcRef.current.ontrack = (event) => {
            console.log('ontrack', event.streams);
            if(remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        pcRef.current.onconnectionstatechange = () => {
            const state = pcRef.current.connectionState;
            console.log('pc connection state', state);
            if(state ==='connected') setStatus('connected');
            if(state === 'disconnected' || state === 'failed' || state === 'closed') {
                setStatus('disconnected');
            }
        };

        const localStream = await getLocalStream();
        localStream.getTracks().forEach((track) => {
            pcRef.current.addTrack(track, localStream);
        });

        return pcRef.current;
    }

    const createAndSendOffer = async() => {
        try {
            await createPeerConnection();
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocationDescription(offer);
            socketRef.currentemit('offer', {roomId, sdp: pcRef.current.localDescription});
        } catch(err) {
            console.error('There is any issue creating and sending offer', err);
        }
    }
    const cleanupLocalStream = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
        }
    }

    const cleanupPeer = () => {
        if (pcRef.current) {
            try {
                pcRef.current.getSenders().forEach((s) => { try { if (s.track) s.track.stop(); } catch(e){}});
                pcRef.current.close();
            } catch (e) {}
            pcRef.current = null;
        }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }

    const toggleAudio = async () => {
        if(!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setMuted((m)=>!m);
    }

    const toggleVideo = async () => {
        if(!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach((t)=> (t.enabled = !t.enabled));
        setVideoOff((v) => !v);
    };

    const endCall = () => {
        socketRef.current.emit('leave-room', roomId);
        cleanupLocalStream();
        cleanupPeer();
        if(socketRef.current) socketRef.current.disconnect();
        setStatus('Disconnected');
    }

    return {
        localVideoRef,
        remoteVideoRef,
        status,
        muted,
        videoOff,
        toggleAudio,
        toggleVideo,
        endCall,
        getLocalStream,
        socket : socketRef.current
    };
};

export default useWebRTC;
