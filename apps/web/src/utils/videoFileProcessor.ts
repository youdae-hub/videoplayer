export interface ProcessedVideoFile {
  file: File;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailBlob: Blob;
  duration: number;
}

const THUMBNAIL_SEEK_TIME = 2;
const THUMBNAIL_WIDTH = 320;

export function processVideoFile(file: File): Promise<ProcessedVideoFile> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.addEventListener('error', () => {
      cleanup();
      URL.revokeObjectURL(videoUrl);
      reject(new Error('동영상 파일을 읽을 수 없습니다.'));
    });

    video.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(video.duration);
      const seekTime = Math.min(THUMBNAIL_SEEK_TIME, duration * 0.1);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = THUMBNAIL_WIDTH / video.videoWidth;
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = Math.floor(video.videoHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 컨텍스트를 생성할 수 없습니다.'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        const duration = Math.floor(video.duration);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              URL.revokeObjectURL(videoUrl);
              reject(new Error('썸네일 Blob 생성에 실패했습니다.'));
              return;
            }
            resolve({ file, videoUrl, thumbnailUrl, thumbnailBlob: blob, duration });
          },
          'image/jpeg',
          0.8,
        );
      } catch {
        cleanup();
        URL.revokeObjectURL(videoUrl);
        reject(new Error('썸네일 생성에 실패했습니다.'));
      }
    });

    video.src = videoUrl;
  });
}

export function revokeVideoUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
