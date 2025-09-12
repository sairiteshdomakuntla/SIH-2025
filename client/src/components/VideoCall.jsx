import React, { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Settings, Users, Shield, UserCheck, UserX } from 'lucide-react';

const VideoCall = ({ room, user, onLeaveCall, isVisible }) => {
  const jitsiContainerRef = useRef(null);
  const [api, setApi] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isModerator, setIsModerator] = useState(false);
  const [lobbyParticipants, setLobbyParticipants] = useState([]);
  const [roomPassword, setRoomPassword] = useState('');

  useEffect(() => {
    if (isVisible && room && user && jitsiContainerRef.current && !api) {
      initializeJitsi();
    }

    return () => {
      if (api) {
        api.dispose();
        setApi(null);
      }
    };
  }, [isVisible, room, user]);

  const initializeJitsi = () => {
    // Load Jitsi Meet API if not already loaded
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = () => createJitsiMeet();
      document.head.appendChild(script);
    } else {
      createJitsiMeet();
    }
  };

  const createJitsiMeet = () => {
    const domain = 'meet.jit.si';
    const roomName = `${room.roomId}-${room.subject}`.replace(/[^a-zA-Z0-9-_]/g, '');
    
    // Generate room password for security
    const password = generateRoomPassword();
    setRoomPassword(password);
    
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user.name || 'Anonymous',
        email: user.email || ''
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: true, // Enable lobby functionality
        disableModeratorIndicator: false,
        startScreenSharing: false,
        enableEmailInStats: false,
        enableClosePage: false,
        enableLobbyChat: true,
        enableInsecureRoomNameWarning: false,
        // Moderator settings
        enableUserRolesBasedOnToken: true,
        moderatedRoomServiceUrl: 'https://moderated.jitsi-meet.example.com',
        // Lobby settings
        enableLobbyUI: true,
        lobbyEnabled: true,
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'security'
        ]
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'security'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DISABLE_VIDEO_BACKGROUND: false,
        HIDE_INVITE_MORE_HEADER: false,
        SHOW_CHROME_EXTENSION_BANNER: false
      }
    };

    const jitsiAPI = new window.JitsiMeetExternalAPI(domain, options);
    setApi(jitsiAPI);

    // Event listeners
    jitsiAPI.addEventListener('participantJoined', (participant) => {
      console.log('Participant joined:', participant);
      setParticipantCount(prev => prev + 1);
    });

    jitsiAPI.addEventListener('participantLeft', (participant) => {
      console.log('Participant left:', participant);
      setParticipantCount(prev => Math.max(1, prev - 1));
    });

    jitsiAPI.addEventListener('audioMuteStatusChanged', ({ muted }) => {
      setIsAudioMuted(muted);
    });

    jitsiAPI.addEventListener('videoMuteStatusChanged', ({ muted }) => {
      setIsVideoMuted(muted);
    });

    // Moderator events
    jitsiAPI.addEventListener('participantRoleChanged', (data) => {
      console.log('Participant role changed:', data);
      if (data.id === jitsiAPI.getMyUserId()) {
        setIsModerator(data.role === 'moderator');
      }
    });

    // Lobby events
    jitsiAPI.addEventListener('knockingParticipant', (participant) => {
      console.log('Participant knocking:', participant);
      setLobbyParticipants(prev => {
        // Avoid duplicates
        if (!prev.find(p => p.id === participant.id)) {
          return [...prev, participant];
        }
        return prev;
      });
    });

    jitsiAPI.addEventListener('participantKicked', (participant) => {
      console.log('Participant kicked:', participant);
      setLobbyParticipants(prev => prev.filter(p => p.id !== participant.id));
    });

    // Conference events
    jitsiAPI.addEventListener('videoConferenceJoined', (participant) => {
      console.log('Conference joined:', participant);
      // Check if this is the first participant (becomes moderator)
      if (participantCount === 0) {
        setIsModerator(true);
        // Set lobby mode for future participants
        jitsiAPI.executeCommand('toggleLobby', true);
      }
    });

    jitsiAPI.addEventListener('readyToClose', () => {
      onLeaveCall();
    });

    jitsiAPI.addEventListener('videoConferenceLeft', () => {
      onLeaveCall();
    });

    // Password protection
    jitsiAPI.addEventListener('passwordRequired', () => {
      jitsiAPI.executeCommand('password', password);
    });
  };

  const generateRoomPassword = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const admitParticipant = (participantId) => {
    if (api && isModerator) {
      api.executeCommand('admitParticipant', participantId);
      setLobbyParticipants(prev => prev.filter(p => p.id !== participantId));
    }
  };

  const rejectParticipant = (participantId) => {
    if (api && isModerator) {
      api.executeCommand('rejectParticipant', participantId);
      setLobbyParticipants(prev => prev.filter(p => p.id !== participantId));
    }
  };

  const toggleLobby = () => {
    if (api && isModerator) {
      api.executeCommand('toggleLobby');
    }
  };

  const setPassword = () => {
    if (api && isModerator) {
      const newPassword = prompt('Enter room password (leave empty to remove):');
      if (newPassword !== null) {
        api.executeCommand('password', newPassword);
        setRoomPassword(newPassword);
      }
    }
  };

  const toggleAudio = () => {
    if (api) {
      api.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (api) {
      api.executeCommand('toggleVideo');
    }
  };

  const hangUp = () => {
    if (api) {
      api.executeCommand('hangup');
    }
    onLeaveCall();
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/community?join=${room.roomId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('Invite link copied to clipboard!');
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold flex items-center space-x-2">
              <span>{room.name}</span>
              {isModerator && (
                <Shield className="w-4 h-4 text-yellow-400" title="You are the moderator" />
              )}
            </h2>
            <p className="text-white/60 text-sm">{room.subject} • Video Call</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Lobby Panel for Moderators */}
          {isModerator && lobbyParticipants.length > 0 && (
            <div className="relative">
              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg px-3 py-2 mr-2">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-yellow-400" />
                  <span className="text-white text-sm">{lobbyParticipants.length} waiting</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-white text-sm">{participantCount}</span>
          </div>
          
          {isModerator && (
            <button
              onClick={setPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              title="Set Room Password"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={copyInviteLink}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            title="Copy Invite Link"
          >
            Invite
          </button>
          
          <button
            onClick={hangUp}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
            title="Leave Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lobby Management Panel (for moderators) */}
      {isModerator && lobbyParticipants.length > 0 && (
        <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 p-4">
          <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-yellow-400" />
            <span>Participants Waiting ({lobbyParticipants.length})</span>
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {lobbyParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {participant.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm">{participant.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => admitParticipant(participant.id)}
                    className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                    title="Admit Participant"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => rejectParticipant(participant.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                    title="Reject Participant"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 relative">
        <div 
          ref={jitsiContainerRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
        
        {/* Loading State */}
        {!api && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-white">Connecting to video call...</p>
              {isModerator && (
                <p className="text-yellow-400 text-sm mt-2">You are the moderator</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoMuted ? (
              <VideoOff className="w-5 h-5 text-white" />
            ) : (
              <Video className="w-5 h-5 text-white" />
            )}
          </button>

          {isModerator && (
            <button
              onClick={toggleLobby}
              className="p-3 rounded-full bg-yellow-600 hover:bg-yellow-700 transition-colors"
              title="Toggle Lobby"
            >
              <Shield className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        
        {/* Moderator Status */}
        {isModerator && (
          <div className="text-center mt-3">
            <div className="inline-flex items-center space-x-2 bg-yellow-600/20 border border-yellow-500/30 rounded-full px-3 py-1">
              <Shield className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 text-xs">You are the moderator</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;