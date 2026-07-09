export function optimizeImage(url: string, width?: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('q_auto')) return url;
  const transforms = width ? `q_auto,f_auto,w_${width}` : 'q_auto,f_auto';
  return url.replace('/upload/', `/upload/${transforms}/`);
}
