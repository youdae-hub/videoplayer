export interface ProcessedVideoFile {
  file: File;
  thumbnailUrl: string;
  thumbnailBlob: Blob;
  duration: number;
}

const THUMBNAIL_SEEK_TIME = 2;
const THUMBNAIL_WIDTH = 320;

export function processVideoFile(file: File): Promise<ProcessedVideoFile> {
  return new Promise((resolve, reject) => {
    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(tempUrl);
    };

    video.addEventListener('error', () => {
      cleanup();
      reject(new Error('동영상 파일을 읽을 수 없습니다.'));
    });

    video.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(video.duration);
      const seekTime = Math.min(THUMBNAIL_SEEK_TIME, duration * 0.1);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      const duration = Math.floor(video.duration);
      captureVideoFrame(video, THUMBNAIL_WIDTH)
        .then(({ thumbnailUrl, thumbnailBlob }) => {
          cleanup();
          resolve({ file, thumbnailUrl, thumbnailBlob, duration });
        })
        .catch(() => {
          cleanup();
          reject(new Error('썸네일 생성에 실패했습니다.'));
        });
    });

    video.src = tempUrl;
  });
}

const CAPTURE_WIDTH = 320;

export function captureVideoFrame(
  video: HTMLVideoElement,
  width = CAPTURE_WIDTH,
): Promise<{ thumbnailUrl: string; thumbnailBlob: Blob }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scale = width / video.videoWidth;
    canvas.width = width;
    canvas.height = Math.floor(video.videoHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 컨텍스트를 생성할 수 없습니다.'));
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('썸네일 Blob 생성에 실패했습니다.'));
          return;
        }
        resolve({ thumbnailUrl, thumbnailBlob: blob });
      },
      'image/jpeg',
      0.8,
    );
  });
}

export function revokeVideoUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
