// app/page.js

'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';


console.log("client working")
export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [strangerVideo, setStrangerVideo] = useState(null);

  const localVideoRef = useRef(null);
  const strangerVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection to the signaling server
    socketRef.current = io('https://server-webrtc-5ztd.onrender.com', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socketRef.current.on('offer', (offer) => {
      console.log('Received offer:', offer);
      handleOffer(offer);
    });

    socketRef.current.on('answer', (answer) => {
      console.log('Received answer:', answer);
      handleAnswer(answer);
    });

    socketRef.current.on('ice-candidate', (candidate) => {
      console.log('Received ICE candidate:', candidate);
      handleNewICECandidate(candidate);
    });

    // Setup the local video stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        console.log('Got local stream');
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setupPeerConnection(stream);
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const setupPeerConnection = (stream) => {
    console.log('Setting up peer connection');
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add the local stream to the peer connection
    stream.getTracks().forEach((track) => {
      console.log('Adding local track:', track.kind);
      peerConnectionRef.current.addTrack(track, stream);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        socketRef.current.emit('ice-candidate', event.candidate);
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (strangerVideoRef.current) {
        strangerVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnectionRef.current.iceConnectionState);
    };

    createOffer();
  };

  const createOffer = () => {
    peerConnectionRef.current
      .createOffer()
      .then((offer) => {
        return peerConnectionRef.current.setLocalDescription(offer);
      })
      .then(() => {
        socketRef.current.emit('offer', peerConnectionRef.current.localDescription);
      })
      .catch((error) => {
        console.error('Error creating offer:', error);
      });
  };

  const handleOffer = (offer) => {
    peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        return peerConnectionRef.current.createAnswer();
      })
      .then((answer) => {
        return peerConnectionRef.current.setLocalDescription(answer);
      })
      .then(() => {
        socketRef.current.emit('answer', peerConnectionRef.current.localDescription);
      })
      .catch((error) => {
        console.error('Error handling offer:', error);
      });
  };

  const handleAnswer = (answer) => {
    peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      .catch((error) => {
        console.error('Error handling answer:', error);
      });
  };

  const handleNewICECandidate = (candidate) => {
    peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      .catch((error) => {
        console.error('Error adding new ICE candidate:', error);
      });
  };

  return (
    <div>
      <h1>Your Video</h1>
      <video ref={localVideoRef} autoPlay playsInline width="300" height="240" />
      <h1>Stranger's Video</h1>
      <video ref={strangerVideoRef} autoPlay playsInline width="300" height="240" />
    </div>
  );
}
