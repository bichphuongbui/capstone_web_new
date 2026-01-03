import React, { useRef, useState, useEffect } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const VideoCallPage: React.FC = () => {
	const [isMicOn, setIsMicOn] = useState<boolean>(true);
	const [isCamOn, setIsCamOn] = useState<boolean>(true);
	const [messages, setMessages] = useState<Array<{ id: number; sender: string; text: string }>>([
		{ id: 1, sender: 'Khách hàng', text: 'Chào bạn, chúng ta bắt đầu nhé?' },
		
	]);
	const [input, setInput] = useState<string>('');
	const listRef = useRef<HTMLDivElement | null>(null);
	const localVideoRef = useRef<HTMLVideoElement | null>(null);
	const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	// Start camera when component mounts
	useEffect(() => {
		const startCamera = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: true, 
					audio: true 
				});
				streamRef.current = stream;
				
				// Display local video
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				
				// Simulate remote video (you can replace this with actual remote stream)
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = stream;
				}
			} catch (error) {
				console.error('Error accessing camera:', error);
				alert('Không thể truy cập camera. Vui lòng cho phép truy cập camera trong trình duyệt.');
			}
		};

		startCamera();

		// Cleanup function
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop());
			}
		};
	}, []);

	// Toggle camera
	useEffect(() => {
		if (streamRef.current) {
			const videoTrack = streamRef.current.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = isCamOn;
			}
		}
	}, [isCamOn]);

	// Toggle microphone
	useEffect(() => {
		if (streamRef.current) {
			const audioTrack = streamRef.current.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = isMicOn;
			}
		}
	}, [isMicOn]);

	const appendMessage = () => {
		const text = input.trim();
		if (!text) return;
		setMessages((prev) => [...prev, { id: prev.length + 1, sender: 'Bạn', text }]);
		setInput('');
		setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 0);
	};

	const controlBtn = (active: boolean, on: () => void, off: () => void, IconOn: React.ComponentType<any>, IconOff: React.ComponentType<any>, labelOn: string, labelOff: string, activeColor: string) => (
		<button
			onClick={() => (active ? off() : on())}
			className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white ${active ? activeColor : 'bg-gray-500'} hover:opacity-90`}
		>
			{active ? <IconOn /> : <IconOff />}
			<span>{active ? labelOn : labelOff}</span>
		</button>
	);

	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Phòng Gọi Video</h1>
					<p className="mt-1 text-sm text-gray-600">Kết nối với khách hàng qua cuộc gọi video</p>
				</div>

				<div className="mt-6 grid lg:grid-cols-3 gap-4">
					{/* Video area (70%) */}
					<div className="lg:col-span-2 rounded-2xl bg-black relative overflow-hidden">
						{/* Main video - Remote stream */}
						<video 
							ref={remoteVideoRef}
							autoPlay 
							playsInline
							muted
							className="aspect-video w-full bg-gray-900 object-cover"
						/>
						{!isCamOn && (
							<div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-gray-400">
								Camera đã tắt
							</div>
						)}
						
						{/* Small self camera */}
						<div className="absolute bottom-20 right-4 w-40 h-28 bg-gray-700 rounded-lg overflow-hidden">
							<video 
								ref={localVideoRef}
								autoPlay 
								playsInline
								muted
								className="w-full h-full object-cover"
							/>
							{!isCamOn && (
								<div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-200 text-xs">
									Camera tắt
								</div>
							)}
						</div>

						{/* Control bar */}
						<div className="absolute inset-x-0 bottom-0 p-4 bg-black/40 backdrop-blur-sm">
							<div className="flex flex-wrap items-center gap-2">
								{controlBtn(isMicOn, () => setIsMicOn(true), () => setIsMicOn(false), FiMic, FiMicOff, 'Mic bật', 'Mic tắt', 'bg-blue-600')}
								{controlBtn(isCamOn, () => setIsCamOn(true), () => setIsCamOn(false), FiVideo, FiVideoOff, 'Camera bật', 'Camera tắt', 'bg-blue-600')}
								
								<button onClick={() => navigate('/care-giver/call-feedback')} className="ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700">
									<FiPhone />
									Kết thúc cuộc gọi
								</button>
							</div>
						</div>
					</div>

					{/* Sidebar chat (30%) */}
					<div className="rounded-2xl bg-white border border-gray-100 shadow p-4 flex flex-col">
						<h2 className="text-sm font-semibold text-gray-900">Chat</h2>
						<div ref={listRef} className="mt-3 flex-1 overflow-y-auto space-y-2">
							{messages.map((m) => (
								<div key={m.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
									<div className="text-xs text-gray-500">{m.sender}</div>
									<div className="text-sm text-gray-800">{m.text}</div>
								</div>
							))}
						</div>
						<div className="mt-3 flex items-center gap-2">
							<input
								type="text"
								placeholder="Nhập tin nhắn..."
								value={input}
								onChange={(e) => setInput(e.target.value)}
								className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
							/>
							<button onClick={appendMessage} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">Gửi</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VideoCallPage;
