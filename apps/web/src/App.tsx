import { VideoPlayer } from '@videoplayer/core';

const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_POSTER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#fafafa' }}>
        Video Player Demo
      </h1>
      <div style={{ width: '100%', maxWidth: '960px' }}>
        <VideoPlayer
          src={SAMPLE_VIDEO}
          poster={SAMPLE_POSTER}
        />
      </div>
    </div>
  );
}
