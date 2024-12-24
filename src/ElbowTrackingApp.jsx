// Mediapipe and React for Elbow Tracking
import React, { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

const ElbowTrackingApp = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [angle, setAngle] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Initialize Mediapipe Pose
        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 2,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);

        // Initialize Camera
        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await pose.send({ image: videoRef.current });
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }

        function onResults(results) {
            if (!canvasRef.current || !results.poseLandmarks) return;

            const canvasCtx = canvasRef.current.getContext('2d');
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;

            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            // Clear canvas
            canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

            // Draw video frame
            canvasCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

            // Extract landmarks
            const landmarks = results.poseLandmarks;
            const left_shoulder = landmarks[11];
            const left_elbow = landmarks[13];
            const left_wrist = landmarks[15];

            // Draw landmarks and connections
            drawLandmark(canvasCtx, left_shoulder, 'blue');
            drawLandmark(canvasCtx, left_elbow, 'red');
            drawLandmark(canvasCtx, left_wrist, 'blue');
            drawLine(canvasCtx, left_shoulder, left_elbow, 'white');
            drawLine(canvasCtx, left_elbow, left_wrist, 'white');

            // Calculate angle
            const calculatedAngle = calculateAngle(left_shoulder, left_elbow, left_wrist);
            setAngle(calculatedAngle);

            if (calculatedAngle === 90) {
                setMessage('Угол 90° достигнут!');
            } else {
                setMessage('');
            }
        }

        function drawLandmark(ctx, point, color) {
            ctx.beginPath();
            ctx.arc(point.x * canvasRef.current.width, point.y * canvasRef.current.height, 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        }

        function drawLine(ctx, start, end, color) {
            ctx.beginPath();
            ctx.moveTo(start.x * canvasRef.current.width, start.y * canvasRef.current.height);
            ctx.lineTo(end.x * canvasRef.current.width, end.y * canvasRef.current.height);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        function calculateAngle(a, b, c) {
            const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
            let angle = Math.abs((radians * 180.0) / Math.PI);
            if (angle > 180) angle = 360 - angle;
            return Math.round(angle);
        }

    }, []);

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Elbow Tracking with Mediapipe</h1>
            <video ref={videoRef} style={{ display: 'none' }} autoPlay></video>
            <canvas ref={canvasRef} style={{ width: '640px', height: '480px' }}></canvas>
            <h2>Angle: {angle ? `${angle}°` : 'Calculating...'}</h2>
            {message && <h3 style={{ color: 'green' }}>{message}</h3>}
        </div>
    );
};

export default ElbowTrackingApp;