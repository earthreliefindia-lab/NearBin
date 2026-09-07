import { Platform, Share } from 'react-native';

function reportUrl(hotspot) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}?spot=${encodeURIComponent(hotspot.id)}`;
  }
  return 'https://nearbin.agriheal.in';
}

function reportMessage(hotspot) {
  return `I reported a public-waste hotspot on NearBin. Join me in keeping our neighborhood clean.\n\n${hotspot.title || 'Waste hotspot'}\n${reportUrl(hotspot)}`;
}

async function loadImage(uri) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = uri;
  });
}

async function createShareCard(hotspot) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#073B27');
  gradient.addColorStop(1, '#00B248');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const photo = hotspot.beforePhoto ? await loadImage(hotspot.beforePhoto) : null;
  if (photo) {
    const scale = Math.max(1080 / photo.width, 580 / photo.height);
    const width = photo.width * scale;
    const height = photo.height * scale;
    context.globalAlpha = 0.88;
    context.drawImage(photo, (1080 - width) / 2, 250, width, height);
    context.globalAlpha = 1;
  }

  context.fillStyle = 'rgba(6, 18, 13, 0.82)';
  context.fillRect(0, 0, 1080, 250);

  // Load official NearBin logo
  let logoImg = await loadImage('icon-192.png');
  if (!logoImg) logoImg = await loadImage('favicon.png');

  if (logoImg) {
    const logoX = 50;
    const logoY = 65;
    const logoSize = 120;
    const radius = 28;

    context.save();
    // Rounded rectangle clip for logo
    context.beginPath();
    context.moveTo(logoX + radius, logoY);
    context.lineTo(logoX + logoSize - radius, logoY);
    context.quadraticCurveTo(logoX + logoSize, logoY, logoX + logoSize, logoY + radius);
    context.lineTo(logoX + logoSize, logoY + logoSize - radius);
    context.quadraticCurveTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - radius, logoY + logoSize);
    context.lineTo(logoX + radius, logoY + logoSize);
    context.quadraticCurveTo(logoX, logoY + logoSize, logoX, logoY + logoSize - radius);
    context.lineTo(logoX, logoY + radius);
    context.quadraticCurveTo(logoX, logoY, logoX + radius, logoY);
    context.closePath();
    context.clip();
    context.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    context.restore();

    // Border around logo
    context.save();
    context.lineWidth = 4;
    context.strokeStyle = '#00E676';
    context.beginPath();
    context.moveTo(logoX + radius, logoY);
    context.lineTo(logoX + logoSize - radius, logoY);
    context.quadraticCurveTo(logoX + logoSize, logoY, logoX + logoSize, logoY + radius);
    context.lineTo(logoX + logoSize, logoY + logoSize - radius);
    context.quadraticCurveTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - radius, logoY + logoSize);
    context.lineTo(logoX + radius, logoY + logoSize);
    context.quadraticCurveTo(logoX, logoY + logoSize, logoX, logoY + logoSize - radius);
    context.lineTo(logoX, logoY + radius);
    context.quadraticCurveTo(logoX, logoY, logoX + radius, logoY);
    context.closePath();
    context.stroke();
    context.restore();
  } else {
    context.fillStyle = '#00E676';
    context.beginPath();
    context.arc(110, 125, 58, 0, Math.PI * 2);
    context.fill();
    context.font = '60px sans-serif';
    context.fillText('🌱', 80, 145);
  }

  context.fillStyle = '#FFFFFF';
  context.font = '800 64px Arial';
  context.fillText('NearBin', 195, 118);
  context.fillStyle = '#B8F7CF';
  context.font = '600 28px Arial';
  context.fillText('Earth Relief India • Civic Cleanliness Mission', 195, 164);

  context.fillStyle = 'rgba(6, 18, 13, 0.88)';
  context.fillRect(0, 830, 1080, 250);
  context.fillStyle = '#FFFFFF';
  context.font = '800 52px Arial';
  context.fillText('I REPORTED A WASTE HOTSPOT', 56, 910);
  context.fillStyle = '#D1FAE0';
  context.font = '600 34px Arial';
  const title = (hotspot.title || 'Public waste hotspot').slice(0, 48);
  context.fillText(title, 56, 968);
  context.fillStyle = '#00E676';
  context.font = '700 28px Arial';
  context.fillText('Report. Share. Keep India clean.', 56, 1025);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], 'nearbin-cleanup-report.png', { type: 'image/png' }) : null);
    }, 'image/png');
  });
}

export async function shareReport(hotspot) {
  const title = 'NearBin community report';
  const text = reportMessage(hotspot);

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const card = await createShareCard(hotspot);
    const payload = { title, text, url: reportUrl(hotspot) };
    if (card && navigator.canShare?.({ files: [card] })) payload.files = [card];

    if (navigator.share) {
      await navigator.share(payload);
      return { shared: true };
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${reportUrl(hotspot)}`);
      return { copied: true };
    }
  }

  await Share.share({ title, message: text });
  return { shared: true };
}
