import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVideoCallSession } from '../services/video-call.service';

const VideoCallTestPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const createTestSession = async () => {
    setIsCreating(true);
    try {
      const session = await createVideoCallSession({
        title: 'Test Video Call Session',
        description: 'This is a test video call session for demonstration',
        caregiverId: 'caregiver-1',
        careSeekerId: 'careseeker-1',
        scheduledTime: new Date().toISOString(),
        duration: 30,
        notes: 'Test session for demo purposes'
      });

      // Navigate to caregiver video call
      navigate(`/care-giver/video-call?meetingId=${session.meetingId}`);
    } catch (error) {
      console.error('Error creating test session:', error);
      alert('Error creating test session');
    } finally {
      setIsCreating(false);
    }
  };

  const joinAsCareSeeker = () => {
    const meetingId = prompt('Enter Meeting ID:');
    if (meetingId) {
      navigate(`/careseeker/video-consultation?meetingId=${meetingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Video Call Test
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={createTestSession}
            disabled={isCreating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Test Session (as Caregiver)'}
          </button>
          
          <button
            onClick={joinAsCareSeeker}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700"
          >
            Join as Care Seeker
          </button>
          
          <div className="text-center text-sm text-gray-500">
            <p>This is a test page for video call functionality.</p>
            <p>Use this to test the video call integration.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallTestPage;


